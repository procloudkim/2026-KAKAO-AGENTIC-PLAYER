import { describe, expect, it } from "vitest"

import { assessSourceBackedPlace } from "../src/pipeline/placeEvidence.js"

describe("source-backed place evidence", () => {
  it("does not treat an overlapping metropolitan envelope as a provincial conflict", () => {
    expect(assessSourceBackedPlace({
      city: "Gyeonggi",
      coordinates: { latitude: 37.305617311364074, longitude: 126.9537683373052 },
      venue_address: "경기도 의왕시 왕송못동로 307",
      venue_name: "왕송호수공원 및 철도박물관",
    })).toMatchObject({
      status: "source_backed",
      reason: "source_name_address_coordinates",
    })
  })

  it.each([
    {
      city: "Incheon",
      coordinates: { latitude: 37.55156933131603, longitude: 126.73994226680931 },
      venue_address: "인천광역시 계양구 방축로 21",
      venue_name: "인천어린이과학관",
    },
    {
      city: "Sejong",
      coordinates: { latitude: 36.498953453, longitude: 127.2701840594 },
      venue_address: "세종특별자치시 다솜로 216",
      venue_name: "세종호수공원",
    },
    {
      city: "Gyeongbuk",
      coordinates: { latitude: 36.102930074676955, longitude: 127.99484429506171 },
      venue_address: "경상북도 김천시 대항면 황악로 1189-52",
      venue_name: "직지문화공원",
    },
  ])("accepts a source-consistent border coordinate for $city", (candidate) => {
    expect(assessSourceBackedPlace(candidate)).toMatchObject({
      status: "source_backed",
      reason: "source_name_address_coordinates",
    })
  })

  it("still rejects a metropolitan address with coordinates in another metro", () => {
    expect(assessSourceBackedPlace({
      city: "Incheon",
      coordinates: { latitude: 37.5665, longitude: 126.978 },
      venue_address: "인천광역시 계양구 방축로 21",
      venue_name: "인천어린이과학관",
    })).toEqual({ status: "conflict", reason: "region_conflict" })
  })
})
