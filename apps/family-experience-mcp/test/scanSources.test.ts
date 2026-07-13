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

  it("allows organizer guide extract URLs outside event source ledgers", () => {
    // Given: PlayMCP organizer guide extracts contain platform, Discord, registry, and example links.
    const file = "docs/external/kakao-playmcp-in-kc-notion/url2_container_image.md"
    const registryUrl = "https://" + "ghcr.io/"
    const discordUrl = "https://" + "kko.kakao.com/playmcp_discord"
    const text = [
      "Open https://playmcp.kakaocloud.io before registration.",
      `Registry examples include docker.io and ${registryUrl}.`,
      `The guide also links to ${discordUrl}.`,
    ].join("\n")

    // When: the source scanner evaluates the extracted guide text.
    const findings = scanText(file, text)

    // Then: organizer guide links are not treated as event source URLs.
    expect(findings).toEqual([])
  })

  it("allows official Notion methodology URLs", () => {
    // Given: the Notion extraction method cites official Notion help and API documentation.
    const text = [
      "Export help: https://www.notion.com/help/export-your-content",
      "Page markdown API: https://developers.notion.com/reference/retrieve-page-markdown",
    ].join("\n")

    // When: the scanner evaluates the methodology document.
    const findings = scanText("docs/NOTION_EXTRACTION_METHOD.md", text)

    // Then: official Notion documentation is accepted as a source.
    expect(findings).toEqual([])
  })

  it("allows official policy references only in the trusted-network PRD", () => {
    // Given: the future-product PRD cites official Kakao, privacy, and statute references.
    const text = [
      "Kakao Login: https://" + "developers.kakao.com/docs/ko/kakaologin/common",
      "Map samples: https://" + "apis.map.kakao.com/web/sample/",
      "Privacy authority: https://" + "m.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217",
      "Statute: https://" + "www.law.go.kr/LSW/lsInfoP.do?lsiSeq=277359",
    ].join("\n")

    // When: the same references appear in the scoped PRD and in a generic event-source document.
    const scoped = scanText("docs/TRUSTED_FAMILY_NETWORK_PRD_VNEXT.md", text)
    const unscoped = scanText("docs/unregistered-event-source.md", text)
    const insecure = scanText(
      "docs/TRUSTED_FAMILY_NETWORK_PRD_VNEXT.md",
      "http://" + "developers.kakao.com/docs/ko/kakaologin/common",
    )

    // Then: only HTTPS policy references in their non-runtime documentation surface are accepted.
    expect(scoped).toEqual([])
    expect(unscoped).toHaveLength(4)
    expect(unscoped.every((finding) => finding.rule === "unregistered-event-source-url")).toBe(true)
    expect(insecure).toHaveLength(1)
  })

  it("allows only exact Kakao navigation links on navigation implementation surfaces", () => {
    // Given: runtime navigation code emits Kakao map and directions links.
    const links = [
      "https://" + "map.kakao.com/link/map/행사장",
      "https://" + "map.kakao.com/link/to/행사장",
    ].join("\n")

    // When: links are scanned in the navigation implementation, a generic source doc, and with a wrong path.
    const implementation = scanText("src/pipeline/navigation.ts", links)
    const unscoped = scanText("docs/unregistered-event-source.md", links)
    const wrongPath = scanText("src/pipeline/navigation.ts", "https://" + "map.kakao.com/search/행사장")
    const unsafeVariants = scanText("src/pipeline/navigation.ts", [
      "http://" + "map.kakao.com/link/map/행사장",
      "https://" + "user:pass@map.kakao.com/link/to/행사장",
      "https://" + "map.kakao.com/link/map/행사장?token=secret",
      "https://" + "map.kakao.com/link/to/행사장#fragment",
    ].join("\n"))

    // Then: only credential-free HTTPS links in the two exact path families are exempted.
    expect(implementation).toEqual([])
    expect(unscoped).toHaveLength(2)
    expect(wrongPath).toHaveLength(1)
    expect(unsafeVariants).toHaveLength(4)
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
