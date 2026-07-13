import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"

import * as z from "zod/v4"

import type { ChildStage } from "../types.js"
import type {
  FamilyExperienceSourceAdapter,
  FamilyExperienceSourceRecord,
  RawSourceSnapshot,
  SourceAdapterFailure,
  SourceAdapterRequest,
  SourceAdapterResult,
} from "./types.js"

export type BuiltNationalFestivalRequest = {
  readonly url: string
  readonly diagnostics: { readonly redacted_url: string }
}

const sourceId = "national-culture-festival-standard"
const mode = "live"
const datasetUrl = "https://www.data.go.kr/data/15013104/standard.do"
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const staleReferenceDays = 370
const allChildStages = ["infant", "toddler", "preschool", "school_age", "teen"] as const satisfies readonly ChildStage[]
const cityRules = [
  ["seoul", "Seoul"],
  ["서울", "Seoul"],
  ["busan", "Busan"],
  ["부산", "Busan"],
  ["daegu", "Daegu"],
  ["대구", "Daegu"],
  ["daejeon", "Daejeon"],
  ["대전", "Daejeon"],
  ["gwangju", "Gwangju"],
  ["광주", "Gwangju"],
  ["incheon", "Incheon"],
  ["인천", "Incheon"],
  ["gangwon", "Gangwon"],
  ["강원", "Gangwon"],
  ["jeju", "Jeju"],
  ["제주", "Jeju"],
] as const

const nonEmptyTextSchema = z.string().trim().min(1)

const rowSchema = z.object({
  festival_name: nonEmptyTextSchema,
  place: nonEmptyTextSchema,
  start_date: nonEmptyTextSchema,
  end_date: nonEmptyTextSchema,
  content: nonEmptyTextSchema,
  organization: nonEmptyTextSchema,
  phone: z.string().trim(),
  homepage: z.string().trim(),
  address: nonEmptyTextSchema,
  latitude: z.string().trim().optional(),
  longitude: z.string().trim().optional(),
  data_reference_date: nonEmptyTextSchema,
})

const payloadSchema = z.object({ data: z.array(rowSchema) })

type Row = z.infer<typeof rowSchema>

const csvHeaderMap = {
  축제명: "festival_name",
  개최장소: "place",
  축제시작일자: "start_date",
  축제종료일자: "end_date",
  축제내용: "content",
  주관기관명: "organization",
  주최기관명: "organization",
  전화번호: "phone",
  홈페이지주소: "homepage",
  소재지도로명주소: "address",
  소재지지번주소: "address",
  위도: "latitude",
  경도: "longitude",
  데이터기준일자: "data_reference_date",
} as const

type CsvHeaderName = keyof typeof csvHeaderMap

type NationalFestivalSourceAdapterOptions = {
  readonly baseUrl?: string
  readonly serviceKey?: string
  readonly csvPath?: string
  readonly requestJson?: (request: BuiltNationalFestivalRequest) => Promise<unknown>
  readonly nowIso?: () => string
}

export function buildNationalFestivalRequest(
  options: { readonly baseUrl: string; readonly serviceKey: string; readonly page: number; readonly perPage: number },
): BuiltNationalFestivalRequest {
  const requestUrl = new URL(options.baseUrl)
  requestUrl.searchParams.set("serviceKey", options.serviceKey)
  requestUrl.searchParams.set("page", String(options.page))
  requestUrl.searchParams.set("perPage", String(options.perPage))

  const redactedUrl = new URL(options.baseUrl)
  redactedUrl.searchParams.set("serviceKey", "<redacted>")
  redactedUrl.searchParams.set("page", String(options.page))
  redactedUrl.searchParams.set("perPage", String(options.perPage))

  return {
    url: requestUrl.toString(),
    diagnostics: { redacted_url: redactedUrl.toString().replace("serviceKey=%3Credacted%3E", "serviceKey=<redacted>") },
  }
}

