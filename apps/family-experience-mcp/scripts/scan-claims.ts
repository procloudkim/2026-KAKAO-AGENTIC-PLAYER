import { readdir, readFile, stat } from "node:fs/promises"
import { basename, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

export type Finding = { readonly file: string; readonly line: number; readonly claim: string }
type ScanSurface = "default" | "include"

const appRoot = process.cwd()
const repoRoot = resolve(appRoot, "../..")
const invocationRoot = process.env["INIT_CWD"] ?? appRoot
const appTargets = ["docs", "src", "test", "scripts", "package.json"] as const
const evidenceNames = [/^golden-family-experience-.*\.json$/, /^task-9-.*\.(txt|md|log|json)$/] as const
const forbiddenClaims = [
  "전국 모든 행사",
  "전국 전체",
  "전국 완전",
  "예약 가능",
  "예약가능",
  "운영 중",
  "실시간",
  "live now",
  "currently open",
  "suitable for all",
  "아이에게 적합함",
  "nationwide completeness",
  "complete nationwide",
  "scraper integration",
  "browser parser",
  "browser-parser",
  "web scraping pipeline",
  "unofficial scraping pipeline",
  "final review and contest submission completed",
  "final review completed",
  "submission completed",
] as const

type ClaimContextSegment = {
  readonly text: string
  readonly occurrenceStart: number
  readonly occurrenceEnd: number
}

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
  return entries
    .filter((entry) => entry.isFile() && evidenceNames.some((pattern) => pattern.test(entry.name)))
    .map((entry) => join(evidenceRoot, entry.name))
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
  const candidates = [
    resolve(invocationRoot, target),
    resolve(appRoot, target),
    resolve(repoRoot, target),
  ]

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  return candidates[0] ?? resolve(target)
}

async function pathExists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  )
}

export function scanText(file: string, text: string, surface: ScanSurface = "include"): readonly Finding[] {
  return text.split(/\r?\n/).flatMap((lineText, index) => {
    if (isAllowedLineContext(file, lineText, surface)) {
      return []
    }
    return forbiddenClaims
      .filter((claim) => hasRejectedClaimOccurrence(lineText, claim))
      .map((claim) => ({ file, line: index + 1, claim }))
  })
}

function isAllowedLineContext(file: string, lineText: string, surface: ScanSurface): boolean {
  const lower = lineText.toLowerCase()
  const defaultRepoScan = surface === "default"
  return (
    (defaultRepoScan &&
      (file.endsWith("scan-claims.ts") ||
        file.endsWith("scan-sources.ts") ||
        file.endsWith("eval-prompts.ts") ||
        isEvalForbiddenClaimFixture(file, lineText) ||
        file.includes(join("test", "fixtures", "eval")))) ||
    (defaultRepoScan && file.endsWith(".test.ts")) ||
    (defaultRepoScan && /^\/.+\/[dgimsuvy]*[,;)]?$/.test(lineText.trim())) ||
    (defaultRepoScan &&
      /\b(no|reject|rejects|rejected)\b|did not|do not|does not|must not|not as|not claim|not promise|not proof|not included|not use|unless|without source|guardrail|forbidden|unsupported|negative|not\.tomatch/.test(lower)) ||
    (defaultRepoScan && file.includes(join(".omo", "evidence")) && /scraper-browser-parser|finding|fail|red|reject/.test(lower))
  )
}

function hasRejectedClaimOccurrence(lineText: string, claim: string): boolean {
  const lowerLine = lineText.toLowerCase()
  const lowerClaim = claim.toLowerCase()
  let index = lowerLine.indexOf(lowerClaim)

  while (index !== -1) {
    if (!isAllowedClaimOccurrence(lineText, claim, index)) {
      return true
    }
    index = lowerLine.indexOf(lowerClaim, index + lowerClaim.length)
  }

  return false
}

function isAllowedClaimOccurrence(lineText: string, claim: string, startIndex: number): boolean {
  const segment = claimContextSegment(lineText, startIndex, startIndex + claim.length)
  return isAllowedCaveatOccurrence(segment)
}

