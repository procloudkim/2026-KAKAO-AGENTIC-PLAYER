import { createHash } from "node:crypto"

import * as z from "zod/v4"

import {
  ageRangeMatchesChildAge,
  parseSeoulAgeTarget,
  stagesForAgeRange,
  stagesMatchChildStage,
} from "./ageTarget.js"
import {
  requestSeoulCultureJson,
  type BuiltSeoulCultureRequest,
} from "./httpJson.js"
import type {
  FamilyExperienceSourceAdapter,
  FamilyExperienceSourceRecord,
  RawSourceSnapshot,
  SourceAdapterFailure,
  SourceAdapterRequest,
  SourceAdapterResult,
} from "./types.js"

const sourceId = "seoul-culture-events"
const mode = "live"
const serviceName = "culturalEventInfo"
const datasetUrl = "https://data.seoul.go.kr/dataList/OA-15486/S/1/datasetView.do"
const successCode = "INFO-000"
const datePattern = /^\d{4}-\d{2}-\d{2}$/

const resultSchema = z.object({ CODE: z.string(), MESSAGE: z.string() })
const rowSchema = z.object({
  CODENAME: z.string(), GUNAME: z.string(), TITLE: z.string(), DATE: z.string(),
  PLACE: z.string(), ORG_NAME: z.string(), USE_TRGT: z.string(), USE_FEE: z.string(),
  INQUIRY: z.string(), PLAYER: z.string(), PROGRAM: z.string(), ETC_DESC: z.string(),
  ORG_LINK: z.string(), MAIN_IMG: z.string(), RGSTDATE: z.string(), TICKET: z.string(),
  STRTDATE: z.string(), END_DATE: z.string(), THEMECODE: z.string(), LOT: z.string(),
  LAT: z.string(), IS_FREE: z.string(), HMPG_ADDR: z.string(), PRO_TIME: z.string(),
})
const payloadSchema = z.object({
  culturalEventInfo: z.object({
    list_total_count: z.number().int().nonnegative(),
    RESULT: resultSchema,
    row: z.array(rowSchema),
  }),
})
const errorSchema = z.object({ RESULT: resultSchema })

type Row = z.infer<typeof rowSchema>

export function buildSeoulCultureRequest(options: {
  readonly baseUrl: string
  readonly apiKey: string
  readonly startIndex: number
  readonly endIndex: number
}): BuiltSeoulCultureRequest {
  const baseUrl = options.baseUrl.replace(/\/+$/, "")
  const path = `/json/${serviceName}/${options.startIndex}/${options.endIndex}/`
  return {
    url: `${baseUrl}/${encodeURIComponent(options.apiKey)}${path}`,
    diagnostics: { redacted_url: `${baseUrl}/<redacted>${path}` },
  }
}

export function createSeoulCultureSourceAdapter(options: {
  readonly baseUrl: string
  readonly apiKey?: string
  readonly requestJson?: (request: BuiltSeoulCultureRequest) => Promise<unknown>
  readonly nowIso?: () => string
}): FamilyExperienceSourceAdapter {
  return {
    source_id: sourceId,
    mode,
    list: async (request) => {
      if (options.apiKey === undefined || options.apiKey.trim().length === 0) {
        return failure({ code: "missing_key", message: "SEOUL_OPEN_DATA_KEY is required.", retryable: false })
      }
      const built = buildSeoulCultureRequest({ baseUrl: options.baseUrl, apiKey: options.apiKey, startIndex: 1, endIndex: 100 })
      const requestJson = options.requestJson ?? requestSeoulCultureJson
      try {
        const payload = await requestJson(built)
        return normalizeSeoulCulturePayload(payload, {
          request,
          retrievedAt: options.nowIso?.() ?? new Date().toISOString(),
          redactedUrl: built.diagnostics.redacted_url,
        })
      } catch (error) {
        const detail = error instanceof Error
          ? redactRequestDetail(error.message, built, options.apiKey)
          : "request loader threw a non-Error value"
        return failure({
          code: "source_failure",
          message: "Seoul culture source request failed.",
          retryable: true,
          diagnostics: { ...built.diagnostics, detail },
        })
      }
    },
  }
}

function redactRequestDetail(detail: string, request: BuiltSeoulCultureRequest, apiKey: string): string {
  return detail
    .split(request.url).join(request.diagnostics.redacted_url)
    .split(encodeURIComponent(apiKey)).join("<redacted>")
    .split(apiKey).join("<redacted>")
}

export function normalizeSeoulCulturePayload(
  payload: unknown,
  context: { readonly request: SourceAdapterRequest; readonly retrievedAt: string; readonly redactedUrl: string },
): SourceAdapterResult {
  const sourceError = errorSchema.safeParse(payload)
  if (sourceError.success) {
    return resultFailure(sourceError.data.RESULT, context.redactedUrl)
  }
  const parsed = payloadSchema.safeParse(payload)
  if (!parsed.success) {
    return failure({
      code: "malformed_source",
      message: "Seoul culture payload did not match expected OA-15486 fields.",
      retryable: false,
      diagnostics: {
        redacted_url: context.redactedUrl,
        detail: parsed.error.issues.map((issue) => issue.path.join(".")).join(", "),
      },
    })
  }
  const result = parsed.data.culturalEventInfo.RESULT
  if (result.CODE !== successCode) {
    return resultFailure(result, context.redactedUrl)
  }
  const requestHash = hash(context.redactedUrl)
  const rawSnapshot: RawSourceSnapshot = {
    snapshot_id: `${sourceId}:raw:${requestHash}`,
    source_id: sourceId,
    retrieved_at: context.retrievedAt,
    request_hash: requestHash,
    payload_ref: serviceName,
  }
  const records = parsed.data.culturalEventInfo.row
    .map((row) => normalizeRow(row, context.request, context.retrievedAt, rawSnapshot.snapshot_id))
    .filter(isFamilyExperienceSourceRecord)
    .filter((record) => matchesRequest(record, context.request))
  if (records.length === 0) {
    return failure({
      code: "no_match",
      message: "Seoul culture source returned no events matching the request.",
      retryable: false,
      diagnostics: { redacted_url: context.redactedUrl },
    })
  }
  return { ok: true, source_id: sourceId, mode, retrieved_at: context.retrievedAt, raw_snapshots: [rawSnapshot], records }
}

