import type { CallToolResult } from "@modelcontextprotocol/server"

import { FindFamilyExperiencesStructuredContentSchema } from "./schemas.js"
import type { RenderedFamilyExperienceCandidate } from "./pipeline/render.js"
import type { ToolFailure } from "./types.js"

export function toToolError(input: {
  readonly mode: "fixture" | "live"
  readonly failure: ToolFailure
  readonly text: string
}): CallToolResult {
  const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse({
    ok: false,
    mode: input.mode,
    failure: input.failure,
  })

  return {
    isError: true,
    content: [{ type: "text", text: input.text }],
    structuredContent,
  }
}

export function summarizeSuccess(
  result: { readonly mode: "fixture" | "live"; readonly candidates: readonly RenderedFamilyExperienceCandidate[] },
  searchNotice?: string,
): string {
  const modeNotice = result.mode === "fixture" ? "fixture/demo 기준" : "공식 데이터 기준"
  const notices = searchNotice === undefined ? [] : [`search_note: ${searchNotice}`]
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

  return [`${modeNotice}으로 후보 ${result.candidates.length}개를 찾았어요.`, ...notices, ...cards].join("\n")
}

export function toKoreanFailureText(failure: ToolFailure): string {
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

function assertNeverToolFailureCode(value: never): never {
  throw new Error(`Unexpected tool failure code: ${JSON.stringify(value)}`)
}
