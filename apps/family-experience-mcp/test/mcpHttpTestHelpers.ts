import { createConnection } from "node:net"

type HttpTextResponse = {
  readonly statusCode: number
  readonly body: string
}

function parseHttpStatus(rawResponse: string): number {
  const match = /^HTTP\/1\.1\s+(\d{3})/.exec(rawResponse)
  if (match === null) {
    throw new Error(`expected HTTP status line in response: ${rawResponse.slice(0, 80)}`)
  }

  const [, statusText] = match
  if (statusText === undefined) {
    throw new Error("expected HTTP status code capture")
  }

  return Number.parseInt(statusText, 10)
}

export function postIncompleteMcpJson(port: number): Promise<HttpTextResponse> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: "127.0.0.1", port })
    let rawResponse = ""
    let settled = false
    const failTimer = setTimeout(() => {
      if (settled) {
        return
      }

      settled = true
      socket.destroy()
      reject(new Error("timed out waiting for MCP request_timeout response"))
    }, 15_000)

    socket.setEncoding("utf8")
    socket.on("connect", () => {
      socket.write(
        [
          "POST /mcp HTTP/1.1",
          "Host: 127.0.0.1",
          "Content-Type: application/json",
          "Accept: application/json, text/event-stream",
          "Content-Length: 100",
          "",
          "{",
        ].join("\r\n"),
      )
    })
    socket.on("data", (chunk) => {
      rawResponse += chunk
      if (!rawResponse.includes("request_timeout")) {
        return
      }

      settled = true
      clearTimeout(failTimer)
      socket.destroy()
      resolve({ statusCode: parseHttpStatus(rawResponse), body: rawResponse })
    })
    socket.on("error", (error) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(failTimer)
      reject(error)
    })
  })
}

export function postMcpJson(url: string, body: string): Promise<HttpTextResponse> {
  return new Promise((resolve, reject) => {
    const request = new Request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body,
    })

    fetch(request)
      .then(async (response) => {
        resolve({ statusCode: response.status, body: await response.text() })
      })
      .catch((error: unknown) => {
        reject(error instanceof Error ? error : new Error("MCP POST failed"))
      })
  })
}
