import { createHash } from "node:crypto"

import * as z from "zod/v4"

import {
  ageRangeMatchesChildAge,
  parseSeoulAgeTarget,
  stagesForAgeRange,
  stagesMatchChildStage,
  type AgeRange,
} from "./ageTarget.js"
import type { FamilyExperienceSourceAdapter, FamilyExperienceSourceRecord, RawSourceSnapshot, SourceAdapterFailure, SourceAdapterRequest, SourceAdapterResult } from "./types.js"

const sourceId = "kto-tourapi-events"
const mode = "live"
const mobileApp = "family-experience-mcp"
const successCode = "0000"
const childStages = ["infant", "toddler", "preschool", "school_age", "teen"] as const
const searchItemFields = ["addr1", "addr2", "areacode", "contentid", "contenttypeid", "eventenddate", "eventstartdate", "firstimage", "firstimage2", "homepage", "mapx", "mapy", "modifiedtime", "sigungucode", "tel", "title"] as const
const detailIntroItemFields = ["agelimit", "contentid", "contenttypeid", "eventplace", "playtime", "usetimefestival"] as const
const xmlItemFields = [...searchItemFields, ...detailIntroItemFields] as const

export const KTO_DETAIL_INTRO_MAX_CONCURRENCY = 4

const stringValueSchema = z.union([z.string(), z.number()]).transform((value) => String(value))
const itemSchema = z
  .object(Object.fromEntries(searchItemFields.map((field) => [field, stringValueSchema.optional()])))
  .passthrough()
const itemsSchema = z.union([z.object({ item: z.union([itemSchema, z.array(itemSchema)]).optional() }).passthrough(), z.literal(""), z.null()])
const payloadSchema = z.object({
  response: z.object({
    header: z.object({ resultCode: stringValueSchema, resultMsg: stringValueSchema }),
    body: z.object({ items: itemsSchema.optional(), totalCount: z.coerce.number().optional() }).passthrough(),
  }),
})
const detailIntroItemSchema = z
  .object(Object.fromEntries(detailIntroItemFields.map((field) => [field, stringValueSchema.optional()])))
  .passthrough()
const detailIntroItemsSchema = z.union([
  z.object({ item: z.union([detailIntroItemSchema, z.array(detailIntroItemSchema)]).optional() }).passthrough(),
  z.literal(""),
  z.null(),
])
const detailIntroPayloadSchema = z.object({
  response: z.object({
    header: z.object({ resultCode: stringValueSchema, resultMsg: stringValueSchema }),
    body: z.object({ items: detailIntroItemsSchema.optional() }).passthrough(),
  }),
})

type KtoTourApiItem = z.infer<typeof itemSchema>
type KtoTourApiDetailIntroItem = z.infer<typeof detailIntroItemSchema>
type KtoTourApiNormalizeContext = { readonly request: SourceAdapterRequest; readonly retrievedAt: string; readonly redactedUrl: string; readonly sourceUrl: string }
type ParsedExternalPayload = { readonly ok: true; readonly payload: unknown } | { readonly ok: false; readonly detail: string }
type KtoDetailIntroEvidence = {
  readonly ageRange: AgeRange
  readonly ageText: string
  readonly eventPlace?: string
  readonly feeText?: string
  readonly playTime?: string
}
type KtoDetailEnrichment = {
  readonly record: FamilyExperienceSourceRecord
  readonly rawSnapshot?: RawSourceSnapshot
}

export type BuiltKtoTourApiRequest = { readonly url: string; readonly diagnostics: { readonly redacted_url: string } }

export function buildKtoTourApiRequest(options: { readonly baseUrl: string; readonly serviceKey: string; readonly eventStartDate: string; readonly pageNo: number; readonly numOfRows: number }): BuiltKtoTourApiRequest {
  const baseUrl = options.baseUrl.replace(/\/+$/, "")
  const params = new URLSearchParams({ MobileOS: "ETC", MobileApp: mobileApp, _type: "json", numOfRows: String(options.numOfRows), pageNo: String(options.pageNo), eventStartDate: options.eventStartDate, serviceKey: options.serviceKey })
  const redactedParams = new URLSearchParams(params)
  redactedParams.set("serviceKey", "<redacted>")
  return {
    url: `${baseUrl}/searchFestival2?${params.toString()}`,
    diagnostics: { redacted_url: `${baseUrl}/searchFestival2?${redactedParams.toString()}` },
  }
}

