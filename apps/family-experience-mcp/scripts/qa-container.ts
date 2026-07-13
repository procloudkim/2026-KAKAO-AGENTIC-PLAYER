// allow: SIZE_OK — one fail-closed container release lane owns build, runtime, protocol, shutdown, and cleanup proof.
import { spawn } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { createConnection, createServer } from "node:net"
import { dirname, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath } from "node:url"

import { Client, StreamableHTTPClientTransport, type Tool } from "@modelcontextprotocol/client"
import { z } from "zod/v4"

import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"
import { parseStarterMessages } from "./qa-production-cache.js"

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const REPO_ROOT = resolve(APP_ROOT, "../..")
const STARTER_DOC = resolve(APP_ROOT, "docs/PLAYMCP_TEMP_REGISTRATION.md")
const HOST = "127.0.0.1"
const CONTAINER_PORT = 3349
const EXPECTED_SOURCE_SET = "kto_tourapi"
const DOCKER = process.platform === "win32" ? "docker.exe" : "docker"
const SHUTDOWN_LOG = "family-experience-mcp shutting down: SIGTERM"

type CommandResult = {
  readonly exitCode: number | null
  readonly stdout: string
  readonly stderr: string
  readonly elapsedMs: number
}

type ImageObservation = {
  readonly os: "linux"
  readonly architecture: "amd64"
  readonly user: "node"
  readonly cmd: readonly ["node", "dist/src/server.js"]
  readonly stop_signal: "SIGTERM"
}

type HealthObservation = {
  readonly status: 200
  readonly ok: true
  readonly cache_status: "fresh"
  readonly cache_mode: "live"
  readonly source_failed: 0
}

type RuntimeObservation = {
  readonly uid: number
  readonly pid1_argv: readonly [string, "dist/src/server.js"]
}

type McpObservation = {
  readonly tool_count: 1
  readonly tool_name: "find_family_experiences"
  readonly mode: "live"
  readonly candidate_count: number
}

type ShutdownObservation = {
  readonly exit_code: 0
  readonly running: false
  readonly shutdown_log: true
  readonly logs_sha256: string
}

type CleanupObservation = {
  readonly container_absent: boolean
  readonly image_absent: boolean
  readonly port_free: boolean
}

type ContainerQaReceipt = {
  readonly status: "PASS" | "FAIL"
  readonly started_at: string
  readonly finished_at: string
  readonly platform: "linux/amd64"
  readonly image_tag: string
  readonly container_name: string
  readonly host_port: number
  readonly docker_server?: string
  readonly build?: {
    readonly elapsed_ms: number
    readonly stdout_sha256: string
    readonly stderr_sha256: string
  }
  readonly image?: ImageObservation
  readonly health?: HealthObservation
  readonly runtime?: RuntimeObservation
  readonly mcp?: McpObservation & {
    readonly starter_index: 1
    readonly starter_doc_sha256: string
    readonly starter_prompt_sha256: string
  }
  readonly shutdown?: ShutdownObservation
  readonly cleanup: CleanupObservation
  readonly failure?: { readonly code: string; readonly message: string }
}

const ImageInspectSchema = z.array(z.object({
  Os: z.string(),
  Architecture: z.string(),
  Config: z.object({
    User: z.string(),
    Cmd: z.array(z.string()).nullable(),
    StopSignal: z.string(),
  }).passthrough(),
}).passthrough()).length(1)

const HealthSchema = z.object({
  ok: z.boolean(),
  config: z.object({
    allowFixture: z.boolean(),
    toolMode: z.string(),
  }).passthrough(),
  cache: z.object({
    status: z.string(),
    mode: z.string().optional(),
    source_health: z.object({
      failed_sources: z.number().int(),
      ok_sources: z.number().int(),
    }).passthrough(),
  }).passthrough(),
}).passthrough()

const ContainerInspectSchema = z.array(z.object({
  State: z.object({
    Running: z.boolean(),
    ExitCode: z.number().int(),
  }).passthrough(),
}).passthrough()).length(1)