function claimContextSegment(lineText: string, startIndex: number, endIndex: number): ClaimContextSegment {
  const boundaries = [...lineText.matchAll(/[.;!?。！？；]|\b(?:but|however|yet|nevertheless)\b|하지만|그러나|다만/gi)]
  let previousBoundary: RegExpExecArray | undefined
  for (const boundary of boundaries) {
    if (boundary.index < startIndex) {
      previousBoundary = boundary
    }
  }
  const nextBoundary = boundaries.find((boundary) => boundary.index >= endIndex)
  const segmentStart = previousBoundary === undefined ? 0 : previousBoundary.index + previousBoundary[0].length
  const segmentEnd = nextBoundary === undefined ? lineText.length : nextBoundary.index
  return {
    text: lineText.slice(segmentStart, segmentEnd),
    occurrenceStart: startIndex - segmentStart,
    occurrenceEnd: endIndex - segmentStart,
  }
}

function isAllowedCaveatOccurrence(segment: ClaimContextSegment): boolean {
  const prefix = segment.text.slice(0, segment.occurrenceStart).toLowerCase()
  const suffix = segment.text.slice(segment.occurrenceEnd)
  return (
    /\b(did not|do not|does not|must not|not)\s+(claim|promise|guarantee|include|use)\s+$/.test(prefix) ||
    hasScopedKoreanCaveat(suffix)
  )
}

function hasScopedKoreanCaveat(suffix: string): boolean {
  const caveat = /약속하지|보장하지|하지 않습니다|않습니다|금지|출처.*지원|근거.*없/.exec(suffix)
  if (caveat === null) {
    return false
  }

  const textBeforeCaveat = suffix.slice(0, caveat.index)
  return !/(?:입니다|합니다|가능합니다|보장합니다|지원합니다|운영\s*중(?:입니다|이며)|운영중(?:입니다|이며))/.test(textBeforeCaveat)
}

function isEvalForbiddenClaimFixture(file: string, lineText: string): boolean {
  if (!file.endsWith("eval-prompt-checks.ts")) {
    return false
  }
  const trimmed = lineText.trim()
  return forbiddenClaims.some((claim) => trimmed === `"${claim}",` || trimmed === `"${claim}"`)
}

export function parseIncludeArgs(args: readonly string[]): readonly string[] {
  const includes: string[] = []
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--help" || arg === "-h") {
      throw new ClaimScanUsageError(usage())
    }
    if (arg !== "--include") {
      throw new ClaimScanUsageError(`Unknown option: ${arg}\n${usage()}`)
    }

    const includePath = args[index + 1]
    if (includePath === undefined || includePath.startsWith("--")) {
      throw new ClaimScanUsageError(`Missing path for --include\n${usage()}`)
    }
    includes.push(includePath)
    index += 1
  }
  return includes
}

class ClaimScanUsageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ClaimScanUsageError"
  }
}

function usage(): string {
  return [
    "Usage: tsx scripts/scan-claims.ts [--include <path> ...]",
    "",
    "Scans default app docs, source, tests, scripts, selected evidence, and any included files or directories.",
    "Use --include for launch copy, prompts, docs, fixtures, temporary QA files, and generated evidence outside the default scan set.",
  ].join("\n")
}

async function main(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  const includes = parseIncludeArgs(args)
  const appFiles = (await Promise.all(appTargets.map(listFiles))).flat()
  const defaultFiles = [...appFiles, ...(await evidenceFiles())]
  const includedFiles = await includeFiles(includes)
  const defaultFindings = (
    await Promise.all(defaultFiles.map(async (file) => scanText(file, await readFile(file, "utf8"), "default")))
  ).flat()
  const includeFindings = (
    await Promise.all(includedFiles.map(async (file) => scanText(file, await readFile(file, "utf8"), "include")))
  ).flat()
  const findings = [...defaultFindings, ...includeFindings]

  if (findings.length > 0) {
    console.error(JSON.stringify({ status: "FAIL", findings }, null, 2))
    process.exitCode = 1
    return
  }
  console.log(JSON.stringify({ status: "PASS", scanned_files: defaultFiles.length + includedFiles.length }, null, 2))
}

function isCliEntryPoint(entryPath: string | undefined): boolean {
  return entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href
}

if (isCliEntryPoint(process.argv[1])) {
  main().catch((error: unknown) => {
    if (error instanceof ClaimScanUsageError) {
      console.error(error.message)
      process.exitCode = 1
      return
    }
    console.error(error instanceof Error ? error.message : "unknown claim scan failure")
    process.exitCode = 1
  })
}
