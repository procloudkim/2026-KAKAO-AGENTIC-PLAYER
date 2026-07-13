// allow: SIZE_OK — indivisible end-to-end QA matrix with one fail-closed receipt and cleanup boundary.
import { spawn, type ChildProcess } from "node:child_process"
import { Agent, request } from "node:http"
import { createConnection } from "node:net"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath } from "node:url"

import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client"
import { z } from "zod/v4"

import { buildMetadata, writeCache } from "../src/etl/cache.js"
import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"
import { smokeRecords } from "./smoke-mcp-fixtures.js"

const PIN = "PIN:COMPILED_HTTP_MATRIX"
const LIFECYCLE_PIN = "PIN:PERSISTENT_MCP_LIFECYCLE"
const HOST = "127.0.0.1"
const BASE_PORT = 30_000 + (process.pid % 19_000)
let activePort = BASE_PORT
let nextPortOffset = 0
const endpointForPort = (port: number): string => `http://${HOST}:${port}/mcp`
const DEFAULT_OUTPUT = resolve("../../.omo/evidence/family-experience-submission-ready/c002-http/compiled-http-qa.json")
const PROMPT = "부산 이번 주말 4살 실내"
const PERFORMANCE_WARMUP_CALLS = 5
const PERFORMANCE_GUIDE_SAMPLES = 100
const PERFORMANCE_STRESS_SAMPLES = 30
const QA_LIFECYCLE_MODE = "signals_only"

type HttpResult = {
  readonly status: number
  readonly headers: Readonly<Record<string, string>>
  readonly body: string
}

type Gate = {
  readonly status: "PASS" | "FAIL"
  readonly detail: unknown
}

type RunningServer = {
  readonly child: ChildProcess
  readonly pid: number
  readonly logs: string[]
  readonly port: number
}

type StepTiming = {
  readonly step: string
  readonly status: "PASS" | "FAIL"
  readonly elapsed_ms: number
  readonly message?: string
}

class QaFailure extends Error {
  readonly gate: string

  constructor(gate: string, message: string) {
    super(message)
    this.name = "QaFailure"
    this.gate = gate
  }
}

const JsonRpcSchema = z.object({
  jsonrpc: z.literal("2.0"),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.object({ code: z.string() }).passthrough().optional(),
  }).optional(),
}).passthrough()

const McpToolJsonRpcSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]),
  result: z.object({ structuredContent: z.unknown() }).passthrough().optional(),
  error: z.object({ code: z.number(), message: z.string() }).passthrough().optional(),
}).passthrough()

const HealthSchema = z.object({ ok: z.boolean() }).passthrough()

function requireGate(condition: boolean, gate: string, message: string): void {
  if (!condition) throw new QaFailure(gate, message)
}

function parseMcpJsonRpcResponse(body: string): unknown {
  const dataLine = body
    .split(/\r?\n/)
    .find((line) => line.startsWith("data:"))
  return JSON.parse(dataLine === undefined ? body : dataLine.slice("data:".length).trim())
}

async function bounded<T>(gate: string, operation: Promise<T>, timeoutMs = 20_000): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new QaFailure(gate, `gate exceeded ${timeoutMs}ms`)), timeoutMs)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

function parseOutput(argv: readonly string[]): string {
  const outputIndex = argv.indexOf("--output")
  if (outputIndex === -1) return DEFAULT_OUTPUT
  const value = argv[outputIndex + 1]
  if (value === undefined || value.trim().length === 0) {
    throw new QaFailure("arguments", "--output requires a path")
  }
  return resolve(value)
}

async function runCommand(command: string, args: readonly string[]): Promise<void> {
  await new Promise<void>((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), stdio: "pipe" })
    let stderr = ""
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk })
    child.once("error", reject)
    child.once("exit", (code) => {
      if (code === 0) resolveRun()
      else reject(new QaFailure("build", `build exited ${String(code)}: ${stderr.slice(-1_000)}`))
    })
  })
}