class ContainerQaFailure extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = "ContainerQaFailure"
  }
}

function requireContainer(condition: boolean, code: string, message: string): asserts condition {
  if (!condition) throw new ContainerQaFailure(code, message)
}

export function validateImageInspection(value: unknown): ImageObservation {
  const image = ImageInspectSchema.parse(value)[0]
  if (image === undefined) throw new ContainerQaFailure("image_inspect_invalid", "image inspection was empty")
  requireContainer(image.Os === "linux", "image_os_invalid", `expected linux image, received ${image.Os}`)
  requireContainer(image.Architecture === "amd64", "image_arch_invalid", `expected amd64 image, received ${image.Architecture}`)
  requireContainer(image.Config.User === "node", "image_user_invalid", "image user must be node")
  requireContainer(
    image.Config.Cmd?.length === 2 && image.Config.Cmd[0] === "node" && image.Config.Cmd[1] === "dist/src/server.js",
    "image_cmd_invalid",
    "image CMD must directly invoke node dist/src/server.js",
  )
  requireContainer(image.Config.StopSignal === "SIGTERM", "image_stop_signal_invalid", "image stop signal must be SIGTERM")
  return {
    os: "linux",
    architecture: "amd64",
    user: "node",
    cmd: ["node", "dist/src/server.js"],
    stop_signal: "SIGTERM",
  }
}

export function validateHealthObservation(status: number, value: unknown): HealthObservation {
  const health = HealthSchema.parse(value)
  requireContainer(status === 200, "container_health_status_invalid", `health returned ${status}`)
  requireContainer(health.ok, "container_health_not_ready", "health did not report ok")
  requireContainer(!health.config.allowFixture, "container_fixture_enabled", "container enabled fixture mode")
  requireContainer(health.config.toolMode === "live", "container_tool_mode_invalid", "container tool mode was not live")
  requireContainer(health.cache.status === "fresh", "container_cache_not_fresh", "container cache was not fresh")
  requireContainer(health.cache.mode === "live", "container_cache_mode_invalid", "container cache mode was not live")
  requireContainer(
    health.cache.source_health.failed_sources === 0 && health.cache.source_health.ok_sources > 0,
    "container_source_health_invalid",
    "container source health was not release-ready",
  )
  return { status: 200, ok: true, cache_status: "fresh", cache_mode: "live", source_failed: 0 }
}

export function validateRuntimeIdentity(uidText: string, cmdline: string): RuntimeObservation {
  const normalizedUid = uidText.trim()
  requireContainer(/^\d+$/u.test(normalizedUid), "container_uid_invalid", "container UID was not numeric")
  const uid = Number.parseInt(normalizedUid, 10)
  requireContainer(uid > 0, "container_uid_root", "container process ran as root")
  const argv = cmdline.split("\0").filter((entry) => entry.length > 0)
  const executable = argv[0]?.replaceAll("\\", "/").split("/").at(-1)
  requireContainer(
    argv.length === 2 && executable === "node" && argv[1] === "dist/src/server.js",
    "container_pid1_not_direct_node",
    "PID 1 must directly run node dist/src/server.js",
  )
  return { uid, pid1_argv: [argv[0] ?? "node", "dist/src/server.js"] }
}

export function validateMcpObservation(
  toolNames: readonly string[],
  structuredContent: unknown,
): McpObservation {
  requireContainer(
    toolNames.length === 1 && toolNames[0] === "find_family_experiences",
    "container_mcp_tools_invalid",
    "container must expose exactly find_family_experiences",
  )
  const structured = FindFamilyExperiencesStructuredContentSchema.parse(structuredContent)
  requireContainer(structured.ok, "container_starter_failed", "canonical starter did not return candidates")
  requireContainer(structured.mode === "live", "container_starter_mode_invalid", "canonical starter was not live")
  const candidateCount = structured.candidates.length
  requireContainer(
    candidateCount >= 1 && candidateCount <= 3,
    "container_candidate_count_invalid",
    `canonical starter returned ${candidateCount} candidates`,
  )
  return {
    tool_count: 1,
    tool_name: "find_family_experiences",
    mode: "live",
    candidate_count: candidateCount,
  }
}

