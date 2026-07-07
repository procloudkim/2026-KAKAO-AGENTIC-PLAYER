import { describe, expect, it } from "vitest"

import seoulCultureSamplePayload from "./fixtures/seoul-culture-sample.json" with { type: "json" }
import {
  buildSeoulCultureRequest,
  createSeoulCultureSourceAdapter,
  normalizeSeoulCulturePayload,
} from "../src/sources/seoulCulture.js"
import type {
  SourceAdapterFailureResult,
  SourceAdapterRequest,
  SourceAdapterResult,
  SourceAdapterSuccess,
} from "../src/sources/types.js"

const sampleRequest: SourceAdapterRequest = {
  location: "Seoul",
  date_range: {
    start: "2026-10-28",
    end: "2026-10-28",
  },
  child_age: 8,
}

const sampleRedactedUrl =
  "https://openapi.example.test/<redacted>/json/culturalEventInfo/1/5/"

function expectFailure(result: SourceAdapterResult): SourceAdapterFailureResult {
  expect(result.ok).toBe(false)
  if (result.ok) {
    throw new Error("expected source adapter failure")
  }
  return result
}

function expectSuccess(result: SourceAdapterResult): SourceAdapterSuccess {
  expect(result.ok).toBe(true)
  if (!result.ok) {
    throw new Error("expected source adapter success")
  }
  return result
}

