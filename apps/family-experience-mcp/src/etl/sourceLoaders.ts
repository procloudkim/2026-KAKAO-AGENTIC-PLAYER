import { request as requestHttp, type ClientRequest, type IncomingMessage } from "node:http"
import { request as requestHttps } from "node:https"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

import {
  loadFamilyExperienceConfig,
  type FamilyExperienceConfig,
  type FamilyExperienceSourceSetEntry,
  DEFAULT_CULTURE_PORTAL_BASE_URL,
  DEFAULT_NATIONAL_CULTURE_FESTIVAL_CSV_PATH,
} from "../config.js"
import { createCulturePortalSourceAdapter, normalizeCulturePortalXml } from "../sources/culturePortal.js"
import { createKtoTourApiSourceAdapter, normalizeKtoTourApiPayload } from "../sources/ktoTourApi.js"
import { createNationalFestivalSourceAdapter, normalizeNationalFestivalPayload } from "../sources/nationalFestival.js"
import { createSeoulCultureSourceAdapter } from "../sources/seoulCulture.js"
import { fixtureSourceAdapter } from "../sources/fixture.js"
import { normalizeSeoulCulturePayload } from "../sources/seoulCulture.js"
import type { SourceAdapterRequest, SourceAdapterResult, SourceId } from "../sources/types.js"
import { requestSeoulCultureJson } from "../sources/httpJson.js"
import {
  culturePortalFixtureXml,
  fixtureRetrievedAt,
  ktoTourApiFixturePayload,
  nationalFestivalFixturePayload,
  seoulCultureFixturePayload,
} from "./nationwideFixtures.js"

export const sourceMap = {
  fixture: "fixture-family-experience-v1",
  seoul: "seoul-culture-events",
  culture_portal: "culture-portal-oneview",
  kto_tourapi: "kto-tourapi-events",
  national_festival: "national-culture-festival-standard",
} as const satisfies Record<FamilyExperienceSourceSetEntry, SourceId>

export async function loadSource(input: {
  readonly fixture: boolean
  readonly source: FamilyExperienceSourceSetEntry
  readonly env?: NodeJS.ProcessEnv
}): Promise<SourceAdapterResult> {
  if (input.fixture) {
    return fixtureSourceResult(input.source)
  }
  return liveSourceResult(input.source, loadFamilyExperienceConfig(input.env))
}

function liveSourceResult(
  source: FamilyExperienceSourceSetEntry,
  config: FamilyExperienceConfig,
): Promise<SourceAdapterResult> {
  const request: SourceAdapterRequest = {
    location: "",
    date_range: { start: "2026-07-04", end: "2026-07-31" },
    child_age: 6,
  }

  if (source === "seoul") {
    const adapter = createSeoulCultureSourceAdapter({
      baseUrl: config.seoulOpenDataBaseUrl,
      ...(config.seoulOpenDataKey === undefined ? {} : { apiKey: config.seoulOpenDataKey }),
      requestJson: requestSeoulCultureJson,
    })
    return adapter.list({ ...request, location: "Seoul", child_age: 8 })
  }

  if (source === "culture_portal") {
    const adapter = createCulturePortalSourceAdapter({
      baseUrl: config.culturePortalBaseUrl ?? DEFAULT_CULTURE_PORTAL_BASE_URL,
      ...(config.culturePortalServiceKey === undefined ? {} : { serviceKey: config.culturePortalServiceKey }),
      requestXml: (request) => requestText(request.url),
    })
    return adapter.list({ ...request, child_age: 5 })
  }

  if (source === "kto_tourapi") {
    const adapter = createKtoTourApiSourceAdapter({
      baseUrl: config.ktoTourApiBaseUrl ?? "https://apis.data.go.kr/B551011/KorService2",
      ...(config.ktoTourApiServiceKey === undefined ? {} : { serviceKey: config.ktoTourApiServiceKey }),
      requestText: (request) => requestText(request.url),
    })
    return adapter.list({ ...request, child_stage: "school_age" })
  }

  if (source === "national_festival") {
    const csvPath = resolveNationalCultureFestivalCsvPath(config.nationalCultureFestivalCsvPath)

    if (csvPath !== undefined) {
      const adapter = createNationalFestivalSourceAdapter({
        csvPath,
        requestJson: (request) => requestJson(request.url),
      })
      return adapter.list({ ...request, child_age: 6 })
    }

    if (config.publicDataStandardServiceKey === undefined) {
      return Promise.resolve({
        ok: false,
        source_id: sourceMap[source],
        mode: "live",
        failure: {
          code: "missing_key",
          message: "PUBLIC_DATA_STANDARD_SERVICE_KEY is required when CSV fallback is unavailable.",
          retryable: false,
        },
      })
    }

    if (config.nationalCultureFestivalBaseUrl === undefined) {
      return Promise.resolve({
        ok: false,
        source_id: sourceMap[source],
        mode: "live",
        failure: {
          code: "source_unavailable",
          message: "NATIONAL_CULTURE_FESTIVAL_BASE_URL is required for live extraction.",
          retryable: false,
        },
      })
    }

    const adapter = createNationalFestivalSourceAdapter({
      baseUrl: config.nationalCultureFestivalBaseUrl,
      serviceKey: config.publicDataStandardServiceKey,
      requestJson: (request) => requestJson(request.url),
    })
    return adapter.list({ ...request, child_age: 6 })
  }

  return Promise.resolve(liveUnavailable(source))
}

