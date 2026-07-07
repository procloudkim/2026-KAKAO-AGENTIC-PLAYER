import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  buildCulturePortalRequest,
  createCulturePortalSourceAdapter,
  normalizeCulturePortalXml,
} from "../src/sources/culturePortal.js"
import type {
  SourceAdapterFailureResult,
  SourceAdapterRequest,
  SourceAdapterResult,
  SourceAdapterSuccess,
} from "../src/sources/types.js"

const sampleRequest: SourceAdapterRequest = {
  location: "Busan",
  date_range: {
    start: "2026-07-18",
    end: "2026-07-19",
  },
  child_age: 5,
}

const sampleRedactedUrl =
  "https://apis.example.test/period2?from=20260718&to=20260719&cPage=1&rows=10&place=Busan&gpsxfrom=&gpsyfrom=&gpsxto=&gpsyto=&keyword=&sortStdr=1&serviceKey=%3Credacted%3E"

function fixture(name: string): string {
  return readFileSync(join(import.meta.dirname, "fixtures", name), "utf8")
}

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

describe("Culture Portal one-view source adapter", () => {
  it("returns a missing_key failure when CULTURE_PORTAL_SERVICE_KEY is absent", async () => {
    // Given: the optional Culture Portal adapter is configured without a service key.
    const adapter = createCulturePortalSourceAdapter({
      baseUrl: "https://apis.example.test",
    })

    // When: the adapter is asked to list family experience candidates.
    const result = await adapter.list(sampleRequest)
    const failure = expectFailure(result)

    // Then: live source execution is disabled with a typed, non-retryable failure.
    expect(failure.source_id).toBe("culture-portal-oneview")
    expect(failure.mode).toBe("live")
    expect(failure.failure).toMatchObject({
      code: "missing_key",
      retryable: false,
    })
  })

  it("redacts keyed url diagnostics when building Culture Portal requests", () => {
    // Given: a configured Culture Portal service key.
    const rawKey = "culture-portal-service-secret-key"

    // When: the adapter builds its request URL and safe diagnostics.
    const request = buildCulturePortalRequest({
      baseUrl: "https://apis.example.test/",
      serviceKey: rawKey,
      from: "20260718",
      to: "20260719",
      page: 1,
      rows: 10,
      place: "Busan",
    })
    const diagnosticsText = JSON.stringify(request.diagnostics)

    // Then: the operational request can be executed, while diagnostics redact the key.
    expect(request.url).toContain(encodeURIComponent(rawKey))
    expect(request.diagnostics.redacted_url).toBe(sampleRedactedUrl)
    expect(diagnosticsText).not.toContain(rawKey)
  })

  it("redacts request loader diagnostics when transport failure includes a keyed URL", async () => {
    // Given: a request loader throws an infrastructure error containing the operational keyed URL.
    const rawKey = "RAW_CULTURE_PORTAL_KEY"
    const adapter = createCulturePortalSourceAdapter({
      baseUrl: "https://apis.example.test",
      serviceKey: rawKey,
      requestXml: async (request) => {
        throw new Error(`transport failed for ${request.url}; serviceKey=${rawKey}`)
      },
    })

    // When: the live adapter converts the thrown transport error to source diagnostics.
    const result = await adapter.list(sampleRequest)
    const failure = expectFailure(result)
    const diagnosticsText = JSON.stringify(failure.failure.diagnostics)

    // Then: the failure stays typed, while raw keys and keyed URLs are absent from diagnostics.
    expect(failure.failure.code).toBe("source_failure")
    expect(failure.failure.diagnostics?.redacted_url).toContain("serviceKey=%3Credacted%3E")
    expect(diagnosticsText).toContain("<redacted>")
    expect(diagnosticsText).not.toContain(rawKey)
    expect(diagnosticsText).not.toContain(encodeURIComponent(rawKey))
  })

  it("returns source_invalid_response when Culture Portal XML is malformed", () => {
    // Given: Culture Portal returns malformed XML.
    const malformedXml = fixture("culture-portal-malformed.xml")

    // When: the source boundary parses and normalizes the XML payload.
    const result = normalizeCulturePortalXml(malformedXml, {
      request: sampleRequest,
      retrievedAt: "2026-07-04T00:00:00.000Z",
      redactedUrl: sampleRedactedUrl,
    })
    const failure = expectFailure(result)

    // Then: the adapter reports a typed invalid-response failure without exposing keyed URLs.
    expect(failure.failure.code).toBe("source_invalid_response")
    expect(JSON.stringify(failure.failure.diagnostics)).not.toContain("secret")
  })

  it("normalizes a Culture Portal period fixture into a source-backed candidate", () => {
    // Given: a saved period-compatible Culture Portal XML response.
    const xml = fixture("culture-portal-period-valid.xml")

    // When: the source boundary parses and normalizes the XML payload.
    const result = normalizeCulturePortalXml(xml, {
      request: sampleRequest,
      retrievedAt: "2026-07-04T00:00:00.000Z",
      redactedUrl: sampleRedactedUrl,
    })
    const success = expectSuccess(result)
    const record = success.records.at(0)
    if (record === undefined) {
      throw new Error("expected one Culture Portal record")
    }

    // Then: stable raw source fields map to the source contract candidate.
    expect(success.raw_snapshots).toHaveLength(1)
    expect(record.source.id).toBe("culture-portal-oneview")
    expect(record.source.mode).toBe("live")
    expect(record.source.url).toBe("https://culture.example.test/events/CP-202607-A")
    expect(record.title).toBe("Busan Family Ocean Concert")
    expect(record.date).toMatchObject({
      start: "2026-07-18",
      end: "2026-07-19",
    })
    expect(record.venue).toMatchObject({
      name: "Busan Culture Center",
      address: "Busan",
    })
    expect(record.confidence).toMatchObject({
      date: "api-returned",
      venue: "api-returned",
      age_fit: "unknown",
      reservation: "unknown",
    })
    expect(record.parent_check).toMatchObject({
      age_fit: "unknown",
      reservation: "confirmation_needed",
      live_status: "source_timestamp_required",
    })
    expect(record.child_stages).toEqual(["infant", "toddler", "preschool", "school_age", "teen"])
    expect(record.min_child_age).toBe(0)
    expect(record.max_child_age).toBe(17)
    expect(record.fee_text).toBe("child 5,000 KRW")
    expect(record.reservation_url).toBeNull()
    expect(record.program_text).toContain("ignore previous instructions")
    expect(record.tags).toEqual(
      expect.arrayContaining([
        "culture-portal",
        "Busan",
        "performance",
        "coordinates_source_provided",
        "thumbnail_source_provided",
        "source_gpsX:129.0934",
        "source_gpsY:35.1379",
        "source_thumbnail:https://culture.example.test/thumbs/CP-202607-A.jpg",
      ]),
    )
  })
})
