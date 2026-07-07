import { createHash } from "node:crypto"

import * as z from "zod/v4"

import { FAMILY_EXPERIENCE_SOURCE_SET_VALUES } from "../config.js"
import { SOURCE_IDS } from "../sources/types.js"
import { sourceMap } from "./sourceLoaders.js"

const hexSha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const sourceModeSchema = z.enum(["fixture", "live"])

export const cacheMetadataSchema = z
  .object({
    schema_version: z.literal(2),
    generated_at: z.iso.datetime(),
    mode: z.enum(["dry-run", "write-cache"]),
    fixture: z.boolean(),
    source_set: z.array(z.enum(FAMILY_EXPERIENCE_SOURCE_SET_VALUES)).min(1),
    source_ids: z.array(z.enum(SOURCE_IDS)).min(1),
    ttl_hours: z.number().int().min(1),
    max_pages: z.number().int().min(1),
    counts: z.object({
      failures: z.number().int().min(0),
      normalized_records: z.number().int().min(0),
      raw_snapshots: z.number().int().min(0),
    }),
    files: z.object({
      normalized_records: z.string().trim().min(1),
      raw_snapshots: z.string().trim().min(1),
    }),
    publish_id: z.string().trim().min(1),
    raw_snapshots_present: z.boolean().optional(),
    file_digests: z.object({
      normalized_records_sha256: hexSha256Schema,
      raw_snapshots_sha256: hexSha256Schema,
    }),
    source_provenance: z.array(
      z.object({
        source: z.enum(FAMILY_EXPERIENCE_SOURCE_SET_VALUES),
        source_id: z.enum(SOURCE_IDS),
        generated_at: z.iso.datetime(),
        ttl_hours: z.number().int().min(1),
        mode: sourceModeSchema,
        ok: z.boolean(),
        records: z.number().int().min(0),
        raw_snapshots: z.number().int().min(0),
        raw_snapshot_present: z.boolean(),
        failure_code: z.string().trim().min(1).optional(),
      }),
    ),
  })
  .passthrough()

const legacyCacheMetadataSchema = z
  .object({
    generated_at: z.iso.datetime(),
    fixture: z.literal(true),
    ttl_hours: z.number().int().min(1),
  })
  .passthrough()
  .refine(
    (metadata) =>
      metadata.fixture &&
      !("mode" in metadata) &&
      !("source_set" in metadata) &&
      !("counts" in metadata) &&
      !("files" in metadata),
  )

export const cacheRecordSchema = z
  .object({
    mode: sourceModeSchema,
    city: z.string().trim().min(1),
    date: z.object({ start: z.string().trim().min(1), end: z.string().trim().min(1) }).passthrough(),
    venue: z.object({ name: z.string().trim().min(1), address: z.string().trim().min(1) }).passthrough(),
    child_stages: z.array(z.enum(["infant", "toddler", "preschool", "school_age", "teen"])),
    min_child_age: z.number().int().min(0).max(17),
    max_child_age: z.number().int().min(0).max(17),
    parent_check: z.object({ live_status: z.enum(["fixture_not_live", "source_timestamp_required"]) }).passthrough(),
    source: z
      .object({
        id: z.enum(SOURCE_IDS),
        mode: sourceModeSchema,
        url: z.string().url(),
      })
      .passthrough(),
  })
  .passthrough()

type LegacyFixtureCacheMetadata = {
  readonly schema_version?: undefined
  readonly generated_at: string
  readonly mode: "write-cache"
  readonly fixture: true
  readonly source_set: readonly ["fixture"]
  readonly source_ids: readonly ["fixture-family-experience-v1"]
  readonly ttl_hours: number
  readonly max_pages: 1
  readonly counts: {
    readonly failures: 0
    readonly normalized_records: 0
    readonly raw_snapshots: 0
  }
  readonly files: {
    readonly normalized_records: "normalized-records.jsonl"
    readonly raw_snapshots: "raw-snapshots.jsonl"
  }
  readonly publish_id?: never
  readonly raw_snapshots_present?: never
  readonly file_digests?: never
  readonly source_provenance?: never
}

export type CacheMetadata = z.infer<typeof cacheMetadataSchema> | LegacyFixtureCacheMetadata
export type CacheRecord = z.infer<typeof cacheRecordSchema>

type CacheContractValidationResult = { readonly ok: true } | { readonly ok: false; readonly message: string }

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

export function parseCacheMetadata(value: unknown): CacheMetadata | undefined {
  const current = cacheMetadataSchema.safeParse(value)
  if (current.success) {
    return current.data
  }

  const legacy = legacyCacheMetadataSchema.safeParse(value)
  if (!legacy.success) {
    return undefined
  }

  const legacyMetadata: LegacyFixtureCacheMetadata = {
    generated_at: legacy.data.generated_at,
    mode: "write-cache",
    fixture: legacy.data.fixture,
    source_set: ["fixture"],
    source_ids: ["fixture-family-experience-v1"],
    ttl_hours: legacy.data.ttl_hours,
    max_pages: 1,
    counts: {
      failures: 0,
      normalized_records: 0,
      raw_snapshots: 0,
    },
    files: {
      normalized_records: "normalized-records.jsonl",
      raw_snapshots: "raw-snapshots.jsonl",
    },
  }

  return legacyMetadata
}