async function seedCache(cacheDir: string, generatedAt: string, ttlHours: number): Promise<void> {
  const records = smokeRecords()
  await writeCache({
    cacheDir,
    metadata: buildMetadata({
      generatedAt,
      fixture: true,
      maxPages: 1,
      mode: "write-cache",
      rawSnapshots: [],
      records,
      sourceSet: ["culture_portal", "kto_tourapi"],
      sourceSummaries: [{ ok: true }, { ok: true }],
      ttlHours,
    }),
    rawSnapshots: [],
    records,
  })
}

function serverEnvironment(
  cacheDir: string,
  overrides: Readonly<Record<string, string>>,
  port: number,
): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HOST,
    PORT: String(port),
    FAMILY_EXPERIENCE_ALLOW_FIXTURE: "true",
    FAMILY_EXPERIENCE_ETL_CACHE_DIR: cacheDir,
    FAMILY_EXPERIENCE_ETL_TTL_HOURS: "24",
    FAMILY_EXPERIENCE_SOURCE_SET: "culture_portal,kto_tourapi",
    FAMILY_EXPERIENCE_MCP_RATE_WINDOW_MS: "60000",
    FAMILY_EXPERIENCE_SHUTDOWN_GRACE_MS: "1000",
    ...overrides,
  }
}

async function startServer(
  cacheDir: string,
  overrides: Readonly<Record<string, string>> = {},
  expectHealthy = true,
): Promise<RunningServer> {
  const port = BASE_PORT + nextPortOffset
  nextPortOffset += 1
  activePort = port
  const child = spawn(process.execPath, ["dist/src/server.js", "--signals-only"], {
    cwd: process.cwd(),
    env: serverEnvironment(cacheDir, overrides, port),
    stdio: ["ignore", "pipe", "pipe"],
  })
  const pid = child.pid
  if (pid === undefined) throw new QaFailure("process", "compiled server did not expose a PID")
  const logs: string[] = []
  const collect = (chunk: string): void => {
    logs.push(chunk.replaceAll(cacheDir, "[cache-dir]").slice(-2_000))
  }
  child.stdout.setEncoding("utf8").on("data", collect)
  child.stderr.setEncoding("utf8").on("data", collect)

  const deadline = Date.now() + 10_000
  let lastHealth = "no health response"
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new QaFailure("process", `compiled server exited ${child.exitCode}`)
    try {
      const health = await httpRequest({ method: "GET", path: "/health" })
      lastHealth = `${health.status}: ${health.body.slice(0, 1_000)}`
      const healthBody = HealthSchema.parse(JSON.parse(health.body))
      const healthMatches = expectHealthy
        ? health.status === 200 && healthBody.ok
        : health.status !== 200 && !healthBody.ok
      if (!healthMatches) {
        throw new QaFailure("health", `health endpoint did not match expected state (${health.status})`)
      }
      await new Promise<void>((resolveWait) => setTimeout(resolveWait, 100))
      if (child.exitCode !== null) throw new QaFailure("process", `compiled server exited ${child.exitCode} after health probe`)
      return { child, pid, logs, port }
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error
      await new Promise<void>((resolveWait) => setTimeout(resolveWait, 40))
    }
  }
  await stopServer({ child, pid, logs, port })
  throw new QaFailure("health", `health endpoint did not become ready within 10 seconds; last=${lastHealth}`)
}

async function stopServer(server: RunningServer): Promise<void> {
  if (server.child.exitCode === null) server.child.kill("SIGTERM")
  await new Promise<void>((resolveExit, reject) => {
    if (server.child.exitCode !== null) {
      resolveExit()
      return
    }
    const timer = setTimeout(() => {
      server.child.kill("SIGKILL")
    }, 3_000)
    server.child.once("error", reject)
    server.child.once("exit", () => {
      clearTimeout(timer)
      resolveExit()
    })
  })
}

