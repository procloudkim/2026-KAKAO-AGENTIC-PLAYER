import { createHash } from "node:crypto"

import * as z from "zod/v4"

import { FAMILY_EXPERIENCE_SOURCE_SET_VALUES } from "../config.js"
import { SourceRecordSchema } from "../pipeline/sourceRecord.js"
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
    counts: z
      .object({
        failures: z.number().int().min(0),
        normalized_records: z.number().int().min(0),
        raw_snapshots: z.number().int().min(0),
      })
      .strict(),
    files: z
      .object({
        normalized_records: z.string().trim().min(1),
        raw_snapshots: z.string().trim().min(1),
      })
      .strict(),
    publish_id: z.string().trim().min(1),
    raw_snapshots_present: z.boolean().optional(),
    file_digests: z
      .object({
        normalized_records_sha256: hexSha256Schema,
        raw_snapshots_sha256: hexSha256Schema,
      })
      .strict(),
    source_provenance: z.array(
      z
        .object({
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
        })
        .strict(),
    ),
  })
  .strict()

const legacyCacheMetadataSchema = z
  .object({
    generated_at: z.iso.datetime(),
    fixture: z.literal(true),
    ttl_hours: z.number().int().min(1),
  })
  .strict()
  .refine(
    (metadata) =>
      metadata.fixture &&
      !("mode" in metadata) &&
      !("source_set" in metadata) &&
      !("counts" in metadata) &&
      !("files" in metadata),
  )

// Cache rows are an official-source persistence boundary. Reuse the complete,
// strict runtime schema so account, feedback, or provider-derived fields cannot
// hitchhike in normalized-records.jsonl.
export const cacheRecordSchema = SourceRecordSchema

