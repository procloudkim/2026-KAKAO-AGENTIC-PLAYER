import { spawnSync } from "node:child_process"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

import { parseIncludeArgs, scanText } from "../scripts/scan-sources.js"

function runSourceScan(args: readonly string[]) {
  return spawnSync(process.execPath, ["--import", "tsx", "scripts/scan-sources.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  })
}

describe("source scanner", () => {
  it("parses repeated include paths", () => {
    // Given: launch-gate callers pass explicit source docs and temporary QA files.
    const args = ["--include", "docs/SOURCE_LEDGER.md", "--include", "../../.omo/tmp/market-plan"] as const

    // When: the scanner parses CLI include arguments.
    const includes = parseIncludeArgs(args)

    // Then: every path is preserved for the file collector.
    expect(includes).toEqual(["docs/SOURCE_LEDGER.md", "../../.omo/tmp/market-plan"])
  })

  it("rejects malformed source ledger rows with blank source URLs", () => {
    // Given: a source-ledger-like markdown table omits the URL for a row.
    const text = ["| source | url |", "| --- | --- |", "| bad | |"].join("\n")

    // When: the scanner evaluates the source document.
    const findings = scanText("docs/bad-source.md", text)

    // Then: malformed source rows are launch-blocking.
    expect(findings).toEqual([
      {
        file: "docs/bad-source.md",
        line: 3,
        rule: "source-ledger-missing-url",
        value: "bad",
      },
    ])
  })

  it("rejects malformed source ledger rows when PowerShell writes literal newline escapes", () => {
    // Given: the documented negative QA command writes a literal backslash-n in single quotes.
    const text = "| source | url |\\n| bad | |"

    // When: the scanner evaluates the included source document.
    const findings = scanText("docs/bad-source.md", text)

    // Then: the escaped row boundary is still scanned as source-ledger content.
    expect(findings).toEqual([
      {
        file: "docs/bad-source.md",
        line: 2,
        rule: "source-ledger-missing-url",
        value: "bad",
      },
    ])
  })

  it("rejects malformed included temporary source docs through the CLI", async () => {
    // Given: a repo-root temporary QA source document has a missing source URL.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan-sources")
    const includeFile = resolve(includeDir, "bad-source.md")
    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, "| source | url |\n| bad | |", "utf8")

    try {
      // When: the scanner runs through its CLI include surface.
      const result = runSourceScan(["--include", "../../.omo/tmp/market-plan-sources/bad-source.md"])

      // Then: the included bad file is scanned and rejected.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("bad-source.md")
      expect(result.stderr).toContain("source-ledger-missing-url")
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("fails closed when include is missing or points to a nonexistent path", () => {
    // Given: malformed include invocations are supplied.
    const missingValue = runSourceScan(["--include"])
    const nonexistentPath = runSourceScan(["--include", "../../.omo/tmp/market-plan/missing.md"])

    // When/Then: both cases fail instead of silently skipping requested source docs.
    expect(missingValue.status).toBe(1)
    expect(missingValue.stderr).toContain("Missing path for --include")
    expect(nonexistentPath.status).toBe(1)
    expect(nonexistentPath.stderr).toContain("ENOENT")
  })
})