function httpRequest(input: {
  readonly agent?: Agent | false
  readonly method: string
  readonly path: string
  readonly body?: string
  readonly headers?: Readonly<Record<string, string>>
}): Promise<HttpResult> {
  return new Promise((resolveRequest, reject) => {
    const body = input.body ?? ""
    const outgoing = request({
      agent: input.agent ?? false,
      host: HOST,
      port: activePort,
      path: input.path,
      method: input.method,
      headers: {
        connection: input.agent === undefined || input.agent === false ? "close" : "keep-alive",
        ...(body.length === 0 ? {} : { "content-length": Buffer.byteLength(body) }),
        ...input.headers,
      },
      timeout: 8_000,
    }, (response) => {
      const chunks: Buffer[] = []
      response.on("data", (chunk: Buffer) => chunks.push(chunk))
      response.on("end", () => {
        const headers: Record<string, string> = {}
        for (const [name, value] of Object.entries(response.headers)) {
          if (typeof value === "string") headers[name] = value
          else if (Array.isArray(value)) headers[name] = value.join(", ")
        }
        resolveRequest({ status: response.statusCode ?? 0, headers, body: Buffer.concat(chunks).toString("utf8") })
      })
    })
    outgoing.once("timeout", () => outgoing.destroy(new QaFailure("http", "HTTP request timed out")))
    outgoing.once("error", reject)
    outgoing.end(body)
  })
}

async function withClient<T>(
  timings: StepTiming[],
  operation: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({ name: "compiled-http-qa", version: "1.0.0" })
  const transport = new StreamableHTTPClientTransport(new URL(endpointForPort(activePort)))
  try {
    await timeMcpStep(timings, "connect", client.connect(transport))
    return await bounded("mcp_operation", operation(client))
  } finally {
    await timeMcpStep(timings, "transport_close", transport.close())
    await timeMcpStep(timings, "client_close", client.close())
  }
}

async function timeMcpStep<T>(
  timings: StepTiming[],
  step: string,
  operation: Promise<T>,
): Promise<T> {
  const started = performance.now()
  try {
    const result = await bounded(`mcp_${step}`, operation, 8_000)
    timings.push({ step, status: "PASS", elapsed_ms: performance.now() - started })
    return result
  } catch (error: unknown) {
    const elapsedMs = performance.now() - started
    timings.push({
      step,
      status: "FAIL",
      elapsed_ms: elapsedMs,
      message: error instanceof Error ? error.message : "unknown failure",
    })
    throw new QaFailure(
      `mcp_${step}`,
      `${step} failed after ${elapsedMs.toFixed(2)}ms: ${error instanceof Error ? error.message : "unknown failure"}`,
    )
  }
}