export function validateShutdownObservation(value: unknown, logs: string): ShutdownObservation {
  const container = ContainerInspectSchema.parse(value)[0]
  if (container === undefined) throw new ContainerQaFailure("container_inspect_invalid", "container inspection was empty")
  requireContainer(!container.State.Running, "container_still_running", "container remained running after SIGTERM")
  requireContainer(container.State.ExitCode === 0, "container_exit_nonzero", `container exited ${container.State.ExitCode}`)
  requireContainer(logs.includes(SHUTDOWN_LOG), "container_shutdown_log_missing", "SIGTERM shutdown log was absent")
  return {
    exit_code: 0,
    running: false,
    shutdown_log: true,
    logs_sha256: sha256(logs),
  }
}

export function validateCleanupObservation(input: CleanupObservation): CleanupObservation {
  requireContainer(input.container_absent, "container_cleanup_failed", "QA container still exists")
  requireContainer(input.image_absent, "image_cleanup_failed", "QA image still exists")
  requireContainer(input.port_free, "port_cleanup_failed", "QA host port is still reachable")
  return input
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

async function runDocker(
  step: string,
  args: readonly string[],
  options: { readonly allowFailure?: boolean; readonly timeoutMs?: number } = {},
): Promise<CommandResult> {
  const started = performance.now()
  return new Promise((resolveRun, reject) => {
    const child = spawn(DOCKER, args, { cwd: REPO_ROOT, shell: false, windowsHide: true })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill()
    }, options.timeoutMs ?? 60_000)
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk))
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk))
    child.once("error", (error) => {
      clearTimeout(timeout)
      reject(new ContainerQaFailure(step, error.message))
    })
    child.once("close", (exitCode) => {
      clearTimeout(timeout)
      const result = {
        exitCode,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        elapsedMs: performance.now() - started,
      }
      if (timedOut) {
        reject(new ContainerQaFailure(`${step}_timeout`, `${step} exceeded its timeout`))
        return
      }
      if (exitCode !== 0 && options.allowFailure !== true) {
        reject(new ContainerQaFailure(`${step}_failed`, `${step} exited ${String(exitCode)}`))
        return
      }
      resolveRun(result)
    })
  })
}

async function reserveHostPort(): Promise<number> {
  const server = createServer()
  return new Promise((resolvePort, reject) => {
    server.once("error", reject)
    server.listen(0, HOST, () => {
      const address = server.address()
      if (address === null || typeof address === "string") {
        server.close()
        reject(new ContainerQaFailure("host_port_unavailable", "could not reserve a host port"))
        return
      }
      server.close((error) => {
        if (error !== undefined) reject(error)
        else resolvePort(address.port)
      })
    })
  })
}

async function pollHealth(port: number): Promise<HealthObservation> {
  const deadline = Date.now() + 60_000
  let lastFailure = "no response"
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://${HOST}:${port}/health`, { signal: AbortSignal.timeout(3_000) })
      const body: unknown = await response.json()
      return validateHealthObservation(response.status, body)
    } catch (error: unknown) {
      lastFailure = error instanceof Error ? error.message : "unknown health failure"
      await new Promise<void>((resolveWait) => setTimeout(resolveWait, 250))
    }
  }
  throw new ContainerQaFailure("container_health_timeout", `container health was not ready: ${lastFailure}`)
}

async function callCanonicalStarter(port: number, prompt: string): Promise<McpObservation> {
  const client = new Client({ name: "container-release-qa", version: "1.0.0" })
  const transport = new StreamableHTTPClientTransport(new URL(`http://${HOST}:${port}/mcp`))
  try {
    await client.connect(transport)
    const tools = await client.listTools()
    const listed = tools.tools[0]
    requireContainer(listed !== undefined, "container_mcp_tools_invalid", "container tool was absent")
    const toolDefinition = {
      name: listed.name,
      inputSchema: listed.inputSchema ?? { type: "object" },
    } satisfies Tool
    const result = await client.callTool(
      { name: "find_family_experiences", arguments: { prompt } },
      { toolDefinition },
    )
    return validateMcpObservation(tools.tools.map((tool) => tool.name), result.structuredContent)
  } finally {
    await transport.close().catch(() => undefined)
    await client.close().catch(() => undefined)
  }
}

