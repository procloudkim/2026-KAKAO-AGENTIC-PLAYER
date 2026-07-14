import { readFileSync } from "node:fs"

import * as z from "zod/v4"
import { describe, expect, it } from "vitest"

import { toBoundedToolSuccess } from "../src/findFamilyExperienceToolResponse.js"
import { normalizeKakaoDestinationLabel } from "../src/placeLabels.js"
import { assessKakaoNavigation, renderKakaoNavigation } from "../src/pipeline/navigation.js"
import { normalizeFamilyExperienceRecordCandidates } from "../src/pipeline/normalize.js"
import { renderFamilyExperienceResponse } from "../src/pipeline/render.js"
import {
  FamilyExperienceNavigationSchema,
  FindFamilyExperiencesStructuredContentSchema,
} from "../src/schemas.js"
import { officialRecord } from "./pipelineTestHelpers.js"

const NavigationGoldCaseSchema = z
  .object({
    id: z.string().min(1),
    city: z.string().min(1),
    venue_name: z.string().min(1),
    address: z.string().min(1),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).strict(),
    expected_status: z.enum(["source_backed", "conflict", "unresolved"]),
    expected_destination: z.string().min(1),
    expect_navigation: z.boolean(),
  })
  .strict()

const navigationGoldCases = z.array(NavigationGoldCaseSchema).length(10).parse(
  JSON.parse(
    readFileSync(
      new URL("./fixtures/navigation-place-gold.json", import.meta.url),
      "utf8",
    ),
  ),
)

