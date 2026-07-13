import { access, readFile } from "node:fs/promises"
import { resolve } from "node:path"

import type { FamilyExperienceSourceSetEntry } from "../config.js"
import type { SourceAdapterRequest } from "../sources/types.js"
import type { ToolFailure, ToolMode } from "../types.js"
import { ETL_CACHE_FILES } from "./cache.js"
import { filterCacheRecordsForRequest, modeFor, scopeCacheRecords } from "./cacheRecordScope.js"
import {
  type CacheMetadata,
  type CacheRecord,
  cacheRecordSchema,
  parseCacheMetadata,
  validateCacheContract,
} from "./cacheContract.js"
import { assessCacheFreshness } from "./cacheFreshness.js"

type CacheQueryFailure = {
  readonly ok: false
  readonly mode: "live"
  readonly failure: ToolFailure
  readonly reason?: "fixture_not_allowed"
}
type CacheQueryContext = {
  readonly allowFixture: boolean
  readonly cacheDir: string
  readonly expectedTtlHours?: number
  readonly sourceSet?: readonly FamilyExperienceSourceSetEntry[]
}

export type CacheQueryResult =
  | { readonly ok: true; readonly mode: ToolMode; readonly records: readonly unknown[] }
  | CacheQueryFailure

export type NationwideCacheSnapshotStore = {
  readonly getOrLoad: <T>(
    key: string,
    load: () => Promise<T>,
    shouldCache: (value: T) => boolean,
  ) => Promise<T>
}

export function createNationwideCacheSnapshotStore(): NationwideCacheSnapshotStore {
  const entries = new Map<string, Promise<unknown>>()

  return {
    getOrLoad: async <T>(key: string, load: () => Promise<T>, shouldCache: (value: T) => boolean) => {
      const existing = entries.get(key) as Promise<T> | undefined
      if (existing !== undefined) {
        return existing
      }

      const pending = load()
      entries.set(key, pending)
      try {
        const value = await pending
        if (!shouldCache(value)) {
          entries.delete(key)
        }
        return value
      } catch (error: unknown) {
        entries.delete(key)
        throw error
      }
    },
  }
}

export async function queryNationwideCache(input: {
  readonly allowFixture?: boolean
  readonly cacheDir: string
  readonly expectedTtlHours?: number
  readonly request: SourceAdapterRequest
  readonly now?: Date
  readonly snapshotStore?: NationwideCacheSnapshotStore
  readonly sourceSet?: readonly FamilyExperienceSourceSetEntry[]
}): Promise<CacheQueryResult> {
  const context: CacheQueryContext = {
    allowFixture: input.allowFixture ?? false,
    cacheDir: input.cacheDir,
    ...(input.expectedTtlHours === undefined ? {} : { expectedTtlHours: input.expectedTtlHours }),
    ...(input.sourceSet === undefined ? {} : { sourceSet: input.sourceSet }),
  }
  const metadataPath = resolve(input.cacheDir, ETL_CACHE_FILES.metadata)
  const recordsPath = resolve(input.cacheDir, ETL_CACHE_FILES.normalized)
  const rawSnapshotsPath = resolve(input.cacheDir, ETL_CACHE_FILES.rawSnapshots)
  const publishMarkerPath = resolve(input.cacheDir, ETL_CACHE_FILES.publishMarker)
  const loadBundle = async (): Promise<CacheBundleResult> => {
    const initialPublishState = await getPublishState(publishMarkerPath, context)

    if (!initialPublishState.ok) {
      return initialPublishState
    }

    const metadataResult = await readMetadata(metadataPath, context)

    if (!metadataResult.ok) {
      return metadataResult
    }

    const recordsResult = await readCacheRecords(recordsPath, context)

    if (!recordsResult.ok) {
      return recordsResult
    }

    const rawSnapshotsResult = await readFileSafely(rawSnapshotsPath, context)

    if (!rawSnapshotsResult.ok) {
      return rawSnapshotsResult
    }

    const finalPublishState = await getPublishState(publishMarkerPath, context)

    if (!finalPublishState.ok) {
      return finalPublishState
    }

    const contractResult = validateCacheContract({
      metadata: metadataResult.metadata,
      records: recordsResult.records,
      recordsText: recordsResult.text,
      rawSnapshotsText: rawSnapshotsResult.text,
    })

    if (!contractResult.ok) {
      return invalidCacheFailure()
    }

    return {
      ok: true,
      metadata: metadataResult.metadata,
      records: recordsResult.records,
    }
  }
  const cacheKey = JSON.stringify([
    resolve(input.cacheDir),
    context.expectedTtlHours ?? null,
    [...new Set(context.sourceSet ?? [])].sort(),
  ])
  const bundle = input.snapshotStore === undefined
    ? await loadBundle()
    : await input.snapshotStore.getOrLoad(cacheKey, loadBundle, (value) => value.ok)

  if (!bundle.ok) {
    return bundle
  }

  if (bundle.metadata.fixture && !context.allowFixture) {
    return {
      ok: false,
      mode: "live",
      reason: "fixture_not_allowed",
      failure: {
        code: "missing_configuration",
        message: "Nationwide fixture cache mode is unavailable in production.",
        retryable: false,
      },
    }
  }

  const freshness = getCacheFreshness({
    generatedAt: bundle.metadata.generated_at,
    ttlHours: bundle.metadata.ttl_hours,
    now: input.now ?? new Date(),
    context,
  })

  if (!freshness.ok) {
    return freshness
  }

  const matchedRecords = filterCacheRecordsForRequest({ records: bundle.records, request: input.request })
  const scopedRecords = scopeCacheRecords({ metadataFixture: bundle.metadata.fixture, records: matchedRecords })

  return { ok: true, mode: modeFor(scopedRecords), records: scopedRecords }
}

