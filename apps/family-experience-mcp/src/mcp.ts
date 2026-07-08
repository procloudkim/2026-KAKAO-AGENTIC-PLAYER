import type { CallToolResult } from "@modelcontextprotocol/server"
import { McpServer } from "@modelcontextprotocol/server"

import { loadFamilyExperienceConfig, type FamilyExperienceConfig } from "./config.js"
import { loadSourceRecords, toSourceAdapterRequest } from "./mcpSourceRecords.js"
import {
  recordToolCall,
  silentOperationalLogger,
  type OperationalLogger,
} from "./observability.js"
import {
  FindFamilyExperiencesHandlerInputSchema,
  FindFamilyExperiencesInputSchema,
  FindFamilyExperiencesMcpInputSchema,
  FindFamilyExperiencesStructuredContentSchema,
  type FindFamilyExperiencesInput,
} from "./schemas.js"
import { renderFamilyExperienceResponse, type RenderedFamilyExperienceCandidate } from "./pipeline/render.js"
import { parseLooseFamilyPrompt } from "./promptParser.js"
import type { FamilyExperienceSourceAdapter } from "./sources/types.js"
import type { ToolFailure } from "./types.js"

export const FAMILY_EXPERIENCE_TOOL_NAME = "find_family_experiences"
export const FAMILY_EXPERIENCE_PUBLIC_TOOLS = [FAMILY_EXPERIENCE_TOOL_NAME] as const

type McpServerOptions = {
  readonly config?: FamilyExperienceConfig
  readonly logger?: OperationalLogger
  readonly sourceAdapter?: FamilyExperienceSourceAdapter
}

export function createFamilyExperienceMcpServer(options: McpServerOptions = {}): McpServer {
  const server = new McpServer({ name: "family-experience-mcp", version: "0.1.0" })

  server.registerTool(
    FAMILY_EXPERIENCE_TOOL_NAME,
    {
      title: "아이랑 어디가",
      description: "서울 가족 체험 후보를 근거와 함께 최대 3개까지 찾습니다.",
      inputSchema: FindFamilyExperiencesMcpInputSchema,
      outputSchema: FindFamilyExperiencesStructuredContentSchema,
    },
    async (input) => callFindFamilyExperiences(input, options),
  )

  return server
}

