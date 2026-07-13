import { describe, expect, it } from "vitest"

import { toBoundedToolSuccess } from "../src/findFamilyExperienceToolResponse.js"
import { renderFamilyExperienceResponse } from "../src/pipeline/render.js"
import { officialRecord } from "./pipelineTestHelpers.js"

describe("Kakao navigation actions", () => {
  it("renders official Kakao map and destination links from typed KTO coordinates", () => {
    const rawSnapshotId = "kto-tourapi-events:raw:3012345"
    const rendered = renderFamilyExperienceResponse({
      input: {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      mode: "live",
      source_records: [
        {
          ...officialRecord({
            id: "kto-tourapi-events:3012345",
            raw_snapshot_id: rawSnapshotId,
            source: {
              id: "kto-tourapi-events",
              mode: "live",
              url: "https://apis.data.go.kr/B551011/KorService2/detailCommon2?contentId=3012345",
              raw_snapshot_id: rawSnapshotId,
            },
          }),
          coordinates: { latitude: 33.245678, longitude: 126.412345 },
        },
      ],
    })

    expect(rendered.ok).toBe(true)
    if (!rendered.ok) throw new Error(rendered.failure.message)
    expect(rendered.candidates[0]).toMatchObject({
      navigation: {
        map_url: "https://map.kakao.com/link/map/행사장,33.245678,126.412345",
        directions_url: "https://map.kakao.com/link/to/행사장,33.245678,126.412345",
      },
    })
    expect(rendered.candidates[0]).not.toHaveProperty("source_url")

    const bounded = toBoundedToolSuccess(rendered)
    expect(bounded.ok).toBe(true)
    if (!bounded.ok) throw new Error(bounded.failure.message)
    const text = bounded.result.content[0]
    expect(text).toMatchObject({
      type: "text",
      text: expect.stringContaining("https://map.kakao.com/link/map/행사장,33.245678,126.412345"),
    })
    expect(text).toMatchObject({
      type: "text",
      text: expect.stringContaining("https://map.kakao.com/link/to/행사장,33.245678,126.412345"),
    })
    expect(JSON.stringify(bounded.result)).not.toContain("apis.data.go.kr")
  })

  it("keeps navigation absent when neither typed nor legacy coordinates exist", () => {
    const rendered = renderFamilyExperienceResponse({
      input: {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      mode: "live",
      source_records: [officialRecord()],
    })

    expect(rendered.ok).toBe(true)
    if (!rendered.ok) throw new Error(rendered.failure.message)
    expect(rendered.candidates[0]).not.toHaveProperty("navigation")
  })

  it("keeps three ordinary KTO navigation cards inside the PlayMCP budget", () => {
    const records = ["one", "two", "three"].map((suffix, index) => {
      const rawSnapshotId = `kto-tourapi-events:raw:${suffix}`
      return {
        ...officialRecord({
          id: `kto-tourapi-events:${3_000 + index}`,
          raw_snapshot_id: rawSnapshotId,
          title: `Busan family event ${suffix}`,
          source: {
            id: "kto-tourapi-events",
            mode: "live",
            url: `https://apis.data.go.kr/B551011/KorService2/detailCommon2?contentId=${3_000 + index}`,
            raw_snapshot_id: rawSnapshotId,
          },
          contact: "051-000-0000",
        }),
        coordinates: {
          latitude: 35.1682 + index / 1_000,
          longitude: 129.057 + index / 1_000,
        },
      } as const
    })
    const rendered = renderFamilyExperienceResponse({
      input: {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      mode: "live",
      source_records: records,
    })

    expect(rendered.ok).toBe(true)
    if (!rendered.ok) throw new Error(rendered.failure.message)
    const bounded = toBoundedToolSuccess(rendered)

    expect(bounded.ok).toBe(true)
    if (!bounded.ok) throw new Error(bounded.failure.message)
    expect(bounded.candidateCount).toBe(3)
    expect(bounded.result.structuredContent).toMatchObject({
      result_summary: { returned_count: 3, reason: "complete" },
    })
    expect(JSON.stringify(bounded.result).length).toBeLessThanOrEqual(4_000)
  })

  it("keeps cached KTO mapx and mapy tags navigation-compatible", () => {
    const rendered = renderFamilyExperienceResponse({
      input: {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      mode: "live",
      source_records: [
        officialRecord({ tags: ["kto-tourapi", "mapx:126.412345", "mapy:33.245678"] }),
      ],
    })

    expect(rendered.ok).toBe(true)
    if (!rendered.ok) throw new Error(rendered.failure.message)
    expect(rendered.candidates[0]?.navigation?.directions_url).toBe(
      "https://map.kakao.com/link/to/행사장,33.245678,126.412345",
    )
  })
})
