import * as z from "zod/v4"

import {
  FamilyExperienceCandidateSchema,
  FindFamilyExperiencesInputSchema,
} from "../src/schemas.js"

const locationAliasEntries = [
  ["seoul", ["서울"]],
  ["busan", ["부산"]],
  ["daegu", ["대구"]],
  ["daejeon", ["대전"]],
  ["gwangju", ["광주"]],
  ["incheon", ["인천"]],
  ["gyeonggi", ["경기", "경기도"]],
  ["gangwon", ["강원"]],
  ["chungcheong", ["충청"]],
  ["jeolla", ["전라", "전라도"]],
  ["gyeongsang", ["경상", "경상권"]],
  ["jeju", ["제주"]],
] as const

type EvalCandidate = z.infer<typeof FamilyExperienceCandidateSchema>

export function requestLocationRespected(
  request: unknown,
  candidates: readonly EvalCandidate[],
): boolean {
  const parsedRequest = FindFamilyExperiencesInputSchema.safeParse(request)
  if (!parsedRequest.success) {
    return false
  }

  const expected = parsedRequest.data.location.trim().toLowerCase()
  return candidates.every((candidate) => {
    const actual = candidate.location.trim().toLowerCase()
    return actual.includes(expected) || locationAliases(expected).some((alias) => actual.includes(alias))
  })
}

export function requestDateRangeRespected(
  request: unknown,
  candidates: readonly EvalCandidate[],
): boolean {
  const parsedRequest = FindFamilyExperiencesInputSchema.safeParse(request)
  if (!parsedRequest.success) {
    return false
  }

  return candidates.every(
    (candidate) =>
      candidate.starts_at <= parsedRequest.data.date_range.end &&
      candidate.ends_at >= parsedRequest.data.date_range.start,
  )
}

export function childSelectorRespected(
  request: unknown,
  candidates: readonly EvalCandidate[],
): boolean {
  const parsedRequest = FindFamilyExperiencesInputSchema.safeParse(request)
  if (!parsedRequest.success) {
    return false
  }

  if (parsedRequest.data.child_age !== undefined) {
    return candidates.every(
      (candidate) =>
        candidate.min_child_age !== undefined &&
        candidate.max_child_age !== undefined &&
        parsedRequest.data.child_age !== undefined &&
        parsedRequest.data.child_age >= candidate.min_child_age &&
        parsedRequest.data.child_age <= candidate.max_child_age,
    )
  }

  if (parsedRequest.data.child_stage !== undefined) {
    const childStage = parsedRequest.data.child_stage
    return candidates.every((candidate) => candidate.child_stages?.includes(childStage) === true)
  }

  return false
}

function locationAliases(location: string): readonly string[] {
  return locationAliasEntries.find(([key]) => key === location)?.[1] ?? []
}
