import * as z from "zod/v4"

import { CHILD_STAGES, FAMILY_EXPERIENCE_SOURCES, TOOL_MODES } from "./types.js"

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
export const MAX_FAMILY_EXPERIENCE_PROMPT_LENGTH = 4_096

export const DateOnlySchema = z.string().regex(dateOnlyPattern, "Expected date in YYYY-MM-DD format")

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

export const FindFamilyExperiencesTransportInputSchema = z
  .object({
    location: z.string().trim().min(1, "location is required"),
    date_range: DateRangeSchema,
    child_age: z.number().int().min(0).max(17).optional(),
    child_stage: z.enum(CHILD_STAGES).optional(),
  })
  .strict()

export const FindFamilyExperiencesMcpInputSchema = z
  .union([FindFamilyExperiencesTransportInputSchema, FindFamilyExperiencesLoosePromptInputSchema])
  .transform((input) => input)

export const FindFamilyExperiencesInputSchema = FindFamilyExperiencesStructuredInputSchema

export type FindFamilyExperiencesInput = z.infer<typeof FindFamilyExperiencesStructuredInputSchema>
export type FindFamilyExperiencesLoosePromptInput = z.infer<typeof FindFamilyExperiencesLoosePromptInputSchema>
export type FamilyExperienceMcpInput = z.infer<typeof FindFamilyExperiencesMcpInputSchema>

const unsupportedPublicClaimPattern =
  /전국 모든 행사|전국 전체|예약 가능|예약가능|운영 중|실시간|아이에게 적합함|안전 인증|safety certified|safe for children|available to book|book now|currently open|live now/i
const sourceConfirmationPattern = /confirm (at|with) (the )?source|공식 출처.*확인|출처에서.*확인|확인하세요|확인하세요\./i

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
    source_url: z.string().url(),
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
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    location: z.string().trim().min(1),
    starts_at: DateOnlySchema,
    source: z.enum(FAMILY_EXPERIENCE_SOURCES),
    ends_at: DateOnlySchema,
    tags: z.array(z.string().trim().min(1)).default([]),
    child_stages: z.array(z.enum(CHILD_STAGES)).optional(),
    description: z.string().trim().min(1).optional(),
    max_child_age: z.number().int().min(0).max(17).optional(),
    min_child_age: z.number().int().min(0).max(17).optional(),
    reservation_url: z.string().url().optional(),
    contact: z.string().trim().min(1).optional(),
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
  })

export const ToolFailureSchema = z
  .object({
    code: z.enum(["invalid_input", "missing_configuration", "upstream_unavailable", "upstream_invalid_response", "no_results", "internal_error"]),
    message: z.string().trim().min(1),
    retryable: z.boolean(),
  })
  .strict()

export const FindFamilyExperiencesResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      mode: z.enum(TOOL_MODES),
      candidates: z.array(FamilyExperienceCandidateSchema),
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      mode: z.enum(TOOL_MODES),
      failure: ToolFailureSchema,
    })
    .strict(),
])

export const FindFamilyExperiencesStructuredContentSchema = FindFamilyExperiencesResultSchema
