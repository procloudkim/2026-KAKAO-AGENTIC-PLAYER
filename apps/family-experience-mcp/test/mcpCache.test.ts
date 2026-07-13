import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import { buildMetadata, writeCache } from "../src/etl/cache.js"
import { callFindFamilyExperiences } from "../src/mcp.js"
import {
  FindFamilyExperiencesInputSchema,
  FindFamilyExperiencesStructuredContentSchema,
} from "../src/schemas.js"
import type { FamilyExperienceSourceRecord, SourceId } from "../src/sources/types.js"

// allow: SIZE_OK - cache-routing contract matrix keeps cache hit, stale, missing, no-match, and unsafe-public-copy regressions together.
const noFixtureConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: false,
  seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
}

const busanCacheInput = FindFamilyExperiencesInputSchema.parse({
  location: "Busan",
  date_range: { start: "2026-07-04", end: "2026-07-05" },
  child_age: 4,
})

type CacheRecordOverrides = {
  readonly id?: string
  readonly raw_snapshot_id?: string
  readonly title?: string
  readonly city?: string
  readonly date?: FamilyExperienceSourceRecord["date"]
  readonly venue?: FamilyExperienceSourceRecord["venue"]
  readonly sourceId?: SourceId
  readonly parent_check?: FamilyExperienceSourceRecord["parent_check"]
  readonly child_stages?: FamilyExperienceSourceRecord["child_stages"]
  readonly min_child_age?: number
  readonly max_child_age?: number
  readonly indoor_outdoor?: FamilyExperienceSourceRecord["indoor_outdoor"]
  readonly program_text?: string
  readonly reservation_url?: string | null
  readonly fee_text?: string
  readonly tags?: FamilyExperienceSourceRecord["tags"]
}

async function tempCacheDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "family-experience-mcp-cache-"))
}

function syntheticCacheRecord(overrides: CacheRecordOverrides = {}): FamilyExperienceSourceRecord {
  const sourceId = overrides.sourceId ?? "culture-portal-oneview"
  const rawSnapshotId = overrides.raw_snapshot_id ?? `${sourceId}:raw:task-7-busan`

  return {
    id: overrides.id ?? `${sourceId}:task-7-busan-indoor`,
    raw_snapshot_id: rawSnapshotId,
    mode: "live",
    title: overrides.title ?? "Busan Indoor Family Studio",
    city: overrides.city ?? "Busan",
    date: overrides.date ?? { start: "2026-07-04", end: "2026-07-05", time_text: "10:00-12:00" },
    venue: overrides.venue ?? {
      name: "Busan Culture Center",
      address: "Busan Haeundae-gu indoor hall",
    },
    source: {
      id: sourceId,
      mode: "live",
      url: `https://example.test/${sourceId}/task-7`,
      raw_snapshot_id: rawSnapshotId,
    },
    retrieved_at: "2026-07-04T00:00:00.000Z",
    confidence: { date: "source-stated", venue: "source-stated", age_fit: "source-stated", reservation: "unknown" },
    parent_check: overrides.parent_check ?? {
      age_fit: "Synthetic cache text marks preschool family participation.",
      reservation: "confirmation_needed",
      live_status: "source_timestamp_required",
    },
    child_stages: overrides.child_stages ?? ["preschool"],
    min_child_age: overrides.min_child_age ?? 3,
    max_child_age: overrides.max_child_age ?? 6,
    indoor_outdoor: overrides.indoor_outdoor ?? "indoor",
    target_age_text: "ages 3-6 family program",
    program_text: overrides.program_text ?? "Cached family culture activity for preschool children.",
    reservation_url: overrides.reservation_url ?? null,
    contact: null,
    fee_text:
      overrides.fee_text ?? "Synthetic fixture fee text; confirm with the official source before visiting",
    tags: overrides.tags ?? ["busan", "indoor", "preschool", "cache"],
    suitability: "happy_prompt_match",
    fixture_notice: "Synthetic cache record for tests; not live/current.",
  }
}

