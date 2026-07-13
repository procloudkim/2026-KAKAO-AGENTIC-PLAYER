import { describe, expect, it } from "vitest"

import { FamilyExperienceCandidateSchema } from "../src/schemas.js"
import {
  fixtureAt,
  fixtureFamilyExperienceRecords,
  happyPromptInput,
  loadPipeline,
  officialRecord,
} from "./pipelineTestHelpers.js"

describe("Todo 4 family experience pipeline", () => {
  it("keeps generic or unsupported keyword text from eliminating eligible candidates", async () => {
    const { renderFamilyExperienceResponse } = await loadPipeline()

    const response = renderFamilyExperienceResponse({
      input: { ...happyPromptInput, keywords: ["체험", "공룡 탐험"] },
      mode: "fixture",
      source_records: [fixtureAt(0)],
    })

    expect(response.ok).toBe(true)
    if (response.ok) {
      expect(response.candidates).toHaveLength(1)
    }
  })

  it("matches the Korean festival alias only from direct source evidence", async () => {
    const { renderFamilyExperienceResponse } = await loadPipeline()
    const festival = officialRecord({
      id: "kto-tourapi-events:family-festival",
      raw_snapshot_id: "kto-tourapi-events:raw:family-festival",
      title: "부산 가족 축제",
      tags: ["kto-tourapi"],
      source: {
        id: "kto-tourapi-events",
        mode: "live",
        url: "https://example.invalid/kto-tourapi-events/family-festival",
        raw_snapshot_id: "kto-tourapi-events:raw:family-festival",
      },
    })

    const response = renderFamilyExperienceResponse({
      input: {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
        keywords: ["축제"],
      },
      mode: "live",
      source_records: [festival],
    })

    expect(response.ok).toBe(true)
    if (response.ok) {
      expect(response.candidates[0]?.id).toBe("kto-tourapi-events:family-festival")
    }
  })

  it("keeps explicit indoor and free constraints as evidence-backed negative filters", async () => {
    const { renderFamilyExperienceResponse } = await loadPipeline()
    const freeIndoor = officialRecord({
      id: "culture-portal-oneview:free-indoor",
      fee_text: "무료",
      indoor_outdoor: "indoor",
    })
    const paidIndoor = officialRecord({
      id: "culture-portal-oneview:paid-indoor",
      fee_text: "10,000원",
      indoor_outdoor: "indoor",
    })
    const freeOutdoor = officialRecord({
      id: "culture-portal-oneview:free-outdoor",
      fee_text: "무료",
      indoor_outdoor: "outdoor",
    })

    const response = renderFamilyExperienceResponse({
      input: {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
        indoor_outdoor_preference: "indoor",
        keywords: ["무료"],
      },
      mode: "live",
      source_records: [paidIndoor, freeOutdoor, freeIndoor],
    })

    expect(response.ok).toBe(true)
    if (response.ok) {
      expect(response.candidates.map((candidate) => candidate.id)).toEqual([
        "culture-portal-oneview:free-indoor",
      ])
    }
  })

  it("PIN:HARD_CONSTRAINTS excludes unknown age and mismatched environment evidence", async () => {
    // Given: one record has unknown age evidence and another is explicitly outdoor.
    const unknownAge = {
      ...fixtureAt(0),
      confidence: { ...fixtureAt(0).confidence, age_fit: "unknown" },
      target_age_text: "not source-stated",
      program_text: "General family program.",
    }
    const outdoor = { ...fixtureAt(1), indoor_outdoor: "outdoor" as const }
    const { renderFamilyExperienceResponse } = await loadPipeline()

    // When: age and indoor constraints are explicit.
    const response = renderFamilyExperienceResponse({
      input: { ...happyPromptInput, indoor_outdoor_preference: "indoor" },
      mode: "fixture",
      source_records: [unknownAge, outdoor],
    })

    // Then: neither unknown nor contradictory evidence is eligible.
    expect(response).toMatchObject({ ok: false, failure: { code: "no_results" } })
  })
  it("returns exactly three ranked candidates when the happy prompt has three matches", async () => {
    // Given: the deterministic Todo 3 fixture has three Seoul indoor preschool matches.
    const { renderFamilyExperienceResponse } = await loadPipeline()

    // When: the renderer is driven through the pipeline surface.
    const response = renderFamilyExperienceResponse({
      input: happyPromptInput,
      mode: "fixture",
      source_records: fixtureFamilyExperienceRecords,
      indoor_outdoor_preference: "indoor",
    })

    // Then: only the top three candidates are returned in ranked order.
    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.failure.message)
    }
    expect(response.candidates).toHaveLength(3)
    expect(response.candidates.map((candidate) => candidate.id)).toEqual([
      "fixture-family-experience-v1:kids-makers-studio",
      "fixture-family-experience-v1:rainy-day-story-theater",
      "fixture-family-experience-v1:family-science-light-lab",
    ])
  })

  it("returns a clarification failure state when child age and stage are missing", async () => {
    // Given: the caller omitted the child suitability selector.
    const { renderFamilyExperienceResponse } = await loadPipeline()

    // When: the renderer parses the untrusted input boundary.
    const response = renderFamilyExperienceResponse({
      input: {
        location: "Seoul",
        date_range: happyPromptInput.date_range,
      },
      mode: "fixture",
      source_records: fixtureFamilyExperienceRecords,
    })

    // Then: the response asks for clarification instead of fabricating suitability.
    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("Expected invalid input failure")
    }
    expect(response.failure).toMatchObject({
      code: "invalid_input",
      retryable: false,
    })
    expect(response.failure.message).toContain("child_age or child_stage")
  })

  it("returns no-results without fabricating candidates when constraints exclude every source record", async () => {
    // Given: the request targets a different city than the available Seoul fixtures.
    const { renderFamilyExperienceResponse } = await loadPipeline()

    // When: the renderer evaluates the source records.
    const response = renderFamilyExperienceResponse({
      input: {
        ...happyPromptInput,
        location: "Busan",
      },
      mode: "fixture",
      source_records: fixtureFamilyExperienceRecords,
    })

    // Then: no synthetic fallback candidate appears in the failure response.
    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("Expected no-results failure")
    }
    expect(response.failure).toMatchObject({
      code: "no_results",
      retryable: false,
    })
    expect("candidates" in response).toBe(false)
  })

  it("shows inferred age labels and quotes the source text used for inference", async () => {
    // Given: a source record marks age fit as inferred from program text.
    const baseRecord = fixtureAt(0)
    const inferredRecord = {
      ...baseRecord,
      id: "fixture-family-experience-v1:inferred-preschool-workshop",
      confidence: {
        ...baseRecord.confidence,
        age_fit: "inferred",
      },
      target_age_text: "Family workshop for Ages 4-6 with a guardian.",
      program_text: "Family workshop for Ages 4-6 with a guardian.",
    }
    const { normalizeFamilyExperienceRecords } = await loadPipeline()

    // When: the normalizer labels the candidate.
    const normalized = normalizeFamilyExperienceRecords({
      input: happyPromptInput,
      source_records: [inferredRecord],
    })

    // Then: the label is visible and the reason contains quoted source evidence only.
    expect(normalized.ok).toBe(true)
    if (!normalized.ok) {
      throw new Error(normalized.failure.message)
    }
    expect(normalized.candidates).toHaveLength(1)
    expect(normalized.candidates[0]).toMatchObject({
      age_fit_label: "inferred",
      age_fit_reason: expect.stringContaining("Ages 4-6"),
    })
  })

  it("omits reservation and contact fields when the source does not provide them", async () => {
    // Given: every fixture has missing reservation and contact values.
    const { renderFamilyExperienceResponse } = await loadPipeline()

    // When: matching candidates are rendered.
    const response = renderFamilyExperienceResponse({
      input: happyPromptInput,
      mode: "fixture",
      source_records: fixtureFamilyExperienceRecords,
      indoor_outdoor_preference: "indoor",
    })

    // Then: missing fields stay absent and no availability claim is introduced.
    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.failure.message)
    }
    for (const candidate of response.candidates) {
      expect(candidate).not.toHaveProperty("reservation_url")
      expect(candidate).not.toHaveProperty("contact")
    }
    expect(JSON.stringify(response).toLowerCase()).not.toContain("reservation available")
    expect(JSON.stringify(response).toLowerCase()).not.toContain("contact available")
  })

  it("requires parent action fields and rejects unsupported reservation claim", async () => {
    // Given: the renderer returns parent-facing candidates.
    const { renderFamilyExperienceResponse } = await loadPipeline()

    // When: each candidate is validated against the public structured-output contract.
    const response = renderFamilyExperienceResponse({
      input: happyPromptInput,
      mode: "fixture",
      source_records: fixtureFamilyExperienceRecords,
      indoor_outdoor_preference: "indoor",
    })

    // Then: every result has action-card fields without claiming reservation availability.
    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.failure.message)
    }
    for (const candidate of response.candidates) {
      expect(FamilyExperienceCandidateSchema.safeParse(candidate).success).toBe(true)
      expect(candidate.date_time).toContain(candidate.starts_at)
      expect(candidate.venue).toBe(candidate.location)
      expect(candidate.address).not.toBe(candidate.location)
      expect(candidate.source_name).toBe("fixture/demo source")
      expect(candidate.retrieved_at).toBe("2026-01-15T00:00:00.000Z")
      expect(candidate.parent_check).toContain("fixture/cache 후보")
      expect(candidate.next_action).toContain(candidate.source_url)
    }
    expect(JSON.stringify(response)).not.toMatch(/예약 가능|예약가능|운영 중|실시간|아이에게 적합함/)
  })

  it("rejects computed and stale as child suitability age-fit labels", async () => {
    // Given: freshness and confidence labels are not suitability labels.
    const { AgeFitLabelSchema, normalizeFamilyExperienceRecords } = await loadPipeline()
    const baseRecord = fixtureAt(0)
    const staleAgeFitRecord = {
      ...baseRecord,
      confidence: {
        ...baseRecord.confidence,
        age_fit: "stale",
      },
    }

    // When: child suitability labels and malformed source records are parsed.
    const computedLabel = AgeFitLabelSchema.safeParse("computed")
    const staleLabel = AgeFitLabelSchema.safeParse("stale")
    const normalized = normalizeFamilyExperienceRecords({
      input: happyPromptInput,
      source_records: [staleAgeFitRecord],
    })

    // Then: computed and stale never pass as age-fit labels.
    expect(computedLabel.success).toBe(false)
    expect(staleLabel.success).toBe(false)
    expect(normalized.ok).toBe(false)
    if (normalized.ok) {
      throw new Error("Expected invalid source failure")
    }
    expect(normalized.failure.code).toBe("upstream_invalid_response")
  })
})