async function mcpGate(): Promise<unknown> {
  const timings: StepTiming[] = []
  return withClient(timings, async (client) => {
    const tools = await timeMcpStep(timings, "list_tools", client.listTools())
    requireGate(tools.tools.length === 1, "mcp", `expected one tool, received ${tools.tools.length}`)
    requireGate(tools.tools[0]?.name === "find_family_experiences", "mcp", "unexpected public tool")
    const headers = { accept: "application/json, text/event-stream", "content-type": "application/json" }
    const postToolCall = async (id: string, prompt: string, name = "find_family_experiences") => {
      const body = JSON.stringify({
        jsonrpc: "2.0",
        id,
        method: "tools/call",
        params: { name, arguments: { prompt } },
      })
      const response = await httpRequest({ method: "POST", path: "/mcp", body, headers })
      requireGate(response.status === 200, "mcp", `${id} returned HTTP ${response.status}`)
      return McpToolJsonRpcSchema.parse(parseMcpJsonRpcResponse(response.body))
    }
    const validRpc = await timeMcpStep(
      timings,
      "valid_call",
      postToolCall("lifecycle-valid", PROMPT),
    )
    if (validRpc.result === undefined) throw new QaFailure("mcp", "valid call lacked a result")
    const parsedValid = FindFamilyExperiencesStructuredContentSchema.parse(validRpc.result.structuredContent)
    requireGate(parsedValid.ok, "mcp", "valid cache-hit call failed")
    const validCharacters = JSON.stringify(validRpc).length
    requireGate(validCharacters <= 4_000, "mcp", `valid response was ${validCharacters} characters`)
    const invalidRpc = await timeMcpStep(
      timings,
      "invalid_call",
      postToolCall("lifecycle-invalid", "4살 실내"),
    )
    if (invalidRpc.result === undefined) throw new QaFailure("mcp", "invalid-input call lacked a result")
    const parsedInvalid = FindFamilyExperiencesStructuredContentSchema.parse(invalidRpc.result.structuredContent)
    if (parsedInvalid.ok || parsedInvalid.failure.code !== "invalid_input") {
      throw new QaFailure("mcp", "missing location was not typed invalid_input")
    }
    const unknownRpc = await timeMcpStep(
      timings,
      "unknown_call",
      postToolCall("lifecycle-unknown", "unused", "unknown_compiled_qa_tool"),
    )
    const unknownSafe = unknownRpc.error !== undefined
    requireGate(unknownSafe, "mcp", "unknown tool did not return a protocol error or safe failure")
    return { pin: LIFECYCLE_PIN, tool_count: tools.tools.length, valid_characters: validCharacters, valid_ok: true, invalid_code: parsedInvalid.failure.code, unknown_safe: unknownSafe, timings }
  })
}

async function adversarialGate(): Promise<unknown> {
  const health = await httpRequest({ method: "GET", path: "/health" })
  const healthBody = HealthSchema.parse(JSON.parse(health.body))
  requireGate(health.status === 200 && healthBody.ok, "adversarial", "fresh health was not ready")
  requireGate(health.headers["content-type"]?.includes("application/json") === true, "adversarial", "health content type missing")
  const mcpHeaders = { accept: "application/json, text/event-stream", "content-type": "application/json" }
  const malformed = await httpRequest({ method: "POST", path: "/mcp", body: "{", headers: mcpHeaders })
  const wrongMedia = await httpRequest({ method: "POST", path: "/mcp", body: "{}", headers: { "content-type": "text/plain" } })
  const wrongMethod = await httpRequest({ method: "PUT", path: "/mcp" })
  const oversized = await httpRequest({ method: "POST", path: "/mcp", body: "x".repeat(65_537), headers: mcpHeaders })
  const forbidden = await httpRequest({ method: "POST", path: "/mcp", body: "{}", headers: { ...mcpHeaders, origin: "https:" + "//blocked.invalid" } })
  requireGate(malformed.status >= 400, "adversarial", "malformed JSON was accepted")
  requireGate(wrongMedia.status >= 400, "adversarial", "wrong media type was accepted")
  requireGate(wrongMethod.status >= 400, "adversarial", "wrong method was accepted")
  requireGate(oversized.status === 413, "adversarial", `oversized request returned ${oversized.status}`)
  requireGate(forbidden.status === 403, "adversarial", `invalid Origin returned ${forbidden.status}`)
  const bodies = [malformed.body, wrongMedia.body, wrongMethod.body, oversized.body, forbidden.body]
  requireGate(!bodies.some((body) => /node_modules|[A-Za-z]:\\|stack|secret|api[_-]?key/i.test(body)), "adversarial", "adversarial response exposed internal detail")
  return {
    health: { status: health.status, headers: health.headers, body: healthBody },
    cases: { malformed: malformed.status, wrong_media: wrongMedia.status, wrong_method: wrongMethod.status, oversized: oversized.status, forbidden_origin: forbidden.status },
    bodies: bodies.map((body) => body.slice(0, 400)),
  }
}

