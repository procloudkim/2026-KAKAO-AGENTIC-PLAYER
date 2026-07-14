import { describe, expect, it } from "vitest"

import {
  PersistableKakaoPlaceReferenceSchema,
  PlaceResolutionRequestSchema,
  TransientKakaoPlaceResolutionSchema,
  persistableKakaoReferenceFromResolution,
  type PlaceResolutionAdapter,
} from "../src/placeResolution.js"

const matchedResolution = {
  provider: "kakao_local" as const,
  status: "kakao_place_matched" as const,
  place_id: "123456789",
  place_url: "https://place.map.kakao.com/123456789",
  canonical_name: "국립중앙박물관",
  canonical_address: "서울특별시 용산구 서빙고로 137",
  matched_coordinates: { latitude: 37.52385, longitude: 126.98047 },
  resolved_at: "2026-07-14T00:00:00.000Z",
  matcher_version: "fixture-v1",
  match_evidence: {
    candidate_count: 1,
    name_similarity: 1,
    address_similarity: 1,
    distance_meters: 0,
    decision_reasons: ["synthetic exact fixture"],
  },
  confidence: 1,
}

describe("place resolution contract", () => {
  it("keeps the fake adapter result transient and schema-validated", async () => {
    const request = PlaceResolutionRequestSchema.parse({
      source_record_id: "kto-tourapi-events:fixture",
      source_name: "국립중앙박물관",
      source_address: "서울특별시 용산구 서빙고로 137",
      source_coordinates: { latitude: 37.52385, longitude: 126.98047 },
    })
    const adapter: PlaceResolutionAdapter = {
      provider: "kakao_local",
      resolve: async () => TransientKakaoPlaceResolutionSchema.parse(matchedResolution),
    }

    await expect(adapter.resolve(request)).resolves.toMatchObject({
      status: "kakao_place_matched",
      place_id: "123456789",
    })
  })

  it("requires complete transient provenance before claiming kakao_place_matched", () => {
    const missingCoordinates = {
      ...matchedResolution,
      matched_coordinates: null,
    }

    expect(TransientKakaoPlaceResolutionSchema.safeParse(missingCoordinates).success).toBe(false)
    expect(TransientKakaoPlaceResolutionSchema.safeParse({
      ...matchedResolution,
      match_evidence: { ...matchedResolution.match_evidence, candidate_count: 0 },
    }).success).toBe(false)
    expect(TransientKakaoPlaceResolutionSchema.safeParse({
      ...matchedResolution,
      match_evidence: { ...matchedResolution.match_evidence, name_similarity: null },
    }).success).toBe(false)
    expect(TransientKakaoPlaceResolutionSchema.safeParse({
      ...matchedResolution,
      confidence: 0,
    }).success).toBe(false)
  })

  it("rejects transient and persistable place ID/URL mismatches", () => {
    const mismatchedTransient = {
      ...matchedResolution,
      place_url: "https://place.map.kakao.com/987654321",
    }
    const mismatchedReference = {
      provider: "kakao_local",
      place_id: matchedResolution.place_id,
      place_url: "https://place.map.kakao.com/987654321",
    }

    expect(TransientKakaoPlaceResolutionSchema.safeParse(mismatchedTransient).success).toBe(false)
    expect(PersistableKakaoPlaceReferenceSchema.safeParse(mismatchedReference).success).toBe(false)
  })

  it("allows only place ID and place URL through the persistence boundary", () => {
    const persistable = PersistableKakaoPlaceReferenceSchema.parse({
      provider: matchedResolution.provider,
      place_id: matchedResolution.place_id,
      place_url: matchedResolution.place_url,
    })

    expect(persistable).toEqual({
      provider: "kakao_local",
      place_id: "123456789",
      place_url: "https://place.map.kakao.com/123456789",
    })
    expect(PersistableKakaoPlaceReferenceSchema.safeParse(matchedResolution).success).toBe(false)
  })

  it("canonicalizes provider HTTP place URLs and extracts only matched references", () => {
    const providerResult = TransientKakaoPlaceResolutionSchema.parse({
      ...matchedResolution,
      place_url: "http://place.map.kakao.com/123456789",
    })
    const unresolved = TransientKakaoPlaceResolutionSchema.parse({
      ...matchedResolution,
      status: "unresolved",
      place_id: null,
      place_url: null,
      canonical_name: null,
      canonical_address: null,
      matched_coordinates: null,
    })

    expect(providerResult.place_url).toBe("https://place.map.kakao.com/123456789")
    expect(persistableKakaoReferenceFromResolution(providerResult)).toEqual({
      provider: "kakao_local",
      place_id: "123456789",
      place_url: "https://place.map.kakao.com/123456789",
    })
    expect(persistableKakaoReferenceFromResolution(unresolved)).toBeUndefined()
  })
})