export function createNationalFestivalSourceAdapter(
  options: NationalFestivalSourceAdapterOptions,
): FamilyExperienceSourceAdapter {
  return {
    source_id: sourceId,
    mode,
    list: async (request) => {
      const retrievedAt = options.nowIso?.() ?? new Date().toISOString()

      if (options.csvPath !== undefined && options.csvPath.trim().length > 0) {
        try {
          const payload = await loadNationalFestivalCsvPayload(options.csvPath)
          return normalizeNationalFestivalPayload(payload, {
            request,
            retrievedAt,
            redactedUrl: `file://${options.csvPath}`,
          })
        } catch (error: unknown) {
          return failure({
            code: "source_failure",
            message: "National festival CSV source loading failed.",
            retryable: false,
            diagnostics: {
              redacted_url: `file://${options.csvPath}`,
              detail: error instanceof Error ? error.message : "CSV loader returned unknown error",
            },
          })
        }
      }

      if (options.serviceKey === undefined || options.serviceKey.trim().length === 0) {
        return failure({
          code: "missing_key",
          message: "PUBLIC_DATA_STANDARD_SERVICE_KEY is required.",
          retryable: false,
        })
      }

      if (options.baseUrl === undefined) {
        return failure({
          code: "source_unavailable",
          message: "NATIONAL_CULTURE_FESTIVAL_BASE_URL is required for live extraction.",
          retryable: false,
        })
      }

      const built = buildNationalFestivalRequest({
        baseUrl: options.baseUrl,
        serviceKey: options.serviceKey,
        page: 1,
        perPage: 100,
      })

      if (options.requestJson === undefined) {
        return failure({
          code: "source_unavailable",
          message: "National festival live request loader is not configured.",
          retryable: false,
          diagnostics: {
            redacted_url: built.diagnostics.redacted_url,
            detail: "Adapter is available for injected loaders and fixtures; MCP live fan-out is not wired.",
          },
        })
      }

      try {
        const payload = await options.requestJson(built)
        return normalizeNationalFestivalPayload(payload, {
          request,
          retrievedAt,
          redactedUrl: built.diagnostics.redacted_url,
        })
      } catch (error: unknown) {
        const detail =
          error instanceof Error
            ? redactRequestDetail(error.message, built, options.serviceKey)
            : "request loader threw a non-Error value"
        return failure({
          code: "source_failure",
          message: "National festival source request failed.",
          retryable: true,
          diagnostics: { ...built.diagnostics, detail },
        })
      }
    },
  }
}

export function normalizeNationalFestivalPayload(
  payload: unknown,
  context: { readonly request: SourceAdapterRequest; readonly retrievedAt: string; readonly redactedUrl: string },
): SourceAdapterResult {
  const parsed = payloadSchema.safeParse(payload)
  if (!parsed.success) {
    return failure({
      code: "malformed_source",
      message: "National festival payload did not match expected standard dataset fields.",
      retryable: false,
      diagnostics: {
        redacted_url: context.redactedUrl,
        detail: parsed.error.issues.map((issue) => issue.path.join(".")).join(", "),
      },
    })
  }

  const requestHash = hash(context.redactedUrl)
  const rawSnapshot: RawSourceSnapshot = {
    snapshot_id: `${sourceId}:raw:${requestHash}`,
    source_id: sourceId,
    retrieved_at: context.retrievedAt,
    request_hash: requestHash,
    payload_ref: "national-culture-festival-standard",
  }
  const records = parsed.data.data
    .map((row) => normalizeRow(row, context.request, context.retrievedAt, rawSnapshot.snapshot_id))
    .filter(isFamilyExperienceSourceRecord)
    .filter((record) => matchesRequest(record, context.request))

  if (records.length === 0) {
    return failure({
      code: "no_match",
      message: "National festival standard dataset returned no festivals matching the request.",
      retryable: false,
      diagnostics: { redacted_url: context.redactedUrl },
    })
  }

  return {
    ok: true,
    source_id: sourceId,
    mode,
    retrieved_at: context.retrievedAt,
    raw_snapshots: [rawSnapshot],
    records,
  }
}

