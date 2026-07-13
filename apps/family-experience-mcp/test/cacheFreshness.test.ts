import { describe, expect, it } from "vitest"

import {
  MAX_CACHE_STALE_GRACE_HOURS,
  assessCacheServingFreshness,
  defaultCacheStaleGraceHours,
} from "../src/etl/cacheFreshness.js"

describe("bounded cache serving freshness", () => {
  it("classifies fresh, stale-servable, and expired cache at deterministic boundaries", () => {
    const generatedAt = "2026-07-01T00:00:00.000Z"
    const assessAt = (now: string) =>
      assessCacheServingFreshness({
        generatedAt,
        now: new Date(now),
        staleGraceHours: 24,
        ttlHours: 24,
      })

    expect(assessAt("2026-07-02T00:00:00.000Z")).toMatchObject({ status: "fresh" })
    expect(assessAt("2026-07-02T00:00:00.001Z")).toMatchObject({
      status: "stale_servable",
    })
    expect(assessAt("2026-07-03T00:00:00.000Z")).toMatchObject({
      status: "stale_servable",
    })
    expect(assessAt("2026-07-03T00:00:00.001Z")).toMatchObject({ status: "expired" })
  })

  it("fails closed for invalid or unbounded stale grace", () => {
    const base = {
      generatedAt: "2026-07-01T00:00:00.000Z",
      now: new Date("2026-07-02T12:00:00.000Z"),
      ttlHours: 24,
    }

    expect(assessCacheServingFreshness({ ...base, staleGraceHours: Number.POSITIVE_INFINITY }))
      .toEqual({ status: "invalid" })
    expect(assessCacheServingFreshness({ ...base, staleGraceHours: -1 }))
      .toEqual({ status: "invalid" })
    expect(
      assessCacheServingFreshness({
        ...base,
        staleGraceHours: MAX_CACHE_STALE_GRACE_HOURS + 1,
      }),
    ).toEqual({ status: "invalid" })
  })

  it("defaults grace to one TTL window with a hard seven-day cap", () => {
    expect(defaultCacheStaleGraceHours(24)).toBe(24)
    expect(defaultCacheStaleGraceHours(MAX_CACHE_STALE_GRACE_HOURS + 24))
      .toBe(MAX_CACHE_STALE_GRACE_HOURS)
  })
})