function resolveNationalCultureFestivalCsvPath(csvPath: string | undefined): string | undefined {
  const candidate = csvPath === undefined || csvPath.trim().length === 0 ? DEFAULT_NATIONAL_CULTURE_FESTIVAL_CSV_PATH : csvPath
  const trimmed = candidate.trim()
  if (trimmed.length === 0) {
    return undefined
  }

  const candidates = [
    trimmed,
    resolve(process.cwd(), trimmed),
    resolve(process.cwd(), "..", trimmed),
    resolve(process.cwd(), "..", "..", trimmed),
  ]

  return candidates.find((path) => existsSync(path))
}

async function fixtureSourceResult(source: FamilyExperienceSourceSetEntry): Promise<SourceAdapterResult> {
  const redactedUrl = `https://fixture.example.test/${source}?serviceKey=<redacted>`
  switch (source) {
    case "fixture":
      return fixtureSourceAdapter.list({
        location: "Seoul",
        date_range: { start: "2026-07-04", end: "2026-07-04" },
        child_age: 4,
      })
    case "seoul":
      return normalizeSeoulCulturePayload(seoulCultureFixturePayload, {
        request: { location: "Seoul", date_range: { start: "2026-10-28", end: "2026-10-28" }, child_age: 8 },
        retrievedAt: fixtureRetrievedAt,
        redactedUrl,
      })
    case "culture_portal":
      return normalizeCulturePortalXml(culturePortalFixtureXml, {
        request: { location: "Busan", date_range: { start: "2026-07-18", end: "2026-07-19" }, child_age: 5 },
        retrievedAt: fixtureRetrievedAt,
        redactedUrl,
      })
    case "kto_tourapi":
      return normalizeKtoTourApiPayload(ktoTourApiFixturePayload, {
        request: { location: "Jeju", date_range: { start: "2026-08-01", end: "2026-08-02" }, child_stage: "school_age" },
        retrievedAt: fixtureRetrievedAt,
        redactedUrl,
        sourceUrl: "https://fixture.example.test/detailCommon2",
      })
    case "national_festival":
      return normalizeNationalFestivalPayload(nationalFestivalFixturePayload, {
        request: { location: "Busan", date_range: { start: "2026-08-01", end: "2026-08-03" }, child_age: 6 },
        retrievedAt: fixtureRetrievedAt,
        redactedUrl,
      })
    default:
      return assertNeverSource(source)
  }
}

function liveUnavailable(source: FamilyExperienceSourceSetEntry): SourceAdapterResult {
  return {
    ok: false,
    source_id: sourceMap[source],
    mode: "live",
    failure: {
      code: "source_unavailable",
      message: "Nationwide ETL live extraction source is not implemented.",
      retryable: false,
    },
  }
}

async function requestText(url: string): Promise<string> {
  const requestUrl = new URL(url)
  const requester = selectRequester(requestUrl)
  if (requester === undefined) {
    throw new Error(`Unsupported protocol for request: ${requestUrl.protocol}`)
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false
    let activeRequest: ClientRequest | undefined

    const fail = (error: Error): void => {
      if (settled) {
        return
      }
      settled = true
      activeRequest?.destroy()
      reject(error)
    }

    activeRequest = requester(requestUrl, { method: "GET" }, (response: IncomingMessage) => {
      const chunks: Buffer[] = []
      response.on("data", (chunk: Buffer | string) => {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
      })
      response.on("end", () => {
        if (settled) {
          return
        }
        const statusCode = response.statusCode ?? 0
        const body = Buffer.concat(chunks).toString("utf8")
        if (statusCode < 200 || statusCode >= 300) {
          fail(new Error(`request failed with HTTP ${statusCode}: ${requestUrl.href}`))
          return
        }

        settled = true
        resolve(body)
      })
      response.on("error", (error) => {
        fail(error instanceof Error ? error : new Error("request stream failed"))
      })
    })

    activeRequest.setTimeout(20_000, () => {
      fail(new Error(`request timeout after 20 seconds: ${requestUrl.href}`))
    })
    activeRequest.on("error", fail)
    activeRequest.end()
  })
}

async function requestJson(url: string): Promise<unknown> {
  const text = await requestText(url)
  return JSON.parse(text)
}

function selectRequester(url: URL): typeof requestHttp | typeof requestHttps | undefined {
  switch (url.protocol) {
    case "http:":
      return requestHttp
    case "https:":
      return requestHttps
    default:
      return undefined
  }
}

function assertNeverSource(source: never): never {
  throw new Error(`Unhandled source: ${source}`)
}
