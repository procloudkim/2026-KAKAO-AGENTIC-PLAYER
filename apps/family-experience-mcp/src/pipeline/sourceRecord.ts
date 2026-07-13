import * as z from "zod/v4"

import { DateOnlySchema } from "../schemas.js"
import { HttpUrlSchema } from "../httpUrl.js"
import { CHILD_STAGES, TOOL_MODES } from "../types.js"
import {
  INDOOR_OUTDOOR_VALUES,
  SOURCE_CONFIDENCE_LABELS,
  SOURCE_IDS,
  SUITABILITY_LABELS,
} from "../sources/types.js"

export const AGE_FIT_LABELS = ["source-stated", "inferred", "unknown"] as const

export type AgeFitLabel = (typeof AGE_FIT_LABELS)[number]

export const AgeFitLabelSchema = z.enum(AGE_FIT_LABELS)

const providerInstructionPattern =
  /(?:\b(?:ignore|disregard|forget|override)\b[^.!?。！？]{0,80}\b(?:instructions?|prompts?|rules?|messages?)\b|\b(?:system|developer)\s+(?:prompt|message|instructions?)\b|\b(?:reveal|show|print|return|expose|leak)\b[^.!?。！？]{0,80}\b(?:secrets?|credentials?|api\s*keys?|system\s*prompts?)\b|(?:이전|앞선|위의)\s*(?:모든\s*)?(?:지시|명령|규칙|프롬프트)(?:를|을)?\s*(?:무시|잊어|덮어)|(?:시스템|개발자)\s*(?:프롬프트|메시지|지시)|(?:비밀|자격\s*증명|API\s*키|시스템\s*프롬프트)(?:을|를)?\s*(?:공개|출력|알려|노출))/iu

export function sanitizeProviderText(value: string): string {
  return value
    .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
    .split(/(?<=[.!?。！？])\s+/u)
    .filter((segment) => !providerInstructionPattern.test(segment))
    .join(" ")
    .replace(/\s+/gu, " ")
    .trim()
}

function providerTextSchema(maximumLength: number) {
  return z
    .string()
    .max(maximumLength)
    .transform(sanitizeProviderText)
    .pipe(z.string().min(1).max(maximumLength))
}

const providerShortTextSchema = providerTextSchema(512)
const providerLongTextSchema = providerTextSchema(2_048)
const providerTagSchema = providerTextSchema(128)

export const SourceRecordSchema = z
  .object({
    id: providerShortTextSchema,
    raw_snapshot_id: providerShortTextSchema,
    age_evidence_snapshot_id: providerShortTextSchema.optional(),
    mode: z.enum(TOOL_MODES),
    title: providerShortTextSchema,
    city: providerShortTextSchema,
    date: z
      .object({
        start: DateOnlySchema,
        end: DateOnlySchema,
        time_text: providerShortTextSchema,
      })
      .strict(),
    venue: z
      .object({
        name: providerShortTextSchema,
        address: providerShortTextSchema,
      })
      .strict(),
    coordinates: z
      .object({
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
      })
      .strict()
      .optional(),
    source: z
      .object({
        id: z.enum(SOURCE_IDS),
        mode: z.enum(TOOL_MODES),
        url: HttpUrlSchema,
        raw_snapshot_id: providerShortTextSchema,
      })
      .strict(),
    retrieved_at: providerShortTextSchema,
    confidence: z
      .object({
        date: z.enum(SOURCE_CONFIDENCE_LABELS),
        venue: z.enum(SOURCE_CONFIDENCE_LABELS),
        age_fit: AgeFitLabelSchema,
        reservation: z.enum(SOURCE_CONFIDENCE_LABELS),
      })
      .strict(),
    parent_check: z
      .object({
        age_fit: providerShortTextSchema,
        reservation: z.literal("confirmation_needed"),
        live_status: z.enum(["fixture_not_live", "source_timestamp_required"]),
      })
      .strict(),
    child_stages: z.array(z.enum(CHILD_STAGES)),
    min_child_age: z.number().int().min(0).max(17),
    max_child_age: z.number().int().min(0).max(17),
    indoor_outdoor: z.enum(INDOOR_OUTDOOR_VALUES),
    target_age_text: providerShortTextSchema,
    program_text: providerLongTextSchema,
    reservation_url: HttpUrlSchema.nullable(),
    contact: providerShortTextSchema.nullable(),
    fee_text: providerShortTextSchema,
    tags: z.array(providerTagSchema).max(20),
    suitability: z.enum(SUITABILITY_LABELS),
    fixture_notice: providerLongTextSchema,
  })
  .strict()
  .superRefine((record, context) => {
    if (record.date.end < record.date.start) {
      context.addIssue({
        code: "custom",
        message: "date.end must be on or after date.start",
        path: ["date", "end"],
      })
    }

    if (record.max_child_age < record.min_child_age) {
      context.addIssue({
        code: "custom",
        message: "max_child_age must be greater than or equal to min_child_age",
        path: ["max_child_age"],
      })
    }
  })

export type ParsedSourceRecord = z.infer<typeof SourceRecordSchema>