export async function callFindFamilyExperiences(input: unknown, options: McpServerOptions = {}): Promise<CallToolResult> {
  const startedAt = Date.now()
  const logger = options.logger ?? silentOperationalLogger
  const config = options.config ?? loadFamilyExperienceConfig()
  const parsedMcpInput = FindFamilyExperiencesHandlerInputSchema.safeParse(input)

  if (!parsedMcpInput.success) {
    const failure: ToolFailure = { code: "invalid_input", message: parsedMcpInput.error.issues.map((issue) => issue.message).join("; "), retryable: false }
    recordToolCall({
      logger,
      mode: config.allowFixture ? "fixture" : "live",
      latencyMs: Date.now() - startedAt,
      candidateCount: 0,
      failure,
    })
    return toToolError({
      mode: config.allowFixture ? "fixture" : "live",
      failure,
      text: toKoreanFailureText({ code: "invalid_input", message: "Provide exactly one of child_age or child_stage.", retryable: false }),
    })
  }

  const normalizedInput = normalizeMcpInput(parsedMcpInput.data)

  if (!normalizedInput.ok) {
    const failure: ToolFailure = { code: "invalid_input", message: normalizedInput.reason, retryable: false }
    recordToolCall({
      logger,
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

  const sourceResult = await loadSourceRecords({
    input: toSourceAdapterRequest(normalizedInput.input),
    config,
    sourceAdapter: options.sourceAdapter,
  })

  if (!sourceResult.ok) {
    recordToolCall({
      logger,
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
    indoor_outdoor_preference: "indoor",
  })

  if (!rendered.ok) {
    recordToolCall({
      logger,
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
    mode: rendered.mode,
    latencyMs: Date.now() - startedAt,
    candidateCount: rendered.candidates.length,
  })

  return {
    content: [{ type: "text", text: summarizeSuccess(rendered) }],
    structuredContent,
  }
}

type NormalizeMcpInputResult =
  | { readonly ok: true; readonly input: FindFamilyExperiencesInput }
  | { readonly ok: false; readonly reason: string }

function normalizeMcpInput(input: ReturnType<typeof FindFamilyExperiencesHandlerInputSchema.parse>): NormalizeMcpInputResult {
  if ("prompt" in input) {
    const parsedPrompt = parseLooseFamilyPrompt(input.prompt)
    return parsedPrompt.ok
      ? { ok: true, input: parsedPrompt.input }
      : { ok: false, reason: parsedPrompt.reason }
  }

  const parsedStructuredInput = FindFamilyExperiencesInputSchema.safeParse(input)
  return parsedStructuredInput.success
    ? { ok: true, input: parsedStructuredInput.data }
    : { ok: false, reason: parsedStructuredInput.error.issues.map((issue) => issue.message).join("; ") }
}

function toToolError(input: { readonly mode: "fixture" | "live"; readonly failure: ToolFailure; readonly text: string }): CallToolResult {
  const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse({ ok: false, mode: input.mode, failure: input.failure })

  return {
    isError: true,
    content: [{ type: "text", text: input.text }],
    structuredContent,
  }
}

function summarizeSuccess(result: { readonly mode: "fixture" | "live"; readonly candidates: readonly RenderedFamilyExperienceCandidate[] }): string {
  const modeNotice = result.mode === "fixture" ? "fixture/demo 기준" : "공식 데이터 기준"
  const cards = result.candidates.flatMap((candidate, index) => [
    `action_card: ${index + 1}`,
    `title: ${candidate.title}`,
    `date_time: ${candidate.date_time}`,
    `venue: ${candidate.venue}`,
    `address: ${candidate.address}`,
    `age_fit_label: ${candidate.age_fit_label}`,
    `age_fit_reason: ${candidate.age_fit_reason}`,
    `indoor_outdoor: ${candidate.indoor_outdoor}`,
    `fee_text: ${candidate.fee_text}`,
    `source_name: ${candidate.source_name}`,
    `source_url: ${candidate.source_url}`,
    `retrieved_at: ${candidate.retrieved_at}`,
    `confidence: ${candidate.confidence}`,
    `mode: ${candidate.mode}`,
    `warnings: ${candidate.warnings}`,
    `source_summary: ${candidate.source_summary}`,
    `parent_check: ${candidate.parent_check}`,
    `next_action: ${candidate.next_action}`,
  ])

  return [`${modeNotice}으로 후보 ${result.candidates.length}개를 찾았어요.`, ...cards].join("\n")
}

function toKoreanFailureText(failure: ToolFailure): string {
  switch (failure.code) {
    case "invalid_input":
      return "요청 조건을 더 구체화해야 해요. 아이 나이 또는 발달 단계를 하나만 알려 주세요."
    case "missing_configuration":
      return failure.message.startsWith("Nationwide cache")
        ? "현재 설정으로는 체험 후보를 확인할 수 없어요. 캐시를 새로고침하거나 공식 데이터 설정을 확인해 주세요."
        : "현재 설정으로는 체험 후보를 확인할 수 없어요. 공식 데이터 키를 설정하거나 fixture 모드를 켜 주세요."
    case "no_results":
      return "조건에 맞는 근거 있는 후보를 찾지 못했어요. 후보를 임의로 만들지 않았습니다. 다음에는 날짜 범위 하나만 넓혀서 다시 요청해 주세요."
    case "upstream_invalid_response":
    case "upstream_unavailable":
      return "공식 데이터 응답을 안전하게 확인하지 못했어요. 잠시 후 다시 시도해 주세요."
    case "internal_error":
      return "도구 처리 중 안전하게 복구할 수 없는 오류가 발생했어요."
    default:
      return assertNeverToolFailureCode(failure.code)
  }
}

function assertNeverToolFailureCode(value: never): never { throw new Error(`Unexpected tool failure code: ${JSON.stringify(value)}`) }