export function buildKtoTourApiDetailIntroRequest(options: {
  readonly baseUrl: string
  readonly serviceKey: string
  readonly contentId: string
  readonly contentTypeId: string
}): BuiltKtoTourApiRequest {
  const baseUrl = options.baseUrl.replace(/\/+$/, "")
  const endpoint = new URL(`${baseUrl}/detailIntro2`)
  if (endpoint.protocol !== "https:") {
    throw new TypeError("KTO TourAPI detailIntro2 requires HTTPS.")
  }
  const params = new URLSearchParams({
    MobileOS: "ETC",
    MobileApp: mobileApp,
    _type: "json",
    contentId: options.contentId,
    contentTypeId: options.contentTypeId,
    serviceKey: options.serviceKey,
  })
  const redactedParams = new URLSearchParams(params)
  redactedParams.set("serviceKey", "<redacted>")
  return {
    url: `${endpoint.toString()}?${params.toString()}`,
    diagnostics: { redacted_url: `${endpoint.toString()}?${redactedParams.toString()}` },
  }
}

export function createKtoTourApiSourceAdapter(options: { readonly baseUrl: string; readonly serviceKey?: string; readonly requestText?: (request: BuiltKtoTourApiRequest) => Promise<unknown>; readonly nowIso?: () => string }): FamilyExperienceSourceAdapter {
  return {
    source_id: sourceId,
    mode,
    list: async (request) => {
      if (options.serviceKey === undefined || options.serviceKey.trim().length === 0) {
        return failure({ code: "missing_key", message: "KTO_TOURAPI_SERVICE_KEY is required.", retryable: false })
      }
      const built = buildKtoTourApiRequest({ baseUrl: options.baseUrl, serviceKey: options.serviceKey, eventStartDate: request.date_range.start.replaceAll("-", ""), pageNo: 1, numOfRows: 100 })
      if (options.requestText === undefined) {
        return failure({ code: "source_unavailable", message: "KTO TourAPI request loader is not wired in this adapter task.", retryable: false, diagnostics: built.diagnostics })
      }
      try {
        const payload = await options.requestText(built)
        const retrievedAt = options.nowIso?.() ?? new Date().toISOString()
        const searchResult = normalizeKtoTourApiPayload(payload, {
          request,
          retrievedAt,
          redactedUrl: built.diagnostics.redacted_url,
          sourceUrl: `${options.baseUrl.replace(/\/+$/, "")}/detailCommon2`,
        })
        if (!searchResult.ok) {
          return searchResult
        }
        return enrichKtoTourApiRecords({
          baseUrl: options.baseUrl,
          request,
          requestText: options.requestText,
          result: searchResult,
          retrievedAt,
          serviceKey: options.serviceKey,
        })
      } catch (error) {
        return failure({
          code: "source_failure",
          message: "KTO TourAPI source request failed.",
          retryable: true,
          diagnostics: {
            ...built.diagnostics,
            detail:
              error instanceof Error
                ? redact(error.message, built, options.serviceKey)
                : "request loader threw a non-Error value",
          },
        })
      }
    },
  }
}

export function normalizeKtoTourApiPayload(payload: unknown, context: KtoTourApiNormalizeContext): SourceAdapterResult {
  const externalPayload = parseExternalPayload(payload)
  if (!externalPayload.ok) {
    return invalidResponse(context.redactedUrl, externalPayload.detail)
  }
  const parsed = payloadSchema.safeParse(externalPayload.payload)
  if (!parsed.success) {
    return invalidResponse(context.redactedUrl, parsed.error.issues.map((issue) => issue.path.join(".")).join(", "))
  }
  const header = parsed.data.response.header
  if (header.resultCode !== successCode) {
    return failure({
      code: "source_failure",
      message: "KTO TourAPI returned a non-success result.",
      retryable: true,
      diagnostics: { redacted_url: context.redactedUrl, source_code: header.resultCode, source_message: header.resultMsg },
    })
  }
  const requestHash = hash(context.redactedUrl)
  const rawSnapshot: RawSourceSnapshot = {
    snapshot_id: `${sourceId}:raw:${requestHash}`,
    source_id: sourceId,
    retrieved_at: context.retrievedAt,
    request_hash: requestHash,
    payload_ref: "searchFestival2",
    response_sha256: responseSha256(payload),
  }
  const records = itemsFrom(parsed.data.response.body.items)
    .map((item) => normalizeItem(item, context, rawSnapshot.snapshot_id))
    .filter(isRecord)
    .filter((record) => matchesRequest(record, context.request))
  return records.length === 0
    ? failure({ code: "no_match", message: "KTO TourAPI returned no events matching the request.", retryable: false, diagnostics: { redacted_url: context.redactedUrl } })
    : { ok: true, source_id: sourceId, mode, retrieved_at: context.retrievedAt, raw_snapshots: [rawSnapshot], records }
}

