import { spawnSync } from "node:child_process"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

import { parseIncludeArgs, scanText } from "../scripts/scan-claims.js"

const nationwideAllEvents = ["전국 모든", " 행사"].join("")
const liveNow = ["live", " now"].join("")
const suitableForAll = ["suitable", " for all"].join("")
const nationwideCompleteness = ["nationwide", " completeness"].join("")
const scraperIntegration = ["scraper", " integration"].join("")
const browserParser = ["browser", " parser"].join("")
const realTimeClaim = ["실", "시간"].join("")
const realTimeAllEvents = [realTimeClaim, " 운영중인 ", nationwideAllEvents, " 체험행사를 보장합니다"].join("")
const finalReviewSubmissionCompleted = ["final review and contest submission", " completed"].join("")
const completedSubmission = ["PlayMCP final review and contest submission", " completed"].join("")
const negativeCompletedSubmission = ["Negative launch update: PlayMCP final review and contest submission", " completed"].join("")
const allowedPublicCaveat =
  "이 서비스는 실시간 운영중, 전국 완전 커버리지, 예약 가능 여부, 안전 인증을 보장하지 않습니다."
const falseMarketClaim = ["Launch copy: ", nationwideCompleteness, " and ", liveNow, " status are ready."].join("")
const englishLiveNowCaveat = `Public copy does not claim ${liveNow}.`
const englishLiveNowSmuggle = `Public copy does not claim ${liveNow}; ${liveNow} status is ready.`
const koreanLiveNowSmuggle = `이 서비스는 ${realTimeClaim} 운영중을 보장하지 않습니다. ${realTimeClaim} 운영중입니다.`
const koreanCrossScopeCaveatBypass = `이 서비스는 ${realTimeClaim} 운영중입니다 예약 가능하지 않습니다.`
const koreanDirectLiveNowCaveat = `이 서비스는 ${realTimeClaim} 운영중을 보장하지 않습니다.`

