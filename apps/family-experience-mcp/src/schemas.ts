import * as z from "zod/v4"

import { INDOOR_OUTDOOR_VALUES } from "./sources/types.js"
import { CHILD_STAGES, FAMILY_EXPERIENCE_SOURCES, TOOL_MODES } from "./types.js"
import { HttpUrlSchema } from "./httpUrl.js"
import {
  isMeaningfulPlaceLabel,
  normalizeKakaoDestinationLabel,
} from "./placeLabels.js"
import { NAVIGABLE_PLACE_EVIDENCE_STATUSES } from "./placeResolution.js"

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
export const MAX_FAMILY_EXPERIENCE_PROMPT_LENGTH = 4_096

export const FAMILY_EXPERIENCE_CANONICAL_KEYWORDS = [
  "museum",
  "performance",
  "festival",
  "craft",
  "free",
  "rainy_day",
] as const

export const FAMILY_EXPERIENCE_TIME_OF_DAY_VALUES = [
  "morning",
  "afternoon",
  "evening",
] as const

export type FamilyExperienceTimeOfDay =
  (typeof FAMILY_EXPERIENCE_TIME_OF_DAY_VALUES)[number]

export type FamilyExperienceCanonicalKeyword =
  (typeof FAMILY_EXPERIENCE_CANONICAL_KEYWORDS)[number]

const familyExperienceKeywordsDescription =
  "Known source-evidenced keywords or synonyms only. Unsupported text is ignored for eligibility, never claimed as matched; use indoor_outdoor_preference for venue type."

const FamilyExperienceKeywordInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)

const FamilyExperienceKeywordsInputSchema = z
  .array(FamilyExperienceKeywordInputSchema)
  .max(8)
  .describe(familyExperienceKeywordsDescription)

export function canonicalFamilyExperienceKeyword(
  keyword: string,
): FamilyExperienceCanonicalKeyword | undefined {
  switch (normalizeFamilyExperienceKeyword(keyword)) {
    case "museum":
    case "박물관":
    case "미술관":
    case "전시":
      return "museum"
    case "performance":
    case "공연":
    case "연극":
    case "뮤지컬":
      return "performance"
    case "festival":
    case "축제":
    case "행사":
      return "festival"
    case "craft":
    case "공예":
    case "만들기":
      return "craft"
    case "free":
    case "무료":
      return "free"
    case "rainy_day":
    case "rainy day":
    case "rainy-day":
    case "비":
    case "우천":
      return "rainy_day"
    default:
      return undefined
  }
}

function normalizeFamilyExperienceKeyword(keyword: string): string {
  return keyword.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ")
}

export const DateOnlySchema = z
  .string()
  .regex(dateOnlyPattern, "Expected date in YYYY-MM-DD format")
  .refine((value) => {
    const [yearText, monthText, dayText] = value.split("-")
    const year = Number(yearText)
    const month = Number(monthText)
    const day = Number(dayText)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
  }, "Expected a valid calendar date")

export const DateRangeSchema = z
  .object({
    start: DateOnlySchema,
    end: DateOnlySchema,
  })
  .strict()
  .superRefine((dateRange, context) => {
    if (dateRange.end < dateRange.start) {
      context.addIssue({
        code: "custom",
        message: "date_range.end must be on or after date_range.start",
        path: ["end"],
      })
    }
  })

export const FindFamilyExperiencesStructuredInputSchema = z
  .object({
    location: z.string().trim().min(1, "location is required"),
    date_range: DateRangeSchema,
    child_age: z.number().int().min(0).max(17).optional(),
    child_stage: z.enum(CHILD_STAGES).optional(),
    time_of_day: z.enum(FAMILY_EXPERIENCE_TIME_OF_DAY_VALUES).optional(),
    indoor_outdoor_preference: z.enum(INDOOR_OUTDOOR_VALUES).optional(),
    keywords: FamilyExperienceKeywordsInputSchema.optional(),
  })
  .strict()
  .superRefine((input, context) => {
    const selectorCount =
      Number(input.child_age !== undefined) + Number(input.child_stage !== undefined)

    if (selectorCount !== 1) {
      context.addIssue({
        code: "custom",
        message: "Provide exactly one of child_age or child_stage.",
        path: ["child_age"],
      })
    }
  })

