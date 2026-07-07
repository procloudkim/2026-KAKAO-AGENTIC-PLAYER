import { describe, expect, it } from "vitest"

import {
  loadPipeline,
  nationwidePromptInput,
  officialRecord,
  sourceReference,
} from "./pipelineTestHelpers.js"

describe("Todo 6 nationwide family experience pipeline", () => {
  it("merges duplicate official records and retains every source reference", async () => {
    // Given: two official sources describe the same title, date, venue, and location.
    const { normalizeFamilyExperienceRecords } = await loadPipeline()
    const cultureRecord = officialRecord()
    const ktoRecord = officialRecord({
      id: "kto-tourapi-events:busan-child-stage",
      raw_snapshot_id: "kto-tourapi-events:raw:busan-stage",
      title: "  Busan Child Stage Festival  ",
      source: sourceReference("kto-tourapi-events", "kto-tourapi-events:raw:busan-stage"),
      retrieved_at: "2026-07-02T00:00:00.000Z",
      tags: ["busan", "kto", "official"],
    })

    // When: records are normalized through the pipeline canonical model.
    const normalized = normalizeFamilyExperienceRecords({
      input: nationwidePromptInput,
      source_records: [cultureRecord, ktoRecord],
    })

    // Then: one candidate remains, and deterministic provenance retains both source refs.
    expect(normalized.ok).toBe(true)
    if (!normalized.ok) {
      throw new Error(normalized.failure.message)
    }
    expect(normalized.candidates).toHaveLength(1)
    expect(normalized.candidates[0]).toMatchObject({
      source_id: "kto-tourapi-events",
      source_references: [
        {
          id: "culture-portal-oneview",
          raw_snapshot_id: "culture-portal-oneview:raw:busan-stage",
        },
        {
          id: "kto-tourapi-events",
          raw_snapshot_id: "kto-tourapi-events:raw:busan-stage",
        },
      ],
    })
  })

  it("does not collapse same-title records when date or location differs", async () => {
    // Given: two records share a title but describe separate official events.
    const { normalizeFamilyExperienceRecords } = await loadPipeline()
    const firstRecord = officialRecord({
      id: "culture-portal-oneview:busan-child-stage-first",
    })
    const differentDateRecord = officialRecord({
      id: "culture-portal-oneview:busan-child-stage-next-day",
      raw_snapshot_id: "culture-portal-oneview:raw:busan-stage-next-day",
      date: {
        start: "2026-08-02",
        end: "2026-08-02",
        time_text: "10:00-12:00",
      },
      source: sourceReference(
        "culture-portal-oneview",
        "culture-portal-oneview:raw:busan-stage-next-day",
      ),
    })
    const differentVenueRecord = officialRecord({
      id: "culture-portal-oneview:busan-child-stage-library",
      raw_snapshot_id: "culture-portal-oneview:raw:busan-stage-library",
      venue: {
        name: "Busan Children's Library",
        address: "Busan Suyeong-gu Library-ro",
      },
      source: sourceReference(
        "culture-portal-oneview",
        "culture-portal-oneview:raw:busan-stage-library",
      ),
    })

    // When: the normalizer sees title collisions with different date/location keys.
    const normalized = normalizeFamilyExperienceRecords({
      input: nationwidePromptInput,
      source_records: [firstRecord, differentDateRecord, differentVenueRecord],
    })

    // Then: every distinct event is preserved.
    expect(normalized.ok).toBe(true)
    if (!normalized.ok) {
      throw new Error(normalized.failure.message)
    }
    expect(normalized.candidates.map((candidate) => candidate.id).sort()).toEqual([
      "culture-portal-oneview:busan-child-stage-first",
      "culture-portal-oneview:busan-child-stage-library",
      "culture-portal-oneview:busan-child-stage-next-day",
    ])
  })

  it("demotes stale national fallback when a fresher exact official source matches", async () => {
    // Given: a broad stale national festival fallback and a fresher exact-location record both match.
    const { renderFamilyExperienceResponse } = await loadPipeline()
    const staleFallback = officialRecord({
      id: "national-culture-festival-standard:busan-child-stage",
      raw_snapshot_id: "national-culture-festival-standard:raw:busan-stage",
      source: sourceReference(
        "national-culture-festival-standard",
        "national-culture-festival-standard:raw:busan-stage",
      ),
      venue: {
        name: "Busan Citywide Festival Area",
        address: "Busan",
      },
      retrieved_at: "2025-01-01T00:00:00.000Z",
      confidence: {
        date: "stale",
        venue: "stale",
        age_fit: "source-stated",
        reservation: "unknown",
      },
      tags: ["busan", "fallback", "stale"],
    })
    const exactOfficial = officialRecord({
      id: "culture-portal-oneview:busan-child-stage",
      retrieved_at: "2026-07-02T00:00:00.000Z",
    })

    // When: the renderer ranks eligible candidates.
    const response = renderFamilyExperienceResponse({
      input: nationwidePromptInput,
      mode: "live",
      source_records: [staleFallback, exactOfficial],
    })

    // Then: the fresher exact official record outranks the stale broad fallback.
    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.failure.message)
    }
    expect(response.candidates.map((candidate) => candidate.id)).toEqual([
      "culture-portal-oneview:busan-child-stage",
      "national-culture-festival-standard:busan-child-stage",
    ])
  })

  it("promotes an exact child-stage match above a broader age-fit record", async () => {
    // Given: one record is exact to preschool, while another is a broader all-children fallback.
    const { renderFamilyExperienceResponse } = await loadPipeline()
    const broadRecord = officialRecord({
      id: "culture-portal-oneview:broad-family-stage",
      title: "Busan Broad Family Stage Festival",
      child_stages: ["toddler", "preschool", "school_age"],
      min_child_age: 1,
      max_child_age: 12,
      target_age_text: "Children and families",
      parent_check: {
        age_fit: "Official source states children and families.",
        reservation: "confirmation_needed",
        live_status: "source_timestamp_required",
      },
    })
    const exactRecord = officialRecord({
      id: "culture-portal-oneview:exact-preschool-stage",
      title: "Busan Exact Preschool Stage Festival",
      confidence: {
        date: "source-stated",
        venue: "source-stated",
        age_fit: "inferred",
        reservation: "unknown",
      },
      parent_check: {
        age_fit: "Program text says preschool workshop.",
        reservation: "confirmation_needed",
        live_status: "source_timestamp_required",
      },
      target_age_text: "",
      program_text: "Preschool workshop with guardian participation.",
    })

    // When: the child-stage selector is preschool.
    const response = renderFamilyExperienceResponse({
      input: nationwidePromptInput,
      mode: "live",
      source_records: [broadRecord, exactRecord],
    })

    // Then: exact child-stage targeting wins before broad source-stated age text.
    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.failure.message)
    }
    expect(response.candidates[0]?.id).toBe("culture-portal-oneview:exact-preschool-stage")
  })

  it("keeps no-result explicit when nationwide canonical records do not match", async () => {
    // Given: a valid official record outside the requested date and location.
    const { renderFamilyExperienceResponse } = await loadPipeline()

    // When: the renderer has no eligible canonical candidate.
    const response = renderFamilyExperienceResponse({
      input: {
        ...nationwidePromptInput,
        location: "Jeju",
        date_range: {
          start: "2026-09-01",
          end: "2026-09-01",
        },
      },
      mode: "live",
      source_records: [officialRecord()],
    })

    // Then: the failure is explicit and contains no fabricated fallback candidate list.
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
})
