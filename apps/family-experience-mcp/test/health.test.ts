import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import { buildMetadata, writeCache } from "../src/etl/cache.js"
import { getHealthStatus } from "../src/health.js"
import type { FamilyExperienceSourceRecord } from "../src/sources/types.js"

const liveConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: false,
  seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
  sourceSet: ["culture_portal"],
}

async function tempCacheDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "family-experience-health-cache-"))
}

function healthCacheRecord(): FamilyExperienceSourceRecord {
  return {
    id: "culture-portal-oneview:health-busan",
    raw_snapshot_id: "culture-portal-oneview:raw:health-busan",
    mode: "live",
    title: "Health Cache Candidate",
    city: "Busan",
    date: { start: "2026-07-04", end: "2026-07-05", time_text: "10:00-12:00" },
    venue: { name: "Busan Culture Center", address: "Busan Haeundae-gu" },
    source: {
      id: "culture-portal-oneview",
      mode: "live",
      url: "https://example.test/culture-portal-oneview/health",
      raw_snapshot_id: "culture-portal-oneview:raw:health-busan",
    },
    retrieved_at: "2026-07-04T00:00:00.000Z",
    confidence: { date: "source-stated", venue: "source-stated", age_fit: "source-stated", reservation: "unknown" },
    parent_check: {
      age_fit: "Official source marks this as a family program.",
      reservation: "confirmation_needed",
      live_status: "source_timestamp_required",
    },
    child_stages: ["preschool"],
    min_child_age: 3,
    max_child_age: 6,
    indoor_outdoor: "indoor",
    target_age_text: "ages 3-6",
    program_text: "Preschool family program.",
    reservation_url: null,
    contact: null,
    fee_text: "Confirm at the source before visiting.",
    tags: ["busan", "preschool"],
    suitability: "happy_prompt_match",
    fixture_notice: "",
  }
}

async function writeHealthCache(input: {
  readonly cacheDir: string
  readonly generatedAt: string
  readonly ttlHours: number
}): Promise<void> {
  const records = [healthCacheRecord()]
  const metadata = buildMetadata({
    generatedAt: input.generatedAt,
    fixture: false,
    maxPages: 1,
    mode: "write-cache",
    rawSnapshots: [],
    records,
    sourceSet: ["culture_portal"],
    sourceSummaries: [{ ok: true, records: records.length, raw_snapshots: 0 }],
    ttlHours: input.ttlHours,
  })

  await writeCache({ cacheDir: input.cacheDir, metadata, rawSnapshots: [], records })
}

describe("family experience health cache status", () => {
  it("reports stale live cache without fixture refresh guidance", async () => {
    // Given: a cache exists but is older than its TTL.
    const cacheDir = await tempCacheDir()

    try {
      await writeHealthCache({
        cacheDir,
        generatedAt: "2000-01-01T00:00:00.000Z",
        ttlHours: 1,
      })

      // When: health is rendered for public-beta live configuration.
      const health = getHealthStatus({ ...liveConfig, etlCacheDir: cacheDir })

      // Then: the cache status is stale and refresh guidance stays on live ETL.
      expect(health.cache).toMatchObject({
        status: "stale",
        cacheDir,
        refreshCommand: expect.stringContaining("--live --write-cache"),
      })
      expect(health.cache.refreshCommand).toContain("--source culture_portal")
      expect(health.cache.refreshCommand).not.toContain("--fixture")
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })
})
