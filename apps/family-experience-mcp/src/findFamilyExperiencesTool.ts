import type { CallToolResult } from "@modelcontextprotocol/server"

import { loadFamilyExperienceConfig, type FamilyExperienceConfig } from "./config.js"
import type { NationwideCacheSnapshotStore } from "./etl/cacheQuery.js"
import { loadSourceRecords, toSourceAdapterRequest } from "./mcpSourceRecords.js"
import {
  recordToolCall,
  silentOperationalLogger,
  type OperationalLogger,
  type OperationalToolName,
} from "./observability.js"
import {
  toBoundedToolSuccess,
  toKoreanFailureText,
  toToolError,
} from "./findFamilyExperienceToolResponse.js"
import { renderFamilyExperienceResponse } from "./pipeline/render.js"
import { parseLooseFamilyPrompt } from "./promptParser.js"
import {
  FindFamilyExperiencesHandlerInputSchema,
  FindFamilyExperiencesInputSchema,
  type FindFamilyExperiencesInput,
} from "./schemas.js"
import type { FamilyExperienceSourceAdapter } from "./sources/types.js"
import type { ToolFailure } from "./types.js"

export type FindFamilyExperiencesToolOptions = {
  readonly cacheSnapshotStore?: NationwideCacheSnapshotStore
  readonly config?: FamilyExperienceConfig
  readonly logger?: OperationalLogger
  readonly toolName?: OperationalToolName
  readonly sourceAdapter?: FamilyExperienceSourceAdapter
}

export async function callFindFamilyExperiences(
  input: unknown,
  options: FindFamilyExperiencesToolOptions = {},
): Promise<CallToolResult> {
  const startedAt = Date.now()
  const logger = options.logger ?? silentOperationalLogger
  const toolName = options.toolName ?? "find_family_experiences"
  const config = options.config ?? loadFamilyExperienceConfig()
  const parsedMcpInput = FindFamilyExperiencesHandlerInputSchema.safeParse(input)

  if (!parsedMcpInput.success) {
    const failure: ToolFailure = {
      code: "invalid_input",
      message: parsedMcpInput.error.issues.map((issue) => issue.message).join("; "),
      retryable: false,
    }
    recordToolCall({
      logger,
      name: toolName,
      mode: config.allowFixture ? "fixture" : "live",
      latencyMs: Date.now() - startedAt,
      candidateCount: 0,
      failure,
    })
    return toToolError({
      mode: config.allowFixture ? "fixture" : "live",
      failure,
      text: toKoreanFailureText(failure),
    })
  }

  const normalizedInput = normalizeMcpInput(parsedMcpInput.data)

  if (!normalizedInput.ok) {
    const failure: ToolFailure = {
      code: "invalid_input",
      message: normalizedInput.reason,
      retryable: false,
      ...(normalizedInput.missing_fields === undefined ? {} : { missing_fields: normalizedInput.missing_fields }),
    }
    recordToolCall({
      logger,
      name: toolName,
      mode: config.allowFixture ? "fixture" : "live",
      latencyMs: Date.now() - startedAt,
      candidateCount: 0,
      failure,
    })
    return toToolError({
      mode: config.allowFixture ? "fixture" : "live",
      failure,
      text: toKoreanFailureText(failure),
    })
  }

  const sourceResult = await loadSourceRecords({
    input: toSourceAdapterRequest(normalizedInput.input),
    config,
    ...(options.cacheSnapshotStore === undefined
      ? {}
      : { cacheSnapshotStore: options.cacheSnapshotStore }),
    sourceAdapter: options.sourceAdapter,
  })
  if (!sourceResult.ok) {
    recordToolCall({
      logger,
      name: toolName,
      mode: sourceResult.mode,
      latencyMs: Date.now() - startedAt,
      candidateCount: 0,
      failure: sourceResult.failure,
    })
    return toToolError({
      mode: sourceResult.mode,
      failure: sourceResult.failure,
      text: `${toKoreanFailureText(sourceResult.failure)} ${sourceResult.failure.message}`,
    })
  }

  const rendered = renderFamilyExperienceResponse({
    input: normalizedInput.input,
    mode: sourceResult.mode,
    source_records: sourceResult.records,
    indoor_outdoor_preference: normalizedInput.input.indoor_outdoor_preference,
  })

  if (!rendered.ok) {
    recordToolCall({
      logger,
      name: toolName,
      mode: rendered.mode,
      latencyMs: Date.now() - startedAt,
      candidateCount: 0,
      failure: rendered.failure,
    })
    return toToolError({
      mode: rendered.mode,
      failure: rendered.failure,
      text: toKoreanFailureText(rendered.failure),
    })
  }

  const toolResponse = toBoundedToolSuccess(rendered, sourceResult.data_notice)

  if (!toolResponse.ok) {
    recordToolCall({
      logger,
      name: toolName,
      mode: rendered.mode,
      latencyMs: Date.now() - startedAt,
      candidateCount: 0,
      failure: toolResponse.failure,
    })
    return toolResponse.result
  }

  recordToolCall({
    logger,
    name: toolName,
    mode: rendered.mode,
    latencyMs: Date.now() - startedAt,
    candidateCount: toolResponse.candidateCount,
  })

  return toolResponse.result
}

