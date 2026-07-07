import type { FamilyExperienceConfig } from "./config.js"
import { queryNationwideCache } from "./etl/cacheQuery.js"
import type { FindFamilyExperiencesInput } from "./schemas.js"
import { fixtureSourceAdapter } from "./sources/fixture.js"
import { createSeoulCultureSourceAdapter } from "./sources/seoulCulture.js"
import type {
  FamilyExperienceSourceAdapter,
  SourceAdapterFailure,
  SourceAdapterRequest,
} from "./sources/types.js"
import type { ToolFailure } from "./types.js"

export type SourceRecordsResult =
  | { readonly ok: true; readonly mode: "fixture" | "live"; readonly records: readonly unknown[] }
  | { readonly ok: false; readonly mode: "fixture" | "live"; readonly failure: ToolFailure }

export type LoadSourceRecordsRequest = {
  readonly input: SourceAdapterRequest
  readonly config: FamilyExperienceConfig
  readonly sourceAdapter: FamilyExperienceSourceAdapter | undefined
}

export function toSourceAdapterRequest(input: FindFamilyExperiencesInput): SourceAdapterRequest {
  return {
    location: input.location,
    date_range: input.date_range,
    ...(input.child_age === undefined ? {} : { child_age: input.child_age }),
    ...(input.child_stage === undefined ? {} : { child_stage: input.child_stage }),
  }
}

export async function loadSourceRecords(request: LoadSourceRecordsRequest): Promise<SourceRecordsResult> {
  if (!request.config.allowFixture && request.config.etlCacheDir !== undefined) {
    const cacheResult = await queryNationwideCache({
      allowFixture: request.config.allowFixture,
      cacheDir: request.config.etlCacheDir,
      request: request.input,
      ...(request.config.sourceSet === undefined ? {} : { sourceSet: request.config.sourceSet }),
    })

    if (cacheResult.ok && cacheResult.records.length > 0) {
      return {
        ok: true,
        mode: cacheResult.mode,
        records: cacheResult.records,
      }
    }

    if (cacheResult.ok && !canFallbackToLiveSource(request)) {
      return {
        ok: false,
        mode: "live",
        failure: {
          code: "missing_configuration",
          message:
            "Nationwide cache has no matching records and no live source is configured. Rebuild the cache or configure a live source.",
          retryable: false,
        },
      }
    }

    if (!cacheResult.ok && !canFallbackToLiveSource(request)) {
      return cacheResult
    }
  }

  const adapter = selectSourceAdapter(request)

  if (adapter === undefined) {
    return {
      ok: false,
      mode: "live",
      failure: {
        code: "missing_configuration",
        message: "Live source is not configured and fixture mode is disabled.",
        retryable: false,
      },
    }
  }

  const result = await adapter.list(request.input)

  if (!result.ok) {
    return {
      ok: false,
      mode: result.mode,
      failure: toToolFailure(result.failure),
    }
  }

  return {
    ok: true,
    mode: result.mode,
    records: result.records,
  }
}

function canFallbackToLiveSource(request: LoadSourceRecordsRequest): boolean {
  if (request.sourceAdapter !== undefined) {
    return true
  }

  if (request.config.seoulOpenDataKey === undefined) {
    return false
  }

  const location = request.input.location.trim().toLowerCase()
  return ["seoul", "서울", "jung-gu", "jongno-gu", "nowon-gu"].includes(location)
}

function selectSourceAdapter(request: LoadSourceRecordsRequest): FamilyExperienceSourceAdapter | undefined {
  if (request.sourceAdapter !== undefined) {
    return request.sourceAdapter
  }

  if (request.config.allowFixture) {
    return fixtureSourceAdapter
  }

  if (request.config.seoulOpenDataKey === undefined) {
    return undefined
  }

  return createSeoulCultureSourceAdapter({
    baseUrl: request.config.seoulOpenDataBaseUrl,
    apiKey: request.config.seoulOpenDataKey,
  })
}

function toToolFailure(failure: SourceAdapterFailure): ToolFailure {
  switch (failure.code) {
    case "missing_key":
    case "permission_failure":
      return { code: "missing_configuration", message: failure.message, retryable: false }
    case "malformed_source":
    case "source_invalid_response":
      return { code: "upstream_invalid_response", message: failure.message, retryable: false }
    case "no_match":
      return { code: "no_results", message: failure.message, retryable: false }
    case "source_failure":
    case "source_not_authorized":
    case "source_unavailable":
      return { code: "upstream_unavailable", message: failure.message, retryable: failure.retryable }
    default:
      return assertNeverSourceFailureCode(failure.code)
  }
}

function assertNeverSourceFailureCode(value: never): never {
  throw new Error(`Unexpected source failure code: ${JSON.stringify(value)}`)
}
