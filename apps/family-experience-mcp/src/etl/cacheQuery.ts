import { access, readFile } from "node:fs/promises"
import { resolve } from "node:path"

import type { FamilyExperienceSourceSetEntry } from "../config.js"
import type { SourceAdapterRequest } from "../sources/types.js"
import type { ToolFailure, ToolMode } from "../types.js"
import { ETL_CACHE_FILES } from "./cache.js"
import { buildCacheRecoverySentence } from "./cacheOperations.js"
import { filterCacheRecordsForRequest, modeFor, scopeCacheRecords } from "./cacheRecordScope.js"
import {
  type CacheMetadata,
  type CacheRecord,
  cacheRecordSchema,
  parseCacheMetadata,
  validateCacheContract,
} from "./cacheContract.js"

type CacheQueryFailure = { readonly ok: false; readonly mode: "live"; readonly failure: ToolFailure }
type CacheQueryContext = {
  readonly allowFixture: boolean
  readonly cacheDir: string
  readonly sourceSet?: readonly FamilyExperienceSourceSetEntry[]
}

export type CacheQueryResult =
  | { readonly ok: true; readonly mode: ToolMode; readonly records: readonly unknown[] }
  | CacheQueryFailure

export async function queryNationwideCache(input: {
  readonly allowFixture?: boolean
  readonly cacheDir: string
  readonly request: SourceAdapterRequest
  readonly now?: Date
  readonly sourceSet?: readonly FamilyExperienceSourceSetEntry[]
}): Promise<CacheQueryResult> {
  const context: CacheQueryContext = {
    allowFixture: input.allowFixture ?? false,
    cacheDir: input.cacheDir,
    ...(input.sourceSet === undefined ? {} : { sourceSet: input.sourceSet }),
  }
  const metadataPath = resolve(input.cacheDir, ETL_CACHE_FILES.metadata)
  const recordsPath = resolve(input.cacheDir, ETL_CACHE_FILES.normalized)
  const rawSnapshotsPath = resolve(input.cacheDir, ETL_CACHE_FILES.rawSnapshots)
  const publishMarkerPath = resolve(input.cacheDir, ETL_CACHE_FILES.publishMarker)
  const initialPublishState = await getPublishState(publishMarkerPath, context)

  if (!initialPublishState.ok) {
    return initialPublishState
  }

  const metadataResult = await readMetadata(metadataPath, context)

  if (!metadataResult.ok) {
    return metadataResult
  }

  const freshness = getCacheFreshness({
    generatedAt: metadataResult.metadata.generated_at,
    ttlHours: metadataResult.metadata.ttl_hours,
    now: input.now ?? new Date(),
    context,
  })

  if (!freshness.ok) {
    return freshness
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
    return invalidCacheFailure({
      context,
      message: `Nationwide cache provenance is invalid at ${input.cacheDir}: ${contractResult.message}.`,
    })
  }

  const matchedRecords = filterCacheRecordsForRequest({ records: recordsResult.records, request: input.request })
  const scopedRecords = scopeCacheRecords({ metadataFixture: metadataResult.metadata.fixture, records: matchedRecords })

  return { ok: true, mode: modeFor(scopedRecords), records: scopedRecords }
}

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
      return invalidCacheFailure({
        context,
        message: `Nationwide cache metadata is malformed at ${path}.`,
      })
    }

    return { ok: true, metadata: parsedMetadata }
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return invalidCacheFailure({
        context,
        message: `Nationwide cache metadata is not valid JSON at ${path}.`,
      })
    }

    throw error
  }
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

  for (const [index, line] of lines.entries()) {
    try {
      const parsedJson: unknown = JSON.parse(line)
      const parsedRecord = cacheRecordSchema.safeParse(parsedJson)

      if (!parsedRecord.success) {
        return invalidCacheFailure({
          context,
          message: `Nationwide cache record ${index + 1} is malformed at ${path}.`,
        })
      }

      records.push(parsedRecord.data)
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        return invalidCacheFailure({
          context,
          message: `Nationwide cache record ${index + 1} is not valid JSON at ${path}.`,
        })
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
        message: `Nationwide cache refresh is in progress at ${context.cacheDir}. Retry after the ETL publish completes.`,
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
  const generatedAtMs = Date.parse(input.generatedAt)

  if (!Number.isFinite(generatedAtMs)) {
    return invalidCacheFailure({
      context: input.context,
      message: `Nationwide cache metadata has an invalid generated_at timestamp in ${input.context.cacheDir}.`,
    })
  }

  const expiresAtMs = generatedAtMs + input.ttlHours * 60 * 60 * 1_000

  if (expiresAtMs < input.now.getTime()) {
    return {
      ok: false,
      mode: "live",
      failure: {
        code: "missing_configuration",
        message: `Nationwide cache is stale at ${input.context.cacheDir}. ${buildCacheRecoverySentence(input.context)}`,
        retryable: false,
      },
    }
  }

  return { ok: true }
}

function missingCacheFailure(context: CacheQueryContext): CacheQueryFailure {
  return {
    ok: false,
    mode: "live",
    failure: {
      code: "missing_configuration",
      message: `Nationwide cache is missing at ${context.cacheDir}. ${buildCacheRecoverySentence(context)}`,
      retryable: false,
    },
  }
}

function invalidCacheFailure(input: { readonly context: CacheQueryContext; readonly message: string }): CacheQueryFailure {
  return {
    ok: false,
    mode: "live",
    failure: {
      code: "upstream_invalid_response",
      message: `${input.message} ${buildCacheRecoverySentence(input.context)}`,
      retryable: false,
    },
  }
}
