import { describe, expect, it } from "vitest"

import { filterCacheRecordsForRequest } from "../src/etl/cacheRecordScope.js"
import { cacheRecordSchema } from "../src/etl/cacheContract.js"
import { officialRecord } from "./pipelineTestHelpers.js"

const seoulRecord = cacheRecordSchema.parse(officialRecord({
  id: "kto-tourapi-events:jongno-test",
  city: "Seoul",
  date: { start: "2026-08-01", end: "2026-08-01", time_text: "10:00-12:00" },
  venue: { name: "\uc885\ub85c \uac00\uc871\ubb38\ud654\uad00", address: "\uc11c\uc6b8\ud2b9\ubcc4\uc2dc \uc885\ub85c\uad6c \uc0bc\uccad\ub85c 1" },
  child_stages: ["preschool"],
  min_child_age: 3,
  max_child_age: 6,
  target_age_text: "\ub9cc 3~6\uc138",
}))

const sejongRecord = cacheRecordSchema.parse(officialRecord({
  id: "kto-tourapi-events:sejong-test",
  city: "세종특별자치시",
  date: seoulRecord.date,
  venue: {
    name: "세종 가족문화관",
    address: "세종특별자치시 다솜로 1",
  },
}))

const chungbukRecord = cacheRecordSchema.parse(officialRecord({
  id: "kto-tourapi-events:chungbuk-test",
  city: "Chungcheong",
  date: seoulRecord.date,
  venue: {
    name: "충북 가족문화관",
    address: "충청북도 청주시 상당로 1",
  },
}))

const chungnamRecord = cacheRecordSchema.parse(officialRecord({
  id: "kto-tourapi-events:chungnam-test",
  city: "Chungcheong",
  date: seoulRecord.date,
  venue: {
    name: "충남 가족문화관",
    address: "충청남도 천안시 문화로 1",
  },
}))

describe("cache location scope", () => {
  it.each(["Seoul", "\uc11c\uc6b8", "Jongno-gu", "\uc885\ub85c\uad6c"])("matches supported Seoul location %s", (location) => {
    expect(filterCacheRecordsForRequest({
      records: [seoulRecord],
      request: { location, date_range: { start: "2026-08-01", end: "2026-08-01" }, child_age: 4 },
    })).toHaveLength(1)
  })

  it.each(["Nowon-gu", "\ub178\uc6d0\uad6c"])("does not broaden district query %s to all Seoul", (location) => {
    expect(filterCacheRecordsForRequest({
      records: [seoulRecord],
      request: { location, date_range: { start: "2026-08-01", end: "2026-08-01" }, child_age: 4 },
    })).toHaveLength(0)
  })

  it.each(["Sejong", "세종", "세종시", "세종특별자치시"])(
    "matches canonical Sejong alias %s",
    (location) => {
      expect(filterCacheRecordsForRequest({
        records: [sejongRecord],
        request: {
          location,
          date_range: { start: "2026-08-01", end: "2026-08-01" },
          child_age: 4,
        },
      })).toHaveLength(1)
    },
  )

  it("does not broaden a Chungbuk request to Chungnam while retaining explicit Chungcheong scope", () => {
    const request = {
      date_range: { start: "2026-08-01", end: "2026-08-01" },
      child_age: 4,
    } as const

    expect(filterCacheRecordsForRequest({
      records: [chungbukRecord, chungnamRecord],
      request: { ...request, location: "충북" },
    })).toEqual([chungbukRecord])
    expect(filterCacheRecordsForRequest({
      records: [chungbukRecord, chungnamRecord],
      request: { ...request, location: "충청" },
    })).toEqual([chungbukRecord, chungnamRecord])
  })
})