async function enrichKtoTourApiRecords(input: {
  readonly baseUrl: string
  readonly request: SourceAdapterRequest
  readonly requestText: (request: BuiltKtoTourApiRequest) => Promise<unknown>
  readonly result: Extract<SourceAdapterResult, { readonly ok: true }>
  readonly retrievedAt: string
  readonly serviceKey: string
}): Promise<SourceAdapterResult> {
  const enrichments = await mapWithConcurrency(
    input.result.records,
    KTO_DETAIL_INTRO_MAX_CONCURRENCY,
    (record) => enrichKtoTourApiRecord({ ...input, record }),
  )
  return {
    ...input.result,
    records: enrichments.map((enrichment) => enrichment.record),
    raw_snapshots: [
      ...input.result.raw_snapshots,
      ...enrichments.flatMap((enrichment) =>
        enrichment.rawSnapshot === undefined ? [] : [enrichment.rawSnapshot],
      ),
    ],
  }
}

async function enrichKtoTourApiRecord(input: {
  readonly baseUrl: string
  readonly record: FamilyExperienceSourceRecord
  readonly request: SourceAdapterRequest
  readonly requestText: (request: BuiltKtoTourApiRequest) => Promise<unknown>
  readonly retrievedAt: string
  readonly serviceKey: string
}): Promise<KtoDetailEnrichment> {
  const identity = detailIdentity(input.record)
  if (identity === undefined) {
    return { record: input.record }
  }

  let built: BuiltKtoTourApiRequest
  try {
    built = buildKtoTourApiDetailIntroRequest({
      baseUrl: input.baseUrl,
      serviceKey: input.serviceKey,
      ...identity,
    })
  } catch {
    return { record: input.record }
  }

  try {
    const payload = await input.requestText(built)
    const evidence = parseKtoTourApiDetailIntroPayload(payload, identity.contentId)
    if (evidence === undefined) {
      return { record: input.record }
    }
    const requestHash = hash(built.diagnostics.redacted_url)
    const rawSnapshot: RawSourceSnapshot = {
      snapshot_id: `${sourceId}:detail:${identity.contentId}:${requestHash}`,
      source_id: sourceId,
      retrieved_at: input.retrievedAt,
      request_hash: requestHash,
      payload_ref: "detailIntro2",
      response_sha256: responseSha256(payload),
      evidence: {
        content_id: identity.contentId,
        age_limit: evidence.ageText,
      },
    }
    return {
      record: mergeKtoDetailIntroEvidence(
        input.record,
        evidence,
        input.request,
        rawSnapshot.snapshot_id,
      ),
      rawSnapshot,
    }
  } catch {
    return { record: input.record }
  }
}

function parseKtoTourApiDetailIntroPayload(
  payload: unknown,
  expectedContentId: string,
): KtoDetailIntroEvidence | undefined {
  const externalPayload = parseExternalPayload(payload)
  if (!externalPayload.ok) {
    return undefined
  }
  const parsed = detailIntroPayloadSchema.safeParse(externalPayload.payload)
  if (!parsed.success || parsed.data.response.header.resultCode !== successCode) {
    return undefined
  }
  const items = detailIntroItemsFrom(parsed.data.response.body.items)
  const item = items.find(
    (candidate) =>
      clean(candidate["contentid"]) === expectedContentId &&
      clean(candidate["agelimit"]) !== undefined,
  )
  const ageText = item === undefined ? undefined : clean(item["agelimit"])
  const ageRange = ageText === undefined ? undefined : parseSeoulAgeTarget(ageText)
  if (item === undefined || ageText === undefined || ageText.length > 512 || ageRange === undefined) {
    return undefined
  }
  const eventPlace = clean(item["eventplace"])
  const feeText = clean(item["usetimefestival"])
  const playTime = clean(item["playtime"])
  return {
    ageRange,
    ageText,
    ...(eventPlace === undefined ? {} : { eventPlace }),
    ...(feeText === undefined ? {} : { feeText }),
    ...(playTime === undefined ? {} : { playTime }),
  }
}

