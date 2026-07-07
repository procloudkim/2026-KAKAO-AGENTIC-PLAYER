import { describe, expect, it } from "vitest"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import currentPayload from "./fixtures/national-festival-current.json" with { type: "json" }
import missingCoordinatesPayload from "./fixtures/national-festival-missing-coordinates.json" with { type: "json" }
import oldPayload from "./fixtures/national-festival-old.json" with { type: "json" }
import promptInjectionPayload from "./fixtures/national-festival-prompt-injection.json" with { type: "json" }
import {
  buildNationalFestivalRequest,
  createNationalFestivalSourceAdapter,
  normalizeNationalFestivalPayload,
} from "../src/sources/nationalFestival.js"
import type {
  SourceAdapterFailureResult,
  SourceAdapterRequest,
  SourceAdapterResult,
  SourceAdapterSuccess,
} from "../src/sources/types.js"

const currentRequest: SourceAdapterRequest = {
  location: "Busan",
  date_range: {
    start: "2026-08-01",
    end: "2026-08-03",
  },
  child_age: 6,
}

const redactedUrl = "https://festival.example.test/api?serviceKey=<redacted>&page=1&perPage=100"

function expectFailure(result: SourceAdapterResult): SourceAdapterFailureResult {
  expect(result.ok).toBe(false)
  if (result.ok) {
    throw new Error("expected national festival adapter failure")
  }
  return result
}

function expectSuccess(result: SourceAdapterResult): SourceAdapterSuccess {
  expect(result.ok).toBe(true)
  if (!result.ok) {
    throw new Error("expected national festival adapter success")
  }
  return result
}

