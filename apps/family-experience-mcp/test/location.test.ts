import { describe, expect, it } from "vitest"

import {
  canonicalSeoulDistrict,
  canonicalFamilyExperienceRegion,
  familyExperienceRegionMatches,
  SEOUL_DISTRICT_DEFINITIONS,
} from "../src/location.js"

describe("family experience region canonicalization", () => {
  it.each([
    ["서울특별시", "seoul"],
    ["부산광역시", "busan"],
    ["세종특별자치시", "sejong"],
    ["강원특별자치도", "gangwon"],
    ["충청북도", "chungbuk"],
    ["충청남도", "chungnam"],
    ["전북특별자치도", "jeonbuk"],
    ["전라남도", "jeonnam"],
    ["경상북도", "gyeongbuk"],
    ["경상남도", "gyeongnam"],
    ["제주특별자치도", "jeju"],
    ["전남광주통합특별시 동구 문화전당로 1", "gwangju"],
    ["전남광주통합특별시 강진군 고성길 1", "jeonnam"],
  ] as const)("maps %s to %s", (input, expected) => {
    expect(canonicalFamilyExperienceRegion(input)).toBe(expected)
  })

  it("does not silently broaden an unsupported location", () => {
    expect(canonicalFamilyExperienceRegion("대한민국 전체")).toBeUndefined()
  })

  it("defines all 25 Seoul districts and maps every documented alias to Seoul", () => {
    expect(SEOUL_DISTRICT_DEFINITIONS).toHaveLength(25)
    for (const definition of SEOUL_DISTRICT_DEFINITIONS) {
      for (const alias of definition.aliases) {
        expect(canonicalSeoulDistrict(alias)).toBe(definition.value)
        expect(canonicalFamilyExperienceRegion(alias)).toBe("seoul")
      }
    }
  })

  it.each(["Gangnam-gu", "Gangnam", "강남구", "강남", "서울 강남", "서울특별시 강남구"])(
    "keeps Gangnam district query %s exact",
    (requestedLocation) => {
      expect(familyExperienceRegionMatches({
        requestedLocation,
        recordCity: "Seoul",
        recordAddress: "서울특별시 강남구 테헤란로 1",
      })).toBe(true)
      expect(familyExperienceRegionMatches({
        requestedLocation,
        recordCity: "Seoul",
        recordAddress: "서울특별시 종로구 삼청로 1",
      })).toBe(false)
    },
  )

  it("keeps leaf provinces exact while an explicitly broad region matches both leaves", () => {
    const chungnamRecord = {
      recordCity: "Chungcheong",
      recordAddress: "충청남도 천안시 문화로 1",
    }

    expect(familyExperienceRegionMatches({
      requestedLocation: "충북",
      ...chungnamRecord,
    })).toBe(false)
    expect(familyExperienceRegionMatches({
      requestedLocation: "충남",
      ...chungnamRecord,
    })).toBe(true)
    expect(familyExperienceRegionMatches({
      requestedLocation: "충청",
      ...chungnamRecord,
    })).toBe(true)
  })

  it("fails closed when structured city and address identify different regions", () => {
    expect(familyExperienceRegionMatches({
      requestedLocation: "서울",
      recordCity: "Busan",
      recordAddress: "서울특별시 테스트로 1",
    })).toBe(false)
  })
})
