import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import { buildMetadata, ETL_CACHE_FILES, writeCache } from "../src/etl/cache.js"
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
    fixture_notice: "Synthetic health test fixture; not a live listing.",
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
  it("PIN:NO_INTERNAL_DISCLOSURE reports stale cache without operator internals", async () => {
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

      // Then: the public status is useful without revealing paths, topology, URLs, or commands.
      expect(health.ok).toBe(false)
      expect(health.cache).toMatchObject({ status: "stale" })
      const publicHealth = JSON.stringify(health)
      expect(publicHealth).not.toContain(cacheDir)
      expect(publicHealth).not.toContain(liveConfig.seoulOpenDataBaseUrl)
      expect(publicHealth).not.toMatch(/[A-Za-z]:[\\/]|--write-cache|refreshCommand|cacheDir/i)
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("reports ready only for a fresh live cache", async () => {
    // Given: a validated live cache is fresh and fixture mode is disabled.
    const cacheDir = await tempCacheDir()

    try {
      await writeHealthCache({
        cacheDir,
        generatedAt: new Date().toISOString(),
        ttlHours: 24,
      })

      // When: health is rendered for the production cache.
      const health = getHealthStatus({ ...liveConfig, etlCacheDir: cacheDir })

      // Then: readiness is true because the actual tool data path is usable.
      expect(health).toMatchObject({
        ok: true,
        cache: { status: "fresh", mode: "live" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("reports invalid when runtime and cache source sets differ", async () => {
    const cacheDir = await tempCacheDir()

    try {
      await writeHealthCache({
        cacheDir,
        generatedAt: new Date().toISOString(),
        ttlHours: 24,
      })

      const health = getHealthStatus({
        ...liveConfig,
        etlCacheDir: cacheDir,
        sourceSet: ["kto_tourapi"],
      })

      expect(health).toMatchObject({ ok: false, cache: { status: "invalid" } })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("reports invalid when generated_at exceeds the allowed future clock skew", async () => {
    const cacheDir = await tempCacheDir()

    try {
      await writeHealthCache({
        cacheDir,
        generatedAt: new Date(Date.now() + 6 * 60 * 1_000).toISOString(),
        ttlHours: 24,
      })

      const health = getHealthStatus({ ...liveConfig, etlCacheDir: cacheDir })

      expect(health).toMatchObject({ ok: false, cache: { status: "invalid" } })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("reports invalid when cache TTL differs from the configured ETL TTL", async () => {
    const cacheDir = await tempCacheDir()

    try {
      await writeHealthCache({
        cacheDir,
        generatedAt: new Date().toISOString(),
        ttlHours: 48,
      })

      const health = getHealthStatus({ ...liveConfig, etlCacheDir: cacheDir, etlTtlHours: 24 })

      expect(health).toMatchObject({ ok: false, cache: { status: "invalid" } })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("PIN:CORRUPT_CACHE_UNREADY reports unready when fresh metadata points at a corrupt cache", async () => {
    // Given: fresh live metadata remains but the normalized cache fails its contract.
    const cacheDir = await tempCacheDir()

    try {
      await writeHealthCache({
        cacheDir,
        generatedAt: new Date().toISOString(),
        ttlHours: 24,
      })
      await writeFile(join(cacheDir, ETL_CACHE_FILES.normalized), "{}\n", "utf8")

      // When: health validates the deployable cache boundary.
      const health = getHealthStatus({ ...liveConfig, etlCacheDir: cacheDir })

      // Then: corrupt data cannot be advertised as ready.
      expect(health).toMatchObject({
        ok: false,
        cache: { status: "invalid" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })
})