describe("Seoul culture event source adapter", () => {
  it("returns a missing_key failure when SEOUL_OPEN_DATA_KEY is absent", async () => {
    // Given: the optional Seoul adapter is configured without an Open Data key.
    const adapter = createSeoulCultureSourceAdapter({
      baseUrl: "https://openapi.example.test",
    })

    // When: the adapter is asked to list family experience candidates.
    const result = await adapter.list(sampleRequest)
    const failure = expectFailure(result)

    // Then: live source execution is disabled with a typed, non-retryable failure.
    expect(failure.source_id).toBe("seoul-culture-events")
    expect(failure.mode).toBe("live")
    expect(failure.failure).toMatchObject({
      code: "missing_key",
      retryable: false,
    })
  })

  it("redacts keyed url diagnostics when building Seoul Open Data requests", () => {
    // Given: a configured Seoul Open Data key.
    const rawKey = "seoul-open-data-secret-key"

    // When: the adapter builds its request URL and safe diagnostics.
    const request = buildSeoulCultureRequest({
      baseUrl: "https://openapi.example.test/",
      apiKey: rawKey,
      startIndex: 1,
      endIndex: 5,
    })
    const diagnosticsText = JSON.stringify(request.diagnostics)

    // Then: the operational request can be executed, while diagnostics redact the key.
    expect(request.url).toContain(rawKey)
    expect(request.diagnostics.redacted_url).toBe(sampleRedactedUrl)
    expect(diagnosticsText).not.toContain(rawKey)
  })

  it("redacts request loader error diagnostics when transport failure includes a keyed URL", async () => {
    // Given: a request loader throws an infrastructure error containing the operational keyed URL.
    const rawKey = "RAW_SECRET_KEY"
    const keyedUrl = "https://openapi.example.test/RAW_SECRET_KEY/json/culturalEventInfo/1/100/"
    const adapter = createSeoulCultureSourceAdapter({
      baseUrl: "https://openapi.example.test",
      apiKey: rawKey,
      requestJson: async (request) => {
        throw new Error(`transport failed for ${request.url}; apiKey=${rawKey}`)
      },
    })

    // When: the live adapter converts the thrown transport error to source diagnostics.
    const result = await adapter.list(sampleRequest)
    const failure = expectFailure(result)
    const diagnosticsText = JSON.stringify(failure.failure.diagnostics)

    // Then: the failure stays typed, while raw keys and keyed URLs are absent from diagnostics.
    expect(failure.failure.code).toBe("source_failure")
    expect(failure.failure.diagnostics?.redacted_url).toBe(
      "https://openapi.example.test/<redacted>/json/culturalEventInfo/1/100/",
    )
    expect(diagnosticsText).toContain("<redacted>")
    expect(diagnosticsText).not.toContain(rawKey)
    expect(diagnosticsText).not.toContain(keyedUrl)
  })

  it("returns a malformed_source failure when Seoul payload shape is malformed", () => {
    // Given: Seoul reports success, but the required row fields are absent.
    const malformedPayload = {
      culturalEventInfo: {
        list_total_count: 1,
        RESULT: {
          CODE: "INFO-000",
          MESSAGE: "정상 처리되었습니다",
        },
        row: [
          {
            TITLE: "missing stable source fields",
          },
        ],
      },
    }

    // When: the source boundary parses and normalizes the payload.
    const result = normalizeSeoulCulturePayload(malformedPayload, {
      request: sampleRequest,
      retrievedAt: "2026-07-02T00:00:00.000Z",
      redactedUrl: sampleRedactedUrl,
    })
    const failure = expectFailure(result)

    // Then: the adapter reports a typed source-shape failure without exposing keyed URLs.
    expect(failure.failure.code).toBe("malformed_source")
    expect(JSON.stringify(failure.failure.diagnostics)).not.toContain("secret")
  })

  it("normalizes a saved Seoul sample row into a source-backed candidate", () => {
    // Given: a saved sample row copied from the official OA-15486 sample endpoint.
    const samplePayload = seoulCultureSamplePayload

    // When: the source boundary parses and normalizes the payload.
    const result = normalizeSeoulCulturePayload(samplePayload, {
      request: sampleRequest,
      retrievedAt: "2026-07-02T00:00:00.000Z",
      redactedUrl: sampleRedactedUrl,
    })
    const success = expectSuccess(result)
    const record = success.records.at(0)
    if (record === undefined) {
      throw new Error("expected one Seoul culture record")
    }

    // Then: stable raw source fields map to the source contract candidate.
    expect(success.raw_snapshots).toHaveLength(1)
    expect(record.source.id).toBe("seoul-culture-events")
    expect(record.source.mode).toBe("live")
    expect(record.source.url).toBe(
      "https://culture.seoul.go.kr/culture/culture/cultureEvent/view.do?cultcode=158447&menuNo=200008",
    )
    expect(record.title).toBe("[꿈의숲아트센터] 꿈의숲 마티네 콘서트 [벨에포크 아트&뮤직] 시리즈3")
    expect(record.date).toMatchObject({
      start: "2026-10-28",
      end: "2026-10-28",
      time_text: "수요일 11:00",
    })
    expect(record.venue).toMatchObject({
      name: "북서울꿈의숲 상상톡톡미술관",
      address: "강북구",
    })
    expect(record.target_age_text).toBe("8세 이상 관람 가능")
    expect(record.min_child_age).toBe(8)
    expect(record.max_child_age).toBe(17)
    expect(record.child_stages).toEqual(expect.arrayContaining(["school_age", "teen"]))
    expect(record.fee_text).toContain("유료")
    expect(record.contact).toBe("02-399-1000")
    expect(record.tags).toEqual(expect.arrayContaining(["seoul", "콘서트", "강북구", "기타", "유료"]))
  })

  it("skips official rows whose age target is outside the child range", () => {
    // Given: Seoul returns an adult-only row before a child-compatible row.
    const childStageRequest: SourceAdapterRequest = {
      location: "Seoul",
      date_range: sampleRequest.date_range,
      child_stage: "school_age",
    }
    const sampleRow = seoulCultureSamplePayload.culturalEventInfo.row[0]
    const samplePayload = {
      culturalEventInfo: {
        ...seoulCultureSamplePayload.culturalEventInfo,
        list_total_count: 2,
        row: [
          {
            ...sampleRow,
            TITLE: "adult only official event",
            USE_TRGT: "20세 이상 관람 가능",
          },
          sampleRow,
        ],
      },
    }

    // When: the source boundary parses and normalizes the mixed payload.
    const result = normalizeSeoulCulturePayload(samplePayload, {
      request: childStageRequest,
      retrievedAt: "2026-07-02T00:00:00.000Z",
      redactedUrl: sampleRedactedUrl,
    })
    const success = expectSuccess(result)

    // Then: unsupported adult-only rows do not poison the child candidate list.
    expect(success.records).toHaveLength(1)
    expect(success.records[0]?.title).toBe("[꿈의숲아트센터] 꿈의숲 마티네 콘서트 [벨에포크 아트&뮤직] 시리즈3")
  })

  it("filters official rows that do not match the requested child stage", () => {
    // Given: the official sample row is marked for school-age and older children.
    const preschoolRequest: SourceAdapterRequest = {
      location: "Seoul",
      date_range: sampleRequest.date_range,
      child_stage: "preschool",
    }

    // When: a preschool request is matched against the source payload.
    const result = normalizeSeoulCulturePayload(seoulCultureSamplePayload, {
      request: preschoolRequest,
      retrievedAt: "2026-07-02T00:00:00.000Z",
      redactedUrl: sampleRedactedUrl,
    })
    const failure = expectFailure(result)

    // Then: the school-age row is not returned as a preschool recommendation.
    expect(failure.failure.code).toBe("no_match")
  })

  it("parses Korean school-age target text before child-stage filtering", () => {
    // Given: Seoul provides a non-numeric Korean age target.
    const sampleRow = seoulCultureSamplePayload.culturalEventInfo.row[0]
    const samplePayload = {
      culturalEventInfo: {
        ...seoulCultureSamplePayload.culturalEventInfo,
        row: [
          {
            ...sampleRow,
            USE_TRGT: "초등학생 이상 관람가",
          },
        ],
      },
    }
    const preschoolRequest: SourceAdapterRequest = {
      location: "Seoul",
      date_range: sampleRequest.date_range,
      child_stage: "preschool",
    }

    // When: the source boundary matches the row against a preschool request.
    const result = normalizeSeoulCulturePayload(samplePayload, {
      request: preschoolRequest,
      retrievedAt: "2026-07-02T00:00:00.000Z",
      redactedUrl: sampleRedactedUrl,
    })
    const failure = expectFailure(result)

    // Then: school-age Korean text is not treated as all-child ages.
    expect(failure.failure.code).toBe("no_match")
  })

  it("skips generic citizen target text without child-age evidence", () => {
    // Given: Seoul provides a generic audience label without child-age evidence.
    const sampleRow = seoulCultureSamplePayload.culturalEventInfo.row[0]
    const samplePayload = {
      culturalEventInfo: {
        ...seoulCultureSamplePayload.culturalEventInfo,
        row: [
          {
            ...sampleRow,
            USE_TRGT: "일반 시민",
          },
        ],
      },
    }

    // When: the source boundary matches it against a child-age request.
    const result = normalizeSeoulCulturePayload(samplePayload, {
      request: sampleRequest,
      retrievedAt: "2026-07-02T00:00:00.000Z",
      redactedUrl: sampleRedactedUrl,
    })
    const failure = expectFailure(result)

    // Then: generic audience text is not promoted as source-stated child fit.
    expect(failure.failure.code).toBe("no_match")
  })
})
