import { createHash } from "node:crypto"

import type { FamilyExperienceSourceAdapter, FamilyExperienceSourceRecord, RawSourceSnapshot, SourceAdapterFailure, SourceAdapterRequest, SourceAdapterResult } from "./types.js"
import { parseSeoulAgeTarget, stagesForAgeRange, type AgeRange } from "./ageTarget.js"

export type BuiltCulturePortalRequest = { readonly url: string; readonly diagnostics: { readonly redacted_url: string } }
type RequestOptions = { readonly baseUrl: string; readonly serviceKey: string; readonly from: string; readonly to: string; readonly page: number; readonly rows: number; readonly place?: string; readonly keyword?: string }
type AdapterOptions = { readonly baseUrl: string; readonly serviceKey?: string; readonly requestXml?: (request: BuiltCulturePortalRequest) => Promise<string>; readonly nowIso?: () => string }
type NormalizeContext = { readonly request: SourceAdapterRequest; readonly retrievedAt: string; readonly redactedUrl: string }
type Row = { readonly seq: string; readonly title: string; readonly startDate: string; readonly endDate: string; readonly place: string; readonly area: string; readonly realmName: string; readonly price: string; readonly url: string; readonly thumbnail: string; readonly gpsX: string; readonly gpsY: string; readonly description: string }

const sourceId = "culture-portal-oneview", mode = "live", operation = "period2"
const officialEndpoint = "https://apis.data.go.kr/B553457/cultureinfo/period2"
const datePattern = /^\d{4}-\d{2}-\d{2}$/, compactDatePattern = /^\d{8}$/
const successCodes: readonly string[] = ["00", "0", "INFO-000"]
const permissionCodes: readonly string[] = ["20", "30", "31", "32"]
const rowTags: readonly string[] = ["item", "perforList", "performance", "display", "event"]
const broadChildStages = ["infant", "toddler", "preschool", "school_age", "teen"] as const
const aliases = {
  seq: ["seq", "id", "contentId", "cntntsNo", "performSeq"], title: ["title", "eventNm", "prfnm", "name", "subject"],
  startDate: ["startDate", "startDt", "from", "periodStart", "strtDate"], endDate: ["endDate", "endDt", "to", "periodEnd", "endDate"],
  place: ["place", "venue", "placeName", "fcltynm", "area"], area: ["area", "region", "sido", "sigungu", "placeAddr", "address"],
  realmName: ["realmName", "realm", "category", "genre", "codename"], price: ["price", "fee", "useFee", "charge", "entrfee"],
  url: ["url", "link", "homepage", "detailUrl", "eventUrl", "placeUrl"], thumbnail: ["thumbnail", "image", "imageUrl", "imgUrl", "mainImg"],
  gpsX: ["gpsX", "gpsx", "longitude", "lng", "lot"], gpsY: ["gpsY", "gpsy", "latitude", "lat"],
  description: ["description", "contents", "contents1", "content", "program"],
}

export function buildCulturePortalRequest(options: RequestOptions): BuiltCulturePortalRequest {
  const endpoint = normalizeEndpoint(options.baseUrl)
  const params = new URLSearchParams({
    from: options.from, to: options.to, cPage: String(options.page), rows: String(options.rows),
    place: options.place ?? "", gpsxfrom: "", gpsyfrom: "", gpsxto: "", gpsyto: "",
    keyword: options.keyword ?? "", sortStdr: "1", serviceKey: options.serviceKey,
  })
  const redactedParams = new URLSearchParams(params)
  redactedParams.set("serviceKey", "<redacted>")
  return {
    url: `${endpoint}?${params.toString()}`,
    diagnostics: { redacted_url: `${endpoint}?${redactedParams.toString()}` },
  }
}

