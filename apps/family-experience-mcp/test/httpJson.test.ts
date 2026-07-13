import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { createServer, type Server } from "node:http"
import { createConnection } from "node:net"
import { once } from "node:events"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { loadFamilyExperienceConfig } from "../src/config.js"
import type { OperationalLogEntry } from "../src/observability.js"
import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"
import { createFamilyExperienceHttpServer } from "../src/server.js"
import {
  requestSeoulCultureJson,
  SeoulCultureHttpError,
  type BuiltSeoulCultureRequest,
} from "../src/sources/httpJson.js"
import { postIncompleteMcpJson, postMcpJson } from "./mcpHttpTestHelpers.js"

let activeServer: Server | undefined
let activeMcpProcess: ChildProcessWithoutNullStreams | undefined

const testDir = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(testDir, "..")

afterEach(async () => {
  vi.unstubAllEnvs()
  await new Promise<void>((resolve, reject) => {
    if (activeServer === undefined) {
      resolve()
      return
    }

    activeServer.close((error) => {
      activeServer = undefined
      if (error === undefined) {
        resolve()
        return
      }
      reject(error)
    })
  })

  if (activeMcpProcess !== undefined) {
    if (activeMcpProcess.exitCode === null && activeMcpProcess.signalCode === null) {
      activeMcpProcess.kill()
      await once(activeMcpProcess, "exit")
    }
    activeMcpProcess = undefined
  }
})

async function serveJson(
  statusCode: number,
  body: unknown,
): Promise<{ readonly url: string }> {
  activeServer = createServer((request, response) => {
    response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" })
    response.end(JSON.stringify({ method: request.method, body }))
  })

  await new Promise<void>((resolve) => {
    activeServer?.listen(0, "127.0.0.1", resolve)
  })

  const address = activeServer.address()
  if (typeof address !== "object" || address === null) {
    throw new Error("expected local server address")
  }

  return { url: `http://127.0.0.1:${address.port}/SECRET_KEY/json/culturalEventInfo/1/100/` }
}

function buildRequest(url: string): BuiltSeoulCultureRequest {
  return {
    url,
    diagnostics: {
      redacted_url: url.replace("SECRET_KEY", "<redacted>"),
    },
  }
}

async function reserveLocalPort(): Promise<number> {
  const server = createServer()

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve)
  })

  const address = server.address()
  if (typeof address !== "object" || address === null) {
    throw new Error("expected reserved local port")
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error === undefined) {
        resolve()
        return
      }
      reject(error)
    })
  })

  return address.port
}

async function startMcpHttpServer(
  envOverrides: Readonly<Record<string, string>> = {},
): Promise<{ readonly url: string }> {
  const port = await reserveLocalPort()
  activeMcpProcess = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
    cwd: packageDir,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      FAMILY_EXPERIENCE_ALLOW_FIXTURE: "1",
      ...envOverrides,
    },
    windowsHide: true,
  })

  activeMcpProcess.stderr.on("data", (chunk: Buffer) => {
    process.stderr.write(chunk)
  })

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("timed out waiting for MCP HTTP server"))
    }, 5_000)

    activeMcpProcess?.stdout.on("data", (chunk: Buffer) => {
      if (chunk.toString("utf8").includes("family-experience-mcp listening")) {
        clearTimeout(timeout)
        resolve()
      }
    })

    activeMcpProcess?.once("exit", (code) => {
      clearTimeout(timeout)
      reject(new Error(`MCP HTTP server exited before listening: ${code ?? "signal"}`))
    })
  })

  return { url: `http://127.0.0.1:${port}/mcp` }
}

async function listenOnLocalhost(server: Server): Promise<{ readonly url: string; readonly port: number }> {
  activeServer = server
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve)
  })

  const address = server.address()
  if (typeof address !== "object" || address === null) {
    throw new Error("expected local server address")
  }

  return { url: `http://127.0.0.1:${address.port}/mcp`, port: address.port }
}

async function postMcpJsonWithOrigin(url: string, origin?: string): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(origin === undefined ? {} : { origin }),
    },
    body: "{bad json",
  })
}

function parseMcpJsonRpcResponse(body: string): unknown {
  const dataLine = body
    .split(/\r?\n/)
    .find((line) => line.startsWith("data:"))
  return JSON.parse(dataLine === undefined ? body : dataLine.slice("data:".length).trim())
}