function normalizeRow(
  row: Row,
  request: SourceAdapterRequest,
  retrievedAt: string,
  rawSnapshotId: string,
): FamilyExperienceSourceRecord | undefined {
  const ageRange = parseSeoulAgeTarget(row.USE_TRGT)
  if (ageRange === undefined) {
    return undefined
  }
  const childStages = stagesForAgeRange(ageRange)
  const sourceUrl = [row.HMPG_ADDR, row.ORG_LINK, datasetUrl].find((value) => value.trim().length > 0)
  const programText = [row.PROGRAM, row.ETC_DESC, row.TITLE].find((value) => value.trim().length > 0)
  const derivedIdentityKey = hash(`${row.HMPG_ADDR}|${row.ORG_LINK}|${row.TITLE}|${row.STRTDATE}`)
  return {
    id: `${sourceId}:${derivedIdentityKey}`,
    source_identity: { key: derivedIdentityKey, basis: "derived_v1" },
    venue_identity: { basis: "source_stated" },
    raw_snapshot_id: rawSnapshotId,
    mode,
    title: row.TITLE,
    city: "Seoul",
    date: { start: sourceDate(row.STRTDATE, row.DATE), end: sourceDate(row.END_DATE, row.DATE), time_text: row.PRO_TIME.trim().length > 0 ? row.PRO_TIME : row.DATE },
    venue: { name: row.PLACE, address: row.GUNAME },
    source: { id: sourceId, mode, url: sourceUrl ?? datasetUrl, raw_snapshot_id: rawSnapshotId },
    retrieved_at: retrievedAt,
    confidence: { date: "api-returned", venue: "api-returned", age_fit: "source-stated", reservation: row.TICKET.trim().length > 0 ? "source-stated" : "unknown" },
    parent_check: { age_fit: row.USE_TRGT, reservation: "confirmation_needed", live_status: "source_timestamp_required" },
    child_stages: childStages,
    min_child_age: ageRange.min,
    max_child_age: ageRange.max,
    indoor_outdoor: "unknown",
    target_age_text: row.USE_TRGT,
    program_text: programText ?? row.TITLE,
    reservation_url: row.ORG_LINK.trim().length > 0 ? row.ORG_LINK : null,
    contact: row.INQUIRY.trim().length > 0 ? row.INQUIRY : null,
    fee_text: [row.IS_FREE, row.USE_FEE].filter((value) => value.trim().length > 0).join(" / "),
    tags: ["seoul", row.CODENAME, row.GUNAME, row.THEMECODE, row.IS_FREE].filter((value) => value.trim().length > 0),
    suitability: ageRangeMatchesChildAge(ageRange, request.child_age) && stagesMatchChildStage(childStages, request.child_stage) ? "happy_prompt_match" : "edge_unsuitable",
    fixture_notice: "Live Seoul Open Data candidate; verify schedule, booking, and age fit before use.",
  }
}

function resultFailure(result: z.infer<typeof resultSchema>, redactedUrl: string): SourceAdapterResult {
  const isPermission = permissionFailure(result)
  return failure({
    code: isPermission ? "permission_failure" : "source_failure",
    message: "Seoul Open Data returned a non-success result.",
    retryable: !isPermission,
    diagnostics: { redacted_url: redactedUrl, source_code: result.CODE, source_message: result.MESSAGE },
  })
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

function permissionFailure(result: z.infer<typeof resultSchema>): boolean {
  const text = `${result.CODE} ${result.MESSAGE}`.toLowerCase()
  return result.CODE.startsWith("ERROR-3") || text.includes("key") || result.MESSAGE.includes("\uc778\uc99d")
}

function isFamilyExperienceSourceRecord(record: FamilyExperienceSourceRecord | undefined): record is FamilyExperienceSourceRecord {
  return record !== undefined
}

function matchesRequest(record: FamilyExperienceSourceRecord, request: SourceAdapterRequest): boolean {
  const requestedLocation = request.location.trim().toLowerCase()
  const locationText = `${record.city} ${record.venue.name} ${record.venue.address}`.toLowerCase()
  const locationMatches = requestedLocation.length === 0 || requestedLocation === "seoul" || requestedLocation === "\uc11c\uc6b8" || locationText.includes(requestedLocation)
  return record.date.start <= request.date_range.end && record.date.end >= request.date_range.start && locationMatches && recordMatchesChildAge(record, request.child_age) && stagesMatchChildStage(record.child_stages, request.child_stage)
}

function recordMatchesChildAge(record: FamilyExperienceSourceRecord, childAge: number | undefined): boolean {
  return ageRangeMatchesChildAge({ min: record.min_child_age, max: record.max_child_age }, childAge)
}

function sourceDate(sourceValue: string, fallbackRange: string): string {
  const sourcePrefix = sourceValue.slice(0, 10)
  const fallbackPrefix = fallbackRange.slice(0, 10)
  if (datePattern.test(sourcePrefix)) {
    return sourcePrefix
  }
  return datePattern.test(fallbackPrefix) ? fallbackPrefix : fallbackRange
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16)
}
