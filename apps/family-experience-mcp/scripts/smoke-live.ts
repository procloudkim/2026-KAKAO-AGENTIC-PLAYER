import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

import { loadFamilyExperienceConfig, getFamilyExperienceConfigDiagnostics } from "../src/config.js"
import { createSeoulCultureSourceAdapter } from "../src/sources/seoulCulture.js"
import type { SourceAdapterResult } from "../src/sources/types.js"

const expectMissingKey = process.argv.includes("--expect-missing-key")

type SmokeReport = {
  readonly ok: boolean
  readonly status: string
  readonly config: ReturnType<typeof getFamilyExperienceConfigDiagnostics>
  readonly probes: readonly unknown[]
}

async function loadLocalEnv(): Promise<void> {
  const envPath = resolve(process.cwd(), ".env")
  if (!existsSync(envPath)) {
    return
  }

  const content = await readFile(envPath, "utf8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue
    }

    const separator = trimmed.indexOf("=")
    if (separator <= 0) {
      continue
    }

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

async function runLiveProbe(): Promise<unknown> {
  const config = loadFamilyExperienceConfig()
  if (config.seoulOpenDataKey === undefined) {
    return {
      name: "live_seoul_open_data",
      ok: false,
      status: "missing_key",
      retryable: false,
    }
  }

  const adapter = createSeoulCultureSourceAdapter({
    baseUrl: config.seoulOpenDataBaseUrl,
    apiKey: config.seoulOpenDataKey,
  })
  const startedAt = Date.now()
  const result = await adapter.list({
    location: "Seoul",
    date_range: { start: "2026-01-01", end: "2026-12-31" },
    child_stage: "preschool",
  })

  return summarizeSourceResult("live_seoul_open_data", result, Date.now() - startedAt)
}

async function runPermissionProbe(): Promise<unknown> {
  const adapter = createSeoulCultureSourceAdapter({
    baseUrl: "http://openapi.seoul.go.kr:8088",
    apiKey: "redaction-test-key",
    requestJson: async () => ({
      RESULT: {
        CODE: "ERROR-300",
        MESSAGE: "Authentication failed for test key.",
      },
    }),
  })
  const result = await adapter.list({
    location: "Seoul",
    date_range: { start: "2026-07-04", end: "2026-07-04" },
    child_age: 4,
  })

  return summarizeSourceResult("permission_failure_simulated", result, 0)
}

async function runMalformedProbe(): Promise<unknown> {
  const adapter = createSeoulCultureSourceAdapter({
    baseUrl: "http://openapi.seoul.go.kr:8088",
    apiKey: "redaction-test-key",
    requestJson: async () => ({ culturalEventInfo: { row: [] } }),
  })
  const result = await adapter.list({
    location: "Seoul",
    date_range: { start: "2026-07-04", end: "2026-07-04" },
    child_age: 4,
  })

  return summarizeSourceResult("malformed_source_simulated", result, 0)
}

function summarizeSourceResult(name: string, result: SourceAdapterResult, latencyMs: number): unknown {
  if (result.ok) {
    return {
      name,
      ok: true,
      mode: result.mode,
      source_id: result.source_id,
      record_count: result.records.length,
      retrieved_at: result.retrieved_at,
      latency_ms: latencyMs,
    }
  }

  return {
    name,
    ok: false,
    mode: result.mode,
    source_id: result.source_id,
    code: result.failure.code,
    retryable: result.failure.retryable,
    diagnostics: result.failure.diagnostics,
    latency_ms: latencyMs,
  }
}

function hasSecretLeak(value: unknown): boolean {
  return /SEOUL_OPEN_DATA_KEY|[?&]KEY=|[?&]key=|\/[A-Za-z0-9]{20,}\//.test(JSON.stringify(value))
}

async function main(): Promise<void> {
  if (expectMissingKey) {
    delete process.env["SEOUL_OPEN_DATA_KEY"]
  } else {
    await loadLocalEnv()
  }

  const config = loadFamilyExperienceConfig()
  const diagnostics = getFamilyExperienceConfigDiagnostics(config)

  if (expectMissingKey) {
    const report: SmokeReport = {
      ok: config.seoulOpenDataKey === undefined,
      status: config.seoulOpenDataKey === undefined ? "missing_key" : "unexpected_key_present",
      config: diagnostics,
      probes: [],
    }
    console.log(JSON.stringify(report, null, 2))
    process.exitCode = report.ok ? 0 : 1
    return
  }

  const probes = [
    await runLiveProbe(),
    await runPermissionProbe(),
    await runMalformedProbe(),
  ]
  const report: SmokeReport = {
    ok:
      diagnostics.seoulOpenDataKey === "redacted" &&
      probes.every((probe) => !hasSecretLeak(probe)),
    status: diagnostics.seoulOpenDataKey === "redacted" ? "complete" : "missing_key",
    config: diagnostics,
    probes,
  }

  console.log(JSON.stringify(report, null, 2))
  process.exitCode = report.ok ? 0 : 2
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "unknown live smoke failure")
  process.exitCode = 1
})
