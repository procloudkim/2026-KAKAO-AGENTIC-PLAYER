import * as z from "zod/v4"

import { HttpUrlSchema } from "./httpUrl.js"

export const PLACE_EVIDENCE_STATUSES = [
  "source_backed",
  "kakao_place_matched",
  "ambiguous",
  "conflict",
  "unresolved",
] as const

export type PlaceEvidenceStatus = (typeof PLACE_EVIDENCE_STATUSES)[number]

export const NAVIGABLE_PLACE_EVIDENCE_STATUSES = [
  "source_backed",
  "kakao_place_matched",
] as const

export type NavigablePlaceEvidenceStatus =
  (typeof NAVIGABLE_PLACE_EVIDENCE_STATUSES)[number]

export const KAKAO_PLACE_RESOLUTION_STATUSES = [
  "kakao_place_matched",
  "ambiguous",
  "conflict",
  "unresolved",
] as const

const PlaceCoordinatesSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  })
  .strict()

export const PlaceResolutionRequestSchema = z
  .object({
    source_record_id: z.string().trim().min(1),
    source_name: z.string().trim().min(1),
    source_address: z.string().trim().min(1),
    source_coordinates: PlaceCoordinatesSchema,
  })
  .strict()

export type PlaceResolutionRequest = z.infer<typeof PlaceResolutionRequestSchema>

const MatchEvidenceSchema = z
  .object({
    candidate_count: z.number().int().min(0).max(45),
    name_similarity: z.number().min(0).max(1).nullable(),
    address_similarity: z.number().min(0).max(1).nullable(),
    distance_meters: z.number().min(0).nullable(),
    decision_reasons: z.array(z.string().trim().min(1)).max(8),
  })
  .strict()

export const KakaoPlaceUrlSchema = HttpUrlSchema.refine((value) => {
  const url = new URL(value)
  return (
    url.hostname.toLowerCase() === "place.map.kakao.com" &&
    url.username.length === 0 &&
    url.password.length === 0 &&
    url.search.length === 0 &&
    url.hash.length === 0 &&
    /^\/\d+\/?$/u.test(url.pathname)
  )
}, "Expected a Kakao place URL").transform((value) => {
  const url = new URL(value)
  url.protocol = "https:"
  return url.toString()
})

function kakaoPlaceIdFromUrl(value: string): string | undefined {
  const match = /^\/(\d+)\/?$/u.exec(new URL(value).pathname)
  return match?.[1]
}

export const TransientKakaoPlaceResolutionSchema = z
  .object({
    provider: z.literal("kakao_local"),
    status: z.enum(KAKAO_PLACE_RESOLUTION_STATUSES),
    place_id: z.string().trim().min(1).nullable(),
    place_url: KakaoPlaceUrlSchema.nullable(),
    canonical_name: z.string().trim().min(1).nullable(),
    canonical_address: z.string().trim().min(1).nullable(),
    matched_coordinates: PlaceCoordinatesSchema.nullable(),
    resolved_at: z.iso.datetime({ offset: true }),
    matcher_version: z.string().trim().min(1),
    match_evidence: MatchEvidenceSchema,
    confidence: z.number().min(0).max(1),
  })
  .strict()
  .superRefine((resolution, context) => {
    if (
      resolution.place_id !== null &&
      resolution.place_url !== null &&
      kakaoPlaceIdFromUrl(resolution.place_url) !== resolution.place_id
    ) {
      context.addIssue({
        code: "custom",
        message: "place_id must match the Kakao place URL path",
        path: ["place_url"],
      })
    }

    if (resolution.status !== "kakao_place_matched") return

    const requiredFields = [
      ["place_id", resolution.place_id],
      ["place_url", resolution.place_url],
      ["canonical_name", resolution.canonical_name],
      ["canonical_address", resolution.canonical_address],
      ["matched_coordinates", resolution.matched_coordinates],
    ] as const

    for (const [field, value] of requiredFields) {
      if (value === null) {
        context.addIssue({
          code: "custom",
          message: `${field} is required for kakao_place_matched`,
          path: [field],
        })
      }
    }

    if (resolution.match_evidence.candidate_count < 1) {
      context.addIssue({
        code: "custom",
        message: "matched resolution requires at least one candidate",
        path: ["match_evidence", "candidate_count"],
      })
    }

    for (const [field, value] of [
      ["name_similarity", resolution.match_evidence.name_similarity],
      ["address_similarity", resolution.match_evidence.address_similarity],
      ["distance_meters", resolution.match_evidence.distance_meters],
    ] as const) {
      if (value === null) {
        context.addIssue({
          code: "custom",
          message: `${field} is required for kakao_place_matched`,
          path: ["match_evidence", field],
        })
      }
    }

    if (resolution.confidence <= 0) {
      context.addIssue({
        code: "custom",
        message: "matched resolution requires positive confidence",
        path: ["confidence"],
      })
    }
  })

export type TransientKakaoPlaceResolution = z.infer<
  typeof TransientKakaoPlaceResolutionSchema
>

// Current Kakao policy evidence permits persisting a place ID and place URL only.
// This schema intentionally excludes every other Local API response or derived field.
export const PersistableKakaoPlaceReferenceSchema = z
  .object({
    provider: z.literal("kakao_local"),
    place_id: z.string().trim().min(1),
    place_url: KakaoPlaceUrlSchema,
  })
  .strict()
  .superRefine((reference, context) => {
    if (kakaoPlaceIdFromUrl(reference.place_url) !== reference.place_id) {
      context.addIssue({
        code: "custom",
        message: "place_id must match the Kakao place URL path",
        path: ["place_url"],
      })
    }
  })

export type PersistableKakaoPlaceReference = z.infer<
  typeof PersistableKakaoPlaceReferenceSchema
>

export function persistableKakaoReferenceFromResolution(
  value: unknown,
): PersistableKakaoPlaceReference | undefined {
  const parsed = TransientKakaoPlaceResolutionSchema.safeParse(value)
  if (
    !parsed.success ||
    parsed.data.status !== "kakao_place_matched" ||
    parsed.data.place_id === null ||
    parsed.data.place_url === null
  ) {
    return undefined
  }

  return PersistableKakaoPlaceReferenceSchema.parse({
    provider: parsed.data.provider,
    place_id: parsed.data.place_id,
    place_url: parsed.data.place_url,
  })
}

export type PlaceResolutionAdapter = {
  readonly provider: "kakao_local"
  readonly resolve: (
    request: PlaceResolutionRequest,
  ) => Promise<TransientKakaoPlaceResolution>
}