async function provePortFree(port: number): Promise<boolean> {
  return new Promise((resolveProbe) => {
    const socket = createConnection({ host: HOST, port })
    const timeout = setTimeout(() => {
      socket.destroy()
      resolveProbe(false)
    }, 2_000)
    socket.once("connect", () => {
      clearTimeout(timeout)
      socket.destroy()
      resolveProbe(false)
    })
    socket.once("error", () => {
      clearTimeout(timeout)
      resolveProbe(true)
    })
  })
}

async function cleanupResources(
  dockerAvailable: boolean,
  containerName: string,
  imageTag: string,
  port: number,
): Promise<CleanupObservation> {
  let containerAbsent = !dockerAvailable
  let imageAbsent = !dockerAvailable
  if (dockerAvailable) {
    await runDocker("cleanup_container", ["container", "rm", "--force", containerName], { allowFailure: true })
    await runDocker("cleanup_image", ["image", "rm", "--force", imageTag], { allowFailure: true })
    const containers = await runDocker(
      "cleanup_container_probe",
      ["container", "ls", "--all", "--filter", `name=^/${containerName}$`, "--format", "{{.Names}}"],
    )
    const images = await runDocker("cleanup_image_probe", ["image", "ls", "--quiet", imageTag])
    containerAbsent = containers.stdout.trim().length === 0
    imageAbsent = images.stdout.trim().length === 0
  }
  return {
    container_absent: containerAbsent,
    image_absent: imageAbsent,
    port_free: await provePortFree(port),
  }
}

async function writeReceipt(path: string, receipt: ContainerQaReceipt): Promise<void> {
  const output = resolve(path)
  const temporary = `${output}.${randomUUID()}.tmp`
  await mkdir(dirname(output), { recursive: true })
  try {
    await writeFile(temporary, `${JSON.stringify(receipt, null, 2)}\n`, "utf8")
    await rename(temporary, output)
  } finally {
    await rm(temporary, { force: true })
  }
}

function parseOutput(argv: readonly string[]): string {
  if (argv.length !== 2 || argv[0] !== "--output" || argv[1] === undefined || argv[1].trim().length === 0) {
    throw new ContainerQaFailure("invalid_arguments", "usage: qa-container.ts --output <receipt.json>")
  }
  return resolve(argv[1])
}

