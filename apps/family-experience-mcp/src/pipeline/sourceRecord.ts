import * as z from "zod/v4"

import { DateOnlySchema } from "../schemas.js"
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

const textSchema = z.string().trim().min(1)

export const SourceRecordSchema = z
  .object({
    id: textSchema,
    raw_snapshot_id: textSchema,
    mode: z.enum(TOOL_MODES),
    title: textSchema,
    city: textSchema,
    date: z
      .object({
        start: DateOnlySchema,
        end: DateOnlySchema,
        time_text: textSchema,
      })
      .strict(),
    venue: z
      .object({
        name: textSchema,
        address: textSchema,
      })
      .strict(),
    source: z
      .object({
        id: z.enum(SOURCE_IDS),
        mode: z.enum(TOOL_MODES),
        url: z.string().url(),
        raw_snapshot_id: textSchema,
      })
      .strict(),
    retrieved_at: textSchema,
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
        age_fit: textSchema,
        reservation: z.literal("confirmation_needed"),
        live_status: z.enum(["fixture_not_live", "source_timestamp_required"]),
      })
      .strict(),
    child_stages: z.array(z.enum(CHILD_STAGES)),
    min_child_age: z.number().int().min(0).max(17),
    max_child_age: z.number().int().min(0).max(17),
    indoor_outdoor: z.enum(INDOOR_OUTDOOR_VALUES),
    target_age_text: z.string().trim(),
    program_text: textSchema,
    reservation_url: z.string().url().nullable(),
    contact: z.string().trim().min(1).nullable(),
    fee_text: textSchema,
    tags: z.array(textSchema),
    suitability: z.enum(SUITABILITY_LABELS),
    fixture_notice: textSchema,
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
