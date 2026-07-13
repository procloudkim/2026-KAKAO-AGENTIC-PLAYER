import { request as requestHttp, type ClientRequest, type IncomingMessage } from "node:http"
import { request as requestHttps } from "node:https"

export type BuiltSeoulCultureRequest = {
  readonly url: string
  readonly diagnostics: { readonly redacted_url: string }
}

export type SeoulCultureJsonRequestOptions = {
  readonly timeoutMs?: number
}

export class SeoulCultureHttpError extends Error {
  readonly statusCode?: number

  constructor(message: string, options: { readonly statusCode?: number } = {}) {
    super(message)
    this.name = "SeoulCultureHttpError"
    if (options.statusCode !== undefined) {
      this.statusCode = options.statusCode
    }
  }
}

export const PUBLIC_SOURCE_TOTAL_DEADLINE_MS = 2_500
const maxProviderResponseBodyBytes = 1_024 * 1_024
const loopbackHostnames = new Set(["127.0.0.1", "localhost", "[::1]", "::1"])

export function requestSeoulCultureJson(
  request: BuiltSeoulCultureRequest,
  options: SeoulCultureJsonRequestOptions = {},
): Promise<unknown> {
  const url = new URL(request.url)
  const requester = selectRequester(url)
  const timeoutMs = options.timeoutMs ?? PUBLIC_SOURCE_TOTAL_DEADLINE_MS

  if (requester === undefined) {
    return Promise.reject(
      new SeoulCultureHttpError(
        `HTTPS is required for non-loopback Seoul requests: ${request.diagnostics.redacted_url}`,
      ),
    )
  }

  return new Promise((resolve, reject) => {
    let settled = false
    let clientRequest: ClientRequest | undefined
    const deadline = setTimeout(() => {
      fail(new SeoulCultureHttpError(`Seoul culture request timed out: ${request.diagnostics.redacted_url}`))
    }, timeoutMs)

    const fail = (error: Error): void => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(deadline)
      clientRequest?.destroy()
      reject(error)
    }

    clientRequest = requester(url, { method: "GET" }, (response) => {
      readResponseBody(response)
        .then((body) => {
          if (settled) {
            return
          }

          settled = true
          clearTimeout(deadline)
          const statusCode = response.statusCode ?? 0
          if (statusCode < 200 || statusCode >= 300) {
            reject(
              new SeoulCultureHttpError(
                `Seoul culture request failed with HTTP ${statusCode}: ${request.diagnostics.redacted_url}`,
                { statusCode },
              ),
            )
            return
          }

          resolve(parseJsonBody(body, request.diagnostics.redacted_url))
        })
        .catch((error: unknown) => {
          fail(error instanceof Error ? error : new SeoulCultureHttpError("Response body read failed"))
        })
    })

    clientRequest.on("error", fail)
    clientRequest.end()
  })
}

function selectRequester(url: URL): typeof requestHttp | typeof requestHttps | undefined {
  switch (url.protocol) {
    case "http:":
      return loopbackHostnames.has(url.hostname) ? requestHttp : undefined
    case "https:":
      return requestHttps
    default:
      return undefined
  }
}

function readResponseBody(response: IncomingMessage): Promise<string> {
  const contentLength = response.headers["content-length"]
  const declaredLength = Number.parseInt(
    Array.isArray(contentLength) ? (contentLength[0] ?? "") : (contentLength ?? ""),
    10,
  )
  if (Number.isFinite(declaredLength) && declaredLength > maxProviderResponseBodyBytes) {
    response.destroy()
    return Promise.reject(new SeoulCultureHttpError("Provider response body is too large."))
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let receivedBytes = 0
    let settled = false
    response.on("data", (chunk: Buffer | string) => {
      if (settled) {
        return
      }

      const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk
      receivedBytes += buffer.byteLength
      if (receivedBytes > maxProviderResponseBodyBytes) {
        settled = true
        response.destroy()
        reject(new SeoulCultureHttpError("Provider response body is too large."))
        return
      }

      chunks.push(buffer)
    })
    response.on("end", () => {
      if (settled) {
        return
      }
      settled = true
      resolve(Buffer.concat(chunks).toString("utf8"))
    })
    response.on("error", (error: Error) => {
      if (settled) {
        return
      }
      settled = true
      reject(error)
    })
  })
}

function parseJsonBody(body: string, redactedUrl: string): unknown {
  try {
    const parsed: unknown = JSON.parse(body)
    return parsed
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      throw new SeoulCultureHttpError(`Seoul culture response was not JSON: ${redactedUrl}`)
    }
    throw error
  }
}