function normalizeRow(
  row: Row,
  request: SourceAdapterRequest,
  retrievedAt: string,
  rawSnapshotId: string,
): FamilyExperienceSourceRecord | undefined {
  const start = sourceDate(row.start_date)
  const end = sourceDate(row.end_date)
  if (start === undefined || end === undefined) {
    return undefined
  }

  const city = cityFromAddress(row.address)
  const stale = isStale(row.end_date, row.data_reference_date, retrievedAt)
  const sourceUrl = /^https?:\/\//iu.test(row.homepage) ? row.homepage : datasetUrl
  const baseTags = ["standard_dataset", "fallback_authority", city, row.organization]
  const tags = stale ? [...baseTags, "stale"] : baseTags

  return {
    id: `${sourceId}:${hash(`${row.festival_name}|${row.place}|${row.start_date}|${row.address}`)}`,
    raw_snapshot_id: rawSnapshotId,
    mode,
    title: row.festival_name,
    city,
    date: { start, end, time_text: `${start} - ${end}` },
    venue: { name: row.place, address: row.address },
    source: { id: sourceId, mode, url: sourceUrl, raw_snapshot_id: rawSnapshotId },
    retrieved_at: retrievedAt,
    confidence: {
      date: stale ? "stale" : "source-stated",
      venue: "source-stated",
      age_fit: "unknown",
      reservation: "unknown",
    },
    parent_check: {
      age_fit: "not source-stated; parent must verify child fit",
      reservation: "confirmation_needed",
      live_status: "source_timestamp_required",
    },
    child_stages: allChildStages,
    min_child_age: 0,
    max_child_age: 17,
    indoor_outdoor: "unknown",
    target_age_text: "not source-stated",
    program_text: row.content,
    reservation_url: sourceUrl === datasetUrl ? null : sourceUrl,
    contact: row.phone.length > 0 ? row.phone : null,
    fee_text: "not source-stated",
    tags,
    suitability: "edge_unsuitable",
    fixture_notice: freshnessNotice(row.data_reference_date, stale),
  }
}

function requestMatchesChildSelector(request: SourceAdapterRequest): boolean {
  if (request.child_age !== undefined && (request.child_age < 0 || request.child_age > 17)) {
    return false
  }
  return request.child_stage === undefined || allChildStages.includes(request.child_stage)
}

function matchesRequest(record: FamilyExperienceSourceRecord, request: SourceAdapterRequest): boolean {
  const requestedLocation = request.location.trim().toLowerCase()
  const locationText = `${record.city} ${record.title} ${record.venue.name} ${record.venue.address}`.toLowerCase()
  const locationMatches = requestedLocation.length === 0 || locationText.includes(requestedLocation)
  const dateMatches = record.date.start <= request.date_range.end && record.date.end >= request.date_range.start
  return dateMatches && locationMatches && requestMatchesChildSelector(request)
}

function freshnessNotice(dataReferenceDate: string, stale: boolean): string {
  const staleText = stale ? " stale historical listing;" : ""
  return `Data lag warning:${staleText} national culture festival standard data is a lower-freshness fallback with data reference date ${dataReferenceDate}; parent must verify schedule, booking, and child fit.`
}

function sourceDate(value: string): string | undefined {
  const sourcePrefix = value.slice(0, 10)
  return datePattern.test(sourcePrefix) ? sourcePrefix : undefined
}

function isStale(endDate: string, dataReferenceDate: string, retrievedAt: string): boolean {
  const eventEnd = Date.parse(endDate)
  const referenceTime = Date.parse(dataReferenceDate)
  const retrievedTime = Date.parse(retrievedAt)
  if (!Number.isFinite(retrievedTime)) {
    return false
  }
  const eventIsPast = Number.isFinite(eventEnd) && eventEnd < retrievedTime
  const referenceAgeMs = Number.isFinite(referenceTime) ? retrievedTime - referenceTime : 0
  const referenceIsOld = referenceAgeMs > staleReferenceDays * 24 * 60 * 60 * 1_000
  return eventIsPast || referenceIsOld
}

function cityFromAddress(address: string): string {
  const normalizedAddress = address.toLowerCase()
  const matchingRule = cityRules.find((rule) => normalizedAddress.includes(rule[0]))
  if (matchingRule !== undefined) {
    return matchingRule[1]
  }

  return address.split(/\s+/)[0] ?? "Korea"
}

function redactRequestDetail(
  detail: string,
  request: BuiltNationalFestivalRequest,
  serviceKey: string,
): string {
  return detail
    .split(request.url)
    .join(request.diagnostics.redacted_url)
    .split(encodeURIComponent(serviceKey))
    .join("<redacted>")
    .split(serviceKey)
    .join("<redacted>")
}

function failure(input: {
  readonly code: SourceAdapterFailure["code"]
  readonly message: string
  readonly retryable: boolean
  readonly diagnostics?: SourceAdapterFailure["diagnostics"]
}): SourceAdapterResult {
  const sourceFailure: SourceAdapterFailure =
    input.diagnostics === undefined
      ? { code: input.code, message: input.message, retryable: input.retryable }
      : { code: input.code, message: input.message, retryable: input.retryable, diagnostics: input.diagnostics }
  return { ok: false, source_id: sourceId, mode, failure: sourceFailure }
}

function isFamilyExperienceSourceRecord(
  record: FamilyExperienceSourceRecord | undefined,
): record is FamilyExperienceSourceRecord {
  return record !== undefined
}

