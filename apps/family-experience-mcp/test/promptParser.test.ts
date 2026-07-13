import { afterEach, describe, expect, it, vi } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import { callFindFamilyExperiences } from "../src/findFamilyExperiencesTool.js"
import { parseLooseFamilyPromptDetails } from "../src/promptParser.js"
import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"
import type { FamilyExperienceSourceAdapter } from "../src/sources/types.js"

const noFixtureConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: false,
  seoulOpenDataBaseUrl: "https://openapi.seoul.go.kr:8088",
}

describe("loose family prompt constraints", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("PIN:NO_SILENT_DEFAULTS reports missing location and date", () => {
    const parsed = parseLooseFamilyPromptDetails("4살 아이와 갈 만한 무료 체험")
    expect(parsed).toEqual({ ok: false, reason: "missing_fields", missing_fields: ["location", "date_range"] })
  })

  it("reports every missing prompt field in the public contract order", () => {
    const parsed = parseLooseFamilyPromptDetails("갈 만한 무료 체험")

    expect(parsed).toEqual({
      ok: false,
      reason: "missing_fields",
      missing_fields: ["location", "date_range", "child_selector"],
    })
  })

  it.each([
    "내일 비가 오는데 24개월 아이와 갈 수 있는 키즈 체험이나 박물관을 찾아줘.",
    "초등학교 저학년 아이와 주말에 갈 수 있는 가족 행사 3개를 출처와 함께 정리해줘.",
  ])("keeps Core User Prompt negative paths at exactly [location]", (prompt) => {
    expect(parseLooseFamilyPromptDetails(prompt)).toEqual({
      ok: false,
      reason: "missing_fields",
      missing_fields: ["location"],
    })
  })

  it("PIN:FULL_MONTH_AGE parses all digits in a month age", () => {
    const parsed = parseLooseFamilyPromptDetails("서울 7월 4일 124개월 아이 체험")
    expect(parsed.ok && parsed.input.child_age).toBe(10)
  })

  it("accepts the maximum supported month age", () => {
    const parsed = parseLooseFamilyPromptDetails("서울 2026년 8월 1일 215개월 아이 체험")

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.input.child_age).toBe(17)
      expect(parsed.input.child_stage).toBeUndefined()
    }
  })

  it.each([216, 217])(
    "returns typed invalid_input without source access for %i months",
    async (months) => {
      let sourceCalls = 0
      const sourceAdapter: FamilyExperienceSourceAdapter = {
        source_id: "seoul-culture-events",
        mode: "live",
        list: async () => {
          sourceCalls += 1
          return {
            ok: false,
            source_id: "seoul-culture-events",
            mode: "live",
            failure: { code: "no_match", message: "not reached", retryable: false },
          }
        },
      }

      const result = await callFindFamilyExperiences(
        { prompt: `서울 2026년 8월 1일 ${months}개월 아이 체험` },
        { config: noFixtureConfig, sourceAdapter },
      )
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)

      expect(sourceCalls).toBe(0)
      expect(structuredContent).toMatchObject({
        ok: false,
        failure: { code: "invalid_input", retryable: false },
      })
      if (!structuredContent.ok) {
        expect(structuredContent.failure.missing_fields).toBeUndefined()
      }
    },
  )

  it("parses an explicit Korean calendar date without adding a date assumption", () => {
    const parsed = parseLooseFamilyPromptDetails("서울 2026년 8월 1일 4살 아이 체험")

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.input.date_range).toEqual({ start: "2026-08-01", end: "2026-08-01" })
      expect(parsed.input.keywords).toBeUndefined()
      expect(parsed.assumptions).toContain(
        "‘체험’은 일반 요청어로 해석해 키워드 일치 조건에서 제외했습니다.",
      )
      expect(parsed.assumptions).not.toContain("날짜가 없으면 가까운 주말 기준으로 시작합니다.")
    }
  })

  it.each([
    ["오전", "morning"],
    ["오후", "afternoon"],
    ["저녁", "evening"],
  ] as const)("preserves an explicit %s time-of-day constraint", (timeText, expected) => {
    const parsed = parseLooseFamilyPromptDetails(
      `서울 2026년 8월 3일 ${timeText}에 4살 아이 체험`,
    )

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.input.time_of_day).toBe(expected)
    }
  })

  it("normalizes festival without silently inferring an outdoor preference", () => {
    const parsed = parseLooseFamilyPromptDetails("서울 2026년 8월 1일 4살 아이 가족 축제")

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.input.keywords).toEqual(["festival"])
      expect(parsed.input.indoor_outdoor_preference).toBeUndefined()
    }
  })

  it("keeps specific craft evidence while treating the generic experience noun separately", () => {
    const parsed = parseLooseFamilyPromptDetails("서울 2026년 8월 1일 4살 아이 공예 체험")

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.input.keywords).toEqual(["craft"])
      expect(parsed.assumptions).not.toContain(
        "‘체험’은 일반 요청어로 해석해 키워드 일치 조건에서 제외했습니다.",
      )
    }
  })

  it("parses a general Korean month and day as the next matching date", () => {
    vi.stubEnv("FAMILY_EXPERIENCE_REFERENCE_DATE", "2026-07-13")

    const parsed = parseLooseFamilyPromptDetails("서울 8월 1일 4살 아이 체험")

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.input.date_range).toEqual({ start: "2026-08-01", end: "2026-08-01" })
    }
  })

  it.each([
    ["7월 20일", "2026-07-20"],
    ["7월 1일", "2027-07-01"],
  ])("compares the complete %s candidate with the reference date", (dateText, expectedDate) => {
    vi.stubEnv("FAMILY_EXPERIENCE_REFERENCE_DATE", "2026-07-13")

    const parsed = parseLooseFamilyPromptDetails(`서울 ${dateText} 4살 아이 체험`)

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.input.date_range).toEqual({ start: expectedDate, end: expectedDate })
    }
  })

  it.each([
    ["2026-07-13", { start: "2026-07-30", end: "2026-07-31" }],
    ["2026-08-01", { start: "2027-07-30", end: "2027-07-31" }],
  ])("selects the next July-end range from reference date %s", (referenceDate, expectedRange) => {
    vi.stubEnv("FAMILY_EXPERIENCE_REFERENCE_DATE", referenceDate)

    const parsed = parseLooseFamilyPromptDetails("서울 7월 말 4살 아이 체험")

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.input.date_range).toEqual(expectedRange)
    }
  })

  it("rejects an invalid Korean calendar date instead of replacing it with a weekend", () => {
    const parsed = parseLooseFamilyPromptDetails("서울 2026년 2월 30일 4살 아이 체험")

    expect(parsed).toEqual({ ok: false, reason: "missing_fields", missing_fields: ["date_range"] })
  })
})