function mergeKtoDetailIntroEvidence(
  record: FamilyExperienceSourceRecord,
  evidence: KtoDetailIntroEvidence,
  request: SourceAdapterRequest,
  ageEvidenceSnapshotId: string,
): FamilyExperienceSourceRecord {
  const recordStages = stagesForAgeRange(evidence.ageRange)
  const ageMatches =
    ageRangeMatchesChildAge(evidence.ageRange, request.child_age) &&
    stagesMatchChildStage(recordStages, request.child_stage)
  return {
    ...record,
    age_evidence_snapshot_id: ageEvidenceSnapshotId,
    confidence: { ...record.confidence, age_fit: "source-stated" },
    parent_check: {
      ...record.parent_check,
      age_fit: `KTO TourAPI detailIntro2 source-stated age limit: ${evidence.ageText}`,
    },
    child_stages: recordStages,
    min_child_age: evidence.ageRange.min,
    max_child_age: evidence.ageRange.max,
    target_age_text: evidence.ageText,
    suitability: ageMatches ? "happy_prompt_match" : "edge_unsuitable",
    ...(evidence.eventPlace === undefined
      ? {}
      : { venue: { ...record.venue, name: evidence.eventPlace } }),
    ...(evidence.playTime === undefined
      ? {}
      : { date: { ...record.date, time_text: evidence.playTime } }),
    ...(evidence.feeText === undefined ? {} : { fee_text: evidence.feeText }),
  }
}

function detailIdentity(record: FamilyExperienceSourceRecord):
  | { readonly contentId: string; readonly contentTypeId: string }
  | undefined {
  const contentId = tagValue(record.tags, "contentid")
  const contentTypeId = tagValue(record.tags, "contenttypeid")
  return contentId === undefined || contentTypeId === undefined ? undefined : { contentId, contentTypeId }
}

function tagValue(tags: readonly string[], name: string): string | undefined {
  const prefixText = `${name}:`
  return tags.find((tag) => tag.startsWith(prefixText))?.slice(prefixText.length)
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<readonly R[]> {
  const results: (R | undefined)[] = Array.from({ length: values.length })
  let nextIndex = 0
  const workerCount = Math.min(concurrency, values.length)
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < values.length) {
        const index = nextIndex
        nextIndex += 1
        const value = values[index]
        if (value !== undefined) {
          results[index] = await mapper(value)
        }
      }
    }),
  )
  return results.flatMap((result) => (result === undefined ? [] : [result]))
}

function normalizeItem(item: KtoTourApiItem, context: KtoTourApiNormalizeContext, rawSnapshotId: string): FamilyExperienceSourceRecord | undefined {
  const contentId = clean(item["contentid"])
  const title = clean(item["title"])
  const start = ktoDate(clean(item["eventstartdate"]))
  const end = ktoDate(clean(item["eventenddate"])) ?? start
  if (contentId === undefined || title === undefined || start === undefined || end === undefined) {
    return undefined
  }
  const address = [item["addr1"], item["addr2"]].map(clean).filter(isString).join(" ")
  return {
    id: `${sourceId}:${contentId}`,
    raw_snapshot_id: rawSnapshotId,
    mode,
    title,
    city: cityFrom(clean(item["areacode"]), address),
    date: { start, end, time_text: `${start} - ${end}` },
    venue: { name: title, address: address.length > 0 ? address : cityFrom(clean(item["areacode"]), "") },
    source: { id: sourceId, mode, url: sourceUrlFor(context.sourceUrl, contentId, clean(item["contenttypeid"])), raw_snapshot_id: rawSnapshotId },
    retrieved_at: context.retrievedAt,
    confidence: { date: "api-returned", venue: "api-returned", age_fit: "unknown", reservation: "unknown" },
    parent_check: { age_fit: "KTO TourAPI event listing does not state child-specific age fit.", reservation: "confirmation_needed", live_status: "source_timestamp_required" },
    child_stages: childStages,
    min_child_age: 0,
    max_child_age: 17,
    indoor_outdoor: "unknown",
    target_age_text: "unknown",
    program_text: title,
    reservation_url: extractUrl(clean(item["homepage"])),
    contact: clean(item["tel"]) ?? null,
    fee_text: "unknown",
    tags: tagsFor(item, contentId),
    suitability: "happy_prompt_match",
    fixture_notice:
      "KTO TourAPI candidate; verify schedule, age fit, and event page before use. Image URLs are source-returned but not proof unless license is verified.",
  }
}

