import { createServer, type Server } from "node:http"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import { buildMetadata, writeCache } from "../src/etl/cache.js"
import { getHealthStatus } from "../src/health.js"
import { callFindFamilyExperiences } from "../src/mcp.js"
import {
  getOperationalSnapshot,
  recordHttpRequest,
  resetOperationalMetrics,
  type OperationalLogEntry,
} from "../src/observability.js"
import { createFamilyExperienceHttpServer } from "../src/server.js"
import type { FamilyExperienceSourceRecord } from "../src/sources/types.js"
import { postMcpJson } from "./mcpHttpTestHelpers.js"

let activeServer: Server | undefined

const fixtureConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: true,
  seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
}

const noFixtureConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: false,
  seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
}

afterEach(async () => {
  resetOperationalMetrics()
  await new Promise<void>((resolve, reject) => {
    if (activeServer === undefined) {
      resolve()
      return
    }

    activeServer.close((error) => {
      activeServer = undefined
      if (error === undefined) {
        resolve()
        return
      }
      reject(error)
    })
  })
})

async function listenOnLocalhost(server: Server): Promise<{ readonly url: string }> {
  activeServer = server
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve)
  })

  const address = server.address()
  if (typeof address !== "object" || address === null) {
    throw new Error("expected local server address")
  }

  return { url: `http://127.0.0.1:${address.port}/mcp` }
}

function syntheticRecord(): FamilyExperienceSourceRecord {
  return {
    id: "culture-portal-oneview:observability",
    raw_snapshot_id: "culture-portal-oneview:raw:observability",
    mode: "live",
    title: "Observed Family Studio",
    city: "Busan",
    date: { start: "2026-08-04", end: "2026-08-05", time_text: "10:00-12:00" },
    venue: { name: "Observed Center", address: "Busan indoor hall" },
    source: {
      id: "culture-portal-oneview",
      mode: "live",
      url: "https://example.invalid/culture-portal-oneview/observability",
      raw_snapshot_id: "culture-portal-oneview:raw:observability",
    },
    retrieved_at: "2026-07-04T00:00:00.000Z",
    confidence: { date: "source-stated", venue: "source-stated", age_fit: "source-stated", reservation: "unknown" },
    parent_check: {
      age_fit: "Synthetic source states preschool fit.",
      reservation: "confirmation_needed",
      live_status: "fixture_not_live",
    },
    child_stages: ["preschool"],
    min_child_age: 3,
    max_child_age: 6,
    indoor_outdoor: "indoor",
    target_age_text: "ages 3-6",
    program_text: "Observed family program.",
    reservation_url: null,
    contact: null,
    fee_text: "Confirm with the official source before visiting.",
    tags: ["busan", "indoor", "observability"],
    suitability: "happy_prompt_match",
    fixture_notice: "Synthetic cache record for observability tests.",
  }
}

async function writeObservedCache(cacheDir: string): Promise<void> {
  const records = [syntheticRecord()]
  const metadata = buildMetadata({
    generatedAt: new Date().toISOString(),
    fixture: false,
    maxPages: 1,
    mode: "write-cache",
    rawSnapshots: [],
    records,
    sourceSet: ["culture_portal"],
    sourceSummaries: [{ ok: true, records: records.length, raw_snapshots: 0 }],
    ttlHours: 24,
  })

  await writeCache({ cacheDir, metadata, rawSnapshots: [], records })
}

