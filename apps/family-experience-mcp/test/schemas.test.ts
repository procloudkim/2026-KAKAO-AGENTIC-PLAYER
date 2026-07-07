import { describe, expect, it } from "vitest"

import { FamilyExperienceCandidateSchema, FindFamilyExperiencesInputSchema } from "../src/schemas.js"

const validDateRange = {
  start: "2026-07-04",
  end: "2026-07-05",
}

describe("FindFamilyExperiencesInputSchema", () => {
  it("requires child_age or child_stage when both are missing", () => {
    // Given: the required location and date range are present.
    const input = {
      location: "Seoul",
      date_range: validDateRange,
    }

    // When: the input is parsed without child age or stage.
    const result = FindFamilyExperiencesInputSchema.safeParse(input)

    // Then: the boundary parse rejects the malformed request.
    expect(result.success).toBe(false)
    expect(result).toMatchObject({
      error: {
        issues: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("child_age or child_stage"),
          }),
        ]),
      },
    })
  })

  it("rejects input when child_age and child_stage are both present", () => {
    // Given: the request contains both child age selectors.
    const input = {
      location: "Seoul",
      date_range: validDateRange,
      child_age: 7,
      child_stage: "school_age",
    }

    // When: the input is parsed.
    const result = FindFamilyExperiencesInputSchema.safeParse(input)

    // Then: the XOR-style age selector contract is enforced.
    expect(result.success).toBe(false)
    expect(result).toMatchObject({
      error: {
        issues: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("exactly one"),
          }),
        ]),
      },
    })
  })

  it("passes validation when child_age is present", () => {
    // Given: the request specifies a child age.
    const input = {
      location: "Jongno-gu, Seoul",
      date_range: validDateRange,
      child_age: 6,
    }

    // When: the input is parsed.
    const result = FindFamilyExperiencesInputSchema.safeParse(input)

    // Then: the parsed value preserves the child age.
    expect(result).toMatchObject({
      success: true,
      data: {
        child_age: 6,
      },
    })
  })

  it("passes validation when child_stage is present", () => {
    // Given: the request specifies a child development stage.
    const input = {
      location: "Mapo-gu, Seoul",
      date_range: validDateRange,
      child_stage: "preschool",
    }

    // When: the input is parsed.
    const result = FindFamilyExperiencesInputSchema.safeParse(input)

    // Then: the parsed value preserves the child stage.
    expect(result).toMatchObject({
      success: true,
      data: {
        child_stage: "preschool",
      },
    })
  })

  it("rejects empty location and invalid date_range values", () => {
    // Given: the request has malformed required fields.
    const input = {
      location: "",
      date_range: {
        start: "2026-07-05",
        end: "2026-07-04",
      },
      child_age: 5,
    }

    // When: the input is parsed.
    const result = FindFamilyExperiencesInputSchema.safeParse(input)

    // Then: field-level validation reports both malformed fields.
    expect(result.success).toBe(false)
    expect(result).toMatchObject({
      error: {
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: ["location"],
          }),
          expect.objectContaining({
            path: ["date_range", "end"],
          }),
        ]),
      },
    })
  })
})

describe("FamilyExperienceCandidateSchema", () => {
  const baseCandidate = {
    id: "candidate-1",
    title: "Family festival",
    location: "Busan",
    starts_at: "2026-07-04",
    ends_at: "2026-07-05",
    tags: ["festival"],
    date_time: "2026-07-04 10:00",
    venue: "Busan Civic Center",
    address: "Busan",
    age_fit_label: "source-stated",
    age_fit_reason: "Source states family program.",
    indoor_outdoor: "mixed",
    fee_text: "Free",
    source_name: "Official source",
    source_url: "https://source.example.test/event",
    retrieved_at: "2026-07-04T00:00:00.000Z",
    confidence: "source-stated",
    mode: "live",
    warnings: "Confirm schedule before visiting.",
    source_summary: "Official event listing.",
    parent_check: "Confirm booking.",
    next_action: "Open official page.",
  }

  it("accepts official city, national API, and national standard dataset candidate sources", () => {
    // Given: candidate output can come from each official nationwide source tier.
    const sources = [
      "seoul_open_data",
      "culture_portal",
      "kto_tourapi",
      "national_culture_festival",
    ]

    // When / Then: each approved source value is accepted at the schema boundary.
    for (const source of sources) {
      expect(FamilyExperienceCandidateSchema.safeParse({ ...baseCandidate, source })).toMatchObject({
        success: true,
      })
    }
  })

  it("rejects unapproved candidate sources", () => {
    // Given: a candidate claims to come from an unofficial source.
    const candidate = {
      ...baseCandidate,
      source: "unofficial_scraper",
    }

    // When: the candidate is parsed at the output boundary.
    const result = FamilyExperienceCandidateSchema.safeParse(candidate)

    // Then: the schema fails closed.
    expect(result.success).toBe(false)
  })
})
