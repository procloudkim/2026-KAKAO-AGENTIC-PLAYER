import { describe, expect, it } from "vitest"
import * as z from "zod/v4"

import {
  DateRangeSchema,
  FamilyExperienceCandidateSchema,
  FindFamilyExperiencesHandlerInputSchema,
  FindFamilyExperiencesInputSchema,
  FindFamilyExperiencesMcpInputSchema,
  canonicalFamilyExperienceKeyword,
} from "../src/schemas.js"

const validDateRange = {
  start: "2026-07-04",
  end: "2026-07-05",
}

describe("FindFamilyExperiencesInputSchema", () => {
  it("documents and accepts unsupported keyword text without treating it as canonical evidence", () => {
    const parsed = FindFamilyExperiencesInputSchema.safeParse({
      location: "Seoul",
      date_range: validDateRange,
      child_age: 4,
      keywords: ["  공룡 탐험  "],
    })
    const keywordJsonSchema = z.toJSONSchema(FindFamilyExperiencesMcpInputSchema)
      .properties?.["keywords"]

    expect(parsed).toMatchObject({
      success: true,
      data: { keywords: ["공룡 탐험"] },
    })
    expect(canonicalFamilyExperienceKeyword("공룡 탐험")).toBeUndefined()
    expect(keywordJsonSchema).toMatchObject({
      description: expect.stringContaining("ignored for eligibility"),
    })
  })

  it.each([
    ["축제", "festival"],
    [" 무료 ", "free"],
    ["RAINY DAY", "rainy_day"],
    ["체험", undefined],
  ])("normalizes only evidence-backed keyword aliases: %s", (keyword, expected) => {
    expect(canonicalFamilyExperienceKeyword(keyword)).toBe(expected)
  })

  it.each([
    { date_range: validDateRange, child_age: 4 },
    { location: "Seoul", child_age: 4 },
    { location: "Seoul", date_range: validDateRange },
    {},
  ])("PIN:PARTIAL_STRUCTURED_SURFACE accepts incomplete structured input for typed handler errors", (input) => {
    expect(FindFamilyExperiencesMcpInputSchema.safeParse(input).success).toBe(true)
  })
  it("PIN:NO_MIXED_INPUT_CONFUSION rejects prompt plus structured constraints", () => {
    const parsed = FindFamilyExperiencesHandlerInputSchema.safeParse({
      prompt: "서울 오늘 4살 체험",
      location: "Busan",
      date_range: validDateRange,
      child_age: 4,
    })
    expect(parsed.success).toBe(false)
  })

  it("PIN:VALID_CALENDAR_DATE rejects impossible dates", () => {
    const parsed = DateRangeSchema.safeParse({ start: "2026-02-30", end: "2026-02-30" })
    expect(parsed.success).toBe(false)
  })
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

  it("rejects actionable URLs outside HTTP and HTTPS", () => {
    // Given: a provider supplies syntactically valid active-content URL schemes.
    const candidates = [
      { ...baseCandidate, source: "culture_portal", source_url: "javascript:alert(1)" },
      {
        ...baseCandidate,
        source: "culture_portal",
        reservation_url: "data:text/html,unsafe",
      },
    ]

    // When / Then: both URLs are rejected at the public output boundary.
    for (const candidate of candidates) {
      expect(FamilyExperienceCandidateSchema.safeParse(candidate).success).toBe(false)
    }
  })
})
