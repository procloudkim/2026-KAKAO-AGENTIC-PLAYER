import { describe, expect, it } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import { callFindFamilyExperiences } from "../src/mcp.js"
import type { OperationalLogEntry } from "../src/observability.js"
import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"
import type {
  FamilyExperienceSourceAdapter,
  FamilyExperienceSourceRecord,
} from "../src/sources/types.js"
import { officialRecord } from "./pipelineTestHelpers.js"

const liveConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: false,
  seoulOpenDataBaseUrl: "https://openapi.seoul.go.kr:8088",
}

function adapterWithRecords(
  records: readonly FamilyExperienceSourceRecord[],
): FamilyExperienceSourceAdapter {
  return {
    source_id: "culture-portal-oneview",
    mode: "live",
    list: () =>
      Promise.resolve({
        ok: true,
        source_id: "culture-portal-oneview",
        mode: "live",
        retrieved_at: "2026-07-11T00:00:00.000Z",
        raw_snapshots: [],
        records,
      }),
  }
}

describe("MCP provider and request boundaries", () => {
  it("preserves structured indoor or outdoor preference through ranking", async () => {
    // Given: two equal candidates differ only in whether they satisfy the requested venue type.
    const indoor = officialRecord({
      id: "culture-portal-oneview:indoor-first",
      title: "Indoor Museum",
      indoor_outdoor: "indoor",
    })
    const outdoor = officialRecord({
      id: "culture-portal-oneview:outdoor-second",
      title: "Outdoor Family Festival",
      indoor_outdoor: "outdoor",
    })

    // When: the public handler receives an explicit outdoor preference.
    const result = await callFindFamilyExperiences(
      {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
        indoor_outdoor_preference: "outdoor",
      },
      { config: liveConfig, sourceAdapter: adapterWithRecords([indoor, outdoor]) },
    )
    const structured = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)

    // Then: the matching outdoor candidate ranks first.
    expect(structured.ok).toBe(true)
    if (!structured.ok) {
      throw new Error(structured.failure.message)
    }
    expect(structured.candidates[0]?.id).toBe("culture-portal-oneview:outdoor-second")
  })

  it("preserves structured keywords through ranking", async () => {
    // Given: two equal candidates differ only in keyword evidence.
    const museum = officialRecord({
      id: "culture-portal-oneview:museum-first",
      title: "Indoor Museum",
      tags: ["museum"],
    })
    const festival = officialRecord({
      id: "culture-portal-oneview:festival-second",
      title: "Family Festival",
      tags: ["festival"],
    })

    // When: the public handler receives a festival keyword.
    const result = await callFindFamilyExperiences(
      {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
        keywords: ["festival"],
      },
      { config: liveConfig, sourceAdapter: adapterWithRecords([museum, festival]) },
    )
    const structured = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)

    // Then: the keyword-matching candidate ranks first.
    expect(structured.ok).toBe(true)
    if (!structured.ok) {
      throw new Error(structured.failure.message)
    }
    expect(structured.candidates[0]?.id).toBe("culture-portal-oneview:festival-second")
  })

  it("explains when fewer than three evidence-backed candidates exist", async () => {
    const result = await callFindFamilyExperiences(
      {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      { config: liveConfig, sourceAdapter: adapterWithRecords([officialRecord()]) },
    )

    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("후보가 1개뿐입니다"),
    })
  })

  it("PIN:4500_4000_BUDGET returns a bounded typed error for oversized provider fields", async () => {
    // Given: a provider record contains a field large enough to exceed the PlayMCP result ceiling.
    const oversized = officialRecord({ title: "x".repeat(15_000) })

    // When: the record crosses the real tool boundary.
    const result = await callFindFamilyExperiences(
      {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      { config: liveConfig, sourceAdapter: adapterWithRecords([oversized]) },
    )
    const structured = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)

    // Then: the tool fails closed without returning an oversized result.
    expect(result.isError).toBe(true)
    expect(structured).toMatchObject({
      ok: false,
      failure: { code: "upstream_invalid_response" },
    })
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(4_000)
  })

  it("rejects an aggregate result that exceeds the PlayMCP ceiling", async () => {
    // Given: three individually valid records combine into an oversized MCP result.
    const denseRecords = ["one", "two", "three"].map((suffix) =>
      officialRecord({
        id: `culture-portal-oneview:dense-${suffix}`,
        raw_snapshot_id: `culture-portal-oneview:raw:dense-${suffix}`,
        title: `Family program ${suffix} ${"x".repeat(470)}`,
        city: "Busan",
        venue: {
          name: `Family venue ${"x".repeat(480)}`,
          address: `Busan address ${"x".repeat(480)}`,
        },
        target_age_text: `Preschool ${"x".repeat(480)}`,
        program_text: `Program ${"x".repeat(2_000)}`,
        fee_text: `Confirm fees at source ${"x".repeat(470)}`,
        contact: `contact-${"x".repeat(480)}`,
        fixture_notice: `Source notice ${"x".repeat(2_000)}`,
      }),
    )

    // When: the records are rendered through the real tool boundary.
    const result = await callFindFamilyExperiences(
      {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      { config: liveConfig, sourceAdapter: adapterWithRecords(denseRecords) },
    )
    const structured = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)

    // Then: the entire result fails closed below the platform limit.
    expect(result.isError).toBe(true)
    expect(structured).toMatchObject({
      ok: false,
      failure: { code: "upstream_invalid_response" },
    })
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(4_000)
  })

  it("records the candidate count that remains after the 4000-character response bound", async () => {
    // Given: three valid candidates require the response boundary to return a smaller prefix.
    const records = ["one", "two", "three"].map((suffix) =>
      officialRecord({
        id: `culture-portal-oneview:bounded-${suffix}`,
        raw_snapshot_id: `culture-portal-oneview:raw:bounded-${suffix}`,
        title: `Bounded family program ${suffix}`,
      }),
    )
    const logs: OperationalLogEntry[] = []

    // When
    const result = await callFindFamilyExperiences(
      {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      {
        config: liveConfig,
        sourceAdapter: adapterWithRecords(records),
        logger: (entry) => logs.push(entry),
      },
    )
    const structured = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)
    const toolLog = logs
      .slice()
      .reverse()
      .find((entry: OperationalLogEntry) => entry.event === "tool_call")?.tool

    // Then: the log describes the actual public response, not the pre-bound render list.
    expect(structured.ok).toBe(true)
    if (!structured.ok) {
      throw new Error(structured.failure.message)
    }
    expect(structured.candidates.length).toBeLessThan(records.length)
    expect(toolLog?.candidate_count).toBe(structured.candidates.length)
  })

  it("reports structured schema rejection separately from response-size overflow", async () => {
    // Given: a provider field would create a prohibited unsupported public claim.
    const unsupportedClaim = officialRecord({
      parent_check: {
        age_fit: "available to book and safe for children",
        reservation: "confirmation_needed",
        live_status: "source_timestamp_required",
      },
    })

    // When
    const result = await callFindFamilyExperiences(
      {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      { config: liveConfig, sourceAdapter: adapterWithRecords([unsupportedClaim]) },
    )
    const structured = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)

    // Then: operators can distinguish schema rejection from the independent size budget.
    expect(result.isError).toBe(true)
    expect(structured).toMatchObject({
      ok: false,
      failure: {
        code: "upstream_invalid_response",
        message: expect.stringContaining("failed schema validation"),
      },
    })
    if (!structured.ok) {
      expect(structured.failure.message).not.toContain("response budget")
    }
  })

  it("rejects provider records with active-content URL schemes", async () => {
    // Given: a compromised provider supplies a javascript source URL.
    const unsafe = officialRecord({
      source: {
        id: "culture-portal-oneview",
        mode: "live",
        url: "javascript:alert(1)",
        raw_snapshot_id: "culture-portal-oneview:raw:unsafe-url",
      },
    })

    // When: the provider record crosses the real tool boundary.
    const result = await callFindFamilyExperiences(
      {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      { config: liveConfig, sourceAdapter: adapterWithRecords([unsafe]) },
    )
    const structured = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)

    // Then: the unsafe link is rejected before it reaches public output.
    expect(result.isError).toBe(true)
    expect(structured).toMatchObject({
      ok: false,
      failure: { code: "upstream_invalid_response" },
    })
    expect(JSON.stringify(result)).not.toContain("javascript:")
  })
})
