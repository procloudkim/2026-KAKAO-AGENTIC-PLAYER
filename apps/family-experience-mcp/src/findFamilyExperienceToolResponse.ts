import type { CallToolResult } from "@modelcontextprotocol/server"

import { FindFamilyExperiencesStructuredContentSchema } from "./schemas.js"
import type {
  RenderedFamilyExperienceCandidate,
  RenderFamilyExperienceSuccess,
} from "./pipeline/render.js"
import type { ToolFailure } from "./types.js"
import { escapeMarkdownLinkLabel } from "./placeLabels.js"

export const MAX_MCP_RESULT_CHARACTERS = 4_000
const COMPACT_CARD_TITLE_CHARACTER_LIMITS = [28, 8] as const

type BoundedToolSuccessResult =
  | { readonly ok: true; readonly candidateCount: number; readonly result: CallToolResult }
  | { readonly ok: false; readonly failure: ToolFailure; readonly result: CallToolResult }

export function toBoundedToolSuccess(
  rendered: RenderFamilyExperienceSuccess,
  searchNotice?: string,
): BoundedToolSuccessResult {
  const maximumCandidateCount = Math.min(3, rendered.candidates.length)
  const allCandidates = rendered.candidates.slice(0, maximumCandidateCount)
  const initialSummary = resultSummary({
    eligibleCount: rendered.eligible_count,
    returnedCount: maximumCandidateCount,
    responseBudgetReduced: false,
    ...(searchNotice === undefined ? {} : { searchNotice }),
  })
  const parsedAllCandidates = FindFamilyExperiencesStructuredContentSchema.safeParse(
    structuredSuccess(rendered.mode, allCandidates, initialSummary, false),
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
    const summary = resultSummary({
      eligibleCount: rendered.eligible_count,
      returnedCount: candidateCount,
      responseBudgetReduced: candidateCount < maximumCandidateCount,
      ...(searchNotice === undefined ? {} : { searchNotice }),
    })
    const variants = [
      {
        structuredCandidates: candidates,
        textCandidates: candidates,
        compact: false,
      },
      ...COMPACT_CARD_TITLE_CHARACTER_LIMITS.map((maximumTitleCharacters) => ({
        structuredCandidates: candidates.map((candidate) =>
          compactCandidateForTransport(candidate, "structured", maximumTitleCharacters),
        ),
        textCandidates: candidates.map((candidate) =>
          compactCandidateForTransport(candidate, "text", maximumTitleCharacters),
        ),
        compact: true,
      })),
    ] as const

    for (const variant of variants) {
      const parsedStructuredContent = FindFamilyExperiencesStructuredContentSchema.safeParse(
        structuredSuccess(
          rendered.mode,
          variant.structuredCandidates,
          summary,
          variant.compact,
        ),
      )

      if (!parsedStructuredContent.success) {
        return structuredSchemaFailure(rendered.mode, parsedStructuredContent.error.issues)
      }

      const result: CallToolResult = {
        content: [
          {
            type: "text",
            text: summarizeSuccess({
              mode: rendered.mode,
              candidates: variant.textCandidates,
              summary,
              compact: variant.compact,
            }),
          },
        ],
        structuredContent: parsedStructuredContent.data,
      }

      if (JSON.stringify(result).length <= MAX_MCP_RESULT_CHARACTERS) {
        return { ok: true, candidateCount, result }
      }
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
  summary: ResultSummary,
  compact: boolean,
) {
  return {
    ok: true as const,
    mode,
    candidates: candidates.map((candidate) => ({
      ...(compact ? {} : { id: candidate.id }),
      title: candidate.title,
      location: candidate.location,
      starts_at: candidate.starts_at,
      source: candidate.source,
      ends_at: candidate.ends_at,
      ...(compact ? {} : { tags: [...candidate.tags] }),
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
      ...(candidate.reservation_url === undefined ? {} : { reservation_url: candidate.reservation_url }),
      ...(candidate.contact === undefined ||
      candidate.source_url !== undefined ||
      candidate.reservation_url !== undefined ||
      candidate.navigation !== undefined
        ? {}
        : { contact: candidate.contact }),
      ...(candidate.navigation === undefined ? {} : { navigation: candidate.navigation }),
    })),
    result_summary: summary,
  }
}

type ResultSummary = {
  readonly target_count: 3
  readonly eligible_count: number
  readonly returned_count: number
  readonly reason: "complete" | "insufficient_eligible_candidates" | "response_budget"
  readonly message: string
  readonly data_notice?: string
}

function resultSummary(input: {
  readonly eligibleCount: number
  readonly returnedCount: number
  readonly responseBudgetReduced: boolean
  readonly searchNotice?: string
}): ResultSummary {
  const reason = input.responseBudgetReduced
    ? "response_budget" as const
    : input.eligibleCount < 3
      ? "insufficient_eligible_candidates" as const
      : "complete" as const
  const message = reason === "response_budget"
    ? `4,000자 한도로 ${input.returnedCount}개만 제공했습니다.`
    : reason === "insufficient_eligible_candidates"
      ? `요청 조건과 근거를 충족한 후보가 ${input.returnedCount}개뿐입니다.`
      : "요청 조건과 근거를 충족한 후보 3개를 제공했습니다."
  return {
    target_count: 3,
    eligible_count: input.eligibleCount,
    returned_count: input.returnedCount,
    reason,
    message,
    ...(input.searchNotice === undefined ? {} : { data_notice: input.searchNotice }),
  }
}

function compactCandidateForTransport(
  candidate: RenderedFamilyExperienceCandidate,
  target: "structured" | "text",
  maximumTitleCharacters: number,
): RenderedFamilyExperienceCandidate {
  if (hasOversizedCandidateText(candidate)) return candidate

  const compactStructured = target === "structured"
  const navigation = candidate.navigation
  return {
    ...candidate,
    title: compactText(candidate.title, maximumTitleCharacters),
    ...(compactStructured
      ? {
          location: compactText(candidate.location, 6),
          date_time: compactStructuredDateTime(candidate.date_time),
          address: compactText(candidate.address, 12),
          age_fit_reason: compactStructuredAgeEvidence(candidate.age_fit_reason),
          fee_text: "출처 확인",
          source_name: compactText(candidate.source_name, 3),
          retrieved_at: candidate.retrieved_at.slice(0, 10),
          confidence: "근거",
        }
      : {
          age_fit_reason: compactAgeEvidence(candidate.age_fit_reason),
          confidence: compactConfidence(candidate.confidence),
        }),
    tags: [],
    warnings: compactStructured
      ? candidate.mode === "fixture" ? "demo." : "재확인"
      : candidate.mode === "fixture" ? "fixture/demo · 운영 아님." : "방문 전 재확인.",
    source_summary: compactStructured ? "출처" : "출처·수집일 참조.",
    parent_check: compactStructured ? "확인" : "공식 확인 필요.",
    next_action: navigation !== undefined
      ? compactStructured ? "지도" : "지도·길찾기 확인."
      : candidate.source_url === undefined && candidate.contact !== undefined
        ? compactStructured ? "운영처" : `운영처 ${compactText(candidate.contact, 24)} 확인.`
        : compactStructured ? "출처" : "공식 링크 확인.",
  }
}

function hasOversizedCandidateText(candidate: RenderedFamilyExperienceCandidate): boolean {
  const fieldLimits: Readonly<Record<string, number>> = {
    title: 96,
    location: 128,
    venue: 96,
    address: 256,
    age_fit_reason: 256,
    fee_text: 256,
  }
  return Object.entries(candidate).some(([field, value]) => {
    if (field === "navigation" || typeof value !== "string") return false
    return value.length > (fieldLimits[field] ?? 512)
  })
}

function compactText(value: string, maximumLength: number): string {
  return value.length <= maximumLength
    ? value
    : `${value.slice(0, Math.max(1, maximumLength - 1)).trimEnd()}…`
}

function compactAgeEvidence(value: string): string {
  const ktoAgeLimit = /KTO TourAPI detailIntro2 source-stated age limit:\s*(.+)$/u.exec(value)?.[1]
  return ktoAgeLimit === undefined
    ? compactText(value, 48)
    : `KTO 연령표기: ${compactText(ktoAgeLimit, 32)}`
}

function compactStructuredDateTime(value: string): string {
  return /^\d{4}-\d{2}-\d{2}/u.test(value)
    ? value.slice(0, 10)
    : compactText(value, 16)
}

function compactStructuredAgeEvidence(value: string): string {
  const ktoAgeLimit = /KTO TourAPI detailIntro2 source-stated age limit:\s*(.+)$/u.exec(value)?.[1]
  if (ktoAgeLimit !== undefined) return `KTO: ${compactText(ktoAgeLimit, 20)}`

  const agePhrase = /\bages?\s+\d+(?:\s*(?:to|-)\s*\d+)?/iu.exec(value)?.[0]
  if (agePhrase !== undefined) return `source: ${agePhrase}`

  const sourceStated = /^Official source states\s+(.+)$/iu.exec(value)?.[1]
  return sourceStated === undefined
    ? compactText(value, 28)
    : `source: ${sourceStated.split(/\s+/u)[0] ?? "stated"}`
}

function compactConfidence(value: string): string {
  return value
    .replace(/date=/u, "d:")
    .replace(/venue=/u, "v:")
    .replace(/age_fit=/u, "a:")
    .replace(/reservation=/u, "r:")
    .replaceAll("source-stated", "source")
    .replaceAll("api-returned", "api")
    .replaceAll("computed", "calc")
    .replaceAll("inferred", "infer")
    .replaceAll("unknown", "?")
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
  result: {
    readonly mode: "fixture" | "live"
    readonly candidates: readonly RenderedFamilyExperienceCandidate[]
    readonly summary: ResultSummary
    readonly compact: boolean
  },
): string {
  const modeNotice = result.mode === "fixture" ? "fixture/demo 기준" : "공식 데이터 기준"
  const notices = [
    `- 결과: ${result.summary.message}`,
    ...(result.summary.data_notice === undefined ? [] : [`- 데이터: ${result.summary.data_notice}`]),
  ]
  const venueCounts = result.candidates.reduce((counts, candidate) => {
    const key = candidate.venue.normalize("NFKC").trim().toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
    return counts
  }, new Map<string, number>())
  const cards = result.candidates.flatMap((candidate, index) => {
    const venueLabel = escapeMarkdownLinkLabel(candidate.venue)
    const venueKey = candidate.venue.normalize("NFKC").trim().toLowerCase()
    const venueDetails = (venueCounts.get(venueKey) ?? 0) > 1
      ? `${compactText(candidate.venue, 36)} · ${compactText(candidate.address, result.compact ? 28 : 44)}`
      : compactText(candidate.venue, 56)
    const navigation = candidate.navigation === undefined
      ? candidate.reservation_url !== undefined
        ? [`   공식 확인: ${candidate.reservation_url}`]
        : candidate.source_url === undefined
          ? [`   확인: ${candidate.next_action}`]
          : [`   공식 확인: ${candidate.source_url}`]
      : [
          `   지도(${candidate.navigation.place_evidence_status}): [${venueLabel} 지도 보기](${candidate.navigation.map_url})`,
          `   길찾기: [${venueLabel} 길찾기](${candidate.navigation.directions_url})`,
        ]
    return result.compact
      ? [
          `${index + 1}. ${candidate.title}`,
          `   날짜·장소: ${compactText(candidate.date_time, 28)} | ${venueDetails}`,
          `   비용·연령: ${compactText(candidate.fee_text, 48)} | ${candidate.age_fit_label} · ${compactAgeEvidence(candidate.age_fit_reason)}`,
          `   출처: ${compactText(candidate.source_name, 18)}·${candidate.retrieved_at.slice(0, 10)} | 주의: ${compactText(candidate.warnings, 32)}`,
          ...navigation,
        ]
      : [
          `${index + 1}. ${candidate.title}`,
          `   날짜·장소: ${compactText(candidate.date_time, 56)} | ${venueDetails}`,
          `   비용·연령: ${compactText(candidate.fee_text, 48)} | ${candidate.age_fit_label} · ${compactAgeEvidence(candidate.age_fit_reason)}`,
          `   출처: ${candidate.source_name}·${candidate.retrieved_at.slice(0, 10)} | 주의: ${compactText(candidate.warnings, 32)}`,
          ...navigation,
        ]
  })

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
