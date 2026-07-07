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

const defaultTimeoutMs = 5_000

export function requestSeoulCultureJson(
  request: BuiltSeoulCultureRequest,
  options: SeoulCultureJsonRequestOptions = {},
): Promise<unknown> {
  const url = new URL(request.url)
  const requester = selectRequester(url)
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs

  if (requester === undefined) {
    return Promise.reject(
      new SeoulCultureHttpError(`Unsupported protocol for ${request.diagnostics.redacted_url}`),
    )
  }

  return new Promise((resolve, reject) => {
    let settled = false
    let clientRequest: ClientRequest | undefined

    const fail = (error: Error): void => {
      if (settled) {
        return
      }

      settled = true
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

    clientRequest.setTimeout(timeoutMs, () => {
      fail(new SeoulCultureHttpError(`Seoul culture request timed out: ${request.diagnostics.redacted_url}`))
    })
    clientRequest.on("error", fail)
    clientRequest.end()
  })
}

function selectRequester(url: URL): typeof requestHttp | typeof requestHttps | undefined {
  switch (url.protocol) {
    case "http:":
      return requestHttp
    case "https:":
      return requestHttps
    default:
      return undefined
  }
}

function readResponseBody(response: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    response.on("data", (chunk: Buffer | string) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
    })
    response.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"))
    })
    response.on("error", (error: Error) => {
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