export function createCulturePortalSourceAdapter(options: AdapterOptions): FamilyExperienceSourceAdapter {
  return {
    source_id: sourceId,
    mode,
    list: async (request) => {
      if (options.serviceKey === undefined || options.serviceKey.trim().length === 0) {
        return failure({ code: "missing_key", message: "CULTURE_PORTAL_SERVICE_KEY is required.", retryable: false })
      }
      const built = buildCulturePortalRequest({
        baseUrl: options.baseUrl,
        serviceKey: options.serviceKey,
        from: request.date_range.start.replaceAll("-", ""),
        to: request.date_range.end.replaceAll("-", ""),
        page: 1,
        rows: 10,
        place: request.location,
      })
      if (options.requestXml === undefined) {
        return failure({ code: "source_unavailable", message: "Culture Portal requestXml loader is not configured.", retryable: true, diagnostics: built.diagnostics })
      }
      try {
        const xml = await options.requestXml(built)
        return normalizeCulturePortalXml(xml, { request, retrievedAt: options.nowIso?.() ?? new Date().toISOString(), redactedUrl: built.diagnostics.redacted_url })
      } catch (error: unknown) {
        const detail =
          error instanceof Error
            ? redactDetail(error.message, built, options.serviceKey)
            : "request loader threw a non-Error value"
        return failure({ code: "source_failure", message: "Culture Portal source request failed.", retryable: true, diagnostics: { ...built.diagnostics, detail } })
      }
    },
  }
}

export function normalizeCulturePortalXml(xml: string, context: NormalizeContext): SourceAdapterResult {
  const wellFormed = isWellFormedXml(xml)
  if (!wellFormed.ok) {
    return failure({ code: "source_invalid_response", message: "Culture Portal XML response could not be parsed.", retryable: false, diagnostics: { redacted_url: context.redactedUrl, detail: wellFormed.detail } })
  }
  const result = readSourceResult(xml)
  if (result.code.length > 0 && !successCodes.includes(result.code)) {
    const permission = permissionCodes.includes(result.code)
    return failure({ code: permission ? "permission_failure" : "source_failure", message: "Culture Portal returned a non-success result.", retryable: !permission, diagnostics: { redacted_url: context.redactedUrl, source_code: result.code, source_message: result.message } })
  }
  const rows = rowBlocks(xml).map(readRow).filter(isRow)
  if (rows.length === 0) {
    return failure({ code: "source_invalid_response", message: "Culture Portal XML rows did not include required event fields.", retryable: false, diagnostics: { redacted_url: context.redactedUrl, detail: "required row fields missing" } })
  }
  const requestHash = hash(context.redactedUrl)
  const rawSnapshot: RawSourceSnapshot = {
    snapshot_id: `${sourceId}:raw:${requestHash}`,
    source_id: sourceId,
    retrieved_at: context.retrievedAt,
    request_hash: requestHash,
    payload_ref: operation,
  }
  const records = rows
    .map((row) => normalizeRow(row, context, rawSnapshot.snapshot_id))
    .filter((record) => matchesRequest(record, context.request))
  if (records.length === 0) {
    return failure({ code: "no_match", message: "Culture Portal source returned no events matching the request.", retryable: false, diagnostics: { redacted_url: context.redactedUrl } })
  }
  return { ok: true, source_id: sourceId, mode, retrieved_at: context.retrievedAt, raw_snapshots: [rawSnapshot], records }
}

function normalizeEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "")
  return trimmed.endsWith(`/${operation}`) ? trimmed : `${trimmed}/${operation}`
}

function isWellFormedXml(xml: string): { readonly ok: true } | { readonly ok: false; readonly detail: string } {
  const body = xml.replace(/<\?xml[^>]*\?>/g, "").replace(/<!--[\s\S]*?-->/g, "")
  const tagPattern = /<(?<closing>\/?)(?<name>[A-Za-z][A-Za-z0-9_:-]*)(?:\s[^>]*)?(?<self>\/?)>/g
  const stack: string[] = []
  let roots = 0
  for (const match of body.matchAll(tagPattern)) {
    const groups = match.groups
    if (groups === undefined) {
      return { ok: false, detail: "tag parser failed" }
    }
    const name = groups["name"] ?? ""
    if (groups["self"] === "/") {
      roots += stack.length === 0 ? 1 : 0
    } else if (groups["closing"] === "/") {
      const current = stack.pop()
      if (current !== name) {
        return { ok: false, detail: `unexpected closing tag ${name}` }
      }
      roots += stack.length === 0 ? 1 : 0
    } else {
      stack.push(name)
    }
  }
  if (stack.length > 0) {
    return { ok: false, detail: `unclosed tag ${stack.at(-1) ?? "unknown"}` }
  }
  return roots === 1 ? { ok: true } : { ok: false, detail: `expected one root element, found ${roots}` }
}

