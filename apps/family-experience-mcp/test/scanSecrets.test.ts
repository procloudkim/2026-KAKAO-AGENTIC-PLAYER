import { mkdir, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"

import { describe, expect, it } from "vitest"

import { scanText } from "../scripts/scan-secrets.js"

function runSecretScan(args: readonly string[]) {
  return spawnSync(process.execPath, ["--import", "tsx", "scripts/scan-secrets.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  })
}

describe("secret scanner", () => {
  it("flags real-looking key assignments when guardrail and redacted are on the same line", () => {
    // Given: a synthetic long key is present on a line that also describes redaction guardrails.
    const realLookingSecret = ["SYNTHETICKEYPART", "1234567890ABCDE"].join("")
    const text = `redacted guardrail example API_KEY=${realLookingSecret}`

    // When: the scanner evaluates the line.
    const findings = scanText("synthetic-bypass.txt", text)

    // Then: context words do not suppress a real-looking secret finding.
    expect(findings).toEqual([{ file: "synthetic-bypass.txt", line: 1, rule: "key-assignment" }])
  })

  it("flags real-looking Seoul Open Data key assignments", () => {
    // Given: a synthetic Seoul Open Data key is assigned directly.
    const seoulOpenDataKey = ["SEOULKEYPART1234", "567890ABCDE"].join("")
    const text = `SEOUL_OPEN_DATA_KEY="${seoulOpenDataKey}"`

    // When: the scanner evaluates the assignment.
    const findings = scanText("synthetic-env.txt", text)

    // Then: the project-specific environment key is treated as secret material.
    expect(findings).toEqual([{ file: "synthetic-env.txt", line: 1, rule: "seoul-open-data-key" }])
  })

  it("allows empty env examples and explicit redaction placeholders", () => {
    // Given: documented placeholders contain no real-looking secret value.
    const text = [
      "SEOUL_OPEN_DATA_KEY=",
      'SEOUL_OPEN_DATA_KEY=""',
      "SEOUL_OPEN_DATA_KEY=<redacted>",
      "SEOUL_OPEN_DATA_KEY=redacted",
      "https://openapi.example.test/<redacted>/json/culturalEventInfo/1/5/",
    ].join("\n")

    // When: the scanner evaluates placeholder examples.
    const findings = scanText(".env.example", text)

    // Then: empty assignments and redaction examples remain allowed.
    expect(findings).toEqual([])
  })

  it("allows pure synthetic service key placeholders", () => {
    // Given: a fixture assignment uses the documented synthetic CLI placeholder.
    const text = "SERVICE_KEY=<redacted-synthetic-secret>"

    // When: the scanner evaluates only that placeholder-valued assignment.
    const findings = scanText("synthetic-placeholder.env", text)

    // Then: the intended synthetic fixture remains allowed.
    expect(findings).toEqual([])
  })

  it("flags real-looking key assignments next to allowed placeholders", () => {
    // Given: an allowed placeholder and a separate real-looking key assignment share one line.
    const realLookingSecret = ["SYNTHETICKEYPART", "1234567890ABCDE"].join("")
    const text = `CLI_SYNTHETIC_SERVICE_KEY_12345 API_KEY=${realLookingSecret}`

    // When: the scanner evaluates the mixed-token line.
    const findings = scanText("mixed-placeholder-secret.env", text)

    // Then: the placeholder does not suppress the separate key occurrence.
    expect(findings).toEqual([{ file: "mixed-placeholder-secret.env", line: 1, rule: "key-assignment" }])
  })

  it("flags placeholder-embedded longer key assignments", () => {
    // Given: a key assignment embeds an allowed placeholder inside a longer real-looking token.
    const text = ["API_KEY=CLI_SYNTHETIC_SERVICE_KEY_12345", "REALTOKEN123456"].join("")

    // When: the scanner evaluates the assignment.
    const findings = scanText("embedded-placeholder-secret.env", text)

    // Then: only an exact full placeholder value is allowed.
    expect(findings).toEqual([{ file: "embedded-placeholder-secret.env", line: 1, rule: "key-assignment" }])
  })

  it("flags real-looking secrets in nested token API security evidence", async () => {
    // Given: a synthetic key is written to the nested evidence directory used by token/API reviews.
    const evidenceDir = resolve(process.cwd(), "../../.omo/evidence/token-api-security")
    const evidenceFile = resolve(evidenceDir, "scan-secrets-nested-bypass.tmp")
    const syntheticKey = ["NESTEDTOKENPART", "1234567890ABCDE"].join("")

    await mkdir(evidenceDir, { recursive: true })
    await writeFile(evidenceFile, `SEOUL_OPEN_DATA_KEY=${syntheticKey}\n`, "utf8")

    try {
      // When: the scanner runs through its CLI surface.
      const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/scan-secrets.ts"], {
        cwd: process.cwd(),
        encoding: "utf8",
      })

      // Then: nested token/API evidence is part of the enforced scan set.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("scan-secrets-nested-bypass.tmp")
      expect(result.stderr).toContain("seoul-open-data-key")
    } finally {
      await rm(evidenceFile, { force: true })
    }
  })

  it("rejects real-looking secrets from explicit include paths", async () => {
    // Given: a temp QA fixture outside the default scan set contains a synthetic provider key.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan-secrets")
    const includeFile = resolve(includeDir, "fake-secret.env")
    const fakeSecretAssignment = [
      "CULTURE_PORTAL",
      "_SERVICE_KEY=FAKE_MARKET_PLAN_SECRET",
      "_123456",
    ].join("")

    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, `${fakeSecretAssignment}\n`, "utf8")

    try {
      // When: the scanner runs through its CLI include surface.
      const result = runSecretScan(["--include", "../../.omo/tmp/market-plan-secrets/fake-secret.env"])

      // Then: included temporary QA files are rejected when they contain key material.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("fake-secret.env")
      expect(result.stderr).toContain("provider-service-key")
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("rejects mixed placeholders and real-looking secrets from explicit include paths", async () => {
    // Given: a caller explicitly includes an untrusted QA file with an allowed placeholder and separate API key.
    const includeDir = resolve(process.cwd(), "../../.omo/tmp/market-plan-mixed-secrets")
    const includeFile = resolve(includeDir, "mixed-placeholder-secret.env")
    const realLookingSecret = ["SYNTHETICKEYPART", "1234567890ABCDE"].join("")

    await mkdir(includeDir, { recursive: true })
    await writeFile(includeFile, `CLI_SYNTHETIC_SERVICE_KEY_12345 API_KEY=${realLookingSecret}\n`, "utf8")

    try {
      // When: the scanner runs through its CLI include surface.
      const result = runSecretScan(["--include", "../../.omo/tmp/market-plan-mixed-secrets/mixed-placeholder-secret.env"])

      // Then: explicit include remains untrusted and rejects the separate key.
      expect(result.status).toBe(1)
      expect(result.stderr).toContain("mixed-placeholder-secret.env")
      expect(result.stderr).toContain("key-assignment")
    } finally {
      await rm(includeDir, { recursive: true, force: true })
    }
  })

  it("fails closed when include option is malformed", () => {
    // Given: a caller provides --include without a path.
    const args = ["--include"] as const

    // When: the scanner runs through its CLI surface.
    const result = runSecretScan(args)

    // Then: malformed input fails instead of falling back to a partial default scan.
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("Missing path for --include")
  })

  it("fails closed when include path does not exist", () => {
    // Given: a caller includes a path that is absent in the repo, app, and invocation roots.
    const missingPath = "../../.omo/tmp/market-plan/no-such-secret-fixture.env"

    // When: the scanner runs through its CLI surface.
    const result = runSecretScan(["--include", missingPath])

    // Then: nonexistent include targets fail closed.
    expect(result.status).toBe(1)
    expect(result.stderr).toContain("no-such-secret-fixture.env")
  })
})
