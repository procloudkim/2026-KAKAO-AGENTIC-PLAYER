import { FindFamilyExperiencesInputSchema } from "../schemas.js"
import type {
  ChildStage,
  FamilyExperienceSource,
  ToolFailure,
  ToolMode,
} from "../types.js"
import type { SourceId } from "../sources/types.js"
import {
  normalizeFamilyExperienceRecordCandidates,
  type AgeFitLabel,
  type NormalizedFamilyExperienceCandidate,
} from "./normalize.js"
import { dedupeFamilyExperienceCandidates } from "./dedupe.js"
import {
  candidateMatchesFamilyRequest,
  rankFamilyExperienceCandidates,
  type IndoorOutdoorPreference,
} from "./rank.js"

export type RenderedFamilyExperienceCandidate = {
  readonly id: string
  readonly title: string
  readonly location: string
  readonly date_time: string
  readonly venue: string
  readonly address: string
  readonly starts_at: string
  readonly source: FamilyExperienceSource
  readonly tags: readonly string[]
  readonly age_fit_label: AgeFitLabel
  readonly age_fit_reason: string
  readonly indoor_outdoor: NormalizedFamilyExperienceCandidate["indoor_outdoor"]
  readonly child_stages: readonly ChildStage[]
  readonly description: string
  readonly ends_at: string
  readonly fee_text: string
  readonly source_name: string
  readonly retrieved_at: string
  readonly confidence: string
  readonly mode: ToolMode
  readonly warnings: string
  readonly source_summary: string
  readonly parent_check: string
  readonly next_action: string
  readonly max_child_age: number
  readonly min_child_age: number
  readonly source_url?: string
  readonly reservation_url?: string
  readonly contact?: string
}

export type RenderFamilyExperienceSuccess = {
  readonly ok: true
  readonly mode: ToolMode
  readonly candidates: readonly RenderedFamilyExperienceCandidate[]
}

export type RenderFamilyExperienceFailure = {
  readonly ok: false
  readonly mode: ToolMode
  readonly failure: ToolFailure
}

export type RenderFamilyExperienceResult =
  | RenderFamilyExperienceSuccess
  | RenderFamilyExperienceFailure

export type RenderFamilyExperienceResponseRequest = {
  readonly input: unknown
  readonly mode: ToolMode
  readonly source_records: readonly unknown[]
  readonly indoor_outdoor_preference?: IndoorOutdoorPreference | undefined
}

export function renderFamilyExperienceResponse(
  request: RenderFamilyExperienceResponseRequest,
): RenderFamilyExperienceResult {
  const parsedInput = FindFamilyExperiencesInputSchema.safeParse(request.input)

  if (!parsedInput.success) {
    return {
      ok: false,
      mode: request.mode,
      failure: {
        code: "invalid_input",
        message: parsedInput.error.issues.map((issue) => issue.message).join("; "),
        retryable: false,
      },
    }
  }

  const normalized = normalizeFamilyExperienceRecordCandidates({
    input: parsedInput.data,
    source_records: request.source_records,
  })

  if (!normalized.ok) {
    return {
      ok: false,
      mode: request.mode,
      failure: normalized.failure,
    }
  }

  const eligibleCandidates = dedupeFamilyExperienceCandidates(
    normalized.candidates.filter((candidate) =>
      candidateMatchesFamilyRequest({ input: parsedInput.data, candidate }),
    ),
  )

  if (eligibleCandidates.length === 0) {
    return {
      ok: false,
      mode: request.mode,
      failure: {
        code: "no_results",
        message: "No family experiences matched the requested date, location, and child age constraints.",
        retryable: false,
      },
    }
  }

  return {
    ok: true,
    mode: request.mode,
    candidates: rankFamilyExperienceCandidates({
      input: parsedInput.data,
      candidates: eligibleCandidates,
      indoor_outdoor_preference: request.indoor_outdoor_preference,
    })
      .slice(0, 3)
      .map(renderCandidate),
  }
}

function renderCandidate(
  candidate: NormalizedFamilyExperienceCandidate,
): RenderedFamilyExperienceCandidate {
  const publicSourceUrl = renderPublicSourceUrl(candidate)

  return {
    id: candidate.id,
    title: candidate.title,
    location: candidate.location,
    date_time: formatDateTime(candidate),
    venue: candidate.venue_name,
    address: candidate.venue_address,
    starts_at: candidate.starts_at,
    source: renderSource(candidate.source_id),
    tags: candidate.tags,
    age_fit_label: candidate.age_fit_label,
    age_fit_reason: candidate.age_fit_reason,
    indoor_outdoor: candidate.indoor_outdoor,
    child_stages: candidate.child_stages,
    description: `Untrusted provider data: ${candidate.program_text}`,
    ends_at: candidate.ends_at,
    fee_text: candidate.fee_text,
    source_name: candidate.source_name,
    retrieved_at: candidate.retrieved_at,
    confidence: renderConfidence(candidate),
    mode: candidate.mode,
    warnings: renderWarnings(candidate),
    source_summary: renderSourceSummary(candidate),
    parent_check: renderParentCheck(candidate),
    next_action: renderNextAction(candidate, publicSourceUrl),
    max_child_age: candidate.max_child_age,
    min_child_age: candidate.min_child_age,
    ...(publicSourceUrl === undefined ? {} : { source_url: publicSourceUrl }),
    ...(candidate.reservation_url === undefined
      ? {}
      : { reservation_url: candidate.reservation_url }),
    ...(candidate.contact === undefined ? {} : { contact: candidate.contact }),
  }
}

