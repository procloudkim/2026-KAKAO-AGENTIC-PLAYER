import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import { pathToFileURL } from "node:url"

import { toNodeHandler } from "@modelcontextprotocol/node"
import { createMcpHandler } from "@modelcontextprotocol/server"

import {
  DEFAULT_MCP_MAX_CONCURRENCY,
  DEFAULT_MCP_RATE_LIMIT,
  DEFAULT_MCP_RATE_WINDOW_MS,
  DEFAULT_SHUTDOWN_GRACE_MS,
  loadFamilyExperienceConfig,
  type FamilyExperienceConfig,
} from "./config.js"
import {
  createNationwideCacheSnapshotStore,
  queryNationwideCache,
} from "./etl/cacheQuery.js"
import { getHealthStatus } from "./health.js"
import { createFamilyExperienceMcpServer } from "./mcp.js"
import {
  HttpResponseError,
  MCP_REQUEST_TIMEOUT_MS,
  createMcpConcurrencyGate,
  createMcpRateLimiter,
  jsonRpcError,
  readLimitedJsonBody,
} from "./mcpRequestLimits.js"
import {
  consoleOperationalLogger,
  recordHttpRequest,
  recordServerStart,
  type OperationalLogger,
} from "./observability.js"
import { installLifecycleHandlers } from "./serverLifecycle.js"
import type { HttpLimitation } from "./observabilityTypes.js"

const mcpPath = "/mcp"
const healthPath = "/health"
const responseLimitations = new WeakMap<ServerResponse, HttpLimitation>()
const requestDrainWaiters = new WeakMap<Server, () => Promise<void>>()

type FamilyExperienceHttpServerOptions = {
  readonly logger?: OperationalLogger
  readonly config?: FamilyExperienceConfig
  readonly routeRequest?: (
    request: IncomingMessage,
    response: ServerResponse,
    logger: OperationalLogger,
  ) => Promise<void>
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
  headers: Readonly<Record<string, string>> = {},
): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", ...headers })
  response.end(JSON.stringify(body))
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  config: FamilyExperienceConfig,
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1")

  if (url.pathname === healthPath) {
    const health = getHealthStatus(config)
    writeJson(response, health.ok ? 200 : 503, health)
    return
  }

  writeJson(response, 404, { ok: false, error: "not_found" })
}

function isAllowedOrigin(request: IncomingMessage, allowedOrigins: readonly string[]): boolean {
  const originHeader = request.headers.origin
  if (originHeader === undefined) return true
  if (Array.isArray(originHeader)) return false

  try {
    const parsed = new URL(originHeader)
    const isWebOrigin = parsed.protocol === "https:" || parsed.protocol === "http:"
    const isOriginOnly =
      parsed.username.length === 0 &&
      parsed.password.length === 0 &&
      parsed.pathname === "/" &&
      parsed.search.length === 0 &&
      parsed.hash.length === 0
    return isWebOrigin && isOriginOnly && allowedOrigins.includes(parsed.origin)
  } catch (error: unknown) {
    if (error instanceof TypeError) return false
    throw error
  }
}

function writeMcpMethodNotAllowed(response: ServerResponse): void {
  writeJson(
    response,
    405,
    jsonRpcError(-32000, "Method not allowed.", "method_not_allowed"),
    { allow: "POST" },
  )
}

async function waitForActiveRequests(server: Server): Promise<void> {
  await requestDrainWaiters.get(server)?.()
}