async function writeTestCache(input: {
  readonly cacheDir: string
  readonly generatedAt: string
  readonly fixture?: boolean
  readonly ttlHours?: number
  readonly records?: readonly FamilyExperienceSourceRecord[]
}): Promise<void> {
  const records = input.records ?? [syntheticCacheRecord()]
  const metadata = buildMetadata({
    generatedAt: input.generatedAt,
    fixture: input.fixture ?? false,
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

describe("Todo 7 MCP nationwide cache routing", () => {
  it("rejects a fixture cache when production fixture mode is disabled", async () => {
    // Given: fixture mode is disabled and a generated nationwide cache has a Busan preschool result.
    const cacheDir = await tempCacheDir()
    await writeTestCache({
      cacheDir,
      fixture: true,
      generatedAt: new Date().toISOString(),
    })
    const sourceAdapter = {
      source_id: "fixture-family-experience-v1",
      mode: "fixture",
      list: () => {
        throw new Error("source adapter must not be called when cache matches")
      },
    } as const

    try {
      // When: the public tool is called with the existing structured input shape.
      const result = await callFindFamilyExperiences(busanCacheInput, {
        config: { ...noFixtureConfig, etlCacheDir: cacheDir },
        sourceAdapter,
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: the explicit production fixture policy fails closed.
      expect(result.isError).toBe(true)
      expect(structuredContent.ok).toBe(false)
      if (structuredContent.ok) {
        throw new Error("Expected fixture policy rejection")
      }
      expect(result.content[0]).toMatchObject({
        type: "text",
        text: expect.stringContaining("fixture"),
      })
      expect(structuredContent.failure).toMatchObject({
        code: "missing_configuration",
        retryable: false,
      })
      expect(structuredContent.mode).toBe("live")
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("keeps reservation links as source-confirmation actions when cache includes reservation-like fields", async () => {
    // Given: a cache record has a reservation URL but no verified booking availability.
    const cacheDir = await tempCacheDir()
    await writeTestCache({
      cacheDir,
      generatedAt: new Date().toISOString(),
      records: [
        syntheticCacheRecord({
          reservation_url: "https://example.test/culture-portal-oneview/reservation",
        }),
      ],
    })

    try {
      // When: the public tool renders the cached source record.
      const result = await callFindFamilyExperiences(busanCacheInput, {
        config: { ...noFixtureConfig, etlCacheDir: cacheDir },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: the URL is exposed only as a source-confirmation step, not booking availability.
      expect(result.isError).toBeUndefined()
      expect(structuredContent.ok).toBe(true)
      if (!structuredContent.ok) {
        throw new Error(structuredContent.failure.message)
      }
      expect(structuredContent.candidates[0]).toMatchObject({
        parent_check: expect.stringMatching(/확인|confirm/i),
        next_action: expect.stringMatching(/확인|confirm/i),
        reservation_url: "https://example.test/culture-portal-oneview/reservation",
      })
      expect(JSON.stringify(result)).toContain("/reservation")
      expect(JSON.stringify({ result, structuredContent })).not.toMatch(
        /예약 가능|예약가능|available to book|book now|currently open|운영 중/i,
      )
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects unsupported availability or safety claims in structured descriptions", async () => {
    // Given: cached source text contains unsupported booking and child-safety claims.
    const cacheDir = await tempCacheDir()
    await writeTestCache({
      cacheDir,
      generatedAt: new Date().toISOString(),
      records: [
        syntheticCacheRecord({
          program_text: "available to book and safe for children",
        }),
      ],
    })

    try {
      // When: the MCP boundary renders only its allowlisted public fields.
      const result = await callFindFamilyExperiences(busanCacheInput, {
        config: { ...noFixtureConfig, etlCacheDir: cacheDir },
      })

      // Then: a claim held only in an omitted provider field is never emitted publicly.
      expect(JSON.stringify(result)).not.toMatch(/available to book|safe for children/i)
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects unsupported availability or safety claims in age-fit reasons", async () => {
    // Given: source-stated age-fit text contains unsupported booking and child-safety claims.
    const cacheDir = await tempCacheDir()
    await writeTestCache({
      cacheDir,
      generatedAt: new Date().toISOString(),
      records: [
        syntheticCacheRecord({
          parent_check: {
            age_fit: "available to book and safe for children",
            reservation: "confirmation_needed",
            live_status: "source_timestamp_required",
          },
        }),
      ],
    })

    try {
      // When: the unsupported claim reaches a public age-fit field.
      const result = await callFindFamilyExperiences(busanCacheInput, {
        config: { ...noFixtureConfig, etlCacheDir: cacheDir },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: the MCP boundary returns a typed failure without emitting the claim.
      expect(result.isError).toBe(true)
      expect(structuredContent).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response" },
      })
      expect(JSON.stringify(result)).not.toMatch(/available to book|safe for children/i)
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("PIN:NO_INTERNAL_DISCLOSURE fails safely when cache is missing", async () => {
    // Given: fixture mode is disabled and the configured cache directory does not exist.
    const cacheDir = join(tmpdir(), "family-experience-missing-cache-task-7")

    // When: the public tool is called for a nationwide request.
    const result = await callFindFamilyExperiences(busanCacheInput, {
      config: { ...noFixtureConfig, etlCacheDir: cacheDir },
    })
    const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
      result.structuredContent,
    )

    // Then: the response is an actionable cache/configuration failure with no synthetic candidates.
    expect(result.isError).toBe(true)
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("cache"),
    })
    expect(structuredContent).toMatchObject({
      ok: false,
      mode: "live",
      failure: {
        code: "missing_configuration",
        retryable: false,
      },
    })
    expect("candidates" in structuredContent).toBe(false)
    expect(JSON.stringify(result)).not.toContain(cacheDir)
    expect(JSON.stringify(result)).not.toMatch(/[A-Za-z]:[\\/]|--write-cache|refresh command/i)
  })

  it("fails actionably when the configured nationwide cache is stale", async () => {
    // Given: the cache exists but its generated_at timestamp is outside the metadata TTL.
    const cacheDir = await tempCacheDir()
    await writeTestCache({
      cacheDir,
      generatedAt: "2020-01-01T00:00:00.000Z",
      ttlHours: 1,
    })

    try {
      // When: the public tool is called against stale cache state.
      const result = await callFindFamilyExperiences(busanCacheInput, {
        config: { ...noFixtureConfig, etlCacheDir: cacheDir },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: stale cache is not reported as success and does not trigger fixture fallback.
      expect(result.isError).toBe(true)
      expect(result.content[0]).toMatchObject({
        type: "text",
        text: expect.stringContaining("stale"),
      })
      expect(structuredContent).toMatchObject({
        ok: false,
        mode: "live",
        failure: {
          code: "missing_configuration",
          message: expect.stringContaining("stale"),
          retryable: false,
        },
      })
      expect(JSON.stringify(result)).not.toContain(cacheDir)
      expect(JSON.stringify(result)).not.toMatch(/[A-Za-z]:[\\/]|--write-cache|refresh command/i)
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("serves a bounded last-known-good cache with an explicit stale notice", async () => {
    const cacheDir = await tempCacheDir()
    const generatedAt = new Date(Date.now() - 90 * 60 * 1_000).toISOString()
    await writeTestCache({ cacheDir, generatedAt, ttlHours: 1 })

    try {
      const result = await callFindFamilyExperiences(busanCacheInput, {
        config: {
          ...noFixtureConfig,
          etlCacheDir: cacheDir,
          etlStaleGraceHours: 2,
          etlTtlHours: 1,
        },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      expect(result.isError).toBeUndefined()
      expect(structuredContent.ok).toBe(true)
      if (!structuredContent.ok) throw new Error(structuredContent.failure.message)
      expect(structuredContent.result_summary.data_notice).toContain("LKG")
      expect(structuredContent.result_summary.data_notice).toContain(generatedAt)
      expect(result.content[0]).toMatchObject({
        type: "text",
        text: expect.stringMatching(/LKG|최신성 TTL/u),
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects cache metadata generated beyond the allowed clock skew", async () => {
    // Given: cache metadata claims a generation time more than five minutes in the future.
    const cacheDir = await tempCacheDir()
    await writeTestCache({
      cacheDir,
      generatedAt: new Date(Date.now() + 6 * 60 * 1_000).toISOString(),
    })

    try {
      // When: the public tool reads the self-future-dated cache.
      const result = await callFindFamilyExperiences(busanCacheInput, {
        config: { ...noFixtureConfig, etlCacheDir: cacheDir },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: future dating cannot manufacture freshness.
      expect(result.isError).toBe(true)
      expect(structuredContent).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response", retryable: false },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("rejects cache TTL metadata that differs from the configured ETL contract", async () => {
    // Given: runtime requires a 24-hour ETL bundle but metadata self-declares 48 hours.
    const cacheDir = await tempCacheDir()
    await writeTestCache({
      cacheDir,
      generatedAt: new Date().toISOString(),
      ttlHours: 48,
    })

    try {
      const result = await callFindFamilyExperiences(busanCacheInput, {
        config: { ...noFixtureConfig, etlCacheDir: cacheDir, etlTtlHours: 24 },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      expect(result.isError).toBe(true)
      expect(structuredContent).toMatchObject({
        ok: false,
        failure: { code: "upstream_invalid_response", retryable: false },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })

  it("does not fall back to the Seoul live adapter for a KTO-only runtime", async () => {
    // Given: KTO-only production has a Seoul key but its configured cache is unavailable.
    const cacheDir = join(tmpdir(), `family-experience-missing-kto-cache-${Date.now()}`)

    // When: a Seoul request reaches the cache-first runtime path.
    const result = await callFindFamilyExperiences(
      FindFamilyExperiencesInputSchema.parse({
        location: "Seoul",
        date_range: { start: "2026-07-04", end: "2026-07-05" },
        child_age: 4,
      }),
      {
        config: {
          ...noFixtureConfig,
          etlCacheDir: cacheDir,
          seoulOpenDataKey: "SYNTHETIC_TEST_KEY",
          sourceSet: ["kto_tourapi"],
        },
      },
    )
    const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
      result.structuredContent,
    )

    // Then: the configured source set is authoritative and cache failure is returned unchanged.
    expect(result.isError).toBe(true)
    expect(structuredContent).toMatchObject({
      ok: false,
      failure: { code: "missing_configuration", retryable: false },
    })
    expect(JSON.stringify(result)).not.toContain("Seoul Open Data")
  })

  it("preserves an explicitly injected adapter as a test-only cache fallback", async () => {
    // Given: a deterministic adapter is explicitly injected while the configured cache is missing.
    const cacheDir = join(tmpdir(), `family-experience-missing-explicit-cache-${Date.now()}`)
    let adapterCalls = 0
    const sourceAdapter = {
      source_id: "culture-portal-oneview",
      mode: "live",
      list: async () => {
        adapterCalls += 1
        return {
          ok: true,
          source_id: "culture-portal-oneview",
          mode: "live",
          retrieved_at: "2026-07-04T00:00:00.000Z",
          raw_snapshots: [],
          records: [syntheticCacheRecord()],
        } as const
      },
    } as const

    // When: the tool executes through the explicit test seam.
    const result = await callFindFamilyExperiences(busanCacheInput, {
      config: { ...noFixtureConfig, etlCacheDir: cacheDir, sourceSet: ["kto_tourapi"] },
      sourceAdapter,
    })
    const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
      result.structuredContent,
    )

    // Then: source-set enforcement does not remove the explicit injection contract.
    expect(adapterCalls).toBe(1)
    expect(result.isError).toBeUndefined()
    expect(structuredContent).toMatchObject({ ok: true, mode: "live" })
  })

  it("returns no-results guidance when cache has no matches and no live source is configured", async () => {
    // Given: the cache is valid but has no records for the request, and no live key is configured.
    const cacheDir = await tempCacheDir()
    await writeTestCache({ cacheDir, generatedAt: new Date().toISOString(), records: [] })

    try {
      // When: the public tool is called through the cache-first route.
      const result = await callFindFamilyExperiences(busanCacheInput, {
        config: { ...noFixtureConfig, etlCacheDir: cacheDir },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: it reports no matching cache records, not a missing deployment configuration.
      expect(result.isError).toBe(true)
      expect(result.content[0]).toMatchObject({
        type: "text",
        text: expect.stringContaining("조건에 맞는 근거 있는 후보"),
      })
      expect(structuredContent).toMatchObject({
        ok: false,
        mode: "live",
        failure: {
          code: "no_results",
          retryable: false,
        },
      })
    } finally {
      await rm(cacheDir, { recursive: true, force: true })
    }
  })
})
