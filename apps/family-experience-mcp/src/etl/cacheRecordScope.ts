import type { SourceAdapterRequest } from "../sources/types.js"
import type { ToolMode } from "../types.js"
import { familyExperienceRegionMatches } from "../location.js"
import type { CacheRecord } from "./cacheContract.js"

export function filterCacheRecordsForRequest(input: {
  readonly records: readonly CacheRecord[]
  readonly request: SourceAdapterRequest
}): readonly CacheRecord[] {
  return input.records.filter((record) => cacheRecordMatchesRequest({ record, request: input.request }))
}

export function scopeCacheRecords(input: {
  readonly metadataFixture: boolean
  readonly records: readonly CacheRecord[]
}): readonly CacheRecord[] {
  return input.records.map((record) =>
    isFixtureCacheRecord({ metadataFixture: input.metadataFixture, record })
      ? toFixtureCacheRecord(record)
      : record,
  )
}

export function modeFor(records: readonly CacheRecord[]): ToolMode {
  if (records.length === 0) {
    return "live"
  }

  if (records.some((record) => record.mode === "live")) {
    return "live"
  }

  return "fixture"
}

function cacheRecordMatchesRequest(input: {
  readonly record: CacheRecord
  readonly request: SourceAdapterRequest
}): boolean {
  return (
    input.record.date.start <= input.request.date_range.end &&
    input.record.date.end >= input.request.date_range.start &&
    locationMatches(input.request.location, input.record) &&
    childSelectorMatches(input.request, input.record)
  )
}

function locationMatches(location: string, record: CacheRecord): boolean {
  if (!familyExperienceRegionMatches({
    requestedLocation: location,
    recordCity: record.city,
    recordAddress: record.venue.address,
  })) {
    return false
  }
  const districtAliases = districtLocationAliases(location)
  if (districtAliases.length === 0) {
    return true
  }
  const sourceText = `${record.venue.name} ${record.venue.address}`.toLowerCase()
  return districtAliases.some((district) => sourceText.includes(district))
}

function districtLocationAliases(location: string): readonly string[] {
  switch (location.trim().toLowerCase()) {
    case "jung-gu": case "중구": return ["jung-gu", "중구"]
    case "jongno-gu": case "종로구": return ["jongno-gu", "종로구"]
    case "nowon-gu": case "노원구": return ["nowon-gu", "노원구"]
    default: return []
  }
}

function childSelectorMatches(request: SourceAdapterRequest, record: CacheRecord): boolean {
  if (request.child_age !== undefined) {
    return request.child_age >= record.min_child_age && request.child_age <= record.max_child_age
  }

  if (request.child_stage !== undefined) {
    return record.child_stages.includes(request.child_stage)
  }

  return false
}

function isFixtureCacheRecord(input: { readonly metadataFixture: boolean; readonly record: CacheRecord }): boolean {
  return input.metadataFixture || isReservedFixtureUrl(input.record.source.url)
}

function isReservedFixtureUrl(url: string): boolean {
  const hostname = new URL(url).hostname
  return hostname === "example.test" || hostname === "example.invalid"
}

function toFixtureCacheRecord(record: CacheRecord): CacheRecord {
  return {
    ...record,
    mode: "fixture",
    parent_check: { ...record.parent_check, live_status: "fixture_not_live" },
    source: { ...record.source, mode: "fixture" },
  }
}