function formatDateTime(candidate: NormalizedFamilyExperienceCandidate): string {
  const dateRange =
    candidate.starts_at === candidate.ends_at
      ? candidate.starts_at
      : `${candidate.starts_at}~${candidate.ends_at}`
  return `${dateRange} ${candidate.time_text}`.trim()
}

function renderConfidence(candidate: NormalizedFamilyExperienceCandidate): string {
  return [
    `date=${candidate.date_confidence}`,
    `venue=${candidate.venue_confidence}`,
    `age_fit=${candidate.age_fit_label}`,
    `reservation=${candidate.reservation_confidence}`,
  ].join("; ")
}

function renderWarnings(candidate: NormalizedFamilyExperienceCandidate): string {
  if (candidate.mode === "fixture") {
    return "fixture/demo data only; not live/current."
  }

  return "공식 출처 응답 기준입니다. 운영 여부, 요금, 예약은 출발 전 다시 확인하세요."
}

function renderSourceSummary(candidate: NormalizedFamilyExperienceCandidate): string {
  const sourceReferences = candidate.source_references
    .map((sourceReference) => `${sourceReference.id}:${sourceReference.raw_snapshot_id}`)
    .join(", ")

  if (candidate.mode === "fixture") {
    return `${candidate.source_name} fixture/cache candidate only; not live/current. source_refs=${sourceReferences}`
  }

  return `${candidate.source_name} 근거로 제목, 날짜, 장소, 연령 단서를 확인했습니다. source_refs=${sourceReferences}`
}

function renderParentCheck(candidate: NormalizedFamilyExperienceCandidate): string {
  if (candidate.mode === "fixture") {
    return `${candidate.parent_check} fixture/cache 후보입니다. 방문 전 실제 공식 출처에서 예약/요금을 확인하세요.`
  }

  return `${candidate.parent_check} 예약/요금은 출발 전 공식 출처에서 확인하세요.`
}

function renderNextAction(
  candidate: NormalizedFamilyExperienceCandidate,
  publicSourceUrl: string | undefined,
): string {
  if (candidate.mode === "fixture") {
    return publicSourceUrl === undefined
      ? `fixture/cache 후보이며 공개 상세/예약 링크가 제공되지 않았습니다. 방문 전 실제 공식 운영처에서 날짜, 장소, 요금, 신청 절차를 확인하세요.`
      : `fixture/cache source_url=${publicSourceUrl}; 방문 전 실제 공식 출처에서 날짜, 장소, 요금, 신청 절차를 확인하세요.`
  }

  if (candidate.reservation_url !== undefined) {
    return `${candidate.reservation_url}에서 날짜, 장소, 요금, 신청 절차를 공식 운영처에 다시 확인하세요.`
  }

  if (publicSourceUrl !== undefined) {
    return `${publicSourceUrl}에서 날짜, 장소, 요금, 신청 절차를 공식 운영처에 다시 확인하세요.`
  }

  const operator = candidate.contact === undefined ? "공식 운영처" : `운영처(${candidate.contact})`
  return `공개 상세/예약 링크가 제공되지 않았습니다. "${candidate.title}"의 날짜, 장소, 요금, 신청 절차는 ${operator}에 확인하세요.`
}

function renderPublicSourceUrl(
  candidate: NormalizedFamilyExperienceCandidate,
): string | undefined {
  // KTO source URLs are authenticated API provenance endpoints, not consumer pages.
  // Keep them inside the audited cache record and fail closed at the public response boundary.
  return candidate.source_id === "kto-tourapi-events" ? undefined : candidate.source_url
}

function renderSource(sourceId: SourceId): FamilyExperienceSource {
  switch (sourceId) {
    case "fixture-family-experience-v1":
      return "fixture"
    case "seoul-culture-events":
      return "seoul_open_data"
    case "culture-portal-oneview":
      return "culture_portal"
    case "kto-tourapi-events":
      return "kto_tourapi"
    case "national-culture-festival-standard":
      return "national_culture_festival"
    default:
      return assertNever(sourceId)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected source id: ${JSON.stringify(value)}`)
}
