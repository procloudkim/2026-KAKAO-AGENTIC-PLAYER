import { readdir, readFile, stat } from "node:fs/promises"
import { basename, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

export type Finding = { readonly file: string; readonly line: number; readonly rule: string; readonly value: string }
type ScanSurface = "default" | "include"

const appRoot = process.cwd()
const repoRoot = resolve(appRoot, "../..")
const invocationRoot = process.env["INIT_CWD"] ?? appRoot
const appTargets = ["docs", "src", "test", "scripts", "package.json"] as const
const evidenceNames = [/^golden-family-experience-.*\.json$/, /^task-9-(plain-verify|final-verify)-GREEN\.txt$/] as const
const scraperPackages = ["cheerio", "puppeteer", "playwright", "jsdom", "got-scraping"] as const
const allowedHosts = ["example.invalid", "127.0.0.1", "localhost", "openapi.example.test", "data.example.test"] as const
const officialSourceHosts = ["apis.data.go.kr", "culture.go.kr", "data.go.kr", "b.kakao.com", "docs.kakaocloud.com", "kko.to", "modelcontextprotocol.io", "playmcp.kakao.com", "playmcp.kakaocloud.io", "tech.kakao.com", "www.sejongpac.or.kr", "www.culture.go.kr", "www.kakaocorp.com", "www.data.go.kr"] as const
const urlPattern = /https?:\/\/[^\s"'`<>),]+/g

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
  const candidates = [resolve(invocationRoot, target), resolve(appRoot, target), resolve(repoRoot, target)]

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  return candidates[0] ?? resolve(target)
}

async function pathExists(path: string): Promise<boolean> {
  return stat(path).then(() => true, () => false)
}

export function scanText(file: string, text: string, surface: ScanSurface = "include"): readonly Finding[] {
  const findings: Finding[] = []
  let activeLedgerHeader: SourceLedgerHeader | undefined

  for (const [index, lineText] of text.split(/\\n|\r?\n/).entries()) {
    const line = index + 1
    findings.push(...dependencyFindings(file, line, lineText), ...urlFindings(file, line, lineText))

    const ledgerHeader = sourceLedgerHeader(lineText)
    if (ledgerHeader !== undefined) {
      activeLedgerHeader = ledgerHeader
      continue
    }

    if (activeLedgerHeader === undefined) {
      continue
    }

    findings.push(
      ...sourceLedgerRowFindings({ file, line, lineText, surface, ledgerHeader: activeLedgerHeader }),
    )
  }

  return findings
}

function dependencyFindings(file: string, line: number, lineText: string): readonly Finding[] {
  if (file.endsWith("scan-sources.ts")) {
    return []
  }
  return scraperPackages
    .filter((name) => hasPackageUse(lineText, name))
    .map((name) => ({ file, line, rule: "scraper-browser-parser-dependency", value: name }))
}

function hasPackageUse(lineText: string, packageName: string): boolean {
  const escaped = packageName.replace("-", "\\-")
  return new RegExp(`(^|["'\\s])${escaped}(["'\\s:]|$)`).test(lineText)
}

function urlFindings(file: string, line: number, lineText: string): readonly Finding[] {
  const urls = [...lineText.matchAll(urlPattern)].map((match) => trimUrl(match[0]))
  return urls
    .filter((url) => !isAllowedUrl(file, url))
    .map((url) => ({ file, line, rule: "unregistered-event-source-url", value: url }))
}

function trimUrl(url: string): string {
  return url.replace(/[.;\]]+$/, "")
}

function isAllowedUrl(file: string, url: string): boolean {
  if (!URL.canParse(url)) {
    return true
  }
  const parsed = new URL(url)
  if (allowedHosts.some((host) => host === parsed.hostname)) {
    return true
  }
  if (officialSourceHosts.some((host) => host === parsed.hostname)) {
    return true
  }
  if (isOrganizerGuideExtract(file)) {
    return true
  }
  if (parsed.hostname.endsWith(".playmcp-endpoint.kakaocloud.io")) {
    return true
  }
  if (parsed.hostname === "seoul.go.kr" || parsed.hostname.endsWith(".seoul.go.kr")) {
    return true
  }
  if (isSyntheticFixtureHost(file, parsed.hostname)) {
    return true
  }
  return file.replaceAll("\\", "/").endsWith("test/fixtures/seoul-culture-sample.json")
}

