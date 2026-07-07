import { readdir, readFile, stat } from "node:fs/promises"
import { basename, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

export type Finding = { readonly file: string; readonly line: number; readonly rule: string }

const appRoot = process.cwd()
const repoRoot = resolve(appRoot, "../..")
const invocationRoot = process.env["INIT_CWD"] ?? appRoot
const appTargets = ["docs", "src", "test", "scripts", "package.json", ".env.example"] as const
const evidenceNames = [/^golden-family-experience-.*\.json$/, /^task-9-.*\.(txt|md|log|json|tmp)$/] as const
const secretRules: readonly (readonly [string, RegExp])[] = [
  ["bearer-token", /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/],
  ["openai-style-key", /\bsk-[A-Za-z0-9_-]{20,}/],
  ["seoul-open-data-key", /\bSEOUL_OPEN_DATA_KEY\s*[:=]\s*["']?[A-Za-z0-9][A-Za-z0-9_~+/=-]{19,}/],
  ["provider-service-key", /\b(?:CULTURE_PORTAL_SERVICE_KEY|KTO_TOURAPI_SERVICE_KEY|PUBLIC_DATA_STANDARD_SERVICE_KEY)\s*[:=]\s*["']?[A-Za-z0-9][A-Za-z0-9_~+/=-]{19,}/],
  ["key-assignment", /\b(?:api[_-]?key|apikey|service[_-]?key|secret|token|access[_-]?token)\s*[:=]\s*["']?[A-Za-z0-9][A-Za-z0-9_~+/=-]{19,}/i],
  ["query-keyed-url", /[?&](?:KEY|key|serviceKey|apikey|apiKey|token)=[A-Za-z0-9][A-Za-z0-9._~-]{19,}/],
  ["path-keyed-url", /https?:\/\/[^\s"'<>]+\/[A-Za-z0-9][A-Za-z0-9._~-]{19,}\/(?:json|xml|api|culturalEventInfo)\b/i],
] as const
const allowedPlaceholderValues = [
  "optionalNonEmptyStringSchema",
  "CLI_SYNTHETIC_SERVICE_KEY_12345",
  "PUBLIC_DATA_STANDARD_SECRET",
] as const

async function listFiles(target: string): Promise<readonly string[]> {
  const absolute = resolve(appRoot, target)
  if (basename(target).includes(".")) {
    return [absolute]
  }
  return walk(absolute)
}

async function walk(directory: string): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const child = join(directory, entry.name)
    if (entry.isDirectory()) {
      return entry.name === "node_modules" ? [] : walk(child)
    }
    return entry.isFile() ? [child] : []
  }))
  return nested.flat()
}

async function evidenceFiles(): Promise<readonly string[]> {
  const evidenceRoot = resolve(repoRoot, ".omo/evidence")
  const entries = await readdir(evidenceRoot, { withFileTypes: true }).catch(() => [])
  const directFiles = entries
    .filter((entry) => entry.isFile() && isEvidenceName(entry.name))
    .map((entry) => join(evidenceRoot, entry.name))
  const tokenSecurityFiles = (
    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && entry.name === "token-api-security")
        .map((entry) => walk(join(evidenceRoot, entry.name))),
    )
  ).flat()
  return [...directFiles, ...tokenSecurityFiles]
}

function isEvidenceName(name: string): boolean {
  return evidenceNames.some((pattern) => pattern.test(name)) || name.startsWith("token-api-security")
}

async function includeFiles(paths: readonly string[]): Promise<readonly string[]> {
  return (await Promise.all(paths.map(listIncludedPath))).flat()
}

async function listIncludedPath(target: string): Promise<readonly string[]> {
  const absolute = await resolveExistingPath(target)
  const targetStats = await stat(absolute)
  return targetStats.isDirectory() ? walk(absolute) : [absolute]
}

async function resolveExistingPath(target: string): Promise<string> {
  const candidates = [resolve(invocationRoot, target), resolve(appRoot, target), resolve(repoRoot, target)]

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  return resolve(invocationRoot, target)
}

async function pathExists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  )
}

export function scanText(file: string, text: string): readonly Finding[] {
  return text.split(/\r?\n/).flatMap((lineText, index) => {
    return secretRules
      .filter((rule) => hasRejectedSecretOccurrence(lineText, rule[1]))
      .map((rule) => ({ file, line: index + 1, rule: rule[0] }))
  })
}

function hasRejectedSecretOccurrence(lineText: string, pattern: RegExp): boolean {
  for (const match of lineText.matchAll(globalPattern(pattern))) {
    if (!isAllowedPlaceholderOccurrence(match[0])) {
      return true
    }
  }
  return false
}

function globalPattern(pattern: RegExp): RegExp {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
  return new RegExp(pattern.source, flags)
}

function isAllowedPlaceholderOccurrence(text: string): boolean {
  const value = matchedSecretValue(text)
  return allowedPlaceholderValues.some((placeholder) => value === placeholder)
}

function matchedSecretValue(text: string): string {
  const bearerValue = /^Bearer\s+([A-Za-z0-9._~+/=-]{20,})$/.exec(text)?.[1]
  if (bearerValue !== undefined) {
    return bearerValue
  }

  const queryValue = /[?&](?:KEY|key|serviceKey|apikey|apiKey|token)=([A-Za-z0-9][A-Za-z0-9._~-]{19,})$/.exec(text)?.[1]
  if (queryValue !== undefined) {
    return queryValue
  }

  const pathValue = /\/([A-Za-z0-9][A-Za-z0-9._~-]{19,})\/(?:json|xml|api|culturalEventInfo)\b/i.exec(text)?.[1]
  if (pathValue !== undefined) {
    return pathValue
  }

  return /[:=]\s*["']?([A-Za-z0-9][A-Za-z0-9_~+/=-]{19,})$/.exec(text)?.[1] ?? text
}

export function parseIncludeArgs(args: readonly string[]): readonly string[] {
  const includes: string[] = []
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--help" || arg === "-h") {
      throw new SecretScanUsageError(usage())
    }
    if (arg !== "--include") {
      throw new SecretScanUsageError(`Unknown option: ${arg}\n${usage()}`)
    }

    const includePath = args[index + 1]
    if (includePath === undefined || includePath.startsWith("--")) {
      throw new SecretScanUsageError(`Missing path for --include\n${usage()}`)
    }
    includes.push(includePath)
    index += 1
  }
  return includes
}

class SecretScanUsageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SecretScanUsageError"
  }
}

function usage(): string {
  return [
    "Usage: tsx scripts/scan-secrets.ts [--include <path> ...]",
    "",
    "Scans default app docs, source, tests, scripts, selected evidence, and any included files or directories.",
    "Use --include for launch copy, env fixtures, temporary QA files, and generated evidence outside the default scan set.",
  ].join("\n")
}

async function main(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  const includes = parseIncludeArgs(args)
  const appFiles = (await Promise.all(appTargets.map(listFiles))).flat()
  const files = [...appFiles, ...(await evidenceFiles()), ...(await includeFiles(includes))]
  const findings = (await Promise.all(files.map(async (file) => scanText(file, await readFile(file, "utf8"))))).flat()

  if (findings.length > 0) {
    console.error(JSON.stringify({ status: "FAIL", findings }, null, 2))
    process.exitCode = 1
    return
  }
  console.log(JSON.stringify({ status: "PASS", scanned_files: files.length }, null, 2))
}

function isCliEntryPoint(entryPath: string | undefined): boolean {
  return entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href
}

if (isCliEntryPoint(process.argv[1])) {
  main().catch((error: unknown) => {
    if (error instanceof SecretScanUsageError) {
      console.error(error.message)
      process.exitCode = 1
      return
    }
    console.error(error instanceof Error ? error.message : "unknown secret scan failure")
    process.exitCode = 1
  })
}
