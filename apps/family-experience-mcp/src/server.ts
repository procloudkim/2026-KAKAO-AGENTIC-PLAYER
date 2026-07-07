import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import { pathToFileURL } from "node:url"

import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node"

import { loadFamilyExperienceConfig } from "./config.js"
import { getHealthStatus } from "./health.js"
import { createFamilyExperienceMcpServer } from "./mcp.js"
import {
  HttpResponseError,
  MCP_REQUEST_TIMEOUT_MS,
  isRateLimited,
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

const mcpPath = "/mcp"
const healthPath = "/health"

type FamilyExperienceHttpServerOptions = {
  readonly logger?: OperationalLogger
  readonly routeRequest?: (
    request: IncomingMessage,
    response: ServerResponse,
    logger: OperationalLogger,
  ) => Promise<void>
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" })
  response.end(JSON.stringify(body))
}

async function handleMcpRequest(
  request: IncomingMessage,
  response: ServerResponse,
  logger: OperationalLogger,
): Promise<void> {
  const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  const server = createFamilyExperienceMcpServer({ logger })
  const parsedBody = request.method === "POST" ? await readLimitedJsonBody(request) : undefined

  response.on("close", () => {
    void transport.close()
  })

  await server.connect(transport)
  await transport.handleRequest(request, response, parsedBody)
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  logger: OperationalLogger,
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1")

  if (url.pathname === healthPath) {
    writeJson(response, 200, getHealthStatus())
    return
  }

  if (url.pathname === mcpPath) {
    if (isRateLimited(request, Date.now())) {
      writeJson(
        response,
        429,
        jsonRpcError(-32000, "Too many requests. Try again later.", "rate_limited"),
      )
      return
    }

    await handleMcpRequest(request, response, logger)
    return
  }

  writeJson(response, 404, { ok: false, error: "not_found" })
}

export function createFamilyExperienceHttpServer(
  options: FamilyExperienceHttpServerOptions = {},
): Server {
  const logger = options.logger ?? consoleOperationalLogger
  const requestRouter = options.routeRequest ?? routeRequest
  const server = createServer((request, response) => {
    const startedAt = Date.now()
    let logged = false
    const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname
    const logRequest = (): void => {
      if (logged) {
        return
      }

      logged = true
      recordHttpRequest({
        logger,
        method: request.method,
        path,
        statusCode: response.statusCode,
        latencyMs: Date.now() - startedAt,
      })
    }
    response.once("finish", logRequest)
    response.once("close", logRequest)

    requestRouter(request, response, logger).catch((error: unknown) => {
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
  })

  server.requestTimeout = MCP_REQUEST_TIMEOUT_MS + 1_000
  server.headersTimeout = MCP_REQUEST_TIMEOUT_MS + 2_000

  return server
}

export function startFamilyExperienceHttpServer(): Server {
  const config = loadFamilyExperienceConfig()
  const logger = consoleOperationalLogger
  const server = createFamilyExperienceHttpServer({ logger })

  server.listen(config.port, config.host, () => {
    recordServerStart({ logger, host: config.host, port: config.port })
  })

  installLifecycleHandlers(server)
  return server
}

function isMainModule(): boolean {
  const entrypoint = process.argv[1]
  return entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href
}

if (isMainModule()) {
  startFamilyExperienceHttpServer()
}
