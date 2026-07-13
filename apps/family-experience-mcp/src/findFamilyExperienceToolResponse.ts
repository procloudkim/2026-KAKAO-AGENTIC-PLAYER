import type { CallToolResult } from "@modelcontextprotocol/server"

import { FindFamilyExperiencesStructuredContentSchema } from "./schemas.js"
import type {
  RenderedFamilyExperienceCandidate,
  RenderFamilyExperienceSuccess,
} from "./pipeline/render.js"
import type { ToolFailure } from "./types.js"

export const MAX_MCP_RESULT_CHARACTERS = 4_000

type BoundedToolSuccessResult =
  | { readonly ok: true; readonly candidateCount: number; readonly result: CallToolResult }
  | { readonly ok: false; readonly failure: ToolFailure; readonly result: CallToolResult }

export function toBoundedToolSuccess(
  rendered: RenderFamilyExperienceSuccess,
  searchNotice?: string,
): BoundedToolSuccessResult {
  const maximumCandidateCount = Math.min(3, rendered.candidates.length)
  const allCandidates = rendered.candidates.slice(0, maximumCandidateCount)
  const parsedAllCandidates = FindFamilyExperiencesStructuredContentSchema.safeParse(
    structuredSuccess(rendered.mode, allCandidates),
  )

  if (!parsedAllCandidates.success) {
    return structuredSchemaFailure(rendered.mode, parsedAllCandidates.error.issues)
  }

  const candidateCounts =
    maximumCandidateCount === 0
      ? [0]
      : Array.from(
          { length: maximumCandidateCount },
          (_, index) => maximumCandidateCount - index,
        )

  for (const candidateCount of candidateCounts) {
    const candidates = allCandidates.slice(0, candidateCount)
    const parsedStructuredContent =
      candidateCount === maximumCandidateCount
        ? parsedAllCandidates
        : FindFamilyExperiencesStructuredContentSchema.safeParse(
            structuredSuccess(rendered.mode, candidates),
          )

    if (!parsedStructuredContent.success) {
      return structuredSchemaFailure(rendered.mode, parsedStructuredContent.error.issues)
    }

    const resultNotice =
      searchNotice ??
      (candidateCount < 3
        ? candidateCount < maximumCandidateCount
          ? `응답 크기 제한으로 상위 ${candidateCount}개만 제공했습니다.`
          : `요청 조건과 출처·연령 근거를 모두 충족한 후보가 ${candidateCount}개뿐입니다. 조건을 임의로 넓히거나 후보를 만들지 않았습니다.`
        : undefined)
    const result: CallToolResult = {
      content: [
        {
          type: "text",
          text: summarizeSuccess({ mode: rendered.mode, candidates }, resultNotice),
        },
      ],
      structuredContent: parsedStructuredContent.data,
    }

    if (JSON.stringify(result).length <= MAX_MCP_RESULT_CHARACTERS) {
      return { ok: true, candidateCount, result }
    }
  }

  const failure: ToolFailure = {
    code: "upstream_invalid_response",
    message: `MCP result exceeds the ${MAX_MCP_RESULT_CHARACTERS}-character response budget.`,
    retryable: false,
  }
  return {
    ok: false,
    failure,
    result: toToolError({
      mode: rendered.mode,
      failure,
      text: toKoreanFailureText(failure),
    }),
  }
}

function structuredSuccess(
  mode: "fixture" | "live",
  candidates: readonly RenderedFamilyExperienceCandidate[],
) {
  return {
    ok: true as const,
    mode,
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      location: candidate.location,
      starts_at: candidate.starts_at,
      source: candidate.source,
      ends_at: candidate.ends_at,
      tags: [...candidate.tags],
      date_time: candidate.date_time,
      venue: candidate.venue,
      address: candidate.address,
      age_fit_label: candidate.age_fit_label,
      age_fit_reason: candidate.age_fit_reason,
      indoor_outdoor: candidate.indoor_outdoor,
      fee_text: candidate.fee_text,
      source_name: candidate.source_name,
      ...(candidate.source_url === undefined ? {} : { source_url: candidate.source_url }),
      retrieved_at: candidate.retrieved_at,
      confidence: candidate.confidence,
      mode: candidate.mode,
      warnings: candidate.warnings,
      source_summary: candidate.source_summary,
      parent_check: candidate.parent_check,
      next_action: candidate.next_action,
    })),
  }
}

function structuredSchemaFailure(
  mode: "fixture" | "live",
  issues: readonly { readonly message: string; readonly path?: PropertyKey[] }[],
): BoundedToolSuccessResult {
  const details = issues
    .slice(0, 3)
    .map((issue) => {
      const path = issue.path?.map(String).join(".")
      return path === undefined || path.length === 0
        ? issue.message
        : `${path}: ${issue.message}`
    })
    .join("; ")
  const failure: ToolFailure = {
    code: "upstream_invalid_response",
    message: `MCP structured response failed schema validation: ${details}`,
    retryable: false,
  }

  return {
    ok: false,
    failure,
    result: toToolError({ mode, failure, text: toKoreanFailureText(failure) }),
  }
}

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

function summarizeSuccess(
  result: { readonly mode: "fixture" | "live"; readonly candidates: readonly RenderedFamilyExperienceCandidate[] },
  searchNotice?: string,
): string {
  const modeNotice = result.mode === "fixture" ? "fixture/demo 기준" : "공식 데이터 기준"
  const notices = searchNotice === undefined ? [] : [`- result_note: ${searchNotice}`]
  const cards = result.candidates.map(
    (candidate, index) =>
      `${index + 1}. ${candidate.title} | ${candidate.date_time} | ${candidate.venue}`,
  )

  return [`${modeNotice}으로 후보 ${result.candidates.length}개를 찾았어요.`, ...notices, ...cards].join("\n")
}

export function toKoreanFailureText(failure: ToolFailure): string {
  switch (failure.code) {
    case "invalid_input": {
      const missingFieldLabels = (failure.missing_fields ?? []).flatMap((field) => {
        switch (field) {
          case "location":
            return ["방문할 지역"]
          case "date_range":
            return ["날짜 범위"]
          case "child_selector":
            return ["아이 나이 또는 발달 단계"]
          default:
            return []
        }
      })
      return missingFieldLabels.length === 0
        ? "요청 조건의 형식이나 범위를 확인해 주세요."
        : `요청 조건을 더 구체화해야 해요. 다음 정보를 알려 주세요: ${missingFieldLabels.join(", ")}.`
    }
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