type NormalizeMcpInputResult =
  | { readonly ok: true; readonly input: FindFamilyExperiencesInput }
  | { readonly ok: false; readonly reason: string; readonly missing_fields?: readonly string[] }

function normalizeMcpInput(input: ReturnType<typeof FindFamilyExperiencesHandlerInputSchema.parse>): NormalizeMcpInputResult {
  if ("prompt" in input && input.prompt !== undefined) {
    const parsedPrompt = parseLooseFamilyPrompt(input.prompt)
    const missingFields = parsedPrompt.ok
      ? undefined
      : parsedPrompt.missing_fields ??
        (parsedPrompt.reason === "missing_child_selector" ? ["child_selector"] : undefined)
    return parsedPrompt.ok
      ? { ok: true, input: parsedPrompt.input }
      : {
          ok: false,
          reason: parsedPrompt.reason,
          ...(missingFields === undefined ? {} : { missing_fields: missingFields }),
        }
  }

  const location = "location" in input ? input.location : undefined
  const dateRange = "date_range" in input ? input.date_range : undefined
  const childAge = "child_age" in input ? input.child_age : undefined
  const childStage = "child_stage" in input ? input.child_stage : undefined
  const missingFields = [
    ...(location === undefined ? ["location"] : []),
    ...(dateRange === undefined ? ["date_range"] : []),
    ...(childAge === undefined && childStage === undefined ? ["child_selector"] : []),
  ]
  if (missingFields.length > 0) {
    return {
      ok: false,
      reason: "Provide location, date_range, and exactly one child selector.",
      missing_fields: missingFields,
    }
  }

  if (
    childAge !== undefined &&
    childStage !== undefined
  ) {
    return {
      ok: false,
      reason: "Provide exactly one of child_age or child_stage.",
    }
  }

  const parsedStructuredInput = FindFamilyExperiencesInputSchema.safeParse({
    location,
    date_range: dateRange,
    ...(childAge === undefined ? {} : { child_age: childAge }),
    ...(childAge !== undefined || childStage === undefined ? {} : { child_stage: childStage }),
    time_of_day: "time_of_day" in input ? input.time_of_day : undefined,
    indoor_outdoor_preference:
      "indoor_outdoor_preference" in input ? input.indoor_outdoor_preference : undefined,
    keywords: "keywords" in input ? input.keywords : undefined,
  })
  return parsedStructuredInput.success
    ? { ok: true, input: parsedStructuredInput.data }
    : { ok: false, reason: parsedStructuredInput.error.issues.map((issue) => issue.message).join("; ") }
}
