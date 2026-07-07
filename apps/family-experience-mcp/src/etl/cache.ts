import { randomUUID } from "node:crypto"
import { mkdir, rename, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import type { FamilyExperienceSourceSetEntry } from "../config.js"
import type { FamilyExperienceSourceRecord, RawSourceSnapshot, SourceId } from "../sources/types.js"
import { sha256Hex } from "./cacheContract.js"
import { sourceMap } from "./sourceLoaders.js"

export const ETL_CACHE_FILES = {
  metadata: "metadata.json",
  normalized: "normalized-records.jsonl",
  publishMarker: ".publish-in-progress",
  rawSnapshots: "raw-snapshots.jsonl",
} as const

type CacheSourceProvenance = {
  readonly source: FamilyExperienceSourceSetEntry
  readonly source_id: SourceId
  readonly generated_at: string
  readonly ttl_hours: number
  readonly mode: "fixture" | "live"
  readonly ok: boolean
  readonly records: number
  readonly raw_snapshots: number
  readonly raw_snapshot_present: boolean
  readonly failure_code?: string
}

export type NationwideCacheMetadata = {
  readonly schema_version?: 2
  readonly generated_at: string
  readonly mode: "dry-run" | "write-cache"
  readonly fixture: boolean
  readonly source_set: readonly FamilyExperienceSourceSetEntry[]
  readonly source_ids: readonly SourceId[]
  readonly ttl_hours: number
  readonly max_pages: number
  readonly counts: {
    readonly failures: number
    readonly normalized_records: number
    readonly raw_snapshots: number
  }
  readonly raw_snapshots_present?: boolean
  readonly publish_id?: string
  readonly files: {
    readonly normalized_records: string
    readonly raw_snapshots: string
  }
  readonly file_digests?: {
    readonly normalized_records_sha256: string
    readonly raw_snapshots_sha256: string
  }
  readonly source_provenance?: readonly CacheSourceProvenance[]
}

type CacheSourceSummaryInput = {
  readonly ok: boolean
  readonly records?: number
  readonly raw_snapshots?: number
  readonly failure_code?: string
}

export type CacheBuildInput = {
  readonly generatedAt: string
  readonly fixture: boolean
  readonly maxPages: number
  readonly mode: "dry-run" | "write-cache"
  readonly rawSnapshots: readonly RawSourceSnapshot[]
  readonly records: readonly FamilyExperienceSourceRecord[]
  readonly sourceSet: readonly FamilyExperienceSourceSetEntry[]
  readonly sourceSummaries: readonly CacheSourceSummaryInput[]
  readonly ttlHours: number
}

export function buildMetadata(input: CacheBuildInput): NationwideCacheMetadata {
  return {
    generated_at: input.generatedAt,
    mode: input.mode,
    fixture: input.fixture,
    source_set: input.sourceSet,
    source_ids: input.sourceSet.map((source) => sourceMap[source]),
    ttl_hours: input.ttlHours,
    max_pages: input.maxPages,
    counts: {
      failures: input.sourceSummaries.filter((source) => !source.ok).length,
      normalized_records: input.records.length,
      raw_snapshots: input.rawSnapshots.length,
    },
    raw_snapshots_present: input.rawSnapshots.length > 0,
    files: {
      normalized_records: ETL_CACHE_FILES.normalized,
      raw_snapshots: ETL_CACHE_FILES.rawSnapshots,
    },
    source_provenance: input.sourceSet.map((source, index) =>
      sourceProvenance({
        generatedAt: input.generatedAt,
        fixture: input.fixture,
        rawSnapshots: input.rawSnapshots,
        records: input.records,
        source,
        summary: input.sourceSummaries[index],
        ttlHours: input.ttlHours,
      }),
    ),
  }
}

export async function writeCache(input: {
  readonly cacheDir: string
  readonly metadata: NationwideCacheMetadata
  readonly rawSnapshots: readonly RawSourceSnapshot[]
  readonly records: readonly FamilyExperienceSourceRecord[]
}): Promise<void> {
  const publishId = `cache-${process.pid}-${Date.now()}-${randomUUID()}`
  const normalizedText = toJsonl(input.records)
  const rawSnapshotsText = toJsonl(input.rawSnapshots)
  const metadata = publishedMetadata({
    metadata: input.metadata,
    normalizedText,
    publishId,
    rawSnapshotsText,
  })
  const markerPath = resolve(input.cacheDir, ETL_CACHE_FILES.publishMarker)
  const tempMetadataPath = tempPath(input.cacheDir, ETL_CACHE_FILES.metadata, publishId)
  const tempRawSnapshotsPath = tempPath(input.cacheDir, ETL_CACHE_FILES.rawSnapshots, publishId)
  const tempNormalizedPath = tempPath(input.cacheDir, ETL_CACHE_FILES.normalized, publishId)

  await mkdir(input.cacheDir, { recursive: true })
  await writeFile(markerPath, `${JSON.stringify({ publish_id: publishId, started_at: new Date().toISOString() })}\n`, "utf8")
  await Promise.all([
    writeFile(tempMetadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8"),
    writeFile(tempRawSnapshotsPath, rawSnapshotsText, "utf8"),
    writeFile(tempNormalizedPath, normalizedText, "utf8"),
  ])
  await rename(tempNormalizedPath, resolve(input.cacheDir, ETL_CACHE_FILES.normalized))
  await rename(tempRawSnapshotsPath, resolve(input.cacheDir, ETL_CACHE_FILES.rawSnapshots))
  await rename(tempMetadataPath, resolve(input.cacheDir, ETL_CACHE_FILES.metadata))
  await rm(markerPath, { force: true })
}

function sourceProvenance(input: {
  readonly generatedAt: string
  readonly fixture: boolean
  readonly rawSnapshots: readonly RawSourceSnapshot[]
  readonly records: readonly FamilyExperienceSourceRecord[]
  readonly source: FamilyExperienceSourceSetEntry
  readonly summary: CacheSourceSummaryInput | undefined
  readonly ttlHours: number
}): CacheSourceProvenance {
  const sourceId = sourceMap[input.source]
  const records = input.summary?.records ?? input.records.filter((record) => record.source.id === sourceId).length
  const rawSnapshots =
    input.summary?.raw_snapshots ??
    input.rawSnapshots.filter((snapshot) => snapshot.source_id === sourceId).length

  return {
    source: input.source,
    source_id: sourceId,
    generated_at: input.generatedAt,
    ttl_hours: input.ttlHours,
    mode: input.fixture ? "fixture" : "live",
    ok: input.summary?.ok ?? false,
    records,
    raw_snapshots: rawSnapshots,
    raw_snapshot_present: rawSnapshots > 0,
    ...(input.summary?.failure_code === undefined ? {} : { failure_code: input.summary.failure_code }),
  }
}

function publishedMetadata(input: {
  readonly metadata: NationwideCacheMetadata
  readonly normalizedText: string
  readonly publishId: string
  readonly rawSnapshotsText: string
}): NationwideCacheMetadata {
  return {
    ...input.metadata,
    schema_version: 2,
    publish_id: input.publishId,
    raw_snapshots_present: input.rawSnapshotsText.trim().length > 0,
    file_digests: {
      normalized_records_sha256: sha256Hex(input.normalizedText),
      raw_snapshots_sha256: sha256Hex(input.rawSnapshotsText),
    },
  }
}

function tempPath(cacheDir: string, fileName: string, publishId: string): string {
  return resolve(cacheDir, `${fileName}.${publishId}.tmp`)
}

function toJsonl(values: readonly unknown[]): string {
  return values.map((value) => JSON.stringify(value)).join("\n").concat(values.length === 0 ? "" : "\n")
}
