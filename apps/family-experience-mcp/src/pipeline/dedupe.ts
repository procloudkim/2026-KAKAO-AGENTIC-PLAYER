import type { SourceId, SourceReference } from "../sources/types.js"
import type { NormalizedFamilyExperienceCandidate } from "./normalize.js"

export function dedupeFamilyExperienceCandidates(
  candidates: readonly NormalizedFamilyExperienceCandidate[],
): readonly NormalizedFamilyExperienceCandidate[] {
  const byCanonicalKey = new Map<string, NormalizedFamilyExperienceCandidate>()

  for (const candidate of candidates) {
    const canonicalKey = getCanonicalEventKey(candidate)
    const existingCandidate = byCanonicalKey.get(canonicalKey)

    byCanonicalKey.set(
      canonicalKey,
      existingCandidate === undefined ? candidate : mergeCandidates(existingCandidate, candidate),
    )
  }

  return [...byCanonicalKey.values()]
}

function mergeCandidates(
  left: NormalizedFamilyExperienceCandidate,
  right: NormalizedFamilyExperienceCandidate,
): NormalizedFamilyExperienceCandidate {
  const primary = compareCanonicalPrimary(right, left) > 0 ? right : left

  return {
    ...primary,
    tags: mergeTextArrays(left.tags, right.tags),
    source_references: mergeSourceReferences(left.source_references, right.source_references),
    source_order: Math.min(left.source_order, right.source_order),
  }
}

function getCanonicalEventKey(candidate: NormalizedFamilyExperienceCandidate): string {
  return [
    canonicalText(candidate.title),
    candidate.starts_at,
    candidate.ends_at,
    canonicalText(candidate.venue_name),
    canonicalText(candidate.venue_address),
    canonicalText(candidate.city),
  ].join("|")
}

function canonicalText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase()
}

function mergeTextArrays(left: readonly string[], right: readonly string[]): readonly string[] {
  return [...new Set([...left, ...right])]
}

function mergeSourceReferences(
  left: readonly SourceReference[],
  right: readonly SourceReference[],
): readonly SourceReference[] {
  const merged = new Map<string, SourceReference>()

  for (const sourceReference of [...left, ...right]) {
    merged.set(sourceReferenceKey(sourceReference), sourceReference)
  }

  return [...merged.values()]
}

function sourceReferenceKey(sourceReference: SourceReference): string {
  return `${sourceReference.id}|${sourceReference.raw_snapshot_id}|${sourceReference.url}`
}

function compareCanonicalPrimary(
  left: NormalizedFamilyExperienceCandidate,
  right: NormalizedFamilyExperienceCandidate,
): number {
  return (
    compareNumber(getSourceConfidenceScore(left), getSourceConfidenceScore(right)) ||
    compareNumber(getSourceAuthorityScore(left.source_id), getSourceAuthorityScore(right.source_id)) ||
    compareNumber(getRetrievedAtScore(left), getRetrievedAtScore(right)) ||
    compareNumber(right.source_order, left.source_order)
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

function assertNever(value: never): never {
  throw new Error(`Unexpected source id: ${JSON.stringify(value)}`)
}