function rowBlocks(xml: string): readonly string[] {
  const blocks = rowTags.flatMap((tag) => tagBlocks(xml, tag))
  return blocks.length > 0 || readRow(xml) === undefined ? blocks : [xml]
}

function tagBlocks(xml: string, tag: string): readonly string[] {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi")
  return [...xml.matchAll(pattern)].map((match) => match[1] ?? "")
}

function readSourceResult(xml: string): { readonly code: string; readonly message: string } {
  return { code: firstField(xml, ["resultCode", "returnReasonCode", "CODE"]), message: firstField(xml, ["resultMsg", "returnAuthMsg", "errMsg", "MESSAGE"]) }
}

function readRow(block: string): Row | undefined {
  const title = firstField(block, aliases.title)
  const startDate = normalizeDate(firstField(block, aliases.startDate))
  const endDate = normalizeDate(firstField(block, aliases.endDate))
  const place = firstField(block, aliases.place)
  if (title.length === 0 || startDate.length === 0 || place.length === 0) {
    return undefined
  }
  return {
    seq: firstField(block, aliases.seq), title, startDate, endDate: endDate.length > 0 ? endDate : startDate, place,
    area: firstField(block, aliases.area), realmName: firstField(block, aliases.realmName),
    price: firstField(block, aliases.price), url: firstField(block, aliases.url),
    thumbnail: firstField(block, aliases.thumbnail), gpsX: firstField(block, aliases.gpsX),
    gpsY: firstField(block, aliases.gpsY), description: firstField(block, aliases.description),
  }
}

function firstField(xml: string, names: readonly string[]): string {
  for (const name of names) {
    const value = tagText(xml, name)
    if (value.length > 0) {
      return value
    }
  }
  return ""
}

function tagText(xml: string, tag: string): string {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i")
  const value = pattern.exec(xml)?.[1] ?? ""
  return decodeXml(value.trim())
}

function normalizeRow(row: Row, context: NormalizeContext, rawSnapshotId: string): FamilyExperienceSourceRecord {
  const sourceUrl = row.url.trim().length > 0 ? row.url : officialEndpoint
  const ageEvidence = sourceAgeEvidence(row)
  const tags = [
    "culture-portal",
    row.area,
    row.realmName,
    ...(row.gpsX.trim().length > 0 && row.gpsY.trim().length > 0 ? ["coordinates_source_provided", `source_gpsX:${row.gpsX}`, `source_gpsY:${row.gpsY}`] : []),
    ...(row.thumbnail.trim().length > 0 ? ["thumbnail_source_provided", `source_thumbnail:${row.thumbnail}`] : []),
  ].filter(hasText)
  const derivedIdentityKey = hash(`${row.seq}|${row.url}|${row.title}|${row.startDate}|${row.place}`)
  return {
    id: `${sourceId}:${derivedIdentityKey}`,
    source_identity: { key: derivedIdentityKey, basis: "derived_v1" },
    venue_identity: { basis: "source_stated" },
    raw_snapshot_id: rawSnapshotId,
    mode, title: row.title, city: row.area.trim().length > 0 ? row.area : context.request.location,
    date: { start: row.startDate, end: row.endDate, time_text: `${row.startDate} - ${row.endDate}` }, venue: { name: row.place, address: row.area },
    source: { id: sourceId, mode, url: sourceUrl, raw_snapshot_id: rawSnapshotId }, retrieved_at: context.retrievedAt,
    confidence: { date: "api-returned", venue: "api-returned", age_fit: ageEvidence === undefined ? "unknown" : "inferred", reservation: "unknown" },
    parent_check: { age_fit: ageEvidence === undefined ? "unknown" : `Culture Portal description contains an explicit audience-age cue; inferred range from: ${ageEvidence.text}`, reservation: "confirmation_needed", live_status: "source_timestamp_required" },
    child_stages: ageEvidence === undefined ? broadChildStages : stagesForAgeRange(ageEvidence.range),
    min_child_age: ageEvidence?.range.min ?? 0,
    max_child_age: ageEvidence?.range.max ?? 17,
    indoor_outdoor: "unknown",
    target_age_text: ageEvidence?.text ?? "unknown",
    program_text: row.description.trim().length > 0 ? row.description : row.title, reservation_url: null, contact: null,
    fee_text: row.price, tags, suitability: "happy_prompt_match",
    fixture_notice: "Live Culture Portal candidate; verify schedule, price, and age fit before use.",
  }
}

