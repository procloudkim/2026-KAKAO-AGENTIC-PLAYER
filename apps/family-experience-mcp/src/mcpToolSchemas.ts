import * as z from "zod/v4"

import {
  FindFamilyExperiencesLoosePromptInputSchema,
  FindFamilyExperiencesMcpInputSchema,
} from "./schemas.js"
import { FAMILY_EXPERIENCE_SOURCES, TOOL_FAILURE_CODES } from "./types.js"

export const ParseFamilyExperienceRequestInputSchema = FindFamilyExperiencesLoosePromptInputSchema

export const ParsedFamilyExperienceRequestSchema = z
  .object({
    input: FindFamilyExperiencesMcpInputSchema,
    assumptions: z.array(z.string().trim().min(1)),
    missing_fields: z.array(z.string().trim().min(1)),
    keywords: z.array(z.string().trim().min(1)),
  })
  .strict()

export const ParseFamilyExperienceRequestResultSchema = z.discriminatedUnion("ok", [
  z
    .object({
      ok: z.literal(true),
      parsed: ParsedFamilyExperienceRequestSchema,
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      failure: z
        .object({
          code: z.enum(TOOL_FAILURE_CODES),
          message: z.string().trim().min(1),
          retryable: z.boolean(),
        })
        .strict(),
    })
    .strict(),
])

export const FamilyExperienceSourceListInputSchema = z.object({}).strict()

export const FamilyExperienceSourceListSchema = z
  .object({
    sources: z.array(
      z
        .object({
          id: z.enum(FAMILY_EXPERIENCE_SOURCES),
          role: z.string().trim().min(1),
          coverage: z.string().trim().min(1),
          authentication: z.string().trim().min(1),
          runtime_boundary: z.string().trim().min(1),
        })
        .strict(),
    ),
    unsupported_claims: z.array(z.string().trim().min(1)),
  })
  .strict()
