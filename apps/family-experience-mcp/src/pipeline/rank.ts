import type { FindFamilyExperiencesInput } from "../schemas.js"
import type { SourceId } from "../sources/types.js"
import type { NormalizedFamilyExperienceCandidate } from "./normalize.js"

export type IndoorOutdoorPreference = NormalizedFamilyExperienceCandidate["indoor_outdoor"]

export type RankFamilyExperienceCandidatesRequest = {
  readonly input: FindFamilyExperiencesInput
  readonly candidates: readonly NormalizedFamilyExperienceCandidate[]
  readonly indoor_outdoor_preference?: IndoorOutdoorPreference | undefined
}

export type CandidateRequestMatchRequest = {
  readonly input: FindFamilyExperiencesInput
  readonly candidate: NormalizedFamilyExperienceCandidate
}

export function candidateMatchesFamilyRequest(request: CandidateRequestMatchRequest): boolean {
  return (
    dateRangesOverlap(request.input.date_range, {
      start: request.candidate.starts_at,
      end: request.candidate.ends_at,
    }) &&
    getLocationRelevanceScore(request.input.location, request.candidate) > 0 &&
    matchesChildSelector(request.input, request.candidate)
  )
}

export function rankFamilyExperienceCandidates(
  request: RankFamilyExperienceCandidatesRequest,
): readonly NormalizedFamilyExperienceCandidate[] {
  return [...request.candidates].sort((left, right) =>
    compareCandidates({
      input: request.input,
      left,
      right,
      indoor_outdoor_preference: request.indoor_outdoor_preference,
    }),
  )
}

type CompareCandidatesRequest = {
  readonly input: FindFamilyExperiencesInput
  readonly left: NormalizedFamilyExperienceCandidate
  readonly right: NormalizedFamilyExperienceCandidate
  readonly indoor_outdoor_preference?: IndoorOutdoorPreference | undefined
}

function compareCandidates(request: CompareCandidatesRequest): number {
  return (
    compareNumber(getDateOverlapPriority(request.input, request.right), getDateOverlapPriority(request.input, request.left)) ||
    compareNumber(getLocationRelevanceScore(request.input.location, request.right), getLocationRelevanceScore(request.input.location, request.left)) ||
    compareNumber(getChildSelectorPriority(request.input, request.right), getChildSelectorPriority(request.input, request.left)) ||
    compareNumber(getAgeFitPriority(request.right), getAgeFitPriority(request.left)) ||
    compareNumber(getPreferencePriority(request.right, request.indoor_outdoor_preference), getPreferencePriority(request.left, request.indoor_outdoor_preference)) ||
    compareNumber(getSourceConfidenceScore(request.right), getSourceConfidenceScore(request.left)) ||
    compareNumber(getSourceAuthorityScore(request.right.source_id), getSourceAuthorityScore(request.left.source_id)) ||
    compareNumber(getRetrievedAtScore(request.right), getRetrievedAtScore(request.left)) ||
    compareNumber(getCompletenessScore(request.right), getCompletenessScore(request.left)) ||
    compareText(request.left.starts_at, request.right.starts_at) ||
    compareNumber(request.left.source_order, request.right.source_order)
  )
}

function getDateOverlapPriority(
  input: FindFamilyExperiencesInput,
  candidate: NormalizedFamilyExperienceCandidate,
): number {
  const candidateRange = {
    start: candidate.starts_at,
    end: candidate.ends_at,
  }

  if (candidateRange.start === input.date_range.start && candidateRange.end === input.date_range.end) {
    return 3
  }

  if (candidate.starts_at >= input.date_range.start && candidate.starts_at <= input.date_range.end) {
    return 2
  }

  return booleanScore(dateRangesOverlap(input.date_range, candidateRange))
}

function dateRangesOverlap(
  requestRange: FindFamilyExperiencesInput["date_range"],
  candidateRange: FindFamilyExperiencesInput["date_range"],
): boolean {
  return candidateRange.start <= requestRange.end && candidateRange.end >= requestRange.start
}