function sourceAgeEvidence(row: Row): { readonly text: string; readonly range: AgeRange } | undefined {
  const normalized = row.description.normalize("NFKC").replace(/\s+/gu, " ").trim()
  if (!hasExplicitAudienceAgeCue(normalized)) {
    return undefined
  }
  const range = parseSeoulAgeTarget(normalized)
  if (range !== undefined) {
    return { text: normalized, range }
  }
  return undefined
}

function hasExplicitAudienceAgeCue(text: string): boolean {
  if (/전\s*연령|전체\s*관람/iu.test(text)) {
    return true
  }
  if (/\bages?\s*\d{1,2}\b/iu.test(text) && !hasPriceCue(text)) {
    return true
  }

  const ageExpression = String.raw`(?:(?:만\s*)?\d{1,2}\s*세|\d{1,3}\s*개월|(?:초등학교|초등|중학교|중|고등학교|고등|고)\s*\d+\s*(?:[~-]\s*\d+\s*)?학년)`
  const audienceCue = String.raw`(?:(?:관람|참여|입장)\s*(?:가능|대상|권장|연령)|(?:대상|권장)(?:\s*연령)?)`
  const patterns = [
    new RegExp(`${ageExpression}.{0,24}${audienceCue}`, "giu"),
    new RegExp(`${audienceCue}.{0,24}${ageExpression}`, "giu"),
  ]
  return patterns.some((pattern) =>
    [...text.matchAll(pattern)].some((match) => !hasPriceCue(match[0])),
  )
}

function hasPriceCue(text: string): boolean {
  return /무료|유료|요금|가격|입장료|할인|티켓|\b(?:free|fee|price|discount|ticket)\b/iu.test(text)
}

function normalizeDate(value: string): string {
  const trimmed = value.trim()
  if (datePattern.test(trimmed)) {
    return trimmed
  }
  return compactDatePattern.test(trimmed)
    ? `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`
    : ""
}

function matchesRequest(record: FamilyExperienceSourceRecord, request: SourceAdapterRequest): boolean {
  const requestedLocation = request.location.trim().toLowerCase()
  const locationText = `${record.city} ${record.venue.name} ${record.venue.address}`.toLowerCase()
  const locationMatches = requestedLocation.length === 0 || locationText.includes(requestedLocation)
  const childAgeMatches =
    request.child_age === undefined ||
    (record.min_child_age <= request.child_age && record.max_child_age >= request.child_age)
  const childStageMatches =
    request.child_stage === undefined || record.child_stages.includes(request.child_stage)
  return record.date.start <= request.date_range.end && record.date.end >= request.date_range.start && locationMatches && childAgeMatches && childStageMatches
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

function redactDetail(detail: string, request: BuiltCulturePortalRequest, serviceKey: string): string {
  return detail
    .split(request.url).join(request.diagnostics.redacted_url)
    .split(encodeURIComponent(serviceKey)).join("<redacted>")
    .split(serviceKey).join("<redacted>")
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
}

function hasText(value: string): value is string {
  return value.trim().length > 0
}

function isRow(row: Row | undefined): row is Row {
  return row !== undefined
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16)
}