function parseExternalPayload(payload: unknown): ParsedExternalPayload {
  if (typeof payload !== "string") {
    return { ok: true, payload }
  }
  const text = payload.trim()
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(text)
      return { ok: true, payload: parsed }
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        return { ok: false, detail: error.message }
      }
      throw error
    }
  }
  return text.startsWith("<") ? { ok: true, payload: fromXml(text) } : { ok: false, detail: "payload was neither JSON nor XML text" }
}

function fromXml(xml: string): unknown {
  const itemBlocks = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((match) => match[1] ?? "")
  const items = itemBlocks.map((block) =>
    Object.fromEntries(xmlItemFields.map((field): readonly [string, string | undefined] => [field, xmlField(block, field)]).filter(isXmlEntry)),
  )
  return { response: { header: { resultCode: xmlField(xml, "resultCode") ?? "", resultMsg: xmlField(xml, "resultMsg") ?? "" }, body: { items: items.length === 0 ? "" : { item: items }, totalCount: xmlField(xml, "totalCount") ?? String(items.length) } } }
}

function xmlField(xml: string, field: string): string | undefined {
  const pattern = new RegExp(`<${field}>([\\s\\S]*?)<\\/${field}>`)
  return clean(decodeXml(pattern.exec(xml)?.[1] ?? ""))
}

function itemsFrom(items: z.infer<typeof itemsSchema> | undefined): readonly KtoTourApiItem[] {
  if (items === undefined || items === null || items === "") {
    return []
  }
  return items.item === undefined ? [] : Array.isArray(items.item) ? items.item : [items.item]
}

function detailIntroItemsFrom(
  items: z.infer<typeof detailIntroItemsSchema> | undefined,
): readonly KtoTourApiDetailIntroItem[] {
  if (items === undefined || items === null || items === "") {
    return []
  }
  return items.item === undefined ? [] : Array.isArray(items.item) ? items.item : [items.item]
}

function matchesRequest(record: FamilyExperienceSourceRecord, request: SourceAdapterRequest): boolean {
  const locationText = `${record.city} ${record.venue.name} ${record.venue.address}`.toLowerCase()
  return record.date.start <= request.date_range.end && record.date.end >= request.date_range.start && locationText.includes(request.location.trim().toLowerCase())
}

function tagsFor(item: KtoTourApiItem, contentId: string): readonly string[] {
  const imageTag = clean(item["firstimage"]) === undefined && clean(item["firstimage2"]) === undefined ? undefined : "image:source-returned-license-unverified"
  return ["kto-tourapi", `contentid:${contentId}`, prefix("contenttypeid", clean(item["contenttypeid"])), prefix("areacode", clean(item["areacode"])), prefix("sigungucode", clean(item["sigungucode"])), prefix("mapx", clean(item["mapx"])), prefix("mapy", clean(item["mapy"])), imageTag].filter(isString)
}

function sourceUrlFor(sourceUrl: string, contentId: string, contentTypeId: string | undefined): string {
  const url = new URL(sourceUrl)
  url.searchParams.set("contentId", contentId)
  if (contentTypeId !== undefined) {
    url.searchParams.set("contentTypeId", contentTypeId)
  }
  return url.toString()
}

