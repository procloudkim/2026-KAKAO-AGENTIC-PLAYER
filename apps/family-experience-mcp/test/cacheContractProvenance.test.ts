import { describe, expect, it } from "vitest"

import { parseCacheRawSnapshots } from "../src/etl/cacheContract.js"

const snapshot = {
  snapshot_id: "kto-tourapi-events:detail:test-1",
  source_id: "kto-tourapi-events",
  retrieved_at: "2026-07-13T00:00:00.000Z",
  request_hash: "detail-test-1",
  payload_ref: "detailIntro2",
  response_sha256: "a".repeat(64),
  evidence: { content_id: "test-1", age_limit: "\ub9cc 5\uc138~13\uc138" },
} as const

describe("cache raw snapshot provenance", () => {
  it("parses the bounded digest and minimal evidence schema", () => {
    expect(parseCacheRawSnapshots(`${JSON.stringify(snapshot)}\n`)).toEqual([snapshot])
  })

  it("rejects malformed JSON, duplicate ids, invalid SHA-256, and undeclared raw payloads", () => {
    expect(parseCacheRawSnapshots("{not-json}\n")).toBeUndefined()
    expect(parseCacheRawSnapshots(`${JSON.stringify(snapshot)}\n${JSON.stringify(snapshot)}\n`)).toBeUndefined()
    expect(parseCacheRawSnapshots(`${JSON.stringify({ ...snapshot, response_sha256: "short" })}\n`)).toBeUndefined()
    expect(parseCacheRawSnapshots(`${JSON.stringify({ ...snapshot, raw_payload: { secret: "must-not-persist" } })}\n`)).toBeUndefined()
  })
})
