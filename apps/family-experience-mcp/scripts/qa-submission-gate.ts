import { spawn } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises"
import { dirname, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const REPO_ROOT = resolve(APP_ROOT, "../..")
const EVIDENCE_ROOT = resolve(REPO_ROOT, ".omo/evidence/family-experience-submission-ready")
const HOLDOUT = resolve(APP_ROOT, "test/fixtures/release-holdout/sealed-holdout.jsonl")
const MANIFEST = `${HOLDOUT}.manifest.json`
const PRODUCTION_CACHE = resolve(APP_ROOT, "data/family-experience-cache")
const STARTER_DOC = resolve(APP_ROOT, "docs/PLAYMCP_TEMP_REGISTRATION.md")
export const releaseTreePaths = [".dockerignore", "Dockerfile", "apps/family-experience-mcp"] as const

type GateStatus = "RUNNING" | "PASS" | "FAIL"
type ChildReceipt = { readonly status?: unknown; readonly hashes?: { readonly holdout_sha256?: unknown } }
type CommandReceipt = {
  readonly name: string
  readonly argv: readonly string[]
  readonly started_at: string
  readonly finished_at: string
  readonly exit_code: number | null
  readonly stdout_sha256: string
  readonly stderr_sha256: string
  readonly receipt_path?: string
  readonly receipt_sha256?: string
}
type GateReceipt = {
  readonly status: GateStatus
  readonly started_at: string
  readonly finished_at?: string
  readonly argv: readonly string[]
  readonly node_version: string
  readonly git_head: string
  readonly dirty_diff_sha256: string
  readonly source_tree_sha256: string
  readonly source_tree_sha256_finish?: string
  readonly source_tree_paths: readonly string[]
  readonly sealed: { readonly dataset_sha256: string; readonly manifest_sha256: string; readonly declared_dataset_sha256: string }
  readonly children: readonly CommandReceipt[]
  readonly failure?: string
}

class GateFailure extends Error {
  constructor(readonly step: string, message: string) {
    super(`${step}: ${message}`)
    this.name = "GateFailure"
  }
}

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex")
}

export function validateFreshPass(
  name: string,
  raw: string,
  modifiedMs: number,
  gateStartedMs: number,
  expectedHoldoutSha?: string,
): void {
  if (modifiedMs < gateStartedMs) throw new GateFailure(name, "receipt is stale")
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== "object" || parsed === null) throw new GateFailure(name, "receipt is not an object")
  const receipt: ChildReceipt = parsed
  if (receipt.status !== "PASS") throw new GateFailure(name, "receipt status is not literal PASS")
  if (expectedHoldoutSha !== undefined && receipt.hashes?.holdout_sha256 !== expectedHoldoutSha) {
    throw new GateFailure(name, "receipt is not bound to the sealed dataset")
  }
}

export function validateLiteralPassOutput(name: string, raw: string): void {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error: unknown) {
    if (!(error instanceof Error)) throw error
    throw new GateFailure(name, "stdout has no literal PASS receipt")
  }
  if (typeof parsed !== "object" || parsed === null || !("status" in parsed) || parsed.status !== "PASS") {
    throw new GateFailure(name, "stdout has no literal PASS receipt")
  }
}

export function validateReleaseTreeUnchanged(startedSha: string, finishedSha: string): void {
  if (finishedSha !== startedSha) {
    throw new GateFailure("release tree", "release inputs changed while the gate was running")
  }
}

async function writeAtomic(path: string, value: GateReceipt): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8")
    await rename(temporary, path)
  } finally {
    await rm(temporary, { force: true })
  }
}

async function run(
  name: string,
  command: string,
  args: readonly string[],
  cwd: string = APP_ROOT,
): Promise<{ readonly receipt: CommandReceipt; readonly stdout: string }> {
  const startedAt = new Date().toISOString()
  const child = spawn(command, args, { cwd, env: process.env, shell: false, windowsHide: true })
  const stdout: Buffer[] = []
  const stderr: Buffer[] = []
  child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk))
  child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk))
  const exitCode = await new Promise<number | null>((resolveExit, reject) => {
    child.once("error", reject)
    child.once("close", resolveExit)
  })
  const out = Buffer.concat(stdout).toString("utf8")
  const err = Buffer.concat(stderr).toString("utf8")
  if (!name.startsWith("git ")) {
    process.stdout.write(out)
    process.stderr.write(err)
  }
  const receipt = { name, argv: [command, ...args], started_at: startedAt, finished_at: new Date().toISOString(), exit_code: exitCode, stdout_sha256: sha256(out), stderr_sha256: sha256(err) }
  if (exitCode !== 0) throw Object.assign(new GateFailure(name, `exit code ${String(exitCode)}`), { commandReceipt: receipt })
  return { receipt, stdout: out }
}