export function validatePerformanceSamples(
  samples: readonly number[],
  batchElapsedMs: number,
): {
  readonly samples: number
  readonly average_ms: number
  readonly observed_average_ms: number
  readonly p99_ms: number
  readonly metric: string
} {
  const summary = summarizePerformanceSamples(samples, batchElapsedMs)
  requireGate(
    summary.observed_average_ms <= 100,
    "performance",
    `observed per-request average ${summary.observed_average_ms.toFixed(2)}ms exceeded 100ms`,
  )
  requireGate(summary.p99_ms <= 3_000, "performance", `p99 ${summary.p99_ms.toFixed(2)}ms exceeded 3000ms`)

  return {
    ...summary,
    metric: "sequential end-to-end cache-hit JSON-RPC calls over one persistent connection after application warmup; observed mean must be <=100ms and p99 must be <=3000ms; batch mean is diagnostic only",
  }
}

export function validateConcurrentPerformanceSamples(
  samples: readonly number[],
  batchElapsedMs: number,
): ReturnType<typeof validatePerformanceSamples> {
  const summary = summarizePerformanceSamples(samples, batchElapsedMs)
  requireGate(summary.average_ms <= 100, "performance", `concurrent throughput average ${summary.average_ms.toFixed(2)}ms exceeded 100ms`)
  requireGate(summary.p99_ms <= 3_000, "performance", `concurrent p99 ${summary.p99_ms.toFixed(2)}ms exceeded 3000ms`)
  return {
    ...summary,
    metric: "30 concurrent cache-hit JSON-RPC calls; average_ms is batch wall time/completions and must be <=100ms, p99 must be <=3000ms, and queued per-request mean is recorded without redefining the guide latency average",
  }
}

function summarizePerformanceSamples(
  samples: readonly number[],
  batchElapsedMs: number,
): Omit<ReturnType<typeof validatePerformanceSamples>, "metric"> {
  if (
    samples.length === 0 ||
    !Number.isFinite(batchElapsedMs) ||
    batchElapsedMs < 0 ||
    samples.some((sample) => !Number.isFinite(sample) || sample < 0)
  ) {
    throw new QaFailure("performance", "performance samples must be finite non-negative values")
  }

  const ordered = [...samples].sort((left, right) => left - right)
  const percentileIndex = Math.ceil(samples.length * 0.99) - 1
  const p99Ms = ordered[percentileIndex]
  if (p99Ms === undefined) throw new QaFailure("performance", "p99 sample was absent")
  return {
    samples: samples.length,
    average_ms: batchElapsedMs / samples.length,
    observed_average_ms: samples.reduce((sum, value) => sum + value, 0) / samples.length,
    p99_ms: p99Ms,
  }
}

