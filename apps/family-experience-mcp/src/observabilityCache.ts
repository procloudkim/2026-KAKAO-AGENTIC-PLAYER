import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import type { FamilyExperienceConfig } from "./config.js"
import { ETL_CACHE_FILES } from "./etl/cache.js"
import { parseCacheMetadata, type CacheMetadata } from "./etl/cacheContract.js"
import { redactOperationalText } from "./observabilityRedaction.js"

export const CACHE_OPERATIONAL_STATUSES = [
  "not_configured",
  "missing",
  "fresh",
  "stale",
  "invalid",
  "unknown",
] as const

export type CacheOperationalStatus = (typeof CACHE_OPERATIONAL_STATUSES)[number]

export type SourceHealthSummary = {
  readonly total_sources: number
  readonly ok_sources: number
  readonly failed_sources: number
  readonly failure_codes: readonly string[]
}

export type CacheOperationalSummary = {
  readonly status: CacheOperationalStatus
  readonly generated_at: string | null
  readonly age_seconds: number | null
  readonly ttl_hours: number | null
  readonly source_health: SourceHealthSummary
}

export function getCacheOperationalSummary(
  config: FamilyExperienceConfig,
  now: Date = new Date(),
): CacheOperationalSummary {
  if (config.etlCacheDir === undefined) {
    return emptyCacheSummary("not_configured")
  }

  const metadataPath = resolve(config.etlCacheDir, ETL_CACHE_FILES.metadata)
  if (!existsSync(metadataPath)) {
    return emptyCacheSummary("missing")
  }

  try {
    const parsedJson: unknown = JSON.parse(readFileSync(metadataPath, "utf8"))
    const metadata = parseCacheMetadata(parsedJson)
    return metadata === undefined ? emptyCacheSummary("invalid") : cacheSummaryFromMetadata(metadata, now)
  } catch (error: unknown) {
    if (error instanceof Error) {
      return emptyCacheSummary("invalid")
    }
    throw error
  }
}

function cacheSummaryFromMetadata(metadata: CacheMetadata, now: Date): CacheOperationalSummary {
  const generatedAtMs = Date.parse(metadata.generated_at)
  if (!Number.isFinite(generatedAtMs)) {
    return emptyCacheSummary("invalid")
  }

  const ageSeconds = Math.max(0, Math.floor((now.getTime() - generatedAtMs) / 1_000))
  const expiresAtMs = generatedAtMs + metadata.ttl_hours * 60 * 60 * 1_000
  return {
    status: expiresAtMs < now.getTime() ? "stale" : "fresh",
    generated_at: metadata.generated_at,
    age_seconds: ageSeconds,
    ttl_hours: metadata.ttl_hours,
    source_health: sourceHealthFromMetadata(metadata),
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
      source.failure_code === undefined ? [] : [redactOperationalText(source.failure_code)],
    ),
  }
}

function emptyCacheSummary(status: CacheOperationalStatus): CacheOperationalSummary {
  return {
    status,
    generated_at: null,
    age_seconds: null,
    ttl_hours: null,
    source_health: {
      total_sources: 0,
      ok_sources: 0,
      failed_sources: 0,
      failure_codes: [],
    },
  }
}