export function countJsonlRecords(text: string): number {
  return text.split(/\r?\n/).filter((line) => line.trim().length > 0).length
}

export function validateCacheContract(input: {
  readonly metadata: CacheMetadata
  readonly records: readonly CacheRecord[]
  readonly recordsText: string
  readonly rawSnapshotsText: string
}): CacheContractValidationResult {
  const rawSnapshotCount = countJsonlRecords(input.rawSnapshotsText)
  const recordCount = input.records.length
  const expectedRawSnapshotPresence = rawSnapshotCount > 0

  if (input.metadata.counts.normalized_records !== recordCount) {
    return contractFailure("metadata normalized record count does not match normalized-records.jsonl")
  }

  if (input.metadata.counts.raw_snapshots !== rawSnapshotCount) {
    return contractFailure("metadata raw snapshot count does not match raw-snapshots.jsonl")
  }

  if (
    input.metadata.raw_snapshots_present !== undefined &&
    input.metadata.raw_snapshots_present !== expectedRawSnapshotPresence
  ) {
    return contractFailure("metadata raw snapshot presence does not match raw-snapshots.jsonl")
  }

  const fileDigestResult = validateFileDigests(input)
  if (!fileDigestResult.ok) {
    return fileDigestResult
  }

  const modeResult = validateFixtureLiveContract(input)
  if (!modeResult.ok) {
    return modeResult
  }

  const sourceResult = validateSourceContract(input.metadata)
  if (!sourceResult.ok) {
    return sourceResult
  }

  return { ok: true }
}

function validateFileDigests(input: {
  readonly metadata: CacheMetadata
  readonly recordsText: string
  readonly rawSnapshotsText: string
}): CacheContractValidationResult {
  if (input.metadata.file_digests === undefined) {
    return input.metadata.schema_version === undefined
      ? { ok: true }
      : contractFailure("metadata file digests are required")
  }

  if (input.metadata.file_digests.normalized_records_sha256 !== sha256Hex(input.recordsText)) {
    return contractFailure("metadata normalized record digest does not match normalized-records.jsonl")
  }

  if (input.metadata.file_digests.raw_snapshots_sha256 !== sha256Hex(input.rawSnapshotsText)) {
    return contractFailure("metadata raw snapshot digest does not match raw-snapshots.jsonl")
  }

  return { ok: true }
}

function validateFixtureLiveContract(input: {
  readonly metadata: CacheMetadata
  readonly records: readonly CacheRecord[]
}): CacheContractValidationResult {
  if (input.metadata.fixture) {
    return { ok: true }
  }

  const fixtureRecord = input.records.find(
    (record) => record.mode === "fixture" || record.source.mode === "fixture",
  )

  if (fixtureRecord !== undefined) {
    return contractFailure("live cache metadata points at fixture records")
  }

  return { ok: true }
}

function validateSourceContract(metadata: CacheMetadata): CacheContractValidationResult {
  if (metadata.source_provenance === undefined) {
    return metadata.schema_version === undefined
      ? { ok: true }
      : contractFailure("source-level provenance is required")
  }

  const sourceRecordTotal = metadata.source_provenance.reduce((total, source) => total + source.records, 0)
  const sourceRawSnapshotTotal = metadata.source_provenance.reduce((total, source) => total + source.raw_snapshots, 0)
  const sourceFailureTotal = metadata.source_provenance.filter((source) => !source.ok).length

  if (sourceRecordTotal !== metadata.counts.normalized_records) return contractFailure("source-level record counts do not match metadata total")

  if (sourceRawSnapshotTotal !== metadata.counts.raw_snapshots) return contractFailure("source-level raw snapshot counts do not match metadata total")

  if (sourceFailureTotal !== metadata.counts.failures) return contractFailure("source-level failure count does not match metadata total")

  const missingInputSource = metadata.source_provenance.find((source) => !metadata.source_set.includes(source.source))
  if (missingInputSource !== undefined) {
    return contractFailure("source-level provenance includes a source outside source_set")
  }

  const missingSourceId = metadata.source_provenance.find((source) => !metadata.source_ids.includes(source.source_id))
  if (missingSourceId !== undefined) {
    return contractFailure("source-level provenance includes a source id outside source_ids")
  }

  if (metadata.source_provenance.some((source) => sourceMap[source.source] !== source.source_id)) return contractFailure("source-level provenance source/source_id pair does not match source registry")

  const coversSourceSet = metadata.source_set.every((source) =>
    metadata.source_provenance.some((provenance) => provenance.source === source),
  )
  const coversSourceIds = metadata.source_ids.every((sourceId) =>
    metadata.source_provenance.some((provenance) => provenance.source_id === sourceId),
  )
  if (!coversSourceSet || !coversSourceIds) {
    return contractFailure("source-level provenance is incomplete for source_set/source_ids")
  }

  const rawSnapshotMismatch = metadata.source_provenance.find((source) => source.raw_snapshot_present !== (source.raw_snapshots > 0))
  if (rawSnapshotMismatch !== undefined) {
    return contractFailure("source-level raw snapshot presence does not match source counts")
  }

  return { ok: true }
}

function contractFailure(message: string): CacheContractValidationResult {
  return { ok: false, message }
}