async function gitValue(args: readonly string[]): Promise<string> {
  const result = await run(`git ${args.join(" ")}`, "git", args, REPO_ROOT)
  return result.stdout.trim()
}

async function receiptReference(command: CommandReceipt, path: string): Promise<{ readonly receipt: CommandReceipt; readonly raw: string; readonly modifiedMs: number }> {
  const raw = await readFile(path, "utf8")
  const modifiedMs = (await stat(path)).mtimeMs
  if (modifiedMs < Date.parse(command.started_at)) throw new GateFailure(command.name, "receipt is stale")
  return {
    receipt: { ...command, receipt_path: relative(REPO_ROOT, path).replaceAll("\\", "/"), receipt_sha256: sha256(raw) },
    raw,
    modifiedMs,
  }
}

async function attachReceipt(command: CommandReceipt, path: string, expectedHoldoutSha?: string): Promise<CommandReceipt> {
  const referenced = await receiptReference(command, path)
  validateFreshPass(command.name, referenced.raw, referenced.modifiedMs, Date.parse(command.started_at), expectedHoldoutSha)
  return referenced.receipt
}

async function runReceiptStep(input: {
  readonly name: string
  readonly args: readonly string[]
  readonly path: string
  readonly node: string
  readonly children: CommandReceipt[]
  readonly expectedHoldoutSha?: string
}): Promise<void> {
  let command: CommandReceipt
  try {
    command = (await run(input.name, input.node, input.args)).receipt
  } catch (error: unknown) {
    const failedCommand = (error as { readonly commandReceipt?: CommandReceipt }).commandReceipt
    if (failedCommand === undefined) throw error
    try {
      input.children.push((await receiptReference(failedCommand, input.path)).receipt)
    } catch (receiptError: unknown) {
      if (!(receiptError instanceof Error)) throw receiptError
      input.children.push(failedCommand)
    }
    throw new GateFailure(input.name, error instanceof Error ? error.message : "command failed")
  }
  try {
    input.children.push(await attachReceipt(command, input.path, input.expectedHoldoutSha))
  } catch (error: unknown) {
    try {
      input.children.push((await receiptReference(command, input.path)).receipt)
    } catch (receiptError: unknown) {
      if (!(receiptError instanceof Error)) throw receiptError
      input.children.push(command)
    }
    throw error
  }
}

export async function releaseTreeSha(): Promise<string> {
  const listed = await gitValue(["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", ...releaseTreePaths])
  const hash = createHash("sha256")
  for (const path of listed.split("\0").filter(Boolean).sort()) {
    hash.update(path).update("\0")
    try {
      hash.update(await readFile(resolve(REPO_ROOT, path)))
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") hash.update("<deleted>")
      else throw error
    }
    hash.update("\0")
  }
  return hash.digest("hex")
}

