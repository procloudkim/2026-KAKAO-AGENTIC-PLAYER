import { describe, expect, it } from "vitest"

import { filterCacheRecordsForRequest } from "../src/etl/cacheRecordScope.js"
import type { CacheRecord } from "../src/etl/cacheContract.js"

const seoulRecord = {
  id: "kto-tourapi-events:jongno-test",
  raw_snapshot_id: "kto-tourapi-events:raw:jongno-test",
  mode: "live",
  city: "Seoul",
  date: { start: "2026-08-01", end: "2026-08-01" },
  venue: { name: "\uc885\ub85c \uac00\uc871\ubb38\ud654\uad00", address: "\uc11c\uc6b8\ud2b9\ubcc4\uc2dc \uc885\ub85c\uad6c \uc0bc\uccad\ub85c 1" },
  child_stages: ["preschool"],
  min_child_age: 3,
  max_child_age: 6,
  parent_check: { live_status: "source_timestamp_required" },
  confidence: { age_fit: "source-stated" },
  target_age_text: "\ub9cc 3~6\uc138",
  source: {
    id: "kto-tourapi-events",
    mode: "live",
    url: "https://example.test/kto/jongno-test",
    raw_snapshot_id: "kto-tourapi-events:raw:jongno-test",
  },
} as const satisfies CacheRecord

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
})
