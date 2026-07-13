import type { ChildStage, DateRange, ToolMode } from "../types.js"

export const SOURCE_IDS = [
  "fixture-family-experience-v1",
  "seoul-culture-events",
  "culture-portal-oneview",
  "kto-tourapi-events",
  "national-culture-festival-standard",
] as const

export type SourceId = (typeof SOURCE_IDS)[number]

export const SOURCE_ROLES = ["authority", "fixture", "fallback_authority"] as const

export type SourceRole = (typeof SOURCE_ROLES)[number]

export const AUTHORITY_TIERS = [
  "fixture_only",
  "official_city_api",
  "official_national_api",
  "official_national_standard_dataset",
] as const

export type AuthorityTier = (typeof AUTHORITY_TIERS)[number]

export const SOURCE_AUTHENTICATIONS = ["none", "api_key_required", "service_key_required"] as const

export type SourceAuthentication = (typeof SOURCE_AUTHENTICATIONS)[number]

export const SOURCE_REDACTION_POLICIES = [
  "no_secrets_fixture_ids_only",
  "redact_api_key_and_keyed_url",
  "redact_service_key_and_keyed_url",
] as const

export type SourceRedactionPolicy = (typeof SOURCE_REDACTION_POLICIES)[number]

export const SOURCE_CLAIMS = [
  "schema_smoke_test",
  "demo_candidate_shape",
  "raw_snapshot_audit",
  "event_listing_presence",
  "event_date",
  "venue",
  "age_target",
  "source_url",
  "source_freshness",
] as const

export type SourceClaim = (typeof SOURCE_CLAIMS)[number]

export const LAUNCH_COVERAGE_TIERS = [
  "tier0-fixture-only",
  "tier1-source-proven-single-source",
  "tier2-multi-source-cross-region",
  "tier3-market-claim-eligible",
] as const

export type LaunchCoverageTier = (typeof LAUNCH_COVERAGE_TIERS)[number]

export type SourceRegistration = {
  readonly id: SourceId
  readonly institution: string
  readonly role: SourceRole
  readonly authority_tier: AuthorityTier
  readonly url: string
  readonly license: string
  readonly authentication: SourceAuthentication
  readonly freshness_expectation: string
  readonly cache_ttl_seconds: number
  readonly allowed_claims: readonly SourceClaim[]
  readonly unsupported_claims: readonly string[]
  readonly redaction_policy: SourceRedactionPolicy
  readonly proof_command: string
  readonly launch_tier: LaunchCoverageTier
}

export const SOURCE_CONFIDENCE_LABELS = [
  "source-stated",
  "api-returned",
  "computed",
  "inferred",
  "stale",
  "unknown",
] as const

export type SourceConfidenceLabel = (typeof SOURCE_CONFIDENCE_LABELS)[number]

export const INDOOR_OUTDOOR_VALUES = ["indoor", "outdoor", "mixed", "unknown"] as const

export type IndoorOutdoor = (typeof INDOOR_OUTDOOR_VALUES)[number]

export const SUITABILITY_LABELS = ["happy_prompt_match", "edge_unsuitable"] as const

export type SuitabilityLabel = (typeof SUITABILITY_LABELS)[number]

export type ExperienceDate = {
  readonly start: string
  readonly end: string
  readonly time_text: string
}

export type ExperienceVenue = {
  readonly name: string
  readonly address: string
}

export type ExperienceCoordinates = {
  readonly latitude: number
  readonly longitude: number
}

export type SourceReference = {
  readonly id: SourceId
  readonly mode: ToolMode
  readonly url: string
  readonly raw_snapshot_id: string
}

export type SourceConfidence = {
  readonly date: SourceConfidenceLabel
  readonly venue: SourceConfidenceLabel
  readonly age_fit: SourceConfidenceLabel
  readonly reservation: SourceConfidenceLabel
}

export type ParentCheck = {
  readonly age_fit: string
  readonly reservation: "confirmation_needed"
  readonly live_status: "fixture_not_live" | "source_timestamp_required"
}

export type FamilyExperienceSourceRecord = {
  readonly id: string
  readonly raw_snapshot_id: string
  readonly age_evidence_snapshot_id?: string
  readonly mode: ToolMode
  readonly title: string
  readonly city: string
  readonly date: ExperienceDate
  readonly venue: ExperienceVenue
  readonly coordinates?: ExperienceCoordinates
  readonly source: SourceReference
  readonly retrieved_at: string
  readonly confidence: SourceConfidence
  readonly parent_check: ParentCheck
  readonly child_stages: readonly ChildStage[]
  readonly min_child_age: number
  readonly max_child_age: number
  readonly indoor_outdoor: IndoorOutdoor
  readonly target_age_text: string
  readonly program_text: string
  readonly reservation_url: string | null
  readonly contact: string | null
  readonly fee_text: string
  readonly tags: readonly string[]
  readonly suitability: SuitabilityLabel
  readonly fixture_notice: string
}

export type FixtureFamilyExperienceRecord = FamilyExperienceSourceRecord & {
  readonly mode: "fixture"
  readonly source: SourceReference & {
    readonly id: "fixture-family-experience-v1"
    readonly mode: "fixture"
  }
}

export type RawSourceSnapshot = {
  readonly snapshot_id: string
  readonly source_id: SourceId
  readonly retrieved_at: string
  readonly request_hash: string
  readonly payload_ref: string
  readonly response_sha256?: string
  readonly evidence?: {
    readonly content_id?: string
    readonly age_limit?: string
  }
}

export type SourceAdapterRequest = {
  readonly location: string
  readonly date_range: DateRange
  readonly child_age?: number
  readonly child_stage?: ChildStage
}

export const SOURCE_ADAPTER_FAILURE_CODES = [
  "source_unavailable",
  "source_invalid_response",
  "source_not_authorized",
  "missing_key",
  "permission_failure",
  "source_failure",
  "malformed_source",
  "no_match",
] as const

export type SourceAdapterFailureCode = (typeof SOURCE_ADAPTER_FAILURE_CODES)[number]

export type SourceAdapterFailureDiagnostics = {
  readonly redacted_url?: string
  readonly source_code?: string
  readonly source_message?: string
  readonly detail?: string
}

export type SourceAdapterFailure = {
  readonly code: SourceAdapterFailureCode
  readonly message: string
  readonly retryable: boolean
  readonly diagnostics?: SourceAdapterFailureDiagnostics
}

export type SourceAdapterSuccess = {
  readonly ok: true
  readonly source_id: SourceId
  readonly mode: ToolMode
  readonly retrieved_at: string
  readonly raw_snapshots: readonly RawSourceSnapshot[]
  readonly records: readonly FamilyExperienceSourceRecord[]
}

export type SourceAdapterFailureResult = {
  readonly ok: false
  readonly source_id: SourceId
  readonly mode: ToolMode
  readonly failure: SourceAdapterFailure
}

export type SourceAdapterResult = SourceAdapterSuccess | SourceAdapterFailureResult

export type FamilyExperienceSourceAdapter = {
  readonly source_id: SourceId
  readonly mode: ToolMode
  readonly list: (request: SourceAdapterRequest) => Promise<SourceAdapterResult>
}