async function main(): Promise<void> { // no-excuse-ok: catch
  const startedAt = new Date().toISOString()
  const runId = `${startedAt.replace(/[-:.]/gu, "")}-${randomUUID()}`
  const runRoot = resolve(EVIDENCE_ROOT, "c003-release/runs", runId)
  const output = resolve(runRoot, "submission-gate.json")
  const contractReceipt = resolve(runRoot, "contract.json")
  const holdoutReceipt = resolve(runRoot, "holdout.json")
  const httpReceipt = resolve(runRoot, "compiled-http.json")
  const containerReceipt = resolve(runRoot, "container.json")
  const productionReceipt = resolve(runRoot, "production-cache.json")
  const children: CommandReceipt[] = []
  const manifestRaw = await readFile(MANIFEST, "utf8")
  const manifest: unknown = JSON.parse(manifestRaw)
  if (typeof manifest !== "object" || manifest === null || !("holdout_sha256" in manifest) || typeof manifest.holdout_sha256 !== "string") {
    throw new GateFailure("sealed manifest", "missing holdout_sha256")
  }
  const datasetRaw = await readFile(HOLDOUT)
  const datasetSha = sha256(datasetRaw)
  if (datasetSha !== manifest.holdout_sha256) throw new GateFailure("sealed manifest", "dataset hash mismatch")
  const gitHead = await gitValue(["rev-parse", "HEAD"])
  const dirtyDiff = await gitValue(["diff", "--binary", "HEAD", "--", ...releaseTreePaths])
  const sourceTreeSha = await releaseTreeSha()
  const base = { started_at: startedAt, argv: process.argv, node_version: process.version, git_head: gitHead, dirty_diff_sha256: sha256(dirtyDiff), source_tree_sha256: sourceTreeSha, source_tree_paths: releaseTreePaths, sealed: { dataset_sha256: datasetSha, manifest_sha256: sha256(manifestRaw), declared_dataset_sha256: manifest.holdout_sha256 } } as const
  await writeAtomic(output, { status: "RUNNING", ...base, children })
  const node = process.execPath
  const npmCli = process.env["npm_execpath"]
  let finishedTreeSha: string | undefined
  try {
    if (npmCli === undefined) throw new GateFailure("npm", "npm_execpath is unavailable; invoke with npm run qa:submission")
    for (const [name, args] of [
      ["typecheck", ["run", "typecheck"]],
      ["tests", ["test", "--", "--run"]],
      ["scan:secrets", ["run", "scan:secrets"]],
      ["scan:claims", ["run", "scan:claims"]],
      ["scan:sources", ["run", "scan:sources"]],
    ] as const) {
      const child = await run(name, node, [npmCli, ...args])
      if (name.startsWith("scan:")) validateLiteralPassOutput(name, child.stdout.slice(child.stdout.indexOf("{")))
      children.push(child.receipt)
    }
    await runReceiptStep({ name: "qa:production-cache", node, args: ["--import", "tsx", "scripts/qa-production-cache.ts", "--cache-dir", PRODUCTION_CACHE, "--expected-source-set", "kto_tourapi", "--starter-doc", STARTER_DOC, "--output", productionReceipt], path: productionReceipt, children })
    await runReceiptStep({ name: "qa:contract", node, args: ["--import", "tsx", "scripts/qa-submission.ts", "--mode", "contract", "--output", contractReceipt], path: contractReceipt, children })
    await runReceiptStep({ name: "qa:holdout", node, args: ["--import", "tsx", "scripts/qa-submission.ts", "--mode", "holdout", "--holdout", HOLDOUT, "--output", holdoutReceipt], path: holdoutReceipt, children, expectedHoldoutSha: datasetSha })
    await runReceiptStep({ name: "qa:compiled-http", node, args: ["--import", "tsx", "scripts/qa-compiled-http.ts", "--output", httpReceipt], path: httpReceipt, children })
    await runReceiptStep({ name: "qa:container", node, args: ["--import", "tsx", "scripts/qa-container.ts", "--output", containerReceipt], path: containerReceipt, children })
    finishedTreeSha = await releaseTreeSha()
    validateReleaseTreeUnchanged(sourceTreeSha, finishedTreeSha)
    await writeAtomic(output, { status: "PASS", ...base, source_tree_sha256_finish: finishedTreeSha, finished_at: new Date().toISOString(), children })
    console.log(JSON.stringify({ status: "PASS", output: relative(REPO_ROOT, output).replaceAll("\\", "/"), source_tree_sha256: sourceTreeSha, source_tree_sha256_finish: finishedTreeSha }))
  } catch (error) {
    const failed = error instanceof GateFailure ? error : new GateFailure("submission gate", error instanceof Error ? error.message : String(error))
    const commandReceipt = (failed as GateFailure & { readonly commandReceipt?: CommandReceipt }).commandReceipt
    if (commandReceipt !== undefined) children.push(commandReceipt)
    await writeAtomic(output, { status: "FAIL", ...base, ...(finishedTreeSha === undefined ? {} : { source_tree_sha256_finish: finishedTreeSha }), finished_at: new Date().toISOString(), children, failure: failed.message })
    console.error(JSON.stringify({ status: "FAIL", output: relative(REPO_ROOT, output).replaceAll("\\", "/"), failure: failed.message }))
    process.exitCode = 1
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
