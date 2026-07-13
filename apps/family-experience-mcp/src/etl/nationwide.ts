import { resolve } from "node:path"

import type { FamilyExperienceSourceSetEntry } from "../config.js"
import type { SourceAdapterResult, SourceId } from "../sources/types.js"
import { buildMetadata, ETL_CACHE_FILES, type NationwideCacheMetadata, writeCache } from "./cache.js"
import { parseNationwideEtlArgs } from "./cliArgs.js"
import { NationwideEtlInputError } from "./errors.js"
import { redactDiagnosticText } from "./redaction.js"
import { loadSource } from "./sourceLoaders.js"

type EtlMode = "dry-run" | "write-cache"

export type NationwideEtlOptions = {
  readonly cacheDir: string
  readonly fixture: boolean
  readonly maxPages: number
  readonly mode: EtlMode
  readonly sourceSet: readonly FamilyExperienceSourceSetEntry[]
  readonly ttlHours: number
  readonly env?: NodeJS.ProcessEnv
  readonly nowIso?: () => string
}

export type NationwideEtlReport = NationwideCacheMetadata & {
  readonly ok: boolean
  readonly published: boolean
  readonly cache_dir: string
  readonly diagnostics: {
    readonly redacted_sample_url: string
    readonly redaction_verified: boolean
  }
  readonly sources: readonly NationwideSourceSummary[]
}

type NationwideSourceSummary = {
  readonly ok: boolean
  readonly source: FamilyExperienceSourceSetEntry
  readonly source_id: SourceId
  readonly records: number
  readonly raw_snapshots: number
  readonly failure_code?: string
  readonly diagnostics?: unknown
}

export { ETL_CACHE_FILES, NationwideEtlInputError, parseNationwideEtlArgs, redactDiagnosticText }
export type { NationwideCacheMetadata }

export async function runNationwideEtl(options: NationwideEtlOptions): Promise<NationwideEtlReport> {
  const generatedAt = options.nowIso?.() ?? new Date().toISOString()
  const results = await Promise.all(
    options.sourceSet.map((source) => loadSource({ source, fixture: options.fixture, maxPages: options.maxPages, ...(options.env === undefined ? {} : { env: options.env }) })),
  )
  const rawSnapshots = results.flatMap((result) => (result.ok ? [...result.raw_snapshots] : []))
  const records = results.flatMap((result) => (result.ok ? [...result.records] : []))
  const sourceSummaries = results.map((result, index) =>
    summarizeSource({ result, source: options.sourceSet[index] ?? "fixture" }),
  )
  const metadata = buildMetadata({
    generatedAt,
    fixture: options.fixture,
    maxPages: options.maxPages,
    mode: options.mode,
    rawSnapshots,
    records,
    sourceSet: options.sourceSet,
    sourceSummaries,
    ttlHours: options.ttlHours,
  })
  const allSourcesOk = sourceSummaries.length > 0 && sourceSummaries.every((source) => source.ok)
  const hasSuccessfulSource = sourceSummaries.some((source) => source.ok)
  const published = options.mode === "write-cache" && hasSuccessfulSource

  if (published) {
    await writeCache({ cacheDir: options.cacheDir, metadata, rawSnapshots, records })
  }

  return {
    ...metadata,
    ok: allSourcesOk,
    published,
    cache_dir: resolve(options.cacheDir),
    diagnostics: {
      redacted_sample_url: "https://fixture.example.test/etl?serviceKey=<redacted>",
      redaction_verified: !hasSecretLeak(JSON.stringify(sourceSummaries), options.env),
    },
    sources: sourceSummaries,
  }
}

function summarizeSource(input: {
  readonly result: SourceAdapterResult
  readonly source: FamilyExperienceSourceSetEntry
}): NationwideSourceSummary {
  if (input.result.ok) {
    return {
      ok: true,
      source: input.source,
      source_id: input.result.source_id,
      records: input.result.records.length,
      raw_snapshots: input.result.raw_snapshots.length,
    }
  }
  return {
    ok: false,
    source: input.source,
    source_id: input.result.source_id,
    records: 0,
    raw_snapshots: 0,
    failure_code: input.result.failure.code,
    ...(input.result.failure.diagnostics === undefined ? {} : { diagnostics: input.result.failure.diagnostics }),
  }
}

function hasSecretLeak(text: string, env: NodeJS.ProcessEnv | undefined): boolean {
  return text !== redactDiagnosticText(text, env)
}
