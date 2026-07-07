export const CHILD_STAGES = ["infant", "toddler", "preschool", "school_age", "teen"] as const

export type ChildStage = (typeof CHILD_STAGES)[number]

export const TOOL_FAILURE_CODES = [
  "invalid_input",
  "missing_configuration",
  "upstream_unavailable",
  "upstream_invalid_response",
  "no_results",
  "internal_error",
] as const

export type ToolFailureCode = (typeof TOOL_FAILURE_CODES)[number]

export const TOOL_MODES = ["fixture", "live"] as const

export type ToolMode = (typeof TOOL_MODES)[number]

export type DateRange = {
  readonly start: string
  readonly end: string
}

export const FAMILY_EXPERIENCE_SOURCES = [
  "fixture",
  "seoul_open_data",
  "culture_portal",
  "kto_tourapi",
  "national_culture_festival",
] as const

export type FamilyExperienceSource = (typeof FAMILY_EXPERIENCE_SOURCES)[number]

export type FamilyExperienceCandidate = {
  readonly id: string
  readonly title: string
  readonly location: string
  readonly date_time: string
  readonly venue: string
  readonly address: string
  readonly age_fit_label: "source-stated" | "inferred" | "unknown"
  readonly age_fit_reason: string
  readonly indoor_outdoor: "indoor" | "outdoor" | "mixed" | "unknown"
  readonly fee_text: string
  readonly source_name: string
  readonly confidence: string
  readonly retrieved_at: string
  readonly warnings: string
  readonly source_summary: string
  readonly parent_check: string
  readonly next_action: string
  readonly starts_at: string
  readonly source: FamilyExperienceSource
  readonly tags: readonly string[]
  readonly child_stages?: readonly ChildStage[]
  readonly description?: string
  readonly ends_at: string
  readonly max_child_age?: number
  readonly min_child_age?: number
  readonly source_url: string
  readonly reservation_url?: string
  readonly contact?: string
}

export type ToolFailure = {
  readonly code: ToolFailureCode
  readonly message: string
  readonly retryable: boolean
}

export type FindFamilyExperiencesSuccess = {
  readonly ok: true
  readonly mode: ToolMode
  readonly candidates: readonly FamilyExperienceCandidate[]
}

export type FindFamilyExperiencesFailure = {
  readonly ok: false
  readonly mode: ToolMode
  readonly failure: ToolFailure
}

export type FindFamilyExperiencesResult =
  | FindFamilyExperiencesSuccess
  | FindFamilyExperiencesFailure