function cityFrom(areaCode: string | undefined, address: string): string {
  const cities: Readonly<Record<string, string>> = {
    "1": "Seoul", "2": "Incheon", "3": "Daejeon", "4": "Daegu", "5": "Gwangju", "6": "Busan", "7": "Ulsan",
    "31": "Gyeonggi", "32": "Gangwon", "33": "Chungcheong", "34": "Chungcheong", "35": "Gyeongsang",
    "36": "Gyeongsang", "37": "Jeolla", "38": "Jeolla", "39": "Jeju",
  }
  const cityFromCode = areaCode === undefined ? undefined : cities[areaCode]
  if (cityFromCode !== undefined) {
    return cityFromCode
  }
  if (/^\uc804\ub0a8\uad11\uc8fc\ud1b5\ud569\ud2b9\ubcc4\uc2dc(?:\s|$)/u.test(address)) {
    const administrativeUnit = address.trim().split(/\s+/u)[1]
    return administrativeUnit !== undefined && ["\ub3d9\uad6c", "\uc11c\uad6c", "\ub0a8\uad6c", "\ubd81\uad6c", "\uad11\uc0b0\uad6c"].includes(administrativeUnit)
      ? "Gwangju"
      : "Jeolla"
  }
  const addressRules: readonly (readonly [RegExp, string])[] = [
    [/^\uc11c\uc6b8(?:\ud2b9\ubcc4\uc2dc)?(?:\s|$)/u, "Seoul"],
    [/^\ubd80\uc0b0(?:\uad11\uc5ed\uc2dc)?(?:\s|$)/u, "Busan"],
    [/^\ub300\uad6c(?:\uad11\uc5ed\uc2dc)?(?:\s|$)/u, "Daegu"],
    [/^\ub300\uc804(?:\uad11\uc5ed\uc2dc)?(?:\s|$)/u, "Daejeon"],
    [/^\uad11\uc8fc(?:\uad11\uc5ed\uc2dc)?(?:\s|$)/u, "Gwangju"],
    [/^\uc778\ucc9c(?:\uad11\uc5ed\uc2dc)?(?:\s|$)/u, "Incheon"],
    [/^\uc6b8\uc0b0(?:\uad11\uc5ed\uc2dc)?(?:\s|$)/u, "Ulsan"],
    [/^\uacbd\uae30\ub3c4(?:\s|$)/u, "Gyeonggi"],
    [/^\uac15\uc6d0(?:\ud2b9\ubcc4\uc790\uce58\ub3c4|\ub3c4)(?:\s|$)/u, "Gangwon"],
    [/^\ucda9\uccad(?:\ubd81\ub3c4|\ub0a8\ub3c4)(?:\s|$)/u, "Chungcheong"],
    [/^\ucda9\ubd81(?:\s|$)/u, "Chungcheong"],
    [/^(?:\uc804\ubd81\ud2b9\ubcc4\uc790\uce58\ub3c4|\uc804\ub77c\ubd81\ub3c4|\uc804\ub77c\ub0a8\ub3c4)(?:\s|$)/u, "Jeolla"],
    [/^\uacbd\uc0c1(?:\ubd81\ub3c4|\ub0a8\ub3c4)(?:\s|$)/u, "Gyeongsang"],
    [/^\uc81c\uc8fc(?:\ud2b9\ubcc4\uc790\uce58\ub3c4|\ub3c4)(?:\s|$)/u, "Jeju"],
  ]
  const matchingRule = addressRules.find(([pattern]) => pattern.test(address))
  return matchingRule?.[1] ?? clean(address.split(/[,\s]/)[0] ?? "") ?? "Korea"
}

function extractUrl(value: string | undefined): string | null {
  const href = value === undefined ? undefined : /href=["']([^"']+)["']/.exec(value)?.[1]
  const candidate = clean(href ?? value)
  return candidate !== undefined && /^https?:\/\//.test(candidate) ? candidate : null
}

function invalidResponse(redactedUrl: string, detail: string): SourceAdapterResult {
  return failure({ code: "source_invalid_response", message: "KTO TourAPI payload did not match expected event fields.", retryable: false, diagnostics: { redacted_url: redactedUrl, detail } })
}

function prefix(prefixText: string, value: string | undefined): string | undefined {
  return value === undefined ? undefined : `${prefixText}:${value}`
}

function ktoDate(value: string | undefined): string | undefined {
  return value !== undefined && /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : undefined
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed
}

function decodeXml(value: string): string {
  return value.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&apos;", "'")
}

function redact(detail: string, request: BuiltKtoTourApiRequest, serviceKey: string): string {
  return detail.split(request.url).join(request.diagnostics.redacted_url).split(encodeURIComponent(serviceKey)).join("<redacted>").split(serviceKey).join("<redacted>")
}

function failure(input: { readonly code: SourceAdapterFailure["code"]; readonly message: string; readonly retryable: boolean; readonly diagnostics?: SourceAdapterFailure["diagnostics"] }): SourceAdapterResult {
  const sourceFailure: SourceAdapterFailure =
    input.diagnostics === undefined
      ? { code: input.code, message: input.message, retryable: input.retryable }
      : { code: input.code, message: input.message, retryable: input.retryable, diagnostics: input.diagnostics }
  return { ok: false, source_id: sourceId, mode, failure: sourceFailure }
}

function isRecord(record: FamilyExperienceSourceRecord | undefined): record is FamilyExperienceSourceRecord {
  return record !== undefined
}

function isString(value: string | undefined): value is string {
  return value !== undefined
}

function isXmlEntry(entry: readonly [string, string | undefined]): entry is readonly [string, string] {
  return entry[1] !== undefined
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16)
}

function responseSha256(payload: unknown): string {
  const serialized = typeof payload === "string" ? payload : JSON.stringify(payload) ?? String(payload)
  return createHash("sha256").update(serialized, "utf8").digest("hex")
}
