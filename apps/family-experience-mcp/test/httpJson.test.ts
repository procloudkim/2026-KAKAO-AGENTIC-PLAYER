import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { createServer, type Server } from "node:http"
import { once } from "node:events"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { afterEach, describe, expect, it } from "vitest"

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

async function startMcpHttpServer(): Promise<{ readonly url: string }> {
  const port = await reserveLocalPort()
  activeMcpProcess = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
    cwd: packageDir,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      FAMILY_EXPERIENCE_ALLOW_FIXTURE: "1",
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
})

describe("Family experience MCP HTTP request limits", () => {
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

  it("rate limits rapid repeated MCP requests per process", async () => {
    // Given: one client sends rapid repeated requests to the public MCP endpoint.
    const server = await startMcpHttpServer()
    const statuses: number[] = []

    // When: the client exceeds the public beta per-process request window.
    for (let requestIndex = 0; requestIndex < 65; requestIndex += 1) {
      const response = await postMcpJson(server.url, "{bad json")
      statuses.push(response.statusCode)
    }

    // Then: the server starts returning safe rate-limit responses.
    expect(statuses).toContain(429)
  })
})
