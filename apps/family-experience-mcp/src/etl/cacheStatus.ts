import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import type { FamilyExperienceSourceSetEntry } from "../config.js"
import { ETL_CACHE_FILES } from "./cache.js"
import type { CacheMetadata } from "./cacheContract.js"
import { buildCacheRefreshCommand } from "./cacheOperations.js"
import { parseCacheMetadata } from "./cacheContract.js"

type CacheStatusInput = {
  readonly allowFixture: boolean
  readonly cacheDir: string
  readonly now?: Date
  readonly sourceSet?: readonly FamilyExperienceSourceSetEntry[]
}

type CacheStatusBase = {
  readonly cacheDir: string
  readonly refreshCommand: string
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
      readonly status: "fresh" | "stale"
      readonly ttl_hours: number
    })

export function getCacheOperationalStatus(input: CacheStatusInput): CacheOperationalStatus {
  const refreshCommand = buildCacheRefreshCommand(input)
  const metadataPath = resolve(input.cacheDir, ETL_CACHE_FILES.metadata)
  const publishMarkerPath = resolve(input.cacheDir, ETL_CACHE_FILES.publishMarker)
  const baseStatus = {
    cacheDir: input.cacheDir,
    refreshCommand,
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

    const generatedAtMs = Date.parse(metadata.generated_at)

    if (!Number.isFinite(generatedAtMs)) {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
    }

    const expiresAtMs = generatedAtMs + metadata.ttl_hours * 60 * 60 * 1_000
    const ageSeconds = Math.max(0, Math.floor(((input.now ?? new Date()).getTime() - generatedAtMs) / 1_000))
    const mode: "fixture" | "live" = metadata.fixture ? "fixture" : "live"
    const freshnessBase = {
      ...baseStatus,
      age_seconds: ageSeconds,
      expiresAt: new Date(expiresAtMs).toISOString(),
      generated_at: metadata.generated_at,
      mode,
      source_health: sourceHealthFromMetadata(metadata),
      ttl_hours: metadata.ttl_hours,
    }

    return expiresAtMs < (input.now ?? new Date()).getTime()
      ? { ...freshnessBase, status: "stale" }
      : { ...freshnessBase, status: "fresh" }
  } catch (error: unknown) {
    if (error instanceof SyntaxError || error instanceof Error) {
      return emptyCacheStatus({ ...baseStatus, status: "invalid" })
    }

    throw error
  }
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