export const cacheRawSnapshotSchema = z
  .object({
    snapshot_id: z.string().trim().min(1).max(512),
    source_id: z.enum(SOURCE_IDS),
    retrieved_at: z.iso.datetime(),
    request_hash: z.string().trim().min(1).max(128),
    payload_ref: z.string().trim().min(1).max(128),
    response_sha256: hexSha256Schema.optional(),
    evidence: z
      .object({
        content_id: z.string().trim().min(1).max(128).optional(),
        age_limit: z.string().trim().min(1).max(512).optional(),
        event_place: z.string().trim().min(1).max(512).optional(),
        address_detail: z.string().trim().min(1).max(512).optional(),
        play_time: z.string().trim().min(1).max(512).optional(),
        fee_text: z.string().trim().min(1).max(512).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()

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
export type CacheRawSnapshot = z.infer<typeof cacheRawSnapshotSchema>

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

  if (input.metadata.files.normalized_records !== "normalized-records.jsonl") {
    return contractFailure("metadata normalized records filename is invalid")
  }

  if (input.metadata.files.raw_snapshots !== "raw-snapshots.jsonl") {
    return contractFailure("metadata raw snapshots filename is invalid")
  }

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

  const rawSnapshotResult = parseRawSnapshots(input.rawSnapshotsText)
  if (!rawSnapshotResult.ok) {
    return rawSnapshotResult
  }

  const rawLinkResult = validateRawSnapshotLinks(input.records, rawSnapshotResult.snapshots)
  if (!rawLinkResult.ok) {
    return rawLinkResult
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

  const sourceContentResult = validateSourceContentContract(
    input.metadata,
    input.records,
    rawSnapshotResult.snapshots,
  )
  if (!sourceContentResult.ok) {
    return sourceContentResult
  }

  return { ok: true }
}

export function parseCacheRawSnapshots(text: string): readonly CacheRawSnapshot[] | undefined {
  const parsed = parseRawSnapshots(text)
  return parsed.ok ? parsed.snapshots : undefined
}

function parseRawSnapshots(text: string):
  | { readonly ok: true; readonly snapshots: readonly CacheRawSnapshot[] }
  | { readonly ok: false; readonly message: string } {
  const snapshots: CacheRawSnapshot[] = []
  for (const line of text.split(/\r?\n/u).filter((entry) => entry.trim().length > 0)) {
    let rawSnapshot: unknown
    try {
      rawSnapshot = JSON.parse(line)
    } catch {
      return { ok: false, message: "raw-snapshots.jsonl contains invalid JSON" }
    }
    const parsed = cacheRawSnapshotSchema.safeParse(rawSnapshot)
    if (!parsed.success) {
      return { ok: false, message: "raw-snapshots.jsonl contains an invalid snapshot" }
    }
    snapshots.push(parsed.data)
  }
  if (new Set(snapshots.map((snapshot) => snapshot.snapshot_id)).size !== snapshots.length) {
    return { ok: false, message: "raw-snapshots.jsonl contains duplicate snapshot ids" }
  }
  return { ok: true, snapshots }
}

function validateRawSnapshotLinks(
  records: readonly CacheRecord[],
  snapshots: readonly CacheRawSnapshot[],
): CacheContractValidationResult {
  const snapshotsById = new Map(snapshots.map((snapshot) => [snapshot.snapshot_id, snapshot]))
  if (snapshots.length > 0) {
    for (const record of records) {
      if (record.raw_snapshot_id !== record.source.raw_snapshot_id) {
        return contractFailure("cache record raw snapshot references are inconsistent")
      }
      const baseSnapshot = snapshotsById.get(record.raw_snapshot_id)
      if (baseSnapshot === undefined || baseSnapshot.source_id !== record.source.id) {
        return contractFailure("cache record points to a missing or wrong-source raw snapshot")
      }
    }
  }

  for (const snapshot of snapshots) {
    if (snapshot.source_id !== "kto-tourapi-events") {
      continue
    }
    if (snapshot.response_sha256 === undefined) {
      return contractFailure("KTO raw snapshot response SHA-256 is required")
    }
    if (snapshot.payload_ref === "detailIntro2") {
      if (snapshot.evidence?.content_id === undefined) {
        return contractFailure("KTO detailIntro2 raw snapshot requires content identity evidence")
      }
      if (
        snapshot.evidence.age_limit === undefined &&
        snapshot.evidence.event_place === undefined &&
        snapshot.evidence.play_time === undefined &&
        snapshot.evidence.fee_text === undefined
      ) {
        return contractFailure("KTO detailIntro2 raw snapshot requires persisted detail evidence")
      }
      if (snapshot.evidence.address_detail !== undefined) {
        return contractFailure("KTO detailIntro2 raw snapshot cannot assert address-detail evidence")
      }
    }
    if (snapshot.payload_ref === "detailCommon2") {
      if (
        snapshot.evidence?.content_id === undefined ||
        snapshot.evidence.address_detail === undefined
      ) {
        return contractFailure("KTO detailCommon2 raw snapshot requires content and address-detail evidence")
      }
      if (
        snapshot.evidence.age_limit !== undefined ||
        snapshot.evidence.event_place !== undefined ||
        snapshot.evidence.play_time !== undefined ||
        snapshot.evidence.fee_text !== undefined
      ) {
        return contractFailure("KTO detailCommon2 raw snapshot contains unrelated detail evidence")
      }
    }
  }

  for (const record of records) {
    if (
      record.mode !== "live" ||
      record.source.id !== "kto-tourapi-events" ||
      record.detail_evidence_snapshot_id === undefined
    ) {
      continue
    }
    const evidenceSnapshot = snapshotsById.get(record.detail_evidence_snapshot_id)
    const expectedContentId = record.source_identity?.basis === "provider_native"
      ? record.source_identity.key
      : undefined
    const evidence = evidenceSnapshot?.evidence
    if (
      evidenceSnapshot?.source_id !== "kto-tourapi-events" ||
      evidenceSnapshot.payload_ref !== "detailIntro2" ||
      evidenceSnapshot.response_sha256 === undefined ||
      evidence?.content_id !== expectedContentId ||
      (evidence?.play_time !== undefined && evidence.play_time !== record.date.time_text) ||
      (evidence?.fee_text !== undefined && evidence.fee_text !== record.fee_text)
    ) {
      return contractFailure("KTO record detail fields are not bound to matching detailIntro2 evidence")
    }
  }

  for (const record of records) {
    if (
      record.mode !== "live" ||
      record.source.id !== "kto-tourapi-events" ||
      record.confidence.age_fit !== "source-stated"
    ) {
      continue
    }
    const evidenceSnapshot = record.age_evidence_snapshot_id === undefined
      ? undefined
      : snapshotsById.get(record.age_evidence_snapshot_id)
    const expectedContentId = record.id.startsWith("kto-tourapi-events:")
      ? record.id.slice("kto-tourapi-events:".length)
      : undefined
    const evidence = evidenceSnapshot?.evidence
    if (
      evidenceSnapshot?.source_id !== "kto-tourapi-events" ||
      evidenceSnapshot.payload_ref !== "detailIntro2" ||
      evidenceSnapshot.response_sha256 === undefined ||
      evidence?.content_id !== expectedContentId ||
      evidence?.age_limit !== record.target_age_text
    ) {
      return contractFailure("KTO source-stated age record is not bound to matching detailIntro2 evidence")
    }
  }

  for (const record of records) {
    if (
      record.mode !== "live" ||
      record.source.id !== "kto-tourapi-events" ||
      record.venue_identity?.basis !== "provider_event_place"
    ) {
      continue
    }
    const evidenceSnapshot = record.venue_identity.evidence_snapshot_id === undefined
      ? undefined
      : snapshotsById.get(record.venue_identity.evidence_snapshot_id)
    const expectedContentId = record.source_identity?.basis === "provider_native"
      ? record.source_identity.key
      : undefined
    const evidence = evidenceSnapshot?.evidence
    if (
      evidenceSnapshot?.source_id !== "kto-tourapi-events" ||
      evidenceSnapshot.payload_ref !== "detailIntro2" ||
      evidenceSnapshot.response_sha256 === undefined ||
      evidence?.content_id !== expectedContentId ||
      evidence?.event_place !== record.venue.name
    ) {
      return contractFailure("KTO provider event place is not bound to matching detailIntro2 evidence")
    }
  }

  for (const record of records) {
    if (
      record.mode !== "live" ||
      record.source.id !== "kto-tourapi-events" ||
      record.venue_identity?.basis !== "provider_address_detail"
    ) {
      continue
    }
    const evidenceSnapshot = record.venue_identity.evidence_snapshot_id === undefined
      ? undefined
      : snapshotsById.get(record.venue_identity.evidence_snapshot_id)
    const expectedContentId = record.source_identity?.basis === "provider_native"
      ? record.source_identity.key
      : undefined
    const evidence = evidenceSnapshot?.evidence
    if (
      evidenceSnapshot?.source_id !== "kto-tourapi-events" ||
      evidenceSnapshot.payload_ref !== "detailCommon2" ||
      evidenceSnapshot.response_sha256 === undefined ||
      evidence?.content_id !== expectedContentId ||
      evidence?.address_detail !== record.venue.name
    ) {
      return contractFailure("KTO provider address detail is not bound to matching detailCommon2 evidence")
    }
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

  if (new Set(metadata.source_set).size !== metadata.source_set.length) {
    return contractFailure("source_set contains duplicates")
  }
  if (new Set(metadata.source_ids).size !== metadata.source_ids.length) {
    return contractFailure("source_ids contains duplicates")
  }
  if (new Set(metadata.source_provenance.map((source) => source.source)).size !== metadata.source_provenance.length) {
    return contractFailure("source-level provenance contains duplicate sources")
  }
  if (new Set(metadata.source_provenance.map((source) => source.source_id)).size !== metadata.source_provenance.length) {
    return contractFailure("source-level provenance contains duplicate source ids")
  }

  const sourceRecordTotal = metadata.source_provenance.reduce((total, source) => total + source.records, 0)
  const sourceRawSnapshotTotal = metadata.source_provenance.reduce((total, source) => total + source.raw_snapshots, 0)
  const sourceFailureTotal = metadata.source_provenance.filter((source) => !source.ok).length
  const expectedMode = metadata.fixture ? "fixture" : "live"

  if (
    metadata.source_provenance.some(
      (source) =>
        source.generated_at !== metadata.generated_at ||
        source.ttl_hours !== metadata.ttl_hours ||
        source.mode !== expectedMode,
    )
  ) {
    return contractFailure("source-level provenance freshness or mode does not match metadata")
  }

  if (
    metadata.source_provenance.some(
      (source) => (source.ok && source.failure_code !== undefined) || (!source.ok && source.failure_code === undefined),
    )
  ) {
    return contractFailure("source-level provenance failure status is inconsistent")
  }

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

function validateSourceContentContract(
  metadata: CacheMetadata,
  records: readonly CacheRecord[],
  snapshots: readonly CacheRawSnapshot[],
): CacheContractValidationResult {
  if (metadata.source_provenance === undefined) {
    return metadata.schema_version === undefined
      ? { ok: true }
      : contractFailure("source-level provenance is required")
  }

  for (const provenance of metadata.source_provenance) {
    const actualRecordCount = records.filter(
      (record) => record.source.id === provenance.source_id,
    ).length
    if (actualRecordCount !== provenance.records) {
      return contractFailure("source-level record count does not match actual records")
    }

    const actualRawSnapshotCount = snapshots.filter(
      (snapshot) => snapshot.source_id === provenance.source_id,
    ).length
    if (actualRawSnapshotCount !== provenance.raw_snapshots) {
      return contractFailure("source-level raw snapshot count does not match actual snapshots")
    }
  }

  return { ok: true }
}

function contractFailure(message: string): CacheContractValidationResult {
  return { ok: false, message }
}
