import { TextDecoder } from "node:util"

import * as z from "zod/v4"

import {
  FindFamilyExperiencesInputSchema,
  MAX_FAMILY_EXPERIENCE_CURSOR_LENGTH,
  type FindFamilyExperiencesInput,
} from "./schemas.js"

export const MAX_FAMILY_EXPERIENCE_CURSOR_OFFSET = 10_000

const encodedCursorPattern = /^[A-Za-z0-9_-]+$/u

const FamilyExperienceContinuationPayloadSchema = z
  .object({
    v: z.literal(1),
    q: FindFamilyExperiencesInputSchema,
    offset: z.number().int().min(1).max(MAX_FAMILY_EXPERIENCE_CURSOR_OFFSET),
  })
  .strict()

export type FamilyExperienceContinuation = {
  readonly input: FindFamilyExperiencesInput
  readonly offset: number
}

export type DecodeFamilyExperienceCursorResult =
  | { readonly ok: true; readonly continuation: FamilyExperienceContinuation }
  | { readonly ok: false }

export function encodeFamilyExperienceCursor(
  input: FindFamilyExperiencesInput,
  offset: number,
): string | undefined {
  const payload = FamilyExperienceContinuationPayloadSchema.safeParse({
    v: 1,
    q: input,
    offset,
  })
  if (!payload.success) return undefined

  const encoded = Buffer.from(JSON.stringify(payload.data), "utf8").toString("base64url")
  return encoded.length <= MAX_FAMILY_EXPERIENCE_CURSOR_LENGTH ? encoded : undefined
}

export function decodeFamilyExperienceCursor(cursor: string): DecodeFamilyExperienceCursorResult {
  if (
    cursor.length === 0 ||
    cursor.length > MAX_FAMILY_EXPERIENCE_CURSOR_LENGTH ||
    !encodedCursorPattern.test(cursor)
  ) {
    return { ok: false }
  }

  try {
    const bytes = Buffer.from(cursor, "base64url")
    if (bytes.toString("base64url") !== cursor) return { ok: false }

    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    const payload = FamilyExperienceContinuationPayloadSchema.safeParse(JSON.parse(json))
    if (!payload.success) return { ok: false }

    const canonical = encodeFamilyExperienceCursor(payload.data.q, payload.data.offset)
    if (canonical !== cursor) return { ok: false }

    return {
      ok: true,
      continuation: {
        input: payload.data.q,
        offset: payload.data.offset,
      },
    }
  } catch {
    return { ok: false }
  }
}
