import { describe, expect, it } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import { callFindFamilyExperiences } from "../src/mcp.js"
import {
  FindFamilyExperiencesInputSchema,
  FindFamilyExperiencesStructuredContentSchema,
} from "../src/schemas.js"
import type { FamilyExperienceSourceAdapter, SourceAdapterRequest } from "../src/sources/types.js"
import { officialRecord, sourceReference } from "./pipelineTestHelpers.js"

process.env["FAMILY_EXPERIENCE_REFERENCE_DATE"] = "2026-07-04"

const fixtureConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: true,
  seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
}

const noFixtureConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: false,
  seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
}

const happyInput = FindFamilyExperiencesInputSchema.parse({
  location: "Seoul",
  date_range: { start: "2026-07-04", end: "2026-07-04" },
  child_age: 4,
})

describe("Family experience MCP handler", () => {
  it.each([
    [{ date_range: { start: "2026-07-04", end: "2026-07-04" }, child_age: 4 }, ["location"], "지역"],
    [{ location: "Seoul", child_age: 4 }, ["date_range"], "날짜 범위"],
    [{ location: "Seoul", date_range: { start: "2026-07-04", end: "2026-07-04" } }, ["child_selector"], "아이 나이"],
    [{}, ["location", "date_range", "child_selector"], "방문할 지역, 날짜 범위, 아이 나이 또는 발달 단계"],
  ])("PIN:PARTIAL_STRUCTURED_TYPED_ERROR returns ordered missing fields without source access", async (input, missingFields, clarification) => {
    let sourceCalls = 0
    const sourceAdapter: FamilyExperienceSourceAdapter = {
      source_id: "seoul-culture-events",
      mode: "live",
      list: async () => {
        sourceCalls += 1
        return { ok: false, source_id: "seoul-culture-events", mode: "live", failure: { code: "no_match", message: "not reached", retryable: false } }
      },
    }

    const result = await callFindFamilyExperiences(input, { config: noFixtureConfig, sourceAdapter })
    const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)

    expect(sourceCalls).toBe(0)
    expect(structuredContent).toMatchObject({ ok: false, failure: { code: "invalid_input", missing_fields: missingFields } })
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining(clarification),
    })
  })
  it("PIN:ZERO_SOURCE_ACCESS returns exact missing fields before the source adapter", async () => {
    // Given: a prompt has age and date but no location.
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

    // When: the tool receives the incomplete prompt.
    const result = await callFindFamilyExperiences(
      { prompt: "이번 주말 4살 아이와 갈 만한 체험" },
      { config: noFixtureConfig, sourceAdapter },
    )
    const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)

    // Then: validation fails without source access and reports only location.
    expect(sourceCalls).toBe(0)
    expect(structuredContent).toMatchObject({
      ok: false,
      failure: { code: "invalid_input", missing_fields: ["location"] },
    })
  })
  it("returns a safe tool error when live source is not configured and fixture mode is disabled", async () => {
    // Given: runtime config has no live key and does not allow fixture fallback.
    const result = await callFindFamilyExperiences(happyInput, { config: noFixtureConfig })

    // When: the structured failure metadata is parsed through the public schema.
    const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
      result.structuredContent,
    )

    // Then: the tool reports a safe Korean error without fabricated candidates.
    expect(result.isError).toBe(true)
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("fixture 모드"),
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
  })

  it("PIN:NO_DATE_EXPANSION makes exactly one source request for the original range", async () => {
    // Given: the live source has no exact weekend match.
    const requests: SourceAdapterRequest[] = []
    const sourceAdapter: FamilyExperienceSourceAdapter = {
      source_id: "seoul-culture-events",
      mode: "live",
      list: async (request) => {
        requests.push(request)
        return {
          ok: false,
          source_id: "seoul-culture-events",
          mode: "live",
          failure: { code: "no_match", message: "No exact-date source matches.", retryable: false },
        }
      },
    }

    // When: a parent asks a natural narrow-date prompt that would otherwise return no results.
    const result = await callFindFamilyExperiences(
      { prompt: "이번 주말 서울에서 4살 아이와 갈 만한 실내 체험 장소" },
      { config: noFixtureConfig, sourceAdapter },
    )
    const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
      result.structuredContent,
    )

    // Then: the original constraint is preserved and no retry/search note is emitted.
    expect(requests.map((request) => request.date_range)).toEqual([
      { start: "2026-07-04", end: "2026-07-05" },
    ])
    expect(result.isError).toBe(true)
    expect(result.content[0]).not.toMatchObject({ text: expect.stringContaining("search_note") })
    expect(structuredContent).toMatchObject({ ok: false, failure: { code: "no_results" } })
  })

  it("clarifies loose Korean prompt input when child age or stage is missing", async () => {
    // Given: a compact Korean prompt omits the child selector.
    const result = await callFindFamilyExperiences(
      { prompt: "이번 주말 서울에서 아이랑 갈 곳" },
      { config: fixtureConfig },
    )

    // When: the structured failure metadata is parsed.
    const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
      result.structuredContent,
    )

    // Then: the tool asks for the missing child age/stage instead of fabricating candidates.
    expect(result.isError).toBe(true)
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("아이 나이"),
    })
    expect(structuredContent).toMatchObject({
      ok: false,
      mode: "fixture",
      failure: {
        code: "invalid_input",
        retryable: false,
        missing_fields: ["child_selector"],
      },
    })
  })
})
