import type { IncomingMessage } from "node:http"

export const MCP_REQUEST_TIMEOUT_MS = 10_000

const maxMcpRequestBodyBytes = 64 * 1_024
const maxConcurrentMcpRequests = 32
const maxRateLimitBuckets = 10_000

type JsonRpcErrorCode = -32700 | -32000 | -32603

export type JsonRpcErrorBody = {
  readonly jsonrpc: "2.0"
  readonly error: {
    readonly code: JsonRpcErrorCode
    readonly message: string
    readonly data?: { readonly code: string }
  }
  readonly id: null
}

export type McpConcurrencyGate = {
  readonly tryEnter: () => (() => void) | undefined
}

export type McpRateLimitResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly retryAfterSeconds: number }

export type McpRateLimiter = {
  readonly consume: (key: string) => McpRateLimitResult
}

type RateLimitBucket = {
  readonly windowStartedAtMs: number
  readonly count: number
}

type McpRateLimiterOptions = {
  readonly limit: number
  readonly windowMs: number
  readonly now?: () => number
}

export class HttpResponseError extends Error {
  readonly statusCode: number
  readonly body: JsonRpcErrorBody

  constructor(statusCode: number, body: JsonRpcErrorBody) {
    super(body.error.message)
    this.name = "HttpResponseError"
    this.statusCode = statusCode
    this.body = body
  }
}

export function jsonRpcError(
  code: JsonRpcErrorCode,
  message: string,
  dataCode?: string,
): JsonRpcErrorBody {
  return {
    jsonrpc: "2.0",
    error: {
      code,
      message,
      ...(dataCode === undefined ? {} : { data: { code: dataCode } }),
    },
    id: null,
  }
}

export function createMcpConcurrencyGate(
  limit: number = maxConcurrentMcpRequests,
): McpConcurrencyGate {
  let activeRequests = 0

  return {
    tryEnter: () => {
      if (activeRequests >= limit) {
        return undefined
      }

      activeRequests += 1
      let active = true
      return () => {
        if (!active) {
          return
        }
        active = false
        activeRequests -= 1
      }
    },
  }
}

export function createMcpRateLimiter(options: McpRateLimiterOptions): McpRateLimiter {
  const buckets = new Map<string, RateLimitBucket>()
  const now = options.now ?? Date.now

  return {
    consume: (key) => {
      const nowMs = now()
      for (const [candidateKey, bucket] of buckets) {
        if (nowMs - bucket.windowStartedAtMs >= options.windowMs) buckets.delete(candidateKey)
      }

      const current = buckets.get(key)
      if (current === undefined) {
        if (buckets.size >= maxRateLimitBuckets) {
          const oldestKey = buckets.keys().next().value
          if (typeof oldestKey === "string") buckets.delete(oldestKey)
        }
        buckets.set(key, { windowStartedAtMs: nowMs, count: 1 })
        return { allowed: true }
      }

      if (current.count >= options.limit) {
        const remainingMs = current.windowStartedAtMs + options.windowMs - nowMs
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1_000)) }
      }

      buckets.set(key, { windowStartedAtMs: current.windowStartedAtMs, count: current.count + 1 })
      return { allowed: true }
    },
  }
}

export function readLimitedJsonBody(request: IncomingMessage): Promise<unknown> {
  const bodyLength = getRequestBodyLength(request)
  if (bodyLength !== undefined && bodyLength > maxMcpRequestBodyBytes) {
    return Promise.reject(
      new HttpResponseError(
        413,
        jsonRpcError(-32000, "Request body is too large.", "request_body_too_large"),
      ),
    )
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let receivedBytes = 0
    let settled = false
    const timeout = setTimeout(() => {
      if (settled) {
        return
      }

      settled = true
      reject(new HttpResponseError(408, jsonRpcError(-32000, "Request timed out.", "request_timeout")))
    }, MCP_REQUEST_TIMEOUT_MS)

    request.on("data", (chunk: Buffer | string) => {
      if (settled) {
        return
      }

      const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk
      receivedBytes += buffer.byteLength
      if (receivedBytes > maxMcpRequestBodyBytes) {
        settled = true
        clearTimeout(timeout)
        reject(
          new HttpResponseError(
            413,
            jsonRpcError(-32000, "Request body is too large.", "request_body_too_large"),
          ),
        )
        return
      }

      chunks.push(buffer)
    })

    request.on("end", () => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeout)
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")))
      } catch (error: unknown) {
        if (error instanceof SyntaxError) {
          reject(new HttpResponseError(400, jsonRpcError(-32700, "Parse error.", "parse_error")))
          return
        }

        reject(error)
      }
    })

    request.on("error", (error: Error) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeout)
      reject(error)
    })
  })
}

function getRequestBodyLength(request: IncomingMessage): number | undefined {
  const contentLength = request.headers["content-length"]
  if (contentLength === undefined) {
    return undefined
  }

  const value = Array.isArray(contentLength) ? contentLength[0] : contentLength
  if (value === undefined) {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}
