// allow: SIZE_OK - Nationwide ETL cache runner integration contract suite; splitting is Todo 4 test refactor scope.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

import { describe, expect, it } from "vitest"

import {
  ETL_CACHE_FILES,
  NationwideEtlInputError,
  parseNationwideEtlArgs,
  redactDiagnosticText,
  runNationwideEtl,
} from "../src/etl/nationwide.js"
import { buildMetadata, writeCache } from "../src/etl/cache.js"
import {
  cacheMetadataSchema,
  cacheRecordSchema,
  sha256Hex,
} from "../src/etl/cacheContract.js"
import { queryNationwideCache } from "../src/etl/cacheQuery.js"
import type { FamilyExperienceSourceRecord, SourceAdapterRequest } from "../src/sources/types.js"

async function tempCacheDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "family-experience-etl-"))
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"))
}

function readJsonl(path: string): readonly unknown[] {
  return readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line): unknown => JSON.parse(line))
}

const busanCacheRequest: SourceAdapterRequest = {
  location: "Busan",
  date_range: { start: "2026-07-04", end: "2026-07-05" },
  child_age: 4,
}

function queryCacheRecord(): FamilyExperienceSourceRecord {
  return {
    id: "culture-portal-oneview:task-4-busan",
    raw_snapshot_id: "culture-portal-oneview:raw:task-4-busan",
    mode: "live",
    title: "Busan Todo 4 Cache Contract",
    city: "Busan",
    date: { start: "2026-07-04", end: "2026-07-05", time_text: "10:00-12:00" },
    venue: { name: "Busan Culture Center", address: "Busan Haeundae-gu" },
    source: {
      id: "culture-portal-oneview",
      mode: "live",
      url: "https://example.test/culture-portal-oneview/task-4",
      raw_snapshot_id: "culture-portal-oneview:raw:task-4-busan",
    },
    retrieved_at: "2026-07-04T00:00:00.000Z",
    confidence: { date: "source-stated", venue: "source-stated", age_fit: "source-stated", reservation: "unknown" },
    parent_check: {
      age_fit: "Official source marks this as a preschool family program.",
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
    fixture_notice: "Synthetic ETL test fixture; not a live listing.",
  }
}

async function writeQueryableCache(input: {
  readonly cacheDir: string
  readonly generatedAt?: string
  readonly records?: readonly FamilyExperienceSourceRecord[]
  readonly ttlHours?: number
}): Promise<void> {
  const records = input.records ?? [queryCacheRecord()]
  const metadata = buildMetadata({
    generatedAt: input.generatedAt ?? "2026-07-07T00:00:00.000Z",
    fixture: false,
    maxPages: 1,
    mode: "write-cache",
    rawSnapshots: [],
    records,
    sourceSet: ["culture_portal"],
    sourceSummaries: [{ ok: true, records: records.length, raw_snapshots: 0 }],
    ttlHours: input.ttlHours ?? 24,
  })

  await writeCache({ cacheDir: input.cacheDir, metadata, rawSnapshots: [], records })
}

describe("nationwide ETL cache runner", () => {
  it("reports fixture dry-run counts without writing cache files", async () => {
    // Given: a fixture ETL request pointed at an empty temp cache directory.
    const cacheDir = await tempCacheDir()

    try {
      // When: the ETL runs in dry-run mode.
      const report = await runNationwideEtl({
        cacheDir: resolve(cacheDir, "cache"),
        fixture: true,
        maxPages: 1,
        mode: "dry-run",
        sourceSet: ["culture_portal", "kto_tourapi", "national_festival"],
        ttlHours: 24,
        nowIso: () => "2026-07-04T00:00:00.000Z",
      })

      // Then: extraction and normalization counts are visible, but no cache files exist.
      expect(report.ok).toBe(true)
      expect(report.counts.normalized_records).toBe(3)
      expect(report.counts.raw_snapshots).toBe(3)
      expect(report.mode).toBe("dry-run")
      expect(existsSync(resolve(cacheDir, "cache"))).toBe(false)
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("writes metadata, raw snapshot JSONL, and normalized record JSONL in write-cache mode", async () => {
    // Given: a fixture ETL request with an explicit cache directory.
    const cacheDir = await tempCacheDir()

    try {
      // When: the ETL writes the local cache.
      const report = await runNationwideEtl({
        cacheDir,
        fixture: true,
        maxPages: 2,
        mode: "write-cache",
        sourceSet: ["seoul", "culture_portal", "kto_tourapi", "national_festival"],
        ttlHours: 48,
        nowIso: () => "2026-07-04T00:00:00.000Z",
      })
      const metadata = readJsonFile(resolve(cacheDir, ETL_CACHE_FILES.metadata))
      const rawSnapshots = readJsonl(resolve(cacheDir, ETL_CACHE_FILES.rawSnapshots))
      const normalizedRecords = readJsonl(resolve(cacheDir, ETL_CACHE_FILES.normalized))

      // Then: the on-disk cache has generated_at, TTL, source set, and real record counts.
      expect(report.ok).toBe(true)
      expect(metadata).toMatchObject({
        schema_version: 2,
        generated_at: "2026-07-04T00:00:00.000Z",
        ttl_hours: 48,
        max_pages: 2,
        source_set: ["seoul", "culture_portal", "kto_tourapi", "national_festival"],
        counts: {
          normalized_records: 4,
        },
        raw_snapshots_present: true,
      })
      expect(metadata).toHaveProperty(
        "source_provenance",
        expect.arrayContaining([
          expect.objectContaining({
            source: "seoul",
            generated_at: "2026-07-04T00:00:00.000Z",
            ttl_hours: 48,
            mode: "fixture",
            ok: true,
            records: 1,
            raw_snapshot_present: true,
          }),
        ]),
      )
      expect(metadata).toMatchObject({
        file_digests: {
          normalized_records_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
          raw_snapshots_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        },
        publish_id: expect.stringContaining("cache-"),
      })
      expect(rawSnapshots).toHaveLength(4)
      expect(normalizedRecords).toHaveLength(4)
      expect(existsSync(resolve(cacheDir, ETL_CACHE_FILES.publishMarker))).toBe(false)
      expect(readdirSync(cacheDir).filter((entry) => entry.endsWith(".tmp"))).toEqual([])
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects invalid generated timestamps in cache metadata", async () => {
    // Given: a published cache has metadata with an invalid generated_at timestamp.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir })
      const metadataPath = resolve(cacheDir, ETL_CACHE_FILES.metadata)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      writeFileSync(metadataPath, `${JSON.stringify({ ...metadata, generated_at: "not-a-date" }, null, 2)}\n`, "utf8")

      // When: the cache is queried through the runtime cache boundary.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: malformed metadata fails closed instead of returning candidates.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects live cache metadata missing schema_version", async () => {
    // Given: a published live cache has provenance metadata without its schema version.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir })
      const metadataPath = resolve(cacheDir, ETL_CACHE_FILES.metadata)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      const { schema_version: omittedSchemaVersion, ...metadataWithoutSchemaVersion } = metadata
      void omittedSchemaVersion
      writeFileSync(metadataPath, `${JSON.stringify(metadataWithoutSchemaVersion, null, 2)}\n`, "utf8")

      // When: the cache is queried through the runtime cache boundary.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: missing versioned metadata fails closed instead of returning candidates.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects live cache metadata missing publish_id", async () => {
    // Given: a published live cache has provenance metadata without its publish id.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir })
      const metadataPath = resolve(cacheDir, ETL_CACHE_FILES.metadata)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      const { publish_id: omittedPublishId, ...metadataWithoutPublishId } = metadata
      void omittedPublishId
      writeFileSync(metadataPath, `${JSON.stringify(metadataWithoutPublishId, null, 2)}\n`, "utf8")

      // When: the cache is queried through the runtime cache boundary.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: missing publish integrity metadata fails closed instead of returning candidates.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects live cache metadata missing file_digests", async () => {
    // Given: a published live cache has provenance metadata without file digests.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir })
      const metadataPath = resolve(cacheDir, ETL_CACHE_FILES.metadata)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      const { file_digests: omittedFileDigests, ...metadataWithoutFileDigests } = metadata
      void omittedFileDigests
      writeFileSync(metadataPath, `${JSON.stringify(metadataWithoutFileDigests, null, 2)}\n`, "utf8")

      // When: the cache is queried through the runtime cache boundary.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: missing file integrity metadata fails closed instead of returning candidates.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects live cache metadata missing source_provenance", async () => {
    // Given: a published live cache has integrity metadata without source provenance.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir })
      const metadataPath = resolve(cacheDir, ETL_CACHE_FILES.metadata)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      const { source_provenance: omittedSourceProvenance, ...metadataWithoutSourceProvenance } = metadata
      void omittedSourceProvenance
      writeFileSync(metadataPath, `${JSON.stringify(metadataWithoutSourceProvenance, null, 2)}\n`, "utf8")

      // When: the cache is queried through the runtime cache boundary.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: missing source provenance metadata fails closed instead of returning candidates.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects live zero-record cache metadata with empty source_provenance", async () => {
    // Given: a published live cache has a nonempty source set but no semantic source provenance.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir, records: [] })
      const metadataPath = resolve(cacheDir, ETL_CACHE_FILES.metadata)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      writeFileSync(metadataPath, `${JSON.stringify({ ...metadata, source_provenance: [] }, null, 2)}\n`, "utf8")

      // When: the zero-record cache is queried through the runtime cache boundary.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: syntactic-but-empty provenance fails closed instead of returning an empty success.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects live cache metadata missing a source_set provenance entry", async () => {
    // Given: a published live cache declares two input sources but keeps provenance for only one.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir, records: [] })
      const metadataPath = resolve(cacheDir, ETL_CACHE_FILES.metadata)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      writeFileSync(
        metadataPath,
        `${JSON.stringify(
          {
            ...metadata,
            source_set: ["culture_portal", "kto_tourapi"],
            source_ids: ["culture-portal-oneview", "kto-tourapi-events"],
          },
          null,
          2,
        )}\n`,
        "utf8",
      )

      // When: the cache is queried through the runtime cache boundary.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: every source_set entry must have corresponding provenance.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects live zero-record cache metadata with swapped source provenance pairs", async () => {
    // Given: a published live zero-record cache covers declared sources and ids but swaps their canonical pairs.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir, records: [] })
      const metadataPath = resolve(cacheDir, ETL_CACHE_FILES.metadata)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      writeFileSync(
        metadataPath,
        `${JSON.stringify(
          {
            ...metadata,
            source_set: ["culture_portal", "kto_tourapi"],
            source_ids: ["culture-portal-oneview", "kto-tourapi-events"],
            source_provenance: [
              {
                source: "culture_portal",
                source_id: "kto-tourapi-events",
                generated_at: metadata.generated_at,
                ttl_hours: metadata.ttl_hours,
                mode: "live",
                ok: true,
                records: 0,
                raw_snapshots: 0,
                raw_snapshot_present: false,
              },
              {
                source: "kto_tourapi",
                source_id: "culture-portal-oneview",
                generated_at: metadata.generated_at,
                ttl_hours: metadata.ttl_hours,
                mode: "live",
                ok: true,
                records: 0,
                raw_snapshots: 0,
                raw_snapshot_present: false,
              },
            ],
          },
          null,
          2,
        )}\n`,
        "utf8",
      )

      // When: the zero-record cache is queried through the runtime cache boundary.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: provenance must preserve the registry's canonical source/source_id pairing.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("returns an empty live result for zero-record cache with source provenance", async () => {
    // Given: a published live cache has no records but records provenance for its source.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir, records: [] })

      // When: the zero-result cache is queried.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: legitimate zero-result provenance is preserved as a bounded empty live cache result.
      expect(result).toMatchObject({
        ok: true,
        mode: "live",
        records: [],
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("returns an empty live result for zero-record cache with source failure provenance", async () => {
    // Given: a published live cache has no records and records the source failure status.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir, records: [] })
      const metadataPath = resolve(cacheDir, ETL_CACHE_FILES.metadata)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      const provenance = metadata.source_provenance.map((source) => ({
        ...source,
        ok: false,
        failure_code: "no_match",
      }))
      writeFileSync(
        metadataPath,
        `${JSON.stringify(
          {
            ...metadata,
            counts: { ...metadata.counts, failures: provenance.length },
            source_provenance: provenance,
          },
          null,
          2,
        )}\n`,
        "utf8",
      )

      // When: the zero-result cache is queried.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: source failure provenance is contract-complete and still yields a bounded empty result.
      expect(result).toMatchObject({
        ok: true,
        mode: "live",
        records: [],
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects stale cache metadata before reading candidates", async () => {
    // Given: a published cache is older than its metadata TTL.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({
        cacheDir,
        generatedAt: "2000-01-01T00:00:00.000Z",
        ttlHours: 1,
      })

      // When: the cache is queried with a current clock.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: stale cache is a bounded configuration failure with no records.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "missing_configuration", retryable: false },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects a cache whose source set differs from runtime configuration", async () => {
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir })
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        sourceSet: ["kto_tourapi"],
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("reports live refresh guidance for stale cache without fixture rebuild instructions", async () => {
    // Given: public-beta live mode points at a cache older than its metadata TTL.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({
        cacheDir,
        generatedAt: "2000-01-01T00:00:00.000Z",
        ttlHours: 1,
      })

      // When: the cache reader rejects the stale cache in live operation.
      const result = await queryNationwideCache({
        allowFixture: false,
        cacheDir,
        request: busanCacheRequest,
        sourceSet: ["culture_portal"],
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: public guidance remains stable without exposing internal refresh commands.
      expect(result).toMatchObject({
        ok: false,
        failure: {
          code: "missing_configuration",
          message: expect.stringContaining("cache is refreshed"),
          retryable: false,
        },
      })
      if (result.ok) {
        throw new Error("expected stale cache failure")
      }
      expect(result.failure.message).not.toMatch(/--live|--write-cache|--source|--fixture/i)
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects fixture records under live cache metadata", async () => {
    // Given: a cache claims live mode but normalized records are fixture-mode.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir })
      const metadataPath = resolve(cacheDir, ETL_CACHE_FILES.metadata)
      const recordsPath = resolve(cacheDir, ETL_CACHE_FILES.normalized)
      const rawSnapshotsPath = resolve(cacheDir, ETL_CACHE_FILES.rawSnapshots)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      const record = cacheRecordSchema.parse(readJsonl(recordsPath)[0])
      const fixtureRecord = {
        ...record,
        mode: "fixture",
        source: { ...record.source, mode: "fixture" },
      }
      const recordsText = `${JSON.stringify(fixtureRecord)}\n`
      const rawSnapshotsText = readFileSync(rawSnapshotsPath, "utf8")

      writeFileSync(recordsPath, recordsText, "utf8")
      writeFileSync(
        metadataPath,
        `${JSON.stringify(
          {
            ...metadata,
            file_digests: {
              normalized_records_sha256: sha256Hex(recordsText),
              raw_snapshots_sha256: sha256Hex(rawSnapshotsText),
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      )

      // When: the cache is queried.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: fixture/live mismatch is rejected at the cache boundary.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects malformed normalized record JSONL", async () => {
    // Given: metadata exists but normalized-records.jsonl contains a partial line.
    const cacheDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir })
      writeFileSync(resolve(cacheDir, ETL_CACHE_FILES.normalized), "{\"id\":", "utf8")

      // When: the cache is queried.
      const result = await queryNationwideCache({
        cacheDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: the malformed record is rejected before candidate filtering.
      expect(result).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects partial publish state and mixed-generation metadata counts", async () => {
    // Given: one cache has an active publish marker and another has mismatched metadata counts.
    const publishDir = await tempCacheDir()
    const mismatchDir = await tempCacheDir()

    try {
      await writeQueryableCache({ cacheDir: publishDir })
      await writeQueryableCache({ cacheDir: mismatchDir })
      writeFileSync(resolve(publishDir, ETL_CACHE_FILES.publishMarker), "refreshing\n", "utf8")
      const metadataPath = resolve(mismatchDir, ETL_CACHE_FILES.metadata)
      const metadata = cacheMetadataSchema.parse(readJsonFile(metadataPath))
      writeFileSync(
        metadataPath,
        `${JSON.stringify(
          { ...metadata, counts: { ...metadata.counts, normalized_records: 99 } },
          null,
          2,
        )}\n`,
        "utf8",
      )

      // When: both caches are queried through the same reader surface.
      const publishResult = await queryNationwideCache({
        cacheDir: publishDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })
      const mismatchResult = await queryNationwideCache({
        cacheDir: mismatchDir,
        request: busanCacheRequest,
        now: new Date("2026-07-07T01:00:00.000Z"),
      })

      // Then: refresh-in-progress and mixed-generation cache state fail closed.
      expect(publishResult).toMatchObject({
        ok: false,
        failure: { code: "missing_configuration", retryable: true },
      })
      expect(mismatchResult).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
    } finally {
      await rm(publishDir, { recursive: true, force: true })
      await rm(mismatchDir, { recursive: true, force: true })
    }
  })

  it("fails closed for invalid source ids and malformed bounded args", () => {
    // Given: CLI input contains malformed operator-controlled values.
    const invalidSource = () => parseNationwideEtlArgs({ args: ["--fixture", "--source", "scraper"] })
    const invalidMaxPages = () => parseNationwideEtlArgs({ args: ["--fixture", "--max-pages", "0"] })
    const unsupportedMaxPages = () => parseNationwideEtlArgs({ args: ["--fixture", "--max-pages", "2"] })
    const unsupportedConfiguredMaxPages = () => parseNationwideEtlArgs({
      args: ["--fixture"],
      env: { FAMILY_EXPERIENCE_ETL_MAX_PAGES: "2" },
    })
    const invalidCacheDir = () => parseNationwideEtlArgs({ args: ["--fixture", "--cache-dir", ""] })

    // When/Then: every malformed value is rejected before any extraction or cache write.
    expect(invalidSource).toThrow(NationwideEtlInputError)
    expect(invalidMaxPages).toThrow(NationwideEtlInputError)
    expect(unsupportedMaxPages).toThrow("until source pagination is implemented")
    expect(unsupportedConfiguredMaxPages).toThrow("until source pagination is implemented")
    expect(invalidCacheDir).toThrow(NationwideEtlInputError)
  })

  it("redacts raw service keys from CLI output and proof files", async () => {
    // Given: the CLI environment contains synthetic service keys.
    const cacheDir = await tempCacheDir()
    const proofDir = await tempCacheDir()
    const serviceKey = "CLI_SYNTHETIC_SERVICE_KEY_12345"

    try {
      // When: the real script surface runs in fixture dry-run mode.
      const result = spawnSync(
        process.execPath,
        [
          "--import",
          "tsx",
          "scripts/etl-nationwide.ts",
          "--fixture",
          "--dry-run",
          "--cache-dir",
          cacheDir,
          "--source",
          "culture_portal",
        ],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          env: {
            ...process.env,
            CULTURE_PORTAL_SERVICE_KEY: serviceKey,
            FAMILY_EXPERIENCE_ETL_PROOF_DIR: proofDir,
          },
        },
      )

      const proofFiles = readdirSync(proofDir).filter((entry) => entry.endsWith(".json"))
      const proofText = proofFiles
        .map((entry) => readFileSync(resolve(proofDir, entry), "utf8"))
        .join("\n")

      // Then: the command succeeds and stdout/proof files contain only redacted keyed diagnostics.
      expect(result.status).toBe(0)
      expect(result.stdout).toContain("redaction_verified")
      expect(result.stdout).toContain("<redacted>")
      expect(result.stdout).not.toContain(serviceKey)
      expect(proofFiles).toContain("etl-proof-latest.json")
      expect(proofText).toContain("redaction_verified")
      expect(proofText).toContain("<redacted>")
      expect(proofText).not.toContain(serviceKey)
      expect(result.stderr).toBe("")
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
      await rm(proofDir, { recursive: true, force: true })
    }
  })

  it("keeps already-redacted encoded service keys from being treated as leaks", () => {
    const redactedUrl = "https://apis.example.test/events?serviceKey=%3Credacted%3E&page=1"

    expect(
      redactDiagnosticText(redactedUrl, { CULTURE_PORTAL_SERVICE_KEY: ["SYNTHETIC", "_SECRET_KEY"].join("") }),
    ).toBe(redactedUrl)
  })
})