export function createFamilyExperienceHttpServer(
  options: FamilyExperienceHttpServerOptions = {},
): Server {
  const logger = options.logger ?? consoleOperationalLogger
  const config = options.config ?? loadFamilyExperienceConfig()
  const concurrencyGate = createMcpConcurrencyGate(
    config.mcpMaxConcurrency ?? DEFAULT_MCP_MAX_CONCURRENCY,
  )
  const rateLimiter = createMcpRateLimiter({
    limit: config.mcpRateLimit ?? DEFAULT_MCP_RATE_LIMIT,
    windowMs: config.mcpRateWindowMs ?? DEFAULT_MCP_RATE_WINDOW_MS,
  })
  const cacheSnapshotStore = createNationwideCacheSnapshotStore()
  const warmupDate = new Date().toISOString().slice(0, 10)
  const cacheWarmup = config.etlCacheDir === undefined
    ? Promise.resolve()
    : queryNationwideCache({
        allowFixture: config.allowFixture,
        cacheDir: config.etlCacheDir,
        ...(config.etlTtlHours === undefined ? {} : { expectedTtlHours: config.etlTtlHours }),
        request: {
          location: "Seoul",
          date_range: { start: warmupDate, end: warmupDate },
          child_age: 0,
        },
        snapshotStore: cacheSnapshotStore,
        ...(config.sourceSet === undefined ? {} : { sourceSet: config.sourceSet }),
      }).then(() => undefined)
  const mcpHandler = createMcpHandler(
    () => createFamilyExperienceMcpServer({ cacheSnapshotStore, config, logger }),
    { legacy: "stateless", responseMode: "json" },
  )
  const handleMcpRequest = toNodeHandler(mcpHandler)
  let handlerClosePromise: Promise<void> | undefined
  const closeMcpHandler = (): Promise<void> => {
    handlerClosePromise ??= mcpHandler.close()
    return handlerClosePromise
  }
  const requestRouter = options.routeRequest ?? (async (request, response) => {
    await cacheWarmup
    const url = new URL(request.url ?? "/", "http://127.0.0.1")
    if (url.pathname !== mcpPath) {
      await routeRequest(request, response, config)
      return
    }

    if (request.method !== "POST") {
      writeMcpMethodNotAllowed(response)
      return
    }

    if (!isAllowedOrigin(request, config.allowedOrigins ?? [])) {
      writeJson(response, 403, jsonRpcError(-32000, "Origin is not allowed.", "origin_forbidden"))
      return
    }

    const rateResult = rateLimiter.consume(request.socket.remoteAddress ?? "unknown")
    if (!rateResult.allowed) {
      responseLimitations.set(response, "rate_limited")
      writeJson(
        response,
        429,
        jsonRpcError(-32000, "Too many requests. Try again later.", "rate_limited"),
        { "retry-after": String(rateResult.retryAfterSeconds) },
      )
      return
    }

    const release = concurrencyGate.tryEnter()
    if (release === undefined) {
      responseLimitations.set(response, "concurrency_limited")
      writeJson(
        response,
        429,
        jsonRpcError(-32000, "Server is busy. Try again shortly.", "concurrency_limited"),
        { "retry-after": "1" },
      )
      return
    }

    try {
      const parsedBody = await readLimitedJsonBody(request)
      request.url ??= mcpPath
      await handleMcpRequest(
        request as IncomingMessage & { method: string; url: string },
        response,
        parsedBody,
      )
    } finally {
      release()
    }
  })
  const activeRequests = new Set<Promise<void>>()
  const server = createServer((request, response) => {
    const startedAt = Date.now()
    let logged = false
    const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname
    const logRequest = (statusCode: number): void => {
      if (logged) {
        return
      }

      logged = true
      const limitation = responseLimitations.get(response)
      recordHttpRequest({
        logger,
        method: request.method,
        path,
        statusCode,
        latencyMs: Date.now() - startedAt,
        ...(limitation === undefined ? {} : { limitation }),
      })
    }
    response.once("finish", () => logRequest(response.statusCode))
    response.once("close", () => {
      const statusCode = response.writableFinished || response.statusCode >= 400
        ? response.statusCode
        : 499
      logRequest(statusCode)
    })

    const activeRequest = requestRouter(request, response, logger).catch((error: unknown) => {
      if (response.headersSent) {
        response.destroy()
        return
      }

      if (error instanceof HttpResponseError) {
        writeJson(response, error.statusCode, error.body)
        return
      }

      writeJson(response, 500, jsonRpcError(-32603, "Internal server error.", "internal_error"))
    })
    activeRequests.add(activeRequest)
    void activeRequest.then(
      () => activeRequests.delete(activeRequest),
      () => activeRequests.delete(activeRequest),
    )
  })
  requestDrainWaiters.set(server, async () => {
    while (activeRequests.size > 0) {
      await Promise.allSettled([...activeRequests])
    }
    await closeMcpHandler()
  })
  server.once("close", () => {
    void closeMcpHandler()
  })

  server.requestTimeout = MCP_REQUEST_TIMEOUT_MS + 1_000
  server.headersTimeout = MCP_REQUEST_TIMEOUT_MS + 2_000

  return server
}

export function startFamilyExperienceHttpServer(): Server {
  const config = loadFamilyExperienceConfig()
  const logger = consoleOperationalLogger
  const server = createFamilyExperienceHttpServer({ config, logger })

  server.listen(config.port, config.host, () => {
    recordServerStart({ logger, host: config.host, port: config.port })
  })

  installLifecycleHandlers(
    server,
    config.shutdownGraceMs ?? DEFAULT_SHUTDOWN_GRACE_MS,
    () => waitForActiveRequests(server),
  )
  return server
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1]
  return entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href
}

if (isMainModule()) {
  startFamilyExperienceHttpServer()
}