function runClaimScan(args: readonly string[]) {
  return spawnSync(process.execPath, ["--import", "tsx", "scripts/scan-claims.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  })
}

describe("claim scanner", () => {
  it("parses repeated include paths", () => {
    // Given: launch-gate callers pass multiple explicit surfaces.
    const args = ["--include", "docs/launch.md", "--include", "../../.omo/tmp/market-plan"] as const

    // When: the scanner parses CLI include arguments.
    const includes = parseIncludeArgs(args)

    // Then: every path is preserved for the file collector.
    expect(includes).toEqual(["docs/launch.md", "../../.omo/tmp/market-plan"])
  })

  it("allows exact forbidden-claim fixture literals in eval prompt checks", () => {
    // Given: the eval checker owns negative fixture vocabulary as exact string literals.
    const text = [`  "${nationwideAllEvents}",`, `  "${liveNow}",`, `  "${suitableForAll}",`].join("\n")

    // When: the scanner evaluates the eval-check fixture table.
    const findings = scanText("scripts/eval-prompt-checks.ts", text, "default")

    // Then: the negative-probe vocabulary table is not treated as production claim text.
    expect(findings).toEqual([])
  })

  it("flags real unsupported claims in docs", () => {
    // Given: production-facing docs claim unsupported nationwide and scraper capabilities.
    const text = `This has ${nationwideCompleteness} through ${scraperIntegration} and a ${browserParser}.`

    // When: the scanner evaluates the docs text.
    const findings = scanText("docs/todo9-negative-probe.md", text)

    // Then: the real unsupported claim is still rejected.
    expect(findings).toEqual([
      { file: "docs/todo9-negative-probe.md", line: 1, claim: nationwideCompleteness },
      { file: "docs/todo9-negative-probe.md", line: 1, claim: scraperIntegration },
      { file: "docs/todo9-negative-probe.md", line: 1, claim: browserParser },
    ])
  })

  it("does not allow copied fixture literals outside eval prompt checks", () => {
    // Given: a docs file copies the negative vocabulary as a claim literal.
    const text = `  "${liveNow}",`

    // When: the scanner evaluates the copied text outside the eval checker.
    const findings = scanText("docs/copied-claim.md", text)

    // Then: file-specific fixture allowance does not suppress the finding.
    expect(findings).toEqual([{ file: "docs/copied-claim.md", line: 1, claim: liveNow }])
  })

  it("rejects unsupported market claims in included launch copy and temporary QA files", async () => {
    // Given: a repo-root temporary QA file contains public launch copy with unsupported claims.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan")
    const includeFile = resolve(includeDir, "bad-public-copy.md")
    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, realTimeAllEvents, "utf8")

    try {
      // When: the scanner runs through its CLI include surface.
      const result = runClaimScan(["--include", "../../.omo/tmp/market-plan/bad-public-copy.md"])

      // Then: unsupported launch copy is rejected with a nonzero process status.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("bad-public-copy.md")
      expect(result.stderr).toContain(nationwideAllEvents)
      expect(result.stderr).toContain(realTimeClaim)
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("rejects false final-review and submission status claims through include", async () => {
    // Given: a temporary launch document falsely claims final review and submission completion.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan")
    const includeFile = resolve(includeDir, "false-submission.md")
    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, completedSubmission, "utf8")

    try {
      // When: the scanner runs through its CLI include surface.
      const result = runClaimScan(["--include", "../../.omo/tmp/market-plan/false-submission.md"])

      // Then: forbidden status claims are launch-blocking.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("false-submission.md")
      expect(result.stderr).toContain(finalReviewSubmissionCompleted)
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("rejects negative-prefixed false final-review and submission status claims through include", async () => {
    // Given: a temporary launch document prefixes a forbidden completion claim with negative wording.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan")
    const includeFile = resolve(includeDir, "false-submission-smuggle.md")
    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, negativeCompletedSubmission, "utf8")

    try {
      // When: the scanner runs through its CLI include surface.
      const result = runClaimScan(["--include", "../../.omo/tmp/market-plan/false-submission-smuggle.md"])

      // Then: generic negative wording does not bypass forbidden public-copy claims.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("false-submission-smuggle.md")
      expect(result.stderr).toContain(finalReviewSubmissionCompleted)
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("allows public copy that explicitly caveats unsupported real-time coverage reservation and safety claims", () => {
    // Given: public docs state the service does not guarantee unsupported capabilities.
    const text = allowedPublicCaveat

    // When: the scanner evaluates the caveated public-copy line.
    const findings = scanText("docs/allowed-public-caveat.md", text)

    // Then: explicit non-claim caveats stay allowed.
    expect(findings).toEqual([])
  })

  it("rejects Korean cross-scope caveat bypass in include text", () => {
    // Given: a line asserts real-time operation before an unrelated reservation caveat.
    const text = koreanCrossScopeCaveatBypass

    // When: the scanner evaluates the include-surface text.
    const findings = scanText("manual/include.md", text, "include")

    // Then: the earlier affirmative real-time occurrence is still rejected.
    expect(findings).toEqual([{ file: "manual/include.md", line: 1, claim: realTimeClaim }])
  })

  it("allows direct Korean real-time caveat only in include text", () => {
    // Given: a Korean sentence directly scopes non-guarantee wording to real-time operation.
    const text = koreanDirectLiveNowCaveat

    // When: the scanner evaluates the include-surface text.
    const findings = scanText("manual/include.md", text, "include")

    // Then: the directly scoped caveat is accepted.
    expect(findings).toEqual([])
  })

  it("rejects explicit include under test fixtures eval path with false market claims", async () => {
    // Given: an explicit include path contains test/fixtures/eval but represents public launch copy.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan/test/fixtures/eval")
    const includeFile = resolve(includeDir, "bad-public-copy.md")
    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, falseMarketClaim, "utf8")

    try {
      // When: the scanner runs through its explicit CLI include surface.
      const result = runClaimScan(["--include", includeFile])

      // Then: fixture-like path text does not bypass forbidden market claims.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("bad-public-copy.md")
      expect(result.stderr).toContain(nationwideCompleteness)
      expect(result.stderr).toContain(liveNow)
    } finally {
      await rm(resolve(process.cwd(), "../../.omo/tmp/market-plan"), { recursive: true, force: true })
    }
  })

  it("rejects explicit include under omo evidence path with false public status claims", async () => {
    // Given: an explicit include path contains .omo/evidence and red/finding wording.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan/.omo/evidence")
    const includeFile = resolve(includeDir, "bad-evidence-copy.md")
    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, ["RED finding says public status: ", completedSubmission].join(""), "utf8")

    try {
      // When: the scanner runs through its explicit CLI include surface.
      const result = runClaimScan(["--include", includeFile])

      // Then: evidence-like path text and review wording do not bypass forbidden public status claims.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("bad-evidence-copy.md")
      expect(result.stderr).toContain(finalReviewSubmissionCompleted)
    } finally {
      await rm(resolve(process.cwd(), "../../.omo/tmp/market-plan"), { recursive: true, force: true })
    }
  })

  it("allows explicit include with a public unsupported-claim caveat", async () => {
    // Given: an explicit include file contains only a real caveat about unsupported capabilities.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan")
    const includeFile = resolve(includeDir, "allowed-public-caveat.md")
    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, allowedPublicCaveat, "utf8")

    try {
      // When: the scanner runs through its explicit CLI include surface.
      const result = runClaimScan(["--include", includeFile])

      // Then: explicit caveat language is accepted.
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('"status": "PASS"')
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("allows explicit include with an English live-now caveat only", async () => {
    // Given: an explicit include file caveats live-now status without asserting it.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan")
    const includeFile = resolve(includeDir, "english-live-now-caveat.md")
    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, englishLiveNowCaveat, "utf8")

    try {
      // When: the scanner runs through its explicit CLI include surface.
      const result = runClaimScan(["--include", includeFile])

      // Then: caveat-only launch copy is accepted.
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('"status": "PASS"')
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("rejects English caveat smuggling through explicit include", async () => {
    // Given: an explicit include file caveats live-now status and then asserts it.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan")
    const includeFile = resolve(includeDir, "english-live-now-smuggle.md")
    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, englishLiveNowSmuggle, "utf8")

    try {
      // When: the scanner runs through its explicit CLI include surface.
      const result = runClaimScan(["--include", includeFile])

      // Then: the affirmative occurrence after the caveat is rejected.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("english-live-now-smuggle.md")
      expect(result.stderr).toContain(liveNow)
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("rejects Korean caveat smuggling through explicit include", async () => {
    // Given: an explicit include file caveats real-time operation and then asserts it.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan")
    const includeFile = resolve(includeDir, "korean-live-now-smuggle.md")
    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, koreanLiveNowSmuggle, "utf8")

    try {
      // When: the scanner runs through its explicit CLI include surface.
      const result = runClaimScan(["--include", includeFile])

      // Then: the affirmative Korean real-time occurrence after the caveat is rejected.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("korean-live-now-smuggle.md")
      expect(result.stderr).toContain(realTimeClaim)
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("rejects included prompt, docs, fixture, and generated evidence claim files", async () => {
    // Given: included launch surfaces outside the default scan set contain unsupported claims.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan")
    await mkdir(resolve(includeDir, "prompts"), { recursive: true })
    await mkdir(resolve(includeDir, "docs"), { recursive: true })
    await mkdir(resolve(includeDir, "fixtures"), { recursive: true })
    await mkdir(resolve(includeDir, "evidence"), { recursive: true })
    await writeFile(resolve(includeDir, "prompts", "launch-prompt.md"), liveNow, "utf8")
    await writeFile(resolve(includeDir, "docs", "public-copy.md"), nationwideCompleteness, "utf8")
    await writeFile(resolve(includeDir, "fixtures", "bad-fixture.txt"), suitableForAll, "utf8")
    await writeFile(resolve(includeDir, "evidence", "generated.txt"), scraperIntegration, "utf8")

    try {
      // When: the scanner includes the temporary market plan directory.
      const result = runClaimScan(["--include", "../../.omo/tmp/market-plan"])

      // Then: every included launch surface is scanned and rejected.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("launch-prompt.md")
      expect(result.stderr).toContain("public-copy.md")
      expect(result.stderr).toContain("bad-fixture.txt")
      expect(result.stderr).toContain("generated.txt")
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("fails closed when include is missing or points to a nonexistent path", () => {
    // Given: malformed include invocations are supplied.
    const missingValue = runClaimScan(["--include"])
    const nonexistentPath = runClaimScan(["--include", "../../.omo/tmp/market-plan/missing.md"])

    // When/Then: both cases fail instead of silently skipping requested launch surfaces.
    expect(missingValue.status).toBe(1)
    expect(missingValue.stderr).toContain("Missing path for --include")
    expect(nonexistentPath.status).toBe(1)
    expect(nonexistentPath.stderr).toContain("ENOENT")
  })
})