async function loadNationalFestivalCsvPayload(csvPath: string): Promise<{ readonly data: readonly Row[] }> {
  const csvText = await readCsvText(csvPath)
  const rows = parseCsvRows(csvText)
  if (rows.length === 0 || rows[0] === undefined || rows[0].length < 2) {
    throw new Error(`CSV file has no valid header rows: ${csvPath}`)
  }

  const headers = normalizeHeaders(rows[0])
  const parsedRows = rows
    .slice(1)
    .map((row) => parseCsvRecord(headers, row))
    .filter((candidate): candidate is Row => candidate !== undefined)

  if (parsedRows.length === 0) {
    throw new Error(`National festival CSV produced no valid rows: ${csvPath}`)
  }

  return { data: parsedRows }
}

async function readCsvText(csvPath: string): Promise<string> {
  const bytes = await readFile(csvPath)
  const utf8Text = new TextDecoder("utf-8").decode(bytes)
  if (containsNationalFestivalHeaders(utf8Text)) {
    return utf8Text
  }

  const euckrText = new TextDecoder("euc-kr").decode(bytes)
  if (containsNationalFestivalHeaders(euckrText)) {
    return euckrText
  }

  return utf8Text
}

function containsNationalFestivalHeaders(value: string): boolean {
  return value.includes("축제명") && value.includes("개최장소") && value.includes("축제시작일자")
}

function normalizeHeaders(row: readonly string[]): readonly CsvHeaderName[] {
  return row.map((header) => {
    const clean = header.trim().replace(/^\uFEFF/, "")
    return clean as CsvHeaderName
  })
}

function parseCsvRecord(headers: readonly CsvHeaderName[], values: readonly string[]): Row | undefined {
  const raw = Object.fromEntries(
    headers.map((header, index) => [header, values[index] ?? ""]),
  ) as Record<CsvHeaderName, string>
  const festival_name = trim(raw["축제명"])
  const place = trim(raw["개최장소"])
  const start_date = normalizeDate(raw["축제시작일자"])
  const end_date = normalizeDate(raw["축제종료일자"])
  const content = trim(raw["축제내용"]) || "행사 상세 정보 미공개"
  const organization = trim(raw["주관기관명"]) || trim(raw["주최기관명"]) || "미기재 기관"
  const phone = trim(raw["전화번호"])
  const homepage = trim(raw["홈페이지주소"])
  const address = normalizeAddress(trim(raw["소재지도로명주소"]), trim(raw["소재지지번주소"]))
  const data_reference_date = normalizeDate(raw["데이터기준일자"]) || start_date || end_date || "2000-01-01"
  const latitude = trim(raw["위도"])
  const longitude = trim(raw["경도"])

  if (festival_name === "" || place === "" || start_date === undefined || end_date === undefined || address === "") {
    return undefined
  }

  const payloadRow = {
    festival_name,
    place,
    start_date,
    end_date,
    content,
    organization,
    phone,
    homepage,
    address,
    latitude: latitude === "" ? undefined : latitude,
    longitude: longitude === "" ? undefined : longitude,
    data_reference_date,
  } satisfies Row

  const parsedRow = rowSchema.safeParse(payloadRow)
  if (!parsedRow.success) {
    return undefined
  }

  return parsedRow.data
}

function parseCsvRows(input: string): readonly (readonly string[])[] {
  const rows: string[][] = []
  const row: string[] = []
  let field = ""
  let inQuotes = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    if (char === undefined) {
      continue
    }

    if (char === '"') {
      if (inQuotes && input[index + 1] === '"') {
        field += '"'
        index += 1
        continue
      }

      inQuotes = !inQuotes
      continue
    }

    if (!inQuotes && char === ",") {
      row.push(field)
      field = ""
      continue
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      row.push(field)
      field = ""
      if (row.some((value) => value.length > 0)) {
        rows.push([...row])
      }
      row.length = 0
      if (char === "\r" && input[index + 1] === "\n") {
        index += 1
      }
      continue
    }

    field += char
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.some((value) => value.length > 0)) {
      rows.push([...row])
    }
  }

  return rows
}

function normalizeDate(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return undefined
  }

  if (datePattern.test(trimmed)) {
    return trimmed
  }

  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`
  }

  return undefined
}

function normalizeAddress(roadAddress: string, lotAddress: string): string {
  if (roadAddress.length > 0) {
    return roadAddress
  }

  return lotAddress.length > 0 ? lotAddress : ""
}

function trim(value: string): string {
  return value.trim()
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16)
}