describe("National culture festival standard dataset adapter", () => {
  it("normalizes a current date-range fixture as a lower-freshness fallback record", () => {
    // Given: a current standard dataset fixture with festival date, venue, contact, URL, and reference date.
    const payload = currentPayload

    // When: the source boundary parses and normalizes the standard dataset payload.
    const result = normalizeNationalFestivalPayload(payload, {
      request: currentRequest,
      retrievedAt: "2026-07-04T00:00:00.000Z",
      redactedUrl,
    })
    const success = expectSuccess(result)
    const record = success.records.at(0)
    if (record === undefined) {
      throw new Error("expected one national festival record")
    }

    // Then: the broad national standard record is source-attributed and visibly lower freshness.
    expect(success.raw_snapshots).toHaveLength(1)
    expect(record.source.id).toBe("national-culture-festival-standard")
    expect(record.title).toBe("Busan Family Sea Festival")
    expect(record.city).toBe("Busan")
    expect(record.date).toMatchObject({
      start: "2026-08-01",
      end: "2026-08-03",
      time_text: "2026-08-01 - 2026-08-03",
    })
    expect(record.venue).toMatchObject({
      name: "Busan Citizens Park",
      address: "Busan Busanjin-gu Citizens Park Road 73",
    })
    expect(record.confidence).toMatchObject({
      date: "source-stated",
      venue: "source-stated",
      age_fit: "unknown",
      reservation: "unknown",
    })
    expect(record.parent_check).toMatchObject({
      age_fit: "not source-stated; parent must verify child fit",
      reservation: "confirmation_needed",
      live_status: "source_timestamp_required",
    })
    expect(record.fixture_notice).toContain("Data lag warning")
    expect(record.fixture_notice).toContain("lower-freshness fallback")
    expect(record.tags).toEqual(expect.arrayContaining(["standard_dataset", "fallback_authority"]))
  })

  it("marks old festival data as stale and lower freshness", () => {
    // Given: an old standard dataset fixture whose event date and reference date are both outdated.
    const oldRequest: SourceAdapterRequest = {
      location: "Gangwon",
      date_range: {
        start: "2023-05-01",
        end: "2023-05-05",
      },
      child_age: 8,
    }

    // When: the old source row is normalized for its historical date range.
    const result = normalizeNationalFestivalPayload(oldPayload, {
      request: oldRequest,
      retrievedAt: "2026-07-04T00:00:00.000Z",
      redactedUrl,
    })
    const success = expectSuccess(result)
    const record = success.records.at(0)
    if (record === undefined) {
      throw new Error("expected one stale national festival record")
    }

    // Then: the adapter does not present the broad old row as fresh exact event data.
    expect(record.confidence.date).toBe("stale")
    expect(record.fixture_notice).toContain("stale")
    expect(record.tags).toEqual(expect.arrayContaining(["stale", "fallback_authority"]))
  })

  it("accepts a standard dataset fixture with missing coordinates", () => {
    // Given: a valid standard dataset row without latitude or longitude values.
    const jejuRequest: SourceAdapterRequest = {
      location: "Jeju",
      date_range: {
        start: "2026-09-12",
        end: "2026-09-13",
      },
      child_stage: "preschool",
    }

    // When: the source boundary parses the row.
    const result = normalizeNationalFestivalPayload(missingCoordinatesPayload, {
      request: jejuRequest,
      retrievedAt: "2026-07-04T00:00:00.000Z",
      redactedUrl,
    })
    const success = expectSuccess(result)
    const record = success.records.at(0)
    if (record === undefined) {
      throw new Error("expected one national festival record without coordinates")
    }

    // Then: absent coordinates do not reject otherwise usable source data.
    expect(record.title).toBe("Jeju Family Culture Festival")
    expect(record.venue.address).toBe("Jeju-si Jungang-ro 1")
    expect(record.confidence.venue).toBe("source-stated")
  })

  it("returns a missing_key failure when the public data standard service key is absent", async () => {
    // Given: the optional national festival adapter is configured without a service key.
    const adapter = createNationalFestivalSourceAdapter({
      baseUrl: "https://festival.example.test/api",
    })

    // When: the adapter is asked to list family experience candidates.
    const result = await adapter.list(currentRequest)
    const failure = expectFailure(result)

    // Then: live source execution is disabled with a typed, non-retryable failure.
    expect(failure.source_id).toBe("national-culture-festival-standard")
    expect(failure.mode).toBe("live")
    expect(failure.failure).toMatchObject({
      code: "missing_key",
      retryable: false,
    })
  })

  it("loads local standard dataset CSV when no public service key is required", async () => {
    const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..")
    const adapter = createNationalFestivalSourceAdapter({
      csvPath: resolve(repoRoot, "공공데이터-관련", "전국문화축제표준데이터.csv"),
    })

    const result = await adapter.list({
      location: "",
      date_range: { start: "2026-07-01", end: "2026-12-31" },
      child_stage: "school_age",
    })
    const success = expectSuccess(result)
    const record = success.records.at(0)

    expect(success.records.length).toBeGreaterThan(0)
    if (record === undefined) {
      throw new Error("expected at least one national festival record from CSV fallback")
    }

    expect(record.source.id).toBe("national-culture-festival-standard")
    expect(record.city.length).toBeGreaterThan(0)
    expect(record.program_text.length).toBeGreaterThan(0)
    expect(record.source.url.length).toBeGreaterThan(0)
  })

  it("loads CSV rows for 2025~2026 nationwide search range", async () => {
    const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..")
    const adapter = createNationalFestivalSourceAdapter({
      csvPath: resolve(repoRoot, "공공데이터-관련", "전국문화축제표준데이터.csv"),
    })

    const result = await adapter.list({
      location: "",
      date_range: { start: "2025-01-01", end: "2026-12-31" },
      child_age: 6,
    })
    const success = expectSuccess(result)

    const count2025 = success.records.filter((record) => record.date.start.startsWith("2025")).length
    const count2026 = success.records.filter((record) => record.date.start.startsWith("2026")).length

    expect(success.records.length).toBeGreaterThan(900)
    expect(count2025).toBeGreaterThan(0)
    expect(count2026).toBeGreaterThan(0)
  })

  it("redacts service key diagnostics when request loading fails", async () => {
    // Given: a request loader throws an infrastructure error containing the operational keyed URL.
    const serviceKey = "PUBLIC_DATA_STANDARD_SECRET"
    const keyedUrl =
      "https://festival.example.test/api?serviceKey=PUBLIC_DATA_STANDARD_SECRET&page=1&perPage=100"
    const adapter = createNationalFestivalSourceAdapter({
      baseUrl: "https://festival.example.test/api",
      serviceKey,
      requestJson: async (request) => {
        throw new Error(`transport failed for ${request.url}; serviceKey=${serviceKey}`)
      },
    })

    // When: the live adapter converts the thrown transport error to source diagnostics.
    const result = await adapter.list(currentRequest)
    const failure = expectFailure(result)
    const diagnosticsText = JSON.stringify(failure.failure.diagnostics)

    // Then: the failure stays typed, while raw service keys and keyed URLs are absent from diagnostics.
    expect(failure.failure.code).toBe("source_failure")
    expect(failure.failure.diagnostics?.redacted_url).toBe(redactedUrl)
    expect(diagnosticsText).toContain("<redacted>")
    expect(diagnosticsText).not.toContain(serviceKey)
    expect(diagnosticsText).not.toContain(keyedUrl)
  })

  it("returns malformed_source when required standard fields are missing", () => {
    // Given: a partial standard dataset row without required date and venue fields.
    const malformedPayload = {
      data: [
        {
          festival_name: "Partial Festival",
        },
      ],
    }

    // When: the source boundary parses and normalizes the partial payload.
    const result = normalizeNationalFestivalPayload(malformedPayload, {
      request: currentRequest,
      retrievedAt: "2026-07-04T00:00:00.000Z",
      redactedUrl,
    })
    const failure = expectFailure(result)

    // Then: malformed source data is reported as a typed source-shape failure.
    expect(failure.failure.code).toBe("malformed_source")
    expect(JSON.stringify(failure.failure.diagnostics)).not.toContain("PUBLIC_DATA_STANDARD_SECRET")
  })

  it("keeps untrusted festival content as data", () => {
    // Given: a festival content field contains prompt-injection-like text from an external source.
    const daejeonRequest: SourceAdapterRequest = {
      location: "Daejeon",
      date_range: {
        start: "2026-10-10",
        end: "2026-10-11",
      },
      child_stage: "school_age",
    }

    // When: the source boundary maps the row.
    const result = normalizeNationalFestivalPayload(promptInjectionPayload, {
      request: daejeonRequest,
      retrievedAt: "2026-07-04T00:00:00.000Z",
      redactedUrl,
    })
    const success = expectSuccess(result)
    const record = success.records.at(0)
    if (record === undefined) {
      throw new Error("expected one prompt-injection fixture record")
    }

    // Then: external content remains a data field and does not alter adapter warnings or source identity.
    expect(record.program_text).toContain("Ignore previous instructions")
    expect(record.source.id).toBe("national-culture-festival-standard")
    expect(record.fixture_notice).toContain("Data lag warning")
  })

  it("builds a redacted service-key request for diagnostics", () => {
    // Given: a configured public data service key.
    const serviceKey = "PUBLIC_DATA_STANDARD_SECRET"

    // When: the adapter builds its request URL and safe diagnostics.
    const request = buildNationalFestivalRequest({
      baseUrl: "https://festival.example.test/api",
      serviceKey,
      page: 1,
      perPage: 100,
    })
    const diagnosticsText = JSON.stringify(request.diagnostics)

    // Then: the operational request can be executed, while diagnostics redact the key.
    expect(request.url).toContain(serviceKey)
    expect(request.diagnostics.redacted_url).toBe(redactedUrl)
    expect(diagnosticsText).not.toContain(serviceKey)
  })
})