async function main(): Promise<void> { // no-excuse-ok: catch
  const startedAt = new Date().toISOString()
  const output = parseOutput(process.argv.slice(2))
  await rm(output, { force: true })
  const id = randomUUID().toLowerCase()
  const imageTag = `family-experience-mcp-qa:${id}`
  const containerName = `family-experience-mcp-qa-${id}`
  const hostPort = await reserveHostPort()
  let dockerAvailable = false
  let failure: ContainerQaFailure | undefined
  let dockerServer: string | undefined
  let build: ContainerQaReceipt["build"]
  let image: ImageObservation | undefined
  let health: HealthObservation | undefined
  let runtime: RuntimeObservation | undefined
  let mcp: ContainerQaReceipt["mcp"]
  let shutdown: ShutdownObservation | undefined

  try {
    try {
      const version = await runDocker("docker_version", ["version", "--format", "{{.Server.Os}}/{{.Server.Arch}}"])
      dockerServer = version.stdout.trim()
      requireContainer(dockerServer === "linux/amd64", "docker_platform_invalid", `Docker server was ${dockerServer}`)
      dockerAvailable = true
    } catch (error: unknown) {
      throw new ContainerQaFailure("docker_unavailable", error instanceof Error ? error.message : "Docker is unavailable")
    }

    const built = await runDocker(
      "docker_build",
      ["build", "--platform", "linux/amd64", "--file", "Dockerfile", "--tag", imageTag, "."],
      { timeoutMs: 300_000 },
    )
    build = {
      elapsed_ms: built.elapsedMs,
      stdout_sha256: sha256(built.stdout),
      stderr_sha256: sha256(built.stderr),
    }
    const imageInspect = await runDocker("image_inspect", ["image", "inspect", imageTag])
    image = validateImageInspection(JSON.parse(imageInspect.stdout))

    await runDocker("container_run", [
      "run",
      "--detach",
      "--name",
      containerName,
      "--platform",
      "linux/amd64",
      "--publish",
      `${HOST}:${hostPort}:${CONTAINER_PORT}`,
      "--env",
      "FAMILY_EXPERIENCE_ALLOW_FIXTURE=false",
      "--env",
      "FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache",
      "--env",
      `FAMILY_EXPERIENCE_SOURCE_SET=${EXPECTED_SOURCE_SET}`,
      imageTag,
    ])
    health = await pollHealth(hostPort)

    const uidResult = await runDocker("container_uid", ["exec", containerName, "id", "-u"])
    const cmdlineResult = await runDocker("container_pid1", [
      "exec",
      containerName,
      "node",
      "-e",
      "process.stdout.write(require('node:fs').readFileSync('/proc/1/cmdline'))",
    ])
    runtime = validateRuntimeIdentity(uidResult.stdout, cmdlineResult.stdout)

    const starterDoc = await readFile(STARTER_DOC, "utf8")
    const starter = parseStarterMessages(starterDoc)[0]
    requireContainer(starter !== undefined, "canonical_starter_missing", "canonical starter 1 was absent")
    const mcpResult = await callCanonicalStarter(hostPort, starter)
    mcp = {
      ...mcpResult,
      starter_index: 1,
      starter_doc_sha256: sha256(starterDoc),
      starter_prompt_sha256: sha256(starter),
    }

    await runDocker("container_sigterm", ["stop", "--signal", "SIGTERM", "--timeout", "20", containerName], { timeoutMs: 30_000 })
    const stoppedInspect = await runDocker("container_inspect_stopped", ["container", "inspect", containerName])
    const logs = await runDocker("container_logs", ["container", "logs", containerName])
    shutdown = validateShutdownObservation(JSON.parse(stoppedInspect.stdout), `${logs.stdout}${logs.stderr}`)
  } catch (error: unknown) {
    failure = error instanceof ContainerQaFailure
      ? error
      : new ContainerQaFailure("container_qa_internal_error", error instanceof Error ? error.message : String(error))
  }

  let cleanup: CleanupObservation
  try {
    cleanup = validateCleanupObservation(
      await cleanupResources(dockerAvailable, containerName, imageTag, hostPort),
    )
  } catch (error: unknown) {
    cleanup = {
      container_absent: false,
      image_absent: false,
      port_free: await provePortFree(hostPort),
    }
    if (failure === undefined) {
      failure = error instanceof ContainerQaFailure
        ? error
        : new ContainerQaFailure("container_cleanup_failed", error instanceof Error ? error.message : String(error))
    }
  }

  const receipt: ContainerQaReceipt = {
    status: failure === undefined ? "PASS" : "FAIL",
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    platform: "linux/amd64",
    image_tag: imageTag,
    container_name: containerName,
    host_port: hostPort,
    ...(dockerServer === undefined ? {} : { docker_server: dockerServer }),
    ...(build === undefined ? {} : { build }),
    ...(image === undefined ? {} : { image }),
    ...(health === undefined ? {} : { health }),
    ...(runtime === undefined ? {} : { runtime }),
    ...(mcp === undefined ? {} : { mcp }),
    ...(shutdown === undefined ? {} : { shutdown }),
    cleanup,
    ...(failure === undefined ? {} : { failure: { code: failure.code, message: failure.message } }),
  }
  await writeReceipt(output, receipt)
  process.stdout.write(`${JSON.stringify({ status: receipt.status, output, cleanup, ...(receipt.failure === undefined ? {} : { failure: receipt.failure }) })}\n`)
  if (receipt.status !== "PASS") process.exitCode = 1
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