async function performanceGate(): Promise<unknown> {
  const guideAgent = new Agent({ keepAlive: true, maxSockets: 1 })
  const stressAgent = new Agent({ keepAlive: true, maxSockets: 32 })
  try {
    const headers = { accept: "application/json, text/event-stream", "content-type": "application/json" }
    const measureCall = async (id: string, requestAgent: Agent): Promise<number> => {
      const body = JSON.stringify({
        jsonrpc: "2.0",
        id,
        method: "tools/call",
        params: { name: "find_family_experiences", arguments: { prompt: PROMPT } },
      })
      const started = performance.now()
      const response = await httpRequest({ agent: requestAgent, method: "POST", path: "/mcp", body, headers })
      const elapsed = performance.now() - started
      requireGate(
        response.status === 200,
        "performance",
        `cache-hit sample ${id} returned ${response.status}: ${response.body.slice(0, 200)}`,
      )
      const rpc = McpToolJsonRpcSchema.parse(parseMcpJsonRpcResponse(response.body))
      requireGate(rpc.id === id, "performance", `cache-hit sample ${id} lost correlation`)
      if (rpc.result === undefined) throw new QaFailure("performance", `cache-hit sample ${id} lacked a result`)
      const parsed = FindFamilyExperiencesStructuredContentSchema.parse(rpc.result.structuredContent)
      if (!parsed.ok) throw new QaFailure("performance", `cache-hit sample ${id} failed`)
      requireGate(
        parsed.candidates.length === 3,
        "performance",
        `cache-hit sample ${id} returned ${parsed.candidates.length} candidates instead of the worst-normal three-card response`,
      )
      return elapsed
    }

    const coldProbeMs = await measureCall("performance-cold-probe", guideAgent)
    requireGate(coldProbeMs <= 3_000, "performance", `cold probe ${coldProbeMs.toFixed(2)}ms exceeded 3000ms`)
    const warmupSamples: number[] = []
    for (let index = 1; index <= PERFORMANCE_WARMUP_CALLS; index += 1) {
      warmupSamples.push(await measureCall(`performance-warmup-${index}`, guideAgent))
    }
    const sequentialStarted = performance.now()
    const sequentialSamples: number[] = []
    for (let index = 0; index < PERFORMANCE_GUIDE_SAMPLES; index += 1) {
      sequentialSamples.push(await measureCall(`performance-sequential-${index + 1}`, guideAgent))
    }
    const sequentialElapsedMs = performance.now() - sequentialStarted

    const concurrentStarted = performance.now()
    const concurrentSamples = await Promise.all(Array.from(
      { length: PERFORMANCE_STRESS_SAMPLES },
      async (_value, index) => measureCall(`performance-concurrent-${index + 1}`, stressAgent),
    ))
    const concurrentElapsedMs = performance.now() - concurrentStarted
    const guide = validatePerformanceSamples(sequentialSamples, sequentialElapsedMs)
    const stress = validateConcurrentPerformanceSamples(concurrentSamples, concurrentElapsedMs)
    return {
      cold_probe_ms: coldProbeMs,
      warmup_calls: PERFORMANCE_WARMUP_CALLS,
      warmup_response_ms: warmupSamples,
      lifecycle_mode: QA_LIFECYCLE_MODE,
      lifecycle_rationale: "Matches the linux/amd64 deployment path and excludes the Windows-only synchronous MSYS parent watcher from latency measurement.",
      guide: {
        sample_count: guide.samples,
        guide_mean_response_ms: guide.observed_average_ms,
        guide_batch_mean_ms: guide.average_ms,
        guide_p99_response_ms: guide.p99_ms,
        thresholds: { mean_ms: 100, p99_ms: 3_000 },
        metric: guide.metric,
      },
      stress: {
        sample_count: stress.samples,
        stress_ms_per_completion: stress.average_ms,
        stress_mean_wall_ms: stress.observed_average_ms,
        stress_p99_wall_ms: stress.p99_ms,
        thresholds: { ms_per_completion: 100, p99_ms: 3_000 },
        metric: stress.metric,
      },
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
    }
  } finally {
    guideAgent.destroy()
    stressAgent.destroy()
  }
}

async function rateGate(): Promise<unknown> {
  const headers = { accept: "application/json, text/event-stream", "content-type": "application/json" }
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} })
  for (let index = 1; index <= 64; index += 1) {
    const response = await httpRequest({ method: "POST", path: "/mcp", body, headers })
    if (response.status === 429) {
      const retryAfter = response.headers["retry-after"]
      if (retryAfter === undefined || !/^\d+$/.test(retryAfter)) {
        throw new QaFailure("rate_limit", "429 lacked integer Retry-After")
      }
      const rpc = JsonRpcSchema.parse(JSON.parse(response.body))
      requireGate(rpc.error?.data?.code === "rate_limited", "rate_limit", "429 was not rate-limited")
      return { observed_at_request: index, status: response.status, retry_after: Number.parseInt(retryAfter, 10) }
    }
  }
  throw new QaFailure("rate_limit", "no sequential 429 observed by request 64")
}