describe("Kakao navigation actions", () => {
  it("renders named Kakao map CTAs from source-backed KTO coordinates", () => {
    const rawSnapshotId = "kto-tourapi-events:raw:3012345"
    const venueName = "국립중앙박물관"
    const rendered = renderFamilyExperienceResponse({
      input: {
        location: "Seoul",
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
          venue: {
            name: venueName,
            address: "서울특별시 용산구 서빙고로 137",
          },
          city: "Seoul",
          coordinates: { latitude: 37.52385, longitude: 126.98047 },
        },
      ],
    })

    expect(rendered.ok).toBe(true)
    if (!rendered.ok) throw new Error(rendered.failure.message)
    expect(rendered.candidates[0]).toMatchObject({
      navigation: {
        place_evidence_status: "source_backed",
        map_url: "https://map.kakao.com/link/map/%EA%B5%AD%EB%A6%BD%EC%A4%91%EC%95%99%EB%B0%95%EB%AC%BC%EA%B4%80,37.52385,126.98047",
        directions_url: "https://map.kakao.com/link/to/%EA%B5%AD%EB%A6%BD%EC%A4%91%EC%95%99%EB%B0%95%EB%AC%BC%EA%B4%80,37.52385,126.98047",
      },
    })
    expect(rendered.candidates[0]).not.toHaveProperty("source_url")

    const bounded = toBoundedToolSuccess(rendered)
    expect(bounded.ok).toBe(true)
    if (!bounded.ok) throw new Error(bounded.failure.message)
    const text = bounded.result.content[0]
    expect(text).toMatchObject({ type: "text" })
    if (text?.type !== "text") throw new Error("Expected text content")
    expect(text.text).toContain(`[${venueName} 지도 보기](`)
    expect(text.text).toContain(`[${venueName} 길찾기](`)
    expect(text.text).not.toContain("source_backed")
    expect(text.text).not.toContain("지도: https://")
    expect(text.text).not.toContain("길찾기: https://")
    const visibleText = text.text.replace(/\]\([^)]+\)/gu, "]")
    expect(visibleText).not.toContain("37.52385")
    expect(visibleText).not.toContain("126.98047")
    expect(JSON.stringify(bounded.result)).not.toContain("apis.data.go.kr")
    expect(JSON.stringify(bounded.result)).not.toContain("kakao_place_matched")
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
          ...(index === 2
            ? {
                fee_text:
                  "- 성인 8,000원 - 학생 5,000원 - 단체 5,000원 - 통합권 15,000원 - 현장 조건은 공식 출처 확인",
              }
            : {}),
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
    const structured = FindFamilyExperiencesStructuredContentSchema.parse(
      bounded.result.structuredContent,
    )
    if (!structured.ok) throw new Error(structured.failure.message)
    const text = bounded.result.content[0]
    if (text?.type !== "text") throw new Error("Expected text content")
    const cardTitles = text.text.split("\n").flatMap((line) => {
      const match = /^\d+\. (.+)$/u.exec(line)
      return match?.[1] === undefined ? [] : [match[1]]
    })

    expect(bounded.candidateCount).toBe(3)
    expect(cardTitles).toEqual(structured.candidates.map((candidate) => candidate.title))
    expect(bounded.result.structuredContent).toMatchObject({
      candidates: [
        { navigation: { place_evidence_status: "source_backed" } },
        { navigation: { place_evidence_status: "source_backed" } },
        { navigation: { place_evidence_status: "source_backed" } },
      ],
      result_summary: { returned_count: 3, reason: "complete" },
    })
    expect(bounded.result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("지도 보기]"),
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
        officialRecord({ tags: ["kto-tourapi", "mapx:129.057", "mapy:35.1682"] }),
      ],
    })

    expect(rendered.ok).toBe(true)
    if (!rendered.ok) throw new Error(rendered.failure.message)
    expect(rendered.candidates[0]?.navigation?.directions_url).toBe(
      "https://map.kakao.com/link/to/Haeundae%20Culture%20Center,35.1682,129.057",
    )
  })

  it.each(navigationGoldCases)(
    "checks gold place $id name, address, evidence, and link result",
    (sample) => {
      const record = {
        ...officialRecord({
          id: `kto-tourapi-events:${sample.id}`,
          raw_snapshot_id: `kto-tourapi-events:raw:${sample.id}`,
          title: `${sample.venue_name} 가족 행사`,
          city: sample.city,
          venue: { name: sample.venue_name, address: sample.address },
        }),
        coordinates: sample.coordinates,
      }
      const input = {
        location: sample.city,
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool" as const,
      }
      const normalized = normalizeFamilyExperienceRecordCandidates({
        input,
        source_records: [record],
      })

      expect(normalized.ok).toBe(true)
      if (!normalized.ok) throw new Error(normalized.failure.message)
      const candidate = normalized.candidates[0]
      if (candidate === undefined) throw new Error("Expected normalized candidate")
      const assessment = assessKakaoNavigation(candidate)
      expect(assessment.status).toBe(sample.expected_status)

      const rendered = renderFamilyExperienceResponse({
        input,
        mode: "live",
        source_records: [record],
      })
      expect(rendered.ok).toBe(true)
      if (!rendered.ok) throw new Error(rendered.failure.message)
      expect(rendered.candidates[0]).toMatchObject({
        venue: sample.venue_name,
        address: sample.address,
      })

      const navigation = rendered.candidates[0]?.navigation
      if (!sample.expect_navigation) {
        expect(navigation).toBeUndefined()
        return
      }

      expect(navigation?.place_evidence_status).toBe("source_backed")
      if (navigation === undefined) throw new Error("Expected navigation")
      const map = parseNavigationUrl(navigation.map_url, "map")
      const directions = parseNavigationUrl(navigation.directions_url, "to")
      expect(map.destination).toBe(sample.expected_destination)
      expect(directions.destination).toBe(sample.expected_destination)
      expect(map).toEqual(directions)
      expect(map.destination).toBe(
        normalizeKakaoDestinationLabel(rendered.candidates[0]?.venue ?? ""),
      )
    },
  )

  it.each(["행사장", "장소", "미정"])(
    "fails closed for meaningless venue name %s while keeping the candidate",
    (venueName) => {
      const input = {
        location: "Seoul",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool" as const,
      }
      const record = {
        ...officialRecord({
          id: `generic:${venueName}`,
          city: "Seoul",
          venue: { name: venueName, address: "서울특별시 용산구 서빙고로 137" },
        }),
        coordinates: { latitude: 37.52385, longitude: 126.98047 },
      }
      const rendered = renderFamilyExperienceResponse({ input, mode: "live", source_records: [record] })

      expect(rendered.ok).toBe(true)
      if (!rendered.ok) throw new Error(rendered.failure.message)
      expect(rendered.candidates[0]?.venue).toBe(venueName)
      expect(rendered.candidates[0]).not.toHaveProperty("navigation")
    },
  )

  it("fails closed when URL encoding exceeds the validated URL budget", () => {
    const input = {
      location: "Seoul",
      date_range: { start: "2026-08-01", end: "2026-08-01" },
      child_stage: "preschool" as const,
    }
    const record = {
      ...officialRecord({
        city: "Seoul",
        venue: { name: "가".repeat(512), address: "서울특별시 용산구 서빙고로 137" },
      }),
      coordinates: { latitude: 37.52385, longitude: 126.98047 },
    }
    const rendered = renderFamilyExperienceResponse({ input, mode: "live", source_records: [record] })

    expect(rendered.ok).toBe(true)
    if (!rendered.ok) throw new Error(rendered.failure.message)
    expect(rendered.candidates).toHaveLength(1)
    expect(rendered.candidates[0]).not.toHaveProperty("navigation")
  })

  it("suppresses direct CTAs for ambiguous, conflict, and unresolved resolver states", () => {
    const normalized = normalizeFamilyExperienceRecordCandidates({
      input: {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      source_records: [{
        ...officialRecord(),
        coordinates: { latitude: 35.1682, longitude: 129.057 },
      }],
    })
    expect(normalized.ok).toBe(true)
    if (!normalized.ok) throw new Error(normalized.failure.message)
    const candidate = normalized.candidates[0]
    if (candidate === undefined) throw new Error("Expected normalized candidate")

    for (const status of ["ambiguous", "conflict", "unresolved"] as const) {
      expect(renderKakaoNavigation(candidate, placeResolutionFixture(status))).toBeUndefined()
    }
  })

  it("does not promote bare or fixture-only Kakao place matches into W0 navigation", () => {
    const normalized = normalizeFamilyExperienceRecordCandidates({
      input: {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      source_records: [{
        ...officialRecord(),
        coordinates: { latitude: 35.1682, longitude: 129.057 },
      }],
    })
    expect(normalized.ok).toBe(true)
    if (!normalized.ok) throw new Error(normalized.failure.message)
    const candidate = normalized.candidates[0]
    if (candidate === undefined) throw new Error("Expected normalized candidate")

    expect(assessKakaoNavigation(candidate, "kakao_place_matched")).toMatchObject({
      status: "unresolved",
      reason: "invalid_place_resolution",
    })
    expect(assessKakaoNavigation(
      candidate,
      placeResolutionFixture("kakao_place_matched"),
    )).toMatchObject({
      status: "unresolved",
      reason: "kakao_place_matching_not_promoted",
    })
  })

  it("fails closed when an Incheon address carries Daejeon coordinates", () => {
    const rendered = renderFamilyExperienceResponse({
      input: {
        location: "Incheon",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      mode: "live",
      source_records: [{
        ...officialRecord({
          city: "Incheon",
          venue: {
            name: "인천 가족문화회관",
            address: "인천광역시 남동구 예술로 1",
          },
        }),
        coordinates: { latitude: 36.3504, longitude: 127.3845 },
      }],
    })

    expect(rendered.ok).toBe(true)
    if (!rendered.ok) throw new Error(rendered.failure.message)
    expect(rendered.candidates[0]).not.toHaveProperty("navigation")
  })

  it("fails closed when an Incheon address carries central Seoul coordinates", () => {
    const rendered = renderFamilyExperienceResponse({
      input: {
        location: "Incheon",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      mode: "live",
      source_records: [{
        ...officialRecord({
          city: "Incheon",
          venue: {
            name: "인천 가족문화회관",
            address: "인천광역시 남동구 예술로 1",
          },
        }),
        coordinates: { latitude: 37.5665, longitude: 126.978 },
      }],
    })

    expect(rendered.ok).toBe(true)
    if (!rendered.ok) throw new Error(rendered.failure.message)
    expect(rendered.candidates[0]).not.toHaveProperty("navigation")
  })

  it("keeps recommendation IDs and order invariant when navigation evidence changes", () => {
    const records = ["one", "two", "three", "four"].map((suffix, index) =>
      officialRecord({
        id: `stable:${suffix}`,
        raw_snapshot_id: `stable:raw:${suffix}`,
        title: `Stable family event ${suffix}`,
        venue: {
          name: `Stable venue ${suffix}`,
          address: `Busan Haeundae-gu Centum ${index + 1}-ro`,
        },
      }),
    )
    const withCoordinates = records.map((record, index) => ({
      ...record,
      coordinates: {
        latitude: 35.1682 + index / 10_000,
        longitude: 129.057 + index / 10_000,
      },
    }))
    const request = {
      input: {
        location: "Busan",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool" as const,
      },
      mode: "live" as const,
    }
    const withoutNavigation = renderFamilyExperienceResponse({ ...request, source_records: records })
    const withNavigation = renderFamilyExperienceResponse({ ...request, source_records: withCoordinates })

    expect(withoutNavigation.ok).toBe(true)
    expect(withNavigation.ok).toBe(true)
    if (!withoutNavigation.ok || !withNavigation.ok) throw new Error("Expected success")
    expect(withNavigation.candidates.map(({ id }) => id)).toEqual(
      withoutNavigation.candidates.map(({ id }) => id),
    )
  })

  it("rejects generic, mismatched, or impossible navigation at the schema boundary", () => {
    const generic = FamilyExperienceNavigationSchema.safeParse({
      place_evidence_status: "source_backed",
      map_url: "https://map.kakao.com/link/map/%ED%96%89%EC%82%AC%EC%9E%A5,37.5,127",
      directions_url: "https://map.kakao.com/link/to/%ED%96%89%EC%82%AC%EC%9E%A5,37.5,127",
    })
    const mismatch = FamilyExperienceNavigationSchema.safeParse({
      place_evidence_status: "source_backed",
      map_url: "https://map.kakao.com/link/map/Seoul%20Museum,37.5,127",
      directions_url: "https://map.kakao.com/link/to/Busan%20Museum,35.1,129",
    })
    const impossibleCoordinates = FamilyExperienceNavigationSchema.safeParse({
      place_evidence_status: "source_backed",
      map_url: "https://map.kakao.com/link/map/Seoul%20Museum,999,999",
      directions_url: "https://map.kakao.com/link/to/Seoul%20Museum,999,999",
    })

    expect(generic.success).toBe(false)
    expect(mismatch.success).toBe(false)
    expect(impossibleCoordinates.success).toBe(false)
  })

  it("uses addresses to distinguish repeated venue names in visible cards", () => {
    const records = [
      {
        ...officialRecord({
          id: "same-venue:first",
          raw_snapshot_id: "same-venue:raw:first",
          title: "First family program",
          venue: { name: "Busan Civic Hall", address: "부산광역시 해운대구 센텀로 1" },
        }),
        coordinates: { latitude: 35.1682, longitude: 129.057 },
      },
      {
        ...officialRecord({
          id: "same-venue:second",
          raw_snapshot_id: "same-venue:raw:second",
          title: "Second family program",
          venue: { name: "Busan Civic Hall", address: "부산광역시 해운대구 센텀로 2" },
        }),
        coordinates: { latitude: 35.1692, longitude: 129.058 },
      },
    ]
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
    const text = bounded.result.content[0]
    if (text?.type !== "text") throw new Error("Expected text content")

    expect(text.text).toContain("부산광역시 해운대구 센텀로 1")
    expect(text.text).toContain("부산광역시 해운대구 센텀로 2")
  })

  it("strips control characters before encoding a Korean destination label", () => {
    const normalized = normalizeFamilyExperienceRecordCandidates({
      input: {
        location: "Seoul",
        date_range: { start: "2026-08-01", end: "2026-08-01" },
        child_stage: "preschool",
      },
      source_records: [{
        ...officialRecord({
          city: "Seoul",
          venue: {
            name: "국립\u0000중앙\t박물관",
            address: "서울특별시 용산구 서빙고로 137",
          },
        }),
        coordinates: { latitude: 37.52385, longitude: 126.98047 },
      }],
    })
    expect(normalized.ok).toBe(true)
    if (!normalized.ok) throw new Error(normalized.failure.message)
    const candidate = normalized.candidates[0]
    if (candidate === undefined) throw new Error("Expected normalized candidate")
    const navigation = renderKakaoNavigation(candidate)

    expect(candidate.venue_name).toBe("국립 중앙 박물관")
    expect(navigation).toBeDefined()
    if (navigation === undefined) throw new Error("Expected navigation")
    expect(parseNavigationUrl(navigation.map_url, "map").destination).toBe("국립 중앙 박물관")
  })
})

function parseNavigationUrl(value: string, kind: "map" | "to") {
  const match = new RegExp(
    `^/link/${kind}/([^/,]+),(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)/?$`,
    "u",
  ).exec(new URL(value).pathname)
  if (match === null || match[1] === undefined || match[2] === undefined || match[3] === undefined) {
    throw new Error(`Invalid navigation URL: ${value}`)
  }
  return {
    destination: decodeURIComponent(match[1]),
    latitude: match[2],
    longitude: match[3],
  }
}

function placeResolutionFixture(
  status: "kakao_place_matched" | "ambiguous" | "conflict" | "unresolved",
) {
  const matched = status === "kakao_place_matched"
  return {
    provider: "kakao_local" as const,
    status,
    place_id: matched ? "123456789" : null,
    place_url: matched ? "https://" + "place.map.kakao.com/123456789" : null,
    canonical_name: matched ? "Haeundae Culture Center" : null,
    canonical_address: matched ? "Busan Haeundae-gu Centum-ro 1" : null,
    matched_coordinates: matched
      ? { latitude: 35.1682, longitude: 129.057 }
      : null,
    resolved_at: "2026-07-14T00:00:00.000Z",
    matcher_version: "fixture-v1",
    match_evidence: {
      candidate_count: matched ? 1 : 0,
      name_similarity: matched ? 1 : null,
      address_similarity: matched ? 1 : null,
      distance_meters: matched ? 0 : null,
      decision_reasons: [`fixture ${status}`],
    },
    confidence: matched ? 1 : 0,
  }
}
