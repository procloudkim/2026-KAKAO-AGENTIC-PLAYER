import { createHmac, randomBytes } from "node:crypto"
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
  readonly consume: (rawKey: string) => McpRateLimitResult
  readonly close: () => void
}

type RateLimitBucket = {
  readonly windowStartedAtMs: number
  count: number
  expirationTimer?: NodeJS.Timeout
}

type McpRateLimiterOptions = {
  readonly limit: number
  readonly windowMs: number
  readonly now?: () => number
  readonly secret?: Uint8Array
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
  const secret = options.secret ?? randomBytes(32)
  let closed = false

  const deleteBucket = (key: string, expected?: RateLimitBucket): void => {
    const bucket = buckets.get(key)
    if (bucket === undefined || (expected !== undefined && bucket !== expected)) {
      return
    }

    if (bucket.expirationTimer !== undefined) {
      clearTimeout(bucket.expirationTimer)
    }
    buckets.delete(key)
  }

  const createBucket = (key: string, nowMs: number): RateLimitBucket => {
    const bucket: RateLimitBucket = { windowStartedAtMs: nowMs, count: 1 }
    const expirationTimer = setTimeout(() => deleteBucket(key, bucket), options.windowMs)
    expirationTimer.unref()
    bucket.expirationTimer = expirationTimer
    buckets.set(key, bucket)
    return bucket
  }

  return {
    consume: (rawKey) => {
      if (closed) {
        throw new Error("MCP rate limiter is closed")
      }

      const key = hashMcpRateLimitKey(rawKey, secret)
      const nowMs = now()
      for (const [candidateKey, bucket] of buckets) {
        if (nowMs - bucket.windowStartedAtMs >= options.windowMs) {
          deleteBucket(candidateKey, bucket)
        }
      }

      const current = buckets.get(key)
      if (current === undefined) {
        if (buckets.size >= maxRateLimitBuckets) {
          const oldestKey = buckets.keys().next().value
          if (typeof oldestKey === "string") deleteBucket(oldestKey)
        }
        createBucket(key, nowMs)
        return { allowed: true }
      }

      if (current.count >= options.limit) {
        const remainingMs = current.windowStartedAtMs + options.windowMs - nowMs
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1_000)) }
      }

      current.count += 1
      return { allowed: true }
    },
    close: () => {
      if (closed) return
      closed = true
      for (const key of buckets.keys()) deleteBucket(key)
    },
  }
}

export function hashMcpRateLimitKey(rawKey: string, secret: Uint8Array): string {
  return createHmac("sha256", secret).update(rawKey, "utf8").digest("hex")
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
