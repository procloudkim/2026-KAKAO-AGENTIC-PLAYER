import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import type { FamilyExperienceSourceSetEntry } from "../config.js"
import { ETL_CACHE_FILES } from "./cache.js"
import type { CacheMetadata } from "./cacheContract.js"
import { cacheRecordSchema, parseCacheMetadata, validateCacheContract } from "./cacheContract.js"
import {
  assessCacheServingFreshness,
  defaultCacheStaleGraceHours,
} from "./cacheFreshness.js"

type CacheStatusInput = {
  readonly allowFixture: boolean
  readonly cacheDir: string
  readonly expectedTtlHours?: number
  readonly now?: Date
  readonly sourceSet?: readonly FamilyExperienceSourceSetEntry[]
  readonly staleGraceHours?: number
}

type CacheStatusBase = {
  readonly source_health: SourceHealthSummary
}

type SourceHealthSummary = {
  readonly failed_sources: number
  readonly failure_codes: readonly string[]
  readonly ok_sources: number
  readonly total_sources: number
}

export type CacheOperationalStatus =
  | (CacheStatusBase & {
      readonly age_seconds: null
      readonly generated_at: null
      readonly status: "invalid" | "missing" | "refreshing"
      readonly ttl_hours: null
    })
  | (CacheStatusBase & {
      readonly age_seconds: number
      readonly expiresAt: string
      readonly generated_at: string
      readonly mode: "fixture" | "live"
      readonly staleGraceExpiresAt: string
      readonly status: "fresh" | "stale_servable" | "expired"
      readonly ttl_hours: number
    })

export function getCacheOperationalStatus(input: CacheStatusInput): CacheOperationalStatus {
  const metadataPath = resolve(input.cacheDir, ETL_CACHE_FILES.metadata)
  const normalizedPath = resolve(input.cacheDir, ETL_CACHE_FILES.normalized)
  const rawSnapshotsPath = resolve(input.cacheDir, ETL_CACHE_FILES.rawSnapshots)
  const publishMarkerPath = resolve(input.cacheDir, ETL_CACHE_FILES.publishMarker)
  const baseStatus = {
    source_health: emptySourceHealth(),
  }

  if (existsSync(publishMarkerPath)) {
    return emptyCacheStatus({ ...baseStatus, status: "refreshing" })
  }

  if (!existsSync(metadataPath)) {
    return emptyCacheStatus({ ...baseStatus, status: "missing" })
  }

  try {
    const metadata = parseCacheMetadata(JSON.parse(readFileSync(metadataPath, "utf8")))

    if (metadata === undefined) {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
    }

    if (!sourceSetsMatch(input.sourceSet, metadata.source_set)) {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
    }

    if (input.expectedTtlHours !== undefined && metadata.ttl_hours !== input.expectedTtlHours) {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
    }

    if (metadata.fixture && !input.allowFixture) {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
    }

    if (!existsSync(normalizedPath) || !existsSync(rawSnapshotsPath)) {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
    }

    const recordsText = readFileSync(normalizedPath, "utf8")
    const rawSnapshotsText = readFileSync(rawSnapshotsPath, "utf8")
    const records = recordsText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => cacheRecordSchema.safeParse(JSON.parse(line)))

    if (records.some((record) => !record.success)) {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
    }

    const parsedRecords = records.flatMap((record) => (record.success ? [record.data] : []))
    const contract = validateCacheContract({ metadata, records: parsedRecords, recordsText, rawSnapshotsText })
    if (!contract.ok) {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
    }

    const freshness = assessCacheServingFreshness({
      generatedAt: metadata.generated_at,
      now: input.now ?? new Date(),
      staleGraceHours:
        input.staleGraceHours ?? defaultCacheStaleGraceHours(metadata.ttl_hours),
      ttlHours: metadata.ttl_hours,
    })

    if (freshness.status === "invalid") {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
    }

    const mode: "fixture" | "live" = metadata.fixture ? "fixture" : "live"
    const freshnessBase = {
      ...baseStatus,
      age_seconds: freshness.ageSeconds,
      expiresAt: new Date(freshness.expiresAtMs).toISOString(),
      generated_at: metadata.generated_at,
      mode,
      staleGraceExpiresAt: new Date(freshness.staleGraceExpiresAtMs).toISOString(),
      source_health: sourceHealthFromMetadata(metadata),
      ttl_hours: metadata.ttl_hours,
    }

    return { ...freshnessBase, status: freshness.status }
  } catch (error: unknown) {
    if (error instanceof SyntaxError || error instanceof Error) {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
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

function emptyCacheStatus(
  input: CacheStatusBase & { readonly status: "invalid" | "missing" | "refreshing" },
): CacheOperationalStatus {
  return {
    ...input,
    age_seconds: null,
    generated_at: null,
    ttl_hours: null,
  }
}

function emptySourceHealth(): SourceHealthSummary {
  return {
    failed_sources: 0,
    failure_codes: [],
    ok_sources: 0,
    total_sources: 0,
  }
}

function sourceHealthFromMetadata(metadata: CacheMetadata): SourceHealthSummary {
  if (metadata.source_provenance === undefined) {
    return {
      total_sources: metadata.source_set.length,
      ok_sources: metadata.counts.failures === 0 ? metadata.source_set.length : 0,
      failed_sources: metadata.counts.failures,
      failure_codes: [],
    }
  }

  const failedSources = metadata.source_provenance.filter((source) => !source.ok)
  return {
    total_sources: metadata.source_provenance.length,
    ok_sources: metadata.source_provenance.length - failedSources.length,
    failed_sources: failedSources.length,
    failure_codes: failedSources.flatMap((source) =>
      source.failure_code === undefined ? [] : [source.failure_code],
    ),
  }
}