type CacheBundleResult =
  | { readonly ok: true; readonly metadata: CacheMetadata; readonly records: readonly CacheRecord[] }
  | CacheQueryFailure

type MetadataReadResult = { readonly ok: true; readonly metadata: CacheMetadata } | CacheQueryFailure

async function readMetadata(path: string, context: CacheQueryContext): Promise<MetadataReadResult> {
  const file = await readFileSafely(path, context)

  if (!file.ok) {
    return file
  }

  try {
    const parsedJson: unknown = JSON.parse(file.text)
    const parsedMetadata = parseCacheMetadata(parsedJson)

    if (parsedMetadata === undefined) {
      return invalidCacheFailure()
    }

    if (!sourceSetsMatch(context.sourceSet, parsedMetadata.source_set)) {
      return invalidCacheFailure()
    }

    if (
      context.expectedTtlHours !== undefined &&
      parsedMetadata.ttl_hours !== context.expectedTtlHours
    ) {
      return invalidCacheFailure()
    }

    return { ok: true, metadata: parsedMetadata }
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return invalidCacheFailure()
    }

    throw error
  }
}

function sourceSetsMatch(
  configured: readonly FamilyExperienceSourceSetEntry[] | undefined,
  cached: readonly FamilyExperienceSourceSetEntry[],
): boolean {
  if (configured === undefined) {
    return true
  }
  return [...new Set(configured)].sort().join("\0") === [...new Set(cached)].sort().join("\0")
}

type CacheRecordsReadResult =
  | { readonly ok: true; readonly records: readonly CacheRecord[]; readonly text: string }
  | CacheQueryFailure

async function readCacheRecords(path: string, context: CacheQueryContext): Promise<CacheRecordsReadResult> {
  const file = await readFileSafely(path, context)

  if (!file.ok) {
    return file
  }

  const records: CacheRecord[] = []
  const lines = file.text.split(/\r?\n/).filter((line) => line.trim().length > 0)

  for (const line of lines) {
    try {
      const parsedJson: unknown = JSON.parse(line)
      const parsedRecord = cacheRecordSchema.safeParse(parsedJson)

      if (!parsedRecord.success) {
        return invalidCacheFailure()
      }

      records.push(parsedRecord.data)
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        return invalidCacheFailure()
      }

      throw error
    }
  }

  return { ok: true, records, text: file.text }
}

type FileReadResult = { readonly ok: true; readonly text: string } | CacheQueryFailure

async function readFileSafely(path: string, context: CacheQueryContext): Promise<FileReadResult> {
  try {
    return { ok: true, text: await readFile(path, "utf8") }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return missingCacheFailure(context)
    }

    throw error
  }
}

async function getPublishState(path: string, context: CacheQueryContext): Promise<{ readonly ok: true } | CacheQueryFailure> {
  try {
    await access(path)
    return {
      ok: false,
      mode: "live",
      failure: {
        code: "missing_configuration",
        message: "Nationwide cache refresh is in progress. Retry shortly.",
        retryable: true,
      },
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { ok: true }
    }

    throw error
  }
}

function getCacheFreshness(input: {
  readonly generatedAt: string
  readonly ttlHours: number
  readonly now: Date
  readonly context: CacheQueryContext
}): { readonly ok: true } | { readonly ok: false; readonly mode: "live"; readonly failure: ToolFailure } {
  const freshness = assessCacheFreshness({
    generatedAt: input.generatedAt,
    now: input.now,
    ttlHours: input.ttlHours,
  })

  if (freshness.status === "invalid") {
    return invalidCacheFailure()
  }

  if (freshness.status === "stale") {
    return {
      ok: false,
      mode: "live",
      failure: {
        code: "missing_configuration",
        message: "Nationwide cache is stale. Retry after the service cache is refreshed.",
        retryable: false,
      },
    }
  }

  return { ok: true }
}

function missingCacheFailure(_context: CacheQueryContext): CacheQueryFailure {
  return {
    ok: false,
    mode: "live",
    failure: {
      code: "missing_configuration",
      message: "Nationwide cache is unavailable. Contact the service operator.",
      retryable: false,
    },
  }
}

function invalidCacheFailure(): CacheQueryFailure {
  return {
    ok: false,
    mode: "live",
    failure: {
      code: "upstream_invalid_response",
      message: "Nationwide cache failed integrity validation. Contact the service operator.",
      retryable: false,
    },
  }
}