describe("Seoul culture HTTP JSON requester", () => {
  it("parses JSON from a local official-data-compatible endpoint", async () => {
    // Given: a local HTTP endpoint returns a Seoul-like JSON payload.
    const server = await serveJson(200, {
      culturalEventInfo: { RESULT: { CODE: "INFO-000", MESSAGE: "ok" }, row: [] },
    })

    // When: the requester loads the URL.
    const payload = await requestSeoulCultureJson(buildRequest(server.url))

    // Then: the decoded payload is returned for the source parser boundary.
    expect(payload).toMatchObject({
      method: "GET",
      body: {
        culturalEventInfo: {
          RESULT: { CODE: "INFO-000" },
        },
      },
    })
  })

  it("uses redacted URLs when HTTP status is not successful", async () => {
    // Given: a local HTTP endpoint rejects the keyed request.
    const server = await serveJson(500, { error: "backend unavailable" })

    // When: the requester sees a non-2xx response.
    const promise = requestSeoulCultureJson(buildRequest(server.url))

    // Then: diagnostics are actionable but do not expose the raw key.
    await expect(promise).rejects.toMatchObject({
      message: expect.stringContaining("<redacted>"),
    })
    await expect(promise).rejects.toBeInstanceOf(SeoulCultureHttpError)
    await expect(promise).rejects.not.toMatchObject({
      message: expect.stringContaining("SECRET_KEY"),
    })
  })

  it("rejects provider responses larger than the byte budget", async () => {
    // Given: an otherwise valid provider endpoint returns more than one MiB.
    const server = await serveJson(200, "x".repeat(1_100_000))

    // When: the response crosses the HTTP body boundary.
    const promise = requestSeoulCultureJson(buildRequest(server.url))

    // Then: the requester aborts with a typed bounded-response error.
    await expect(promise).rejects.toBeInstanceOf(SeoulCultureHttpError)
    await expect(promise).rejects.toMatchObject({
      message: expect.stringContaining("too large"),
    })
  })

  it("rejects plaintext Seoul transport outside loopback", async () => {
    // Given: a keyed Seoul request targets a non-loopback plaintext endpoint.
    const request = buildRequest("http://" + "192.0.2.1:9/SECRET_KEY/json/culturalEventInfo/1/100/")

    // When: transport selection runs at the network boundary.
    const promise = requestSeoulCultureJson(request, { timeoutMs: 10 })

    // Then: the request fails for missing HTTPS before network I/O.
    await expect(promise).rejects.toMatchObject({
      message: expect.stringContaining("HTTPS"),
    })
  })
})

