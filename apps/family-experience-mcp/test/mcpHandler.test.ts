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

  it("widens a narrow prompt date range when live source has no exact-date matches", async () => {
    // Given: the live source has no exact weekend match but does have a later age-matched event.
    const requests: SourceAdapterRequest[] = []
    const sourceAdapter: FamilyExperienceSourceAdapter = {
      source_id: "seoul-culture-events",
      mode: "live",
      list: async (request) => {
        requests.push(request)
        if (request.date_range.end !== "2026-08-31") {
          return {
            ok: false,
            source_id: "seoul-culture-events",
            mode: "live",
            failure: {
              code: "no_match",
              message: "No exact-date source matches.",
              retryable: false,
            },
          }
        }

        return {
          ok: true,
          source_id: "seoul-culture-events",
          mode: "live",
          retrieved_at: "2026-07-09T00:00:00.000Z",
          raw_snapshots: [],
          records: [
            officialRecord({
              id: "seoul-culture-events:preschool-exhibition",
              raw_snapshot_id: "seoul-culture-events:raw:preschool-exhibition",
              title: "Seoul Preschool Indoor Exhibition",
              city: "Seoul",
              date: { start: "2026-08-03", end: "2026-08-03", time_text: "10:00-12:00" },
              venue: { name: "Seoul Family Gallery", address: "Seoul Jung-gu indoor hall" },
              source: sourceReference(
                "seoul-culture-events",
                "seoul-culture-events:raw:preschool-exhibition",
              ),
              parent_check: {
                age_fit: "Official source states ages 4 and up with guardian participation.",
                reservation: "confirmation_needed",
                live_status: "source_timestamp_required",
              },
              min_child_age: 4,
              max_child_age: 7,
              indoor_outdoor: "indoor",
              tags: ["seoul", "indoor", "preschool", "exhibition"],
            }),
          ],
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

    // Then: the tool transparently widens the date range and returns the later source-backed option.
    expect(requests.map((request) => request.date_range)).toEqual([
      { start: "2026-07-04", end: "2026-07-05" },
      { start: "2026-07-04", end: "2026-08-31" },
    ])
    expect(result.isError).toBeUndefined()
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("날짜 범위를"),
    })
    expect(structuredContent.ok).toBe(true)
    if (!structuredContent.ok) {
      throw new Error(structuredContent.failure.message)
    }
    expect(structuredContent.candidates[0]).toMatchObject({
      title: "Seoul Preschool Indoor Exhibition",
      source: "seoul_open_data",
      starts_at: "2026-08-03",
      min_child_age: 4,
    })
  })

  it("clarifies loose Korean prompt input when child age or stage is missing", async () => {
    // Given: a compact Korean prompt omits the child selector.
    const result = await callFindFamilyExperiences(
      { prompt: "이번 주말 아이랑 갈 곳" },
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
      },
    })
  })
})