export const FindFamilyExperiencesLoosePromptInputSchema = z
  .object({
    prompt: z
      .string()
      .trim()
      .min(1, "prompt is required")
      .max(
        MAX_FAMILY_EXPERIENCE_PROMPT_LENGTH,
        `prompt must be at most ${MAX_FAMILY_EXPERIENCE_PROMPT_LENGTH} characters`,
      ),
  })
  .strict()

export const FindFamilyExperiencesMcpInputSchema = z
  .object({
    prompt: z
      .string()
      .trim()
      .min(1, "prompt is required when structured fields are omitted")
      .max(
        MAX_FAMILY_EXPERIENCE_PROMPT_LENGTH,
        `prompt must be at most ${MAX_FAMILY_EXPERIENCE_PROMPT_LENGTH} characters`,
      )
      .optional(),
    location: z.string().trim().min(1).optional(),
    date_range: DateRangeSchema.optional(),
    child_age: z.number().int().min(0).max(17).optional(),
    child_stage: z.enum(CHILD_STAGES).optional(),
    time_of_day: z.enum(FAMILY_EXPERIENCE_TIME_OF_DAY_VALUES).optional(),
    indoor_outdoor_preference: z.enum(INDOOR_OUTDOOR_VALUES).optional(),
    keywords: FamilyExperienceKeywordsInputSchema.optional(),
  })
  .strict()
  .superRefine((input, context) => {
    const hasPrompt = input.prompt !== undefined
    const hasAnyStructuredField =
      input.location !== undefined ||
      input.date_range !== undefined ||
      input.child_age !== undefined ||
      input.child_stage !== undefined ||
      input.time_of_day !== undefined ||
      input.indoor_outdoor_preference !== undefined ||
      input.keywords !== undefined
    if (hasPrompt && hasAnyStructuredField) {
      context.addIssue({
        code: "custom",
        message: "Provide prompt or structured fields, not both.",
        path: ["prompt"],
      })
    }
  })

export const FindFamilyExperiencesTransportInputSchema = z
  .object({
    location: z.string().trim().min(1, "location is required"),
    date_range: DateRangeSchema,
    child_age: z.number().int().min(0).max(17).optional(),
    child_stage: z.enum(CHILD_STAGES).optional(),
    time_of_day: z.enum(FAMILY_EXPERIENCE_TIME_OF_DAY_VALUES).optional(),
  })
  .strict()

export const FindFamilyExperiencesHandlerInputSchema = z
  .union([
    FindFamilyExperiencesTransportInputSchema,
    FindFamilyExperiencesLoosePromptInputSchema,
    FindFamilyExperiencesMcpInputSchema,
  ])
  .transform((input) => input)

export const FindFamilyExperiencesInputSchema = FindFamilyExperiencesStructuredInputSchema

export type FindFamilyExperiencesInput = z.infer<typeof FindFamilyExperiencesStructuredInputSchema>
export type FindFamilyExperiencesLoosePromptInput = z.infer<typeof FindFamilyExperiencesLoosePromptInputSchema>
export type FamilyExperienceHandlerInput = z.infer<typeof FindFamilyExperiencesHandlerInputSchema>
export type FamilyExperienceMcpInput = z.infer<typeof FindFamilyExperiencesMcpInputSchema>

const unsupportedPublicClaimPattern =
  /전국 모든 행사|전국 전체|예약 가능|예약가능|운영 중|실시간|아이에게 적합함|안전 인증|safety certified|safe for children|available to book|book now|currently open|live now/i
const sourceConfirmationPattern = /confirm (at|with) (the )?source|공식 출처.*확인|출처에서.*확인|확인하세요|확인하세요\./i
const PublicSourceUrlSchema = HttpUrlSchema.refine((value) => {
  const url = new URL(value)
  const hostname = url.hostname.toLowerCase()
  return hostname !== "apis.data.go.kr" && !/\/(?:detailCommon2|detailIntro2)\/?$/iu.test(url.pathname)
}, "Authenticated provider API URLs are not public detail pages")

const KakaoMapLinkBaseSchema = HttpUrlSchema.refine((value) => {
  const url = new URL(value)
  return (
    url.protocol === "https:" &&
    url.hostname.toLowerCase() === "map.kakao.com" &&
    url.username.length === 0 &&
    url.password.length === 0 &&
    url.search.length === 0 &&
    url.hash.length === 0
  )
}, "Expected an official Kakao Map link")