describe("Family experience MCP HTTP request limits", () => {
  it("accepts only POST on the MCP endpoint", async () => {
    // Given: the stateless MCP endpoint is running with an explicit fixture configuration.
    const server = await listenOnLocalhost(createFamilyExperienceHttpServer({
      config: loadFamilyExperienceConfig({ FAMILY_EXPERIENCE_ALLOW_FIXTURE: "1" }),
    }))

    // When: stateful streaming/session verbs target the public MCP path.
    const [getResponse, deleteResponse] = await Promise.all([
      fetch(server.url, { method: "GET" }),
      fetch(server.url, { method: "DELETE" }),
    ])

    // Then: both are rejected before any MCP transport is created.
    for (const response of [getResponse, deleteResponse]) {
      expect(response.status).toBe(405)
      expect(response.headers.get("allow")).toBe("POST")
      expect(await response.text()).toContain("method_not_allowed")
    }
  })

  it("isolates concurrent stateless requests that reuse the same JSON-RPC id", async () => {
    // Given: two clients issue different tool calls with the same request id.
    const server = await listenOnLocalhost(createFamilyExperienceHttpServer({
      config: loadFamilyExperienceConfig({
        FAMILY_EXPERIENCE_ALLOW_FIXTURE: "1",
        FAMILY_EXPERIENCE_MCP_RATE_LIMIT: "100",
      }),
    }))
    const toolCall = (prompt: string): string => JSON.stringify({
      jsonrpc: "2.0",
      id: "shared-id",
      method: "tools/call",
      params: { name: "find_family_experiences", arguments: { prompt } },
    })

    // When: the requests overlap at the HTTP boundary.
    const [missingDate, missingLocation] = await Promise.all([
      postMcpJson(server.url, toolCall("서울에서 4살 아이와 체험")),
      postMcpJson(server.url, toolCall("2026년 8월 1일 4살 아이와 체험")),
    ])
    const datePayload = parseMcpJsonRpcResponse(missingDate.body) as {
      readonly id?: string
      readonly result?: {
        readonly structuredContent?: {
          readonly failure?: { readonly missing_fields?: readonly string[] }
        }
      }
    }
    const locationPayload = parseMcpJsonRpcResponse(missingLocation.body) as {
      readonly id?: string
      readonly result?: {
        readonly structuredContent?: {
          readonly failure?: { readonly missing_fields?: readonly string[] }
        }
      }
    }

    // Then: each request has its own server/transport and receives its own correlated result.
    expect([missingDate.statusCode, missingLocation.statusCode]).toEqual([200, 200])
    expect([datePayload.id, locationPayload.id]).toEqual(["shared-id", "shared-id"])
    expect(datePayload.result?.structuredContent?.failure?.missing_fields).toContain("date_range")
    expect(locationPayload.result?.structuredContent?.failure?.missing_fields).toContain("location")
  })

  it("records an interrupted response as 499 instead of a false HTTP success", async () => {
    // Given: a request is admitted and held while structured request logs are captured.
    const logs: OperationalLogEntry[] = []
    let markEntered: (() => void) | undefined
    let releaseRoute: (() => void) | undefined
    const entered = new Promise<void>((resolve) => { markEntered = resolve })
    const routeGate = new Promise<void>((resolve) => { releaseRoute = resolve })
    const server = await listenOnLocalhost(createFamilyExperienceHttpServer({
      logger: (entry) => logs.push(entry),
      routeRequest: async (_request, response) => {
        markEntered?.()
        await routeGate
        if (!response.destroyed) {
          response.writeHead(204)
          response.end()
        }
      },
    }))
    const target = new URL(server.url)
    const socket = createConnection({ host: target.hostname, port: Number(target.port) })
    await once(socket, "connect")
    socket.write([
      "POST /mcp HTTP/1.1",
      `Host: ${target.host}`,
      "Content-Type: application/json",
      "Content-Length: 2",
      "Connection: close",
      "",
      "{}",
    ].join("\r\n"))

    // When: the client disconnects before the response is written.
    await entered
    socket.destroy()
    await vi.waitFor(() => {
      expect(logs.some((entry) => entry.http?.status_code === 499)).toBe(true)
    })
    releaseRoute?.()

    // Then: no completed 2xx request is emitted for the aborted response.
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      event: "http_request",
      http: { method: "POST", path: "/mcp", status_code: 499, outcome: "failure" },
    })
  })

  it("rejects invalid JSON with a safe parse-error shape", async () => {
    // Given: the public MCP HTTP endpoint receives malformed JSON.
    const server = await startMcpHttpServer()

    // When: the client posts the malformed body.
    const response = await postMcpJson(server.url, "{bad json")

    // Then: the server returns a bounded JSON-RPC parse error.
    expect(response.statusCode).toBe(400)
    expect(response.body).toContain("parse_error")
    expect(response.body).not.toMatch(/stack|SyntaxError|TypeError/i)
  })

  it("rejects oversized JSON bodies before MCP tool dispatch", async () => {
    // Given: the public MCP HTTP endpoint receives a body larger than the beta cap.
    const server = await startMcpHttpServer()
    const oversizedBody = JSON.stringify({
      jsonrpc: "2.0",
      id: "large-1",
      method: "tools/call",
      params: {
        name: "find_family_experiences",
        arguments: { prompt: "x".repeat(70_000) },
      },
    })

    // When: the client posts the oversized body.
    const response = await postMcpJson(server.url, oversizedBody)

    // Then: the server rejects it without echoing the payload.
    expect(response.statusCode).toBe(413)
    expect(response.body).toContain("request_body_too_large")
    expect(response.body).not.toContain("x".repeat(1_000))
    expect(response.body).not.toMatch(/stack|SyntaxError|TypeError/i)
  })

  it("returns request_timeout when the MCP JSON body stalls", async () => {
    // Given: the public MCP HTTP endpoint receives headers and a partial JSON body that never ends.
    const server = await startMcpHttpServer()
    const port = Number(new URL(server.url).port)

    // When: the client leaves the request body incomplete past the app timeout.
    const response = await postIncompleteMcpJson(port)

    // Then: the server returns the safe JSON-RPC request timeout shape.
    expect(response.statusCode).toBe(408)
    expect(response.body).toContain("request_timeout")
    expect(response.body).not.toMatch(/stack|SyntaxError|TypeError/i)
  }, 20_000)

  it("returns internal_error when an unexpected MCP HTTP route error escapes", async () => {
    // Given: the MCP HTTP server route has an unexpected internal failure.
    const server = await listenOnLocalhost(
      createFamilyExperienceHttpServer({
        routeRequest: async () => {
          throw new Error("simulated internal failure")
        },
      }),
    )

    // When: the client posts a real MCP request.
    const response = await postMcpJson(server.url, "{}")

    // Then: the server returns the safe JSON-RPC internal error shape.
    expect(response.statusCode).toBe(500)
    expect(response.body).toContain("internal_error")
    expect(response.body).not.toContain("simulated internal failure")
    expect(response.body).not.toMatch(/stack|SyntaxError|TypeError/i)
  })

  it("propagates injected config through health and MCP tool execution", async () => {
    // Given: the ambient environment disables fixtures while this server instance explicitly enables them.
    vi.stubEnv("FAMILY_EXPERIENCE_ALLOW_FIXTURE", "0")
    const server = await listenOnLocalhost(createFamilyExperienceHttpServer({
      config: {
        host: "127.0.0.1",
        port: 3345,
        allowFixture: true,
        seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
      },
    }))
    const healthResponse = await fetch(new URL("/health", server.url))
    const health: unknown = await healthResponse.json()
    const client = new Client({ name: "injected-config-test-client", version: "0.1.0" })

    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(server.url)))

      // When: health and the public tool are exercised through the same HTTP server.
      const result = await client.callTool({
        name: "find_family_experiences",
        arguments: {
          location: "Seoul",
          date_range: { start: "2026-07-04", end: "2026-07-04" },
          child_age: 4,
        },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: neither boundary reloads and substitutes ambient configuration.
      expect(health).toMatchObject({ config: { allowFixture: true, toolMode: "fixture" } })
      expect(structuredContent).toMatchObject({ ok: true, mode: "fixture" })
    } finally {
      await client.close()
    }
  })

  it("rejects overlong prompt requests with a safe JSON-RPC error", async () => {
    // Given: the public MCP HTTP endpoint receives a prompt larger than the beta limit.
    const server = await startMcpHttpServer()
    const longPrompt = "x".repeat(20_000)

    // When: the client posts the real JSON-RPC tool call.
    const response = await postMcpJson(
      server.url,
      JSON.stringify({
        jsonrpc: "2.0",
        id: "long-1",
        method: "tools/call",
        params: {
          name: "find_family_experiences",
          arguments: { prompt: longPrompt },
        },
      }),
    )

    // Then: the server rejects it without echoing the prompt or a stack trace.
    expect(response.statusCode).toBeLessThan(500)
    expect(response.body).toContain("at most")
    expect(response.body).not.toContain(longPrompt)
    expect(response.body).not.toMatch(/stack|SyntaxError|TypeError/i)
  })

  it("PIN:RATE_LIMIT returns 429 on the fourth invocation when the configured limit is three", async () => {
    // Given: one client has a deterministic three-request allowance in a long window.
    const server = await startMcpHttpServer({
      FAMILY_EXPERIENCE_MCP_RATE_LIMIT: "3",
      FAMILY_EXPERIENCE_MCP_RATE_WINDOW_MS: "60000",
    })
    const statuses: number[] = []

    // When: the client exceeds the configured invocation window.
    for (let requestIndex = 0; requestIndex < 4; requestIndex += 1) {
      const response = await postMcpJson(server.url, "{bad json")
      statuses.push(response.statusCode)
    }

    // Then: three requests reach parsing and the fourth is rejected at admission.
    expect(statuses).toEqual([400, 400, 400, 429])
  })

  it("PIN:ORIGIN_403 rejects malformed and unlisted present origins but permits absent origin", async () => {
    // Given: a server allows exactly one normalized browser origin.
    const server = await listenOnLocalhost(createFamilyExperienceHttpServer({
      config: {
        ...loadFamilyExperienceConfig({ FAMILY_EXPERIENCE_ALLOWED_ORIGINS: "https://allowed.example.test" }),
      },
    }))

    // When: non-browser, malformed, unlisted, and exact-origin requests arrive.
    const absent = await postMcpJson(server.url, "{bad json")
    const malformed = await postMcpJsonWithOrigin(server.url, "not a URL")
    const unlisted = await postMcpJsonWithOrigin(server.url, "https://allowed.example.test" + ".evil")
    const allowed = await postMcpJsonWithOrigin(server.url, "https://allowed.example.test")

    // Then: every present origin is exact-validated before transport; absent Origin remains MCP-compatible.
    expect(absent.statusCode).toBe(400)
    expect(malformed.status).toBe(403)
    expect(unlisted.status).toBe(403)
    expect(allowed.status).toBe(400)
  })

  it("PIN:RETRY_AFTER returns an integer Retry-After for rate-limited invocations", async () => {
    // Given: one invocation is allowed in a long deterministic window.
    const server = await listenOnLocalhost(createFamilyExperienceHttpServer({
      config: loadFamilyExperienceConfig({
        FAMILY_EXPERIENCE_MCP_RATE_LIMIT: "1",
        FAMILY_EXPERIENCE_MCP_RATE_WINDOW_MS: "60000",
      }),
    }))

    // When: the stable local socket key invokes twice.
    await postMcpJson(server.url, "{bad json")
    const limited = await postMcpJsonWithOrigin(server.url)

    // Then: the public response supplies an integer retry delay.
    expect(limited.status).toBe(429)
    expect(limited.headers.get("retry-after")).toMatch(/^\d+$/)
  })
})
