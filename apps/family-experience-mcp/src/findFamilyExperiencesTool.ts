import type { CallToolResult } from "@modelcontextprotocol/server"

import { loadFamilyExperienceConfig, type FamilyExperienceConfig } from "./config.js"
import { loadSourceRecords, toSourceAdapterRequest, type SourceRecordsResult } from "./mcpSourceRecords.js"
import {
  recordToolCall,
  silentOperationalLogger,
  type OperationalLogger,
  type OperationalToolName,
} from "./observability.js"
import {
  summarizeSuccess,
  toKoreanFailureText,
  toToolError,
} from "./findFamilyExperienceToolResponse.js"
import { renderFamilyExperienceResponse } from "./pipeline/render.js"
import { parseLooseFamilyPrompt } from "./promptParser.js"
import {
  FindFamilyExperiencesHandlerInputSchema,
  FindFamilyExperiencesInputSchema,
  FindFamilyExperiencesStructuredContentSchema,
  type FindFamilyExperiencesInput,
} from "./schemas.js"
import type { FamilyExperienceSourceAdapter } from "./sources/types.js"
import type { ToolFailure } from "./types.js"

const noResultsExpandedDateEnd = "2026-08-31"

export type FindFamilyExperiencesToolOptions = {
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
      text: toKoreanFailureText({
        code: "invalid_input",
        message: "Provide exactly one of child_age or child_stage.",
        retryable: false,
      }),
    })
  }

  const normalizedInput = normalizeMcpInput(parsedMcpInput.data)

  if (!normalizedInput.ok) {
    const failure: ToolFailure = { code: "invalid_input", message: normalizedInput.reason, retryable: false }
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
      text: toKoreanFailureText({ code: "invalid_input", message: normalizedInput.reason, retryable: false }),
    })
  }

  let sourceResult = await loadSourceRecords({
    input: toSourceAdapterRequest(normalizedInput.input),
    config,
    sourceAdapter: options.sourceAdapter,
  })
  let renderInput = normalizedInput.input
  let searchNotice: string | undefined

  if (!sourceResult.ok) {
    const expanded = await retryWithExpandedDateRange({
      input: normalizedInput.input,
      sourceResult,
      config,
      sourceAdapter: options.sourceAdapter,
    })
    if (expanded !== undefined) {
      sourceResult = expanded.sourceResult
      renderInput = expanded.input
      searchNotice = expanded.notice
    }
  }

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
    input: renderInput,
    mode: sourceResult.mode,
    source_records: sourceResult.records,
    indoor_outdoor_preference: "indoor",
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

  const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse({
    ok: true,
    mode: rendered.mode,
    candidates: rendered.candidates.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      location: candidate.location,
      date_time: candidate.date_time,
      venue: candidate.venue,
      address: candidate.address,
      starts_at: candidate.starts_at,
      source: candidate.source,
      tags: [...candidate.tags],
      age_fit_label: candidate.age_fit_label,
      age_fit_reason: candidate.age_fit_reason,
      indoor_outdoor: candidate.indoor_outdoor,
      child_stages: [...candidate.child_stages],
      description: candidate.description,
      ends_at: candidate.ends_at,
      fee_text: candidate.fee_text,
      source_name: candidate.source_name,
      source_url: candidate.source_url,
      retrieved_at: candidate.retrieved_at,
      confidence: candidate.confidence,
      mode: candidate.mode,
      warnings: candidate.warnings,
      source_summary: candidate.source_summary,
      parent_check: candidate.parent_check,
      next_action: candidate.next_action,
      max_child_age: candidate.max_child_age,
      min_child_age: candidate.min_child_age,
      ...(candidate.reservation_url === undefined
        ? {}
        : { reservation_url: candidate.reservation_url }),
      ...(candidate.contact === undefined ? {} : { contact: candidate.contact }),
    })),
  })

  recordToolCall({
    logger,
    name: toolName,
    mode: rendered.mode,
    latencyMs: Date.now() - startedAt,
    candidateCount: rendered.candidates.length,
  })

  return {
    content: [{ type: "text", text: summarizeSuccess(rendered, searchNotice) }],
    structuredContent,
  }
}

type ExpandedDateRetryResult = {
  readonly input: FindFamilyExperiencesInput
  readonly sourceResult: SourceRecordsResult & { readonly ok: true }
  readonly notice: string
}

async function retryWithExpandedDateRange(input: {
  readonly input: FindFamilyExperiencesInput
  readonly sourceResult: SourceRecordsResult
  readonly config: FamilyExperienceConfig
  readonly sourceAdapter: FamilyExperienceSourceAdapter | undefined
}): Promise<ExpandedDateRetryResult | undefined> {
  if (input.sourceResult.ok || input.sourceResult.failure.code !== "no_results") {
    return undefined
  }

  if (input.input.date_range.end >= noResultsExpandedDateEnd) {
    return undefined
  }

  const expandedInput = {
    ...input.input,
    date_range: {
      start: input.input.date_range.start,
      end: noResultsExpandedDateEnd,
    },
  }
  const sourceResult = await loadSourceRecords({
    input: toSourceAdapterRequest(expandedInput),
    config: input.config,
    sourceAdapter: input.sourceAdapter,
  })

  if (!sourceResult.ok) {
    return undefined
  }

  return {
    input: expandedInput,
    sourceResult,
    notice: `요청한 날짜 범위에서는 근거 있는 후보가 없어 ${noResultsExpandedDateEnd}까지 날짜 범위를 넓혀 찾았습니다.`,
  }
}

type NormalizeMcpInputResult =
  | { readonly ok: true; readonly input: FindFamilyExperiencesInput }
  | { readonly ok: false; readonly reason: string }

function normalizeMcpInput(input: ReturnType<typeof FindFamilyExperiencesHandlerInputSchema.parse>): NormalizeMcpInputResult {
  if ("prompt" in input && input.prompt !== undefined) {
    const parsedPrompt = parseLooseFamilyPrompt(input.prompt)
    return parsedPrompt.ok
      ? { ok: true, input: parsedPrompt.input }
      : { ok: false, reason: parsedPrompt.reason }
  }

  if (!("location" in input) || !("date_range" in input)) {
    return { ok: false, reason: "Provide prompt or structured location/date_range fields." }
  }

  const parsedStructuredInput = FindFamilyExperiencesInputSchema.safeParse({
    location: input.location,
    date_range: input.date_range,
    child_age: input.child_age,
    child_stage: input.child_stage,
  })
  return parsedStructuredInput.success
    ? { ok: true, input: parsedStructuredInput.data }
    : { ok: false, reason: parsedStructuredInput.error.issues.map((issue) => issue.message).join("; ") }
}
