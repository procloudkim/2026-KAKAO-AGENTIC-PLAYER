import { createHash } from "node:crypto"

import * as z from "zod/v4"

import type { FamilyExperienceSourceAdapter, FamilyExperienceSourceRecord, RawSourceSnapshot, SourceAdapterFailure, SourceAdapterRequest, SourceAdapterResult } from "./types.js"

const sourceId = "kto-tourapi-events"
const mode = "live"
const mobileApp = "family-experience-mcp"
const successCode = "0000"
const childStages = ["infant", "toddler", "preschool", "school_age", "teen"] as const
const xmlItemFields = ["addr1", "addr2", "areacode", "contentid", "contenttypeid", "eventenddate", "eventstartdate", "firstimage", "firstimage2", "homepage", "mapx", "mapy", "modifiedtime", "sigungucode", "tel", "title"] as const

const stringValueSchema = z.union([z.string(), z.number()]).transform((value) => String(value))
const itemSchema = z
  .object(Object.fromEntries(xmlItemFields.map((field) => [field, stringValueSchema.optional()])))
  .passthrough()
const itemsSchema = z.union([z.object({ item: z.union([itemSchema, z.array(itemSchema)]).optional() }).passthrough(), z.literal(""), z.null()])
const payloadSchema = z.object({
  response: z.object({
    header: z.object({ resultCode: stringValueSchema, resultMsg: stringValueSchema }),
    body: z.object({ items: itemsSchema.optional(), totalCount: z.coerce.number().optional() }).passthrough(),
  }),
})

type KtoTourApiItem = z.infer<typeof itemSchema>
type KtoTourApiNormalizeContext = { readonly request: SourceAdapterRequest; readonly retrievedAt: string; readonly redactedUrl: string; readonly sourceUrl: string }
type ParsedExternalPayload = { readonly ok: true; readonly payload: unknown } | { readonly ok: false; readonly detail: string }

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
        return normalizeKtoTourApiPayload(payload, { request, retrievedAt: options.nowIso?.() ?? new Date().toISOString(), redactedUrl: built.diagnostics.redacted_url, sourceUrl: `${options.baseUrl.replace(/\/+$/, "")}/detailCommon2` })
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
  const rawSnapshot: RawSourceSnapshot = { snapshot_id: `${sourceId}:raw:${requestHash}`, source_id: sourceId, retrieved_at: context.retrievedAt, request_hash: requestHash, payload_ref: "searchFestival2" }
  const records = itemsFrom(parsed.data.response.body.items)
    .map((item) => normalizeItem(item, context, rawSnapshot.snapshot_id))
    .filter(isRecord)
    .filter((record) => matchesRequest(record, context.request))
  return records.length === 0
    ? failure({ code: "no_match", message: "KTO TourAPI returned no events matching the request.", retryable: false, diagnostics: { redacted_url: context.redactedUrl } })
    : { ok: true, source_id: sourceId, mode, retrieved_at: context.retrievedAt, raw_snapshots: [rawSnapshot], records }
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
  const cities: Record<string, string> = { "1": "Seoul", "2": "Incheon", "3": "Daejeon", "4": "Daegu", "5": "Gwangju", "6": "Busan", "7": "Ulsan", "31": "Gyeonggi", "32": "Gangwon", "33": "Chungbuk", "34": "Chungnam", "35": "Gyeongbuk", "36": "Gyeongnam", "37": "Jeonbuk", "38": "Jeonnam", "39": "Jeju" }
  return areaCode !== undefined && cities[areaCode] !== undefined ? cities[areaCode] : clean(address.split(/[,\s]/)[0] ?? "") ?? "Korea"
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