function isOrganizerGuideExtract(file: string): boolean {
  return file.replaceAll("\\", "/").includes("docs/external/kakao-playmcp-in-kc-notion/")
}

function isSyntheticFixtureHost(file: string, hostname: string): boolean {
  const normalizedFile = file.replaceAll("\\", "/")
  const isAppFixtureSurface = normalizedFile.includes("/src/") || normalizedFile.includes("/test/") || normalizedFile.includes("/scripts/")
  const isExampleTestHost = hostname === "example.test" || hostname.endsWith(".example.test")
  return isAppFixtureSurface && isExampleTestHost
}

type SourceLedgerHeader = { readonly sourceColumnIndex: number; readonly urlColumnIndex: number }
type SourceLedgerRowScan = {
  readonly file: string
  readonly line: number
  readonly lineText: string
  readonly surface: ScanSurface
  readonly ledgerHeader: SourceLedgerHeader
}

function sourceLedgerHeader(lineText: string): SourceLedgerHeader | undefined {
  const cells = markdownCells(lineText)
  const sourceColumnIndex = cells.findIndex((cell) => cell === "source")
  const urlColumnIndex = cells.findIndex((cell) => cell === "url")

  if (sourceColumnIndex < 0 || urlColumnIndex < 0) {
    return undefined
  }

  return { sourceColumnIndex, urlColumnIndex }
}

function sourceLedgerRowFindings(scan: SourceLedgerRowScan): readonly Finding[] {
  const { file, line, lineText, surface, ledgerHeader } = scan
  if (isAllowedLedgerContext(file, surface)) {
    return []
  }

  const cells = markdownCells(lineText)
  const source = cells[ledgerHeader.sourceColumnIndex]
  const url = cells[ledgerHeader.urlColumnIndex]

  if (source === undefined || source.length === 0 || isMarkdownSeparatorRow(cells)) {
    return []
  }

  return url === undefined || url.length === 0
    ? [{ file, line, rule: "source-ledger-missing-url", value: source }]
    : []
}

function markdownCells(lineText: string): readonly string[] {
  const trimmed = lineText.trim()
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
    return []
  }
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim().toLowerCase())
}

function isMarkdownSeparatorRow(cells: readonly string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function isAllowedLedgerContext(file: string, surface: ScanSurface): boolean {
  return surface === "default" && file.replaceAll("\\", "/").includes("/test/")
}

export function parseIncludeArgs(args: readonly string[]): readonly string[] {
  const includes: string[] = []
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--help" || arg === "-h") {
      throw new SourceScanUsageError(usage())
    }
    if (arg !== "--include") {
      throw new SourceScanUsageError(`Unknown option: ${arg}\n${usage()}`)
    }

    const includePath = args[index + 1]
    if (includePath === undefined || includePath.startsWith("--")) {
      throw new SourceScanUsageError(`Missing path for --include\n${usage()}`)
    }
    includes.push(includePath)
    index += 1
  }
  return includes
}

class SourceScanUsageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SourceScanUsageError"
  }
}

function usage(): string {
  return [
    "Usage: tsx scripts/scan-sources.ts [--include <path> ...]",
    "",
    "Scans default app docs, source, tests, scripts, selected evidence, and any included files or directories.",
    "Use --include for source ledgers, launch docs, fixtures, temporary QA files, and generated evidence outside the default scan set.",
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
    if (error instanceof SourceScanUsageError) {
      console.error(error.message)
      process.exitCode = 1
      return
    }
    console.error(error instanceof Error ? error.message : "unknown source scan failure")
    process.exitCode = 1
  })
}