const KakaoMapLinkSchema = KakaoMapLinkBaseSchema.refine((value) => {
  const pathname = new URL(value).pathname
  return /^\/link\/map\/[^/,]+,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?\/?$/u.test(pathname)
}, "Expected an official Kakao map link")

const KakaoDirectionsLinkSchema = KakaoMapLinkBaseSchema.refine((value) => {
  const pathname = new URL(value).pathname
  return /^\/link\/to\/[^/,]+,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?\/?$/u.test(pathname)
}, "Expected an official Kakao directions link")

export const FamilyExperienceNavigationSchema = z
  .object({
    place_evidence_status: z.enum(NAVIGABLE_PLACE_EVIDENCE_STATUSES),
    map_url: KakaoMapLinkSchema,
    directions_url: KakaoDirectionsLinkSchema,
  })
  .strict()
  .superRefine((navigation, context) => {
    const map = parseKakaoNavigationLink(navigation.map_url, "map")
    const directions = parseKakaoNavigationLink(navigation.directions_url, "to")
    if (map === undefined || directions === undefined) return

    if (!isMeaningfulPlaceLabel(map.destination)) {
      context.addIssue({
        code: "custom",
        message: "Kakao navigation destination must be a meaningful place name",
        path: ["map_url"],
      })
    }
    if (
      map.destination !== directions.destination ||
      map.latitude !== directions.latitude ||
      map.longitude !== directions.longitude
    ) {
      context.addIssue({
        code: "custom",
        message: "Kakao map and directions links must use the same destination and coordinates",
        path: ["directions_url"],
      })
    }
    const latitude = Number(map.latitude)
    const longitude = Number(map.longitude)
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      context.addIssue({
        code: "custom",
        message: "Kakao navigation coordinates must be valid latitude and longitude",
        path: ["map_url"],
      })
    }
  })

function parseKakaoNavigationLink(
  value: string,
  kind: "map" | "to",
): { readonly destination: string; readonly latitude: string; readonly longitude: string } | undefined {
  const match = new RegExp(
    `^/link/${kind}/([^/,]+),(-?\\d+(?:\\.\\d+)?),(-?\\d+(?:\\.\\d+)?)/?$`,
    "u",
  ).exec(new URL(value).pathname)
  if (match === null) return undefined

  const [, encodedDestination, latitude, longitude] = match
  if (
    encodedDestination === undefined ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return undefined
  }

  try {
    return {
      destination: decodeURIComponent(encodedDestination),
      latitude,
      longitude,
    }
  } catch {
    return undefined
  }
}

export const FamilyExperienceParentActionCardSchema = z
  .object({
    date_time: z.string().trim().min(1),
    venue: z.string().trim().min(1),
    address: z.string().trim().min(1),
    age_fit_label: z.enum(["source-stated", "inferred", "unknown"]),
    age_fit_reason: z.string().trim().min(1),
    indoor_outdoor: z.enum(["indoor", "outdoor", "mixed", "unknown"]),
    fee_text: z.string().trim().min(1),
    source_name: z.string().trim().min(1),
    source_url: PublicSourceUrlSchema.optional(),
    retrieved_at: z.string().trim().min(1),
    confidence: z.string().trim().min(1),
    mode: z.enum(TOOL_MODES),
    warnings: z.string().trim().min(1),
    source_summary: z.string().trim().min(1),
    parent_check: z.string().trim().min(1),
    next_action: z.string().trim().min(1),
  })
  .strict()

export const FamilyExperienceCandidateSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1),
    location: z.string().trim().min(1),
    starts_at: DateOnlySchema,
    source: z.enum(FAMILY_EXPERIENCE_SOURCES),
    ends_at: DateOnlySchema,
    tags: z.array(z.string().trim().min(1)).optional(),
    child_stages: z.array(z.enum(CHILD_STAGES)).optional(),
    description: z.string().trim().min(1).optional(),
    max_child_age: z.number().int().min(0).max(17).optional(),
    min_child_age: z.number().int().min(0).max(17).optional(),
    reservation_url: HttpUrlSchema.optional(),
    contact: z.string().trim().min(1).optional(),
    navigation: FamilyExperienceNavigationSchema.optional(),
    ...FamilyExperienceParentActionCardSchema.shape,
  })
  .strict()
  .superRefine((candidate, context) => {
    if (candidate.ends_at !== undefined && candidate.ends_at < candidate.starts_at) {
      context.addIssue({
        code: "custom",
        message: "ends_at must be on or after starts_at",
        path: ["ends_at"],
      })
    }

    if (
      candidate.min_child_age !== undefined &&
      candidate.max_child_age !== undefined &&
      candidate.max_child_age < candidate.min_child_age
    ) {
      context.addIssue({
        code: "custom",
        message: "max_child_age must be greater than or equal to min_child_age",
        path: ["max_child_age"],
      })
    }

    const publicStructuredFields = [
      ["title", candidate.title],
      ["location", candidate.location],
      ["date_time", candidate.date_time],
      ["venue", candidate.venue],
      ["address", candidate.address],
      ["age_fit_reason", candidate.age_fit_reason],
      ["fee_text", candidate.fee_text],
      ["source_name", candidate.source_name],
      ["confidence", candidate.confidence],
      ["warnings", candidate.warnings],
      ["source_summary", candidate.source_summary],
      ["parent_check", candidate.parent_check],
      ["next_action", candidate.next_action],
      ["description", candidate.description ?? ""],
      ["contact", candidate.contact ?? ""],
    ] as const
    const publicCopy = publicStructuredFields.map(([, value]) => value).join("\n")

    for (const [field, value] of publicStructuredFields) {
      if (unsupportedPublicClaimPattern.test(value)) {
        context.addIssue({
          code: "custom",
          message: "unsupported availability or safety claim in public candidate copy",
          path: [field],
        })
      }
    }

    if (
      candidate.reservation_url !== undefined &&
      !sourceConfirmationPattern.test(publicCopy)
    ) {
      context.addIssue({
        code: "custom",
        message: "reservation_url requires public copy to say confirm at source",
        path: ["reservation_url"],
      })
    }

    if (candidate.navigation !== undefined) {
      const map = parseKakaoNavigationLink(candidate.navigation.map_url, "map")
      if (
        map !== undefined &&
        map.destination !== normalizeKakaoDestinationLabel(candidate.venue)
      ) {
        context.addIssue({
          code: "custom",
          message: "Kakao navigation destination must match candidate venue",
          path: ["navigation", "map_url"],
        })
      }
    }
  })

export const ToolFailureSchema = z
  .object({
    code: z.enum(["invalid_input", "missing_configuration", "upstream_unavailable", "upstream_invalid_response", "no_results", "internal_error"]),
    message: z.string().trim().min(1),
    retryable: z.boolean(),
    missing_fields: z.array(z.string().trim().min(1)).optional(),
  })
  .strict()

export const FindFamilyExperiencesResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      mode: z.enum(TOOL_MODES),
      candidates: z.array(FamilyExperienceCandidateSchema).min(1).max(3),
      result_summary: z
        .object({
          target_count: z.literal(3),
          eligible_count: z.number().int().min(1),
          returned_count: z.number().int().min(1).max(3),
          reason: z.enum(["complete", "insufficient_eligible_candidates", "response_budget"]),
          message: z.string().trim().min(1),
          data_notice: z.string().trim().min(1).optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      mode: z.enum(TOOL_MODES),
      failure: ToolFailureSchema,
    })
    .strict(),
]).superRefine((result, context) => {
  if (!result.ok) return

  const { result_summary: summary } = result
  if (summary.returned_count !== result.candidates.length) {
    context.addIssue({
      code: "custom",
      message: "returned_count must equal candidates.length",
      path: ["result_summary", "returned_count"],
    })
  }
  if (summary.eligible_count < summary.returned_count) {
    context.addIssue({
      code: "custom",
      message: "eligible_count must be at least returned_count",
      path: ["result_summary", "eligible_count"],
    })
  }

  const validReason =
    (summary.reason === "complete" && summary.returned_count === 3 && summary.eligible_count >= 3) ||
    (summary.reason === "insufficient_eligible_candidates" &&
      summary.eligible_count < 3 &&
      summary.returned_count === summary.eligible_count) ||
    (summary.reason === "response_budget" &&
      summary.returned_count < Math.min(3, summary.eligible_count))
  if (!validReason) {
    context.addIssue({
      code: "custom",
      message: "result_summary reason does not match eligible and returned counts",
      path: ["result_summary", "reason"],
    })
  }
})

export const FindFamilyExperiencesStructuredContentSchema = FindFamilyExperiencesResultSchema
