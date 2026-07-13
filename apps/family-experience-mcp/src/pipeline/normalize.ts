import type { FindFamilyExperiencesInput } from "../schemas.js"
import {
  INDOOR_OUTDOOR_VALUES,
  type SourceId,
  type SourceReference,
} from "../sources/types.js"
import { CHILD_STAGES, type ToolFailure } from "../types.js"
import { dedupeFamilyExperienceCandidates } from "./dedupe.js"
import {
  SourceRecordSchema,
  type AgeFitLabel,
  type ParsedSourceRecord,
} from "./sourceRecord.js"

export { AGE_FIT_LABELS, AgeFitLabelSchema } from "./sourceRecord.js"
export type { AgeFitLabel } from "./sourceRecord.js"

export type NormalizedFamilyExperienceCandidate = {
  readonly id: string
  readonly title: string
  readonly mode: "fixture" | "live"
  readonly city: string
  readonly source_name: string
  readonly location: string
  readonly starts_at: string
  readonly ends_at: string
  readonly time_text: string
  readonly retrieved_at: string
  readonly venue_name: string
  readonly venue_address: string
  readonly source_id: SourceId
  readonly source_url: string
  readonly raw_snapshot_id: string
  readonly source_references: readonly SourceReference[]
  readonly tags: readonly string[]
  readonly child_stages: readonly (typeof CHILD_STAGES)[number][]
  readonly min_child_age: number
  readonly max_child_age: number
  readonly indoor_outdoor: (typeof INDOOR_OUTDOOR_VALUES)[number]
  readonly target_age_text: string
  readonly program_text: string
  readonly fee_text: string
  readonly parent_check: string
  readonly date_confidence: string
  readonly venue_confidence: string
  readonly reservation_confidence: string
  readonly reservation_url?: string
  readonly contact?: string
  readonly age_fit_label: AgeFitLabel
  readonly age_fit_reason: string
  readonly source_order: number
}

export type NormalizeFamilyExperienceRecordsRequest = {
  readonly input: FindFamilyExperiencesInput
  readonly source_records: readonly unknown[]
}

export type NormalizeFamilyExperienceRecordsResult =
  | {
      readonly ok: true
      readonly candidates: readonly NormalizedFamilyExperienceCandidate[]
    }
  | {
      readonly ok: false
      readonly failure: ToolFailure
    }

export function normalizeFamilyExperienceRecords(
  request: NormalizeFamilyExperienceRecordsRequest,
): NormalizeFamilyExperienceRecordsResult {
  const normalized = normalizeFamilyExperienceRecordCandidates(request)

  if (!normalized.ok) {
    return normalized
  }

  return {
    ok: true,
    candidates: dedupeFamilyExperienceCandidates(normalized.candidates),
  }
}

export function normalizeFamilyExperienceRecordCandidates(
  request: NormalizeFamilyExperienceRecordsRequest,
): NormalizeFamilyExperienceRecordsResult {
  const candidates: NormalizedFamilyExperienceCandidate[] = []

  for (const [sourceOrder, rawRecord] of request.source_records.entries()) {
    const parsedRecord = SourceRecordSchema.safeParse(rawRecord)

    if (!parsedRecord.success) {
      return invalidSourceRecordFailure(parsedRecord.error.issues.map((issue) => issue.message))
    }

    candidates.push(
      normalizeRecord({
        record: parsedRecord.data,
        source_order: sourceOrder,
      }),
    )
  }

  return {
    ok: true,
    candidates,
  }
}

type NormalizeRecordRequest = {
  readonly record: ParsedSourceRecord
  readonly source_order: number
}

function normalizeRecord(request: NormalizeRecordRequest): NormalizedFamilyExperienceCandidate {
  const ageFit = getAgeFitAssessment(request.record)

  return {
    id: request.record.id,
    title: request.record.title,
    mode: request.record.mode,
    city: request.record.city,
    source_name: sourceDisplayName(request.record.source.id),
    location: request.record.venue.name,
    starts_at: request.record.date.start,
    ends_at: request.record.date.end,
    time_text: request.record.date.time_text,
    retrieved_at: request.record.retrieved_at,
    venue_name: request.record.venue.name,
    venue_address: request.record.venue.address,
    source_id: request.record.source.id,
    source_url: request.record.source.url,
    raw_snapshot_id: request.record.raw_snapshot_id,
    source_references: [request.record.source],
    tags: request.record.tags,
    child_stages: request.record.child_stages,
    min_child_age: request.record.min_child_age,
    max_child_age: request.record.max_child_age,
    indoor_outdoor: request.record.indoor_outdoor,
    target_age_text: request.record.target_age_text,
    program_text: request.record.program_text,
    fee_text: request.record.fee_text,
    parent_check: request.record.parent_check.age_fit,
    date_confidence: request.record.confidence.date,
    venue_confidence: request.record.confidence.venue,
    reservation_confidence: request.record.confidence.reservation,
    ...optionalReservationUrl(request.record.reservation_url),
    ...optionalContact(request.record.contact),
    age_fit_label: ageFit.label,
    age_fit_reason: ageFit.reason,
    source_order: request.source_order,
  }
}

type AgeFitAssessment = {
  readonly label: AgeFitLabel
  readonly reason: string
}

function getAgeFitAssessment(record: ParsedSourceRecord): AgeFitAssessment {
  switch (record.confidence.age_fit) {
    case "source-stated":
      return {
        label: "source-stated",
        reason: record.parent_check.age_fit,
      }
    case "inferred":
      return {
        label: "inferred",
        reason: `Inferred from source text: "${getAgeEvidenceText(record)}"`,
      }
    case "unknown":
      return {
        label: "unknown",
        reason: "Source does not state enough child suitability evidence.",
      }
    default:
      return assertNever(record.confidence.age_fit)
  }
}

function getAgeEvidenceText(record: ParsedSourceRecord): string {
  const evidence = [record.target_age_text, record.program_text, record.title].find(
    (text) => text.trim().length > 0,
  )

  return evidence ?? record.title
}

function sourceDisplayName(sourceId: SourceId): string {
  switch (sourceId) {
    case "fixture-family-experience-v1":
      return "fixture/demo source"
    case "seoul-culture-events":
      return "Seoul Open Data"
    case "culture-portal-oneview":
      return "Culture Portal/KCISA"
    case "kto-tourapi-events":
      return "KTO TourAPI"
    case "national-culture-festival-standard":
      return "National Culture Festival Standard Dataset"
    default:
      return assertNever(sourceId)
  }
}

function optionalReservationUrl(value: string | null): { readonly reservation_url?: string } {
  if (value === null) {
    return {}
  }

  return {
    reservation_url: value,
  }
}

function optionalContact(value: string | null): { readonly contact?: string } {
  if (value === null) {
    return {}
  }

  return {
    contact: value,
  }
}

function invalidSourceRecordFailure(messages: readonly string[]): NormalizeFamilyExperienceRecordsResult {
  return {
    ok: false,
    failure: {
      code: "upstream_invalid_response",
      message: `Invalid family experience source record: ${messages.join("; ")}`,
      retryable: false,
    },
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected age fit label: ${JSON.stringify(value)}`)
}