function getLocationRelevanceScore(
  location: string,
  candidate: NormalizedFamilyExperienceCandidate,
): number {
  const target = location.toLowerCase()
  const sourceText =
    `${candidate.city} ${candidate.venue_name} ${candidate.venue_address}`.toLowerCase()

  if (candidate.venue_address.toLowerCase().includes(target)) {
    return 4
  }

  if (candidate.city.toLowerCase() === target || sourceText.includes(target)) {
    return 3
  }

  return location
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((token) => token.length > 1 && sourceText.includes(token)).length
}

function matchesChildSelector(
  input: FindFamilyExperiencesInput,
  candidate: NormalizedFamilyExperienceCandidate,
): boolean {
  if (input.child_age !== undefined) {
    return input.child_age >= candidate.min_child_age && input.child_age <= candidate.max_child_age
  }

  if (input.child_stage !== undefined) {
    return candidate.child_stages.includes(input.child_stage)
  }

  return false
}

function getChildSelectorPriority(
  input: FindFamilyExperiencesInput,
  candidate: NormalizedFamilyExperienceCandidate,
): number {
  if (input.child_stage !== undefined) {
    if (!candidate.child_stages.includes(input.child_stage)) {
      return 0
    }

    return candidate.child_stages.length === 1 ? 3 : 2
  }

  if (input.child_age !== undefined) {
    const ageRangeSize = candidate.max_child_age - candidate.min_child_age

    if (input.child_age >= candidate.min_child_age && input.child_age <= candidate.max_child_age) {
      return 20 - ageRangeSize
    }
  }

  return 0
}

function getAgeFitPriority(candidate: NormalizedFamilyExperienceCandidate): number {
  switch (candidate.age_fit_label) {
    case "source-stated":
      return 2
    case "inferred":
      return 1
    case "unknown":
      return 0
    default:
      return assertNever(candidate.age_fit_label)
  }
}

function getPreferencePriority(
  candidate: NormalizedFamilyExperienceCandidate,
  preference: IndoorOutdoorPreference | undefined,
): number {
  if (preference === undefined) {
    return 0
  }

  if (candidate.indoor_outdoor === preference) {
    return 2
  }

  if (candidate.indoor_outdoor === "mixed") {
    return 1
  }

  return 0
}

function getCompletenessScore(candidate: NormalizedFamilyExperienceCandidate): number {
  return (
    booleanScore(candidate.fee_text.length > 0) +
    booleanScore(candidate.reservation_url !== undefined) +
    booleanScore(candidate.contact !== undefined) +
    booleanScore(candidate.parent_check.length > 0) +
    booleanScore(candidate.source_url.length > 0)
  )
}

function getSourceConfidenceScore(candidate: NormalizedFamilyExperienceCandidate): number {
  return (
    getConfidencePriority(candidate.date_confidence) +
    getConfidencePriority(candidate.venue_confidence) +
    getConfidencePriority(candidate.reservation_confidence)
  )
}

function getConfidencePriority(confidence: string): number {
  switch (confidence) {
    case "source-stated":
    case "api-returned":
      return 2
    case "computed":
    case "inferred":
      return 1
    case "stale":
    case "unknown":
      return 0
    default:
      return 0
  }
}

function getSourceAuthorityScore(sourceId: SourceId): number {
  switch (sourceId) {
    case "seoul-culture-events":
      return 4
    case "culture-portal-oneview":
    case "kto-tourapi-events":
      return 3
    case "national-culture-festival-standard":
      return 1
    case "fixture-family-experience-v1":
      return 0
    default:
      return assertNever(sourceId)
  }
}

function getRetrievedAtScore(candidate: NormalizedFamilyExperienceCandidate): number {
  const parsed = Date.parse(candidate.retrieved_at)

  if (Number.isFinite(parsed)) {
    return parsed
  }

  return 0
}

function compareNumber(left: number, right: number): number {
  return left - right
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right)
}

function booleanScore(value: boolean): number {
  return value ? 1 : 0
}

function assertNever(value: never): never {
  throw new Error(`Unexpected age fit label: ${JSON.stringify(value)}`)
}