describe("Todo 12 operational logs and metrics", () => {
  it("records redacted tool failure metrics without logging raw prompts or secrets", async () => {
    // Given: a secret-like prompt is sent while live source configuration is missing.
    const rawSecret = "FAKE_MARKET_PLAN_SECRET_REDACTED"
    const logs: OperationalLogEntry[] = []

    // When: the tool fails before any candidate is fabricated.
    const result = await callFindFamilyExperiences(
      {
        location: "Busan",
        date_range: { start: "2026-08-04", end: "2026-08-05" },
        child_age: 4,
        keywords: [rawSecret],
      },
      { config: noFixtureConfig, logger: (entry) => logs.push(entry) },
    )

    // Then: logs and metrics capture the failure shape without the prompt, secret, or stack.
    const serializedLogs = JSON.stringify(logs)
    expect(result.isError).toBe(true)
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      event: "tool_call",
      tool: {
        name: "find_family_experiences",
        outcome: "failure",
        failure_code: "missing_configuration",
      },
    })
    expect(serializedLogs).not.toContain(rawSecret)
    expect(serializedLogs).not.toMatch(/prompt|민준|stack|Error:/i)
    expect(getOperationalSnapshot()).toMatchObject({
      tool_calls: {
        total: 1,
        failed: 1,
        invalid_input: 0,
        no_results: 0,
      },
    })
  })

  it("exposes cache freshness, source health, and launch metrics through health", async () => {
    // Given: a fresh cache and one successful tool call have been observed.
    const cacheDir = await mkdtemp(join(tmpdir(), "family-experience-observability-"))
    await writeObservedCache(cacheDir)

    try {
      const result = await callFindFamilyExperiences(
        { location: "Busan", date_range: { start: "2026-08-04", end: "2026-08-05" }, child_age: 4 },
        { config: { ...noFixtureConfig, etlCacheDir: cacheDir } },
      )
      expect(result.isError).not.toBe(true)

      // When: health is requested for the same runtime config.
      const health = getHealthStatus({ ...fixtureConfig, etlCacheDir: cacheDir })

      // Then: the non-sensitive diagnostics include cache age, source health, and counters.
      expect(health.cache).toMatchObject({
        status: "fresh",
        ttl_hours: 24,
      })
      expect(health.cache_metrics).toMatchObject({
        status: "fresh",
        ttl_hours: 24,
        source_health: {
          total_sources: 1,
          ok_sources: 1,
          failed_sources: 0,
        },
      })
      expect(health.cache.age_seconds).toBeGreaterThanOrEqual(0)
      expect(health.operations).toMatchObject({
        deployed_version: "0.1.0",
        tool_calls: {
          total: 1,
          succeeded: 1,
        },
      })
      expect(JSON.stringify(health)).not.toMatch(/SECRET|stack|prompt/i)
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("emits structured redacted HTTP failure logs without stack traces", async () => {
    // Given: the HTTP server route fails with a secret-bearing internal error.
    const rawSecret = "FAKE_MARKET_PLAN_SECRET_REDACTED"
    const logs: OperationalLogEntry[] = []
    const server = await listenOnLocalhost(
      createFamilyExperienceHttpServer({
        logger: (entry) => logs.push(entry),
        routeRequest: async () => {
          throw new Error(`simulated internal failure ${rawSecret}`)
        },
      }),
    )

    // When: a request reaches the failing route.
    const response = await postMcpJson(server.url, "{}")

    // Then: the public response and operational log are bounded and redacted.
    const serializedLogs = JSON.stringify(logs)
    expect(response.statusCode).toBe(500)
    expect(response.body).toContain("internal_error")
    expect(response.body).not.toContain(rawSecret)
    expect(response.body).not.toMatch(/stack|Error:/i)
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      event: "http_request",
      http: {
        method: "POST",
        path: "/mcp",
        status_code: 500,
        outcome: "failure",
      },
    })
    expect(serializedLogs).not.toContain(rawSecret)
    expect(serializedLogs).not.toMatch(/stack|Error:/i)
    expect(getOperationalSnapshot()).toMatchObject({
      requests: {
        total: 1,
        failed: 1,
      },
    })
  })

  it("PIN:METRICS_ACCOUNTING separates admitted results from admission limits", () => {
    // Given: one successful, one failed, and two admission-limited HTTP outcomes.
    const logger = (): void => undefined

    // When: each outcome is recorded through the operational boundary.
    recordHttpRequest({ logger, method: "POST", path: "/mcp", statusCode: 200, latencyMs: 1 })
    recordHttpRequest({ logger, method: "POST", path: "/mcp", statusCode: 400, latencyMs: 1 })
    recordHttpRequest({
      logger,
      method: "POST",
      path: "/mcp",
      statusCode: 429,
      latencyMs: 1,
      limitation: "rate_limited",
    })
    recordHttpRequest({
      logger,
      method: "POST",
      path: "/mcp",
      statusCode: 429,
      latencyMs: 1,
      limitation: "concurrency_limited",
    })

    // Then: counters are mutually meaningful without resetting state behind assertions.
    expect(getOperationalSnapshot().requests).toMatchObject({
      total: 4,
      accepted: 2,
      succeeded: 1,
      failed: 1,
      rate_limited: 1,
      concurrency_limited: 1,
    })
    expect(getHealthStatus(fixtureConfig).operations.requests).toMatchObject({
      total: 4,
      accepted: 2,
      succeeded: 1,
      failed: 1,
      rate_limited: 1,
      concurrency_limited: 1,
    })
  })
})