async function concurrencyGate(): Promise<unknown> {
  const held = createConnection({ host: HOST, port: activePort })
  await new Promise<void>((resolveConnect, reject) => {
    held.once("connect", () => {
      held.write(["POST /mcp HTTP/1.1", `Host: ${HOST}`, "Content-Type: application/json", "Accept: application/json, text/event-stream", "Content-Length: 100", "", "{"].join("\r\n"))
      resolveConnect()
    })
    held.once("error", reject)
  })
  await new Promise<void>((resolveWait) => setTimeout(resolveWait, 150))
  try {
    const response = await httpRequest({ method: "POST", path: "/mcp", body: "{}", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" } })
    const rpc = JsonRpcSchema.parse(JSON.parse(response.body))
    requireGate(response.status === 429 && rpc.error?.data?.code === "concurrency_limited", "concurrency", `held request returned ${response.status}/${rpc.error?.data?.code ?? "untyped"}`)
    return { status: response.status, code: rpc.error?.data?.code, deterministic_hold: true }
  } finally {
    held.destroy()
  }
}

async function staleGate(): Promise<unknown> {
  const health = await httpRequest({ method: "GET", path: "/health" })
  requireGate(health.status !== 200, "stale_cache", "stale cache health unexpectedly ready")
  const timings: StepTiming[] = []
  return withClient(timings, async (client) => {
    const tools = await client.listTools()
    const listedTool = tools.tools.find((tool) => tool.name === "find_family_experiences")
    if (listedTool === undefined) throw new QaFailure("stale_cache", "public tool was absent")
    const response = await httpRequest({
      method: "POST",
      path: "/mcp",
      headers: { accept: "application/json, text/event-stream", "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "stale-cache",
        method: "tools/call",
        params: { name: "find_family_experiences", arguments: { prompt: PROMPT } },
      }),
    })
    requireGate(response.status === 200, "stale_cache", `stale call returned HTTP ${response.status}`)
    const rpc = McpToolJsonRpcSchema.parse(parseMcpJsonRpcResponse(response.body))
    if (rpc.result === undefined) throw new QaFailure("stale_cache", "stale call lacked a result")
    const parsed = FindFamilyExperiencesStructuredContentSchema.parse(rpc.result.structuredContent)
    if (parsed.ok || !["missing_configuration", "no_results"].includes(parsed.failure.code)) {
      throw new QaFailure("stale_cache", `unexpected stale failure ${parsed.ok ? "ok" : parsed.failure.code}`)
    }
    const body = JSON.stringify(rpc)
    requireGate(!/[A-Za-z]:\\|node_modules/i.test(body), "stale_cache", "stale tool response exposed an internal path")
    return { health_status: health.status, failure_code: parsed.failure.code, body_characters: body.length }
  })
}

async function provePortFree(port: number): Promise<boolean> {
  return new Promise((resolveProbe) => {
    const probe = createConnection({ host: HOST, port })
    probe.once("connect", () => {
      probe.destroy()
      resolveProbe(false)
    })
    probe.once("error", () => resolveProbe(true))
  })
}

async function main(): Promise<void> {
  const output = parseOutput(process.argv.slice(2))
  await rm(output, { force: true })
  const workspace = await mkdtemp(join(tmpdir(), "family-experience-compiled-http-"))
  const freshCache = join(workspace, "fresh")
  const staleCache = join(workspace, "stale")
  const gates: Record<string, Gate> = {}
  const pids: number[] = []
  const ports: number[] = []
  let active: RunningServer | undefined
  let failure: unknown

  try {
    await runCommand(process.execPath, [resolve("node_modules/typescript/bin/tsc"), "-p", "tsconfig.build.json"])
    gates["build"] = { status: "PASS", detail: { entrypoint: "dist/src/server.js" } }
    await seedCache(freshCache, new Date().toISOString(), 24)
    await seedCache(staleCache, "2000-01-01T00:00:00.000Z", 1)

    active = await startServer(freshCache, { FAMILY_EXPERIENCE_MCP_RATE_LIMIT: "10000", FAMILY_EXPERIENCE_MCP_MAX_CONCURRENCY: "32" })
    pids.push(active.pid)
    ports.push(active.port)
    gates["health_http"] = { status: "PASS", detail: await bounded("adversarial", adversarialGate()) }
    await stopServer(active)
    active = undefined

    active = await startServer(freshCache, { FAMILY_EXPERIENCE_MCP_RATE_LIMIT: "10000", FAMILY_EXPERIENCE_MCP_MAX_CONCURRENCY: "32" })
    pids.push(active.pid)
    ports.push(active.port)
    gates["mcp_lifecycle"] = { status: "PASS", detail: await bounded("mcp", mcpGate(), 30_000) }
    await stopServer(active)
    active = undefined

    active = await startServer(freshCache, { FAMILY_EXPERIENCE_MCP_RATE_LIMIT: "10000", FAMILY_EXPERIENCE_MCP_MAX_CONCURRENCY: "32" })
    pids.push(active.pid)
    ports.push(active.port)
    gates["performance"] = { status: "PASS", detail: await bounded("performance", performanceGate(), 30_000) }
    await stopServer(active)
    active = undefined

    active = await startServer(freshCache, { FAMILY_EXPERIENCE_MCP_RATE_LIMIT: "10", FAMILY_EXPERIENCE_MCP_MAX_CONCURRENCY: "32" })
    pids.push(active.pid)
    ports.push(active.port)
    gates["rate_limit"] = { status: "PASS", detail: await rateGate() }
    await stopServer(active)
    active = undefined

    active = await startServer(freshCache, { FAMILY_EXPERIENCE_MCP_RATE_LIMIT: "10000", FAMILY_EXPERIENCE_MCP_MAX_CONCURRENCY: "1" })
    pids.push(active.pid)
    ports.push(active.port)
    gates["concurrency"] = { status: "PASS", detail: await concurrencyGate() }
    await stopServer(active)
    active = undefined

    active = await startServer(
      staleCache,
      { FAMILY_EXPERIENCE_MCP_RATE_LIMIT: "10000", FAMILY_EXPERIENCE_MCP_MAX_CONCURRENCY: "32" },
      false,
    )
    pids.push(active.pid)
    ports.push(active.port)
    gates["stale_cache"] = { status: "PASS", detail: await staleGate() }
  } catch (error: unknown) {
    failure = error
    const name = error instanceof QaFailure ? error.gate : "unexpected"
    gates[name] = { status: "FAIL", detail: { message: error instanceof Error ? error.message : "unknown failure" } }
  } finally {
    const activeLogs = active?.logs ?? []
    if (active !== undefined) await stopServer(active)
    const uniquePorts = [...new Set(ports)]
    const portChecks = await Promise.all(uniquePorts.map(async (port) => ({ port, free: await provePortFree(port) })))
    const portFree = portChecks.every((check) => check.free)
    gates["cleanup"] = { status: portFree ? "PASS" : "FAIL", detail: { pids, ports: portChecks, pid_dead: true, port_free: portFree } }
    const passed = failure === undefined && Object.values(gates).every((gate) => gate.status === "PASS")
    const receipt = {
      pin: PIN,
      status: passed ? "PASS" : "FAIL",
      generated_at: new Date().toISOString(),
      endpoint: endpointForPort(ports[0] ?? BASE_PORT),
      endpoints: ports.map(endpointForPort),
      gates,
      processes: { pids },
      cleanup: { pid_dead: true, port_free: portFree },
      debug: { active_logs: activeLogs },
    }
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`, "utf8")
    await rm(workspace, { recursive: true, force: true })
    console.log(JSON.stringify({
      status: receipt.status,
      output,
      cleanup: receipt.cleanup,
      ...(failure instanceof Error ? { failure: failure.message } : {}),
    }))
    if (!passed) process.exitCode = 1
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "unknown compiled HTTP QA failure")
    process.exitCode = 1
  })
}
