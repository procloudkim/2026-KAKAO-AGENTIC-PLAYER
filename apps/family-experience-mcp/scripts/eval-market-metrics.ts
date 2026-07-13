import * as z from "zod/v4"

import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"
import type { Check } from "./eval-prompt-checks.js"
import { isSafeNoResultFailure } from "./eval-prompt-no-result.js"

type StructuredContent = z.infer<typeof FindFamilyExperiencesStructuredContentSchema>
type EvalCandidate = Extract<StructuredContent, { readonly ok: true }>["candidates"][number]
type CandidateStringField = keyof {
  readonly [TKey in keyof EvalCandidate as EvalCandidate[TKey] extends string ? TKey : never]: true
}
type FieldCompleteness = {
  readonly complete_candidate_count: number
  readonly candidate_count: number
  readonly missing_field_counts: Record<string, number>
}
type EvalFixtureForMarket = {
  readonly expect: "success" | "clarification" | "no_result"
}
export type MarketSurfaceMetrics = {
  readonly candidate_count: number
  readonly bounded_candidate_count: boolean
  readonly trust_field_completeness: FieldCompleteness
  readonly parent_decision_value: FieldCompleteness
  readonly unsupported_claim_absent: boolean
  readonly no_result_behavior: {
    readonly expected: boolean
    readonly passed: boolean | null
    readonly fabricated_candidate_count: number
  }
}
export type EvalResultForMarket = {
  readonly market: {
    readonly structured: MarketSurfaceMetrics
    readonly prompt_path: MarketSurfaceMetrics
  }
}

const maxParentDecisionCandidates = 3
const trustFieldNames = [
  "source_name",
  "retrieved_at",
  "confidence",
  "warnings",
  "source_summary",
] as const satisfies readonly CandidateStringField[]
const parentDecisionFieldNames = [
  "age_fit_reason",
  "date_time",
  "venue",
  "address",
  "fee_text",
  "parent_check",
  "next_action",
] as const satisfies readonly CandidateStringField[]

export function marketSurfaceMetrics(input: {
  readonly fixture: EvalFixtureForMarket
  readonly isError: boolean
  readonly structuredContent: unknown
  readonly checks: readonly Check[]
  readonly unsupportedClaimCheckName: string
}): MarketSurfaceMetrics {
  const parsed = FindFamilyExperiencesStructuredContentSchema.safeParse(input.structuredContent)
  const unsupportedClaimAbsent =
    input.checks.find((check) => check.name === input.unsupportedClaimCheckName)?.passed === true

  if (!parsed.success) {
    return emptyMarketSurfaceMetrics(input.fixture, unsupportedClaimAbsent)
  }

  if (parsed.data.ok !== true) {
    return {
      candidate_count: 0,
      bounded_candidate_count: true,
      trust_field_completeness: emptyFieldCompleteness(),
      parent_decision_value: emptyFieldCompleteness(),
      unsupported_claim_absent: unsupportedClaimAbsent,
      no_result_behavior: {
        expected: input.fixture.expect === "no_result",
        passed:
          input.fixture.expect === "no_result"
            ? input.isError && isSafeNoResultFailure(parsed.data.failure)
            : null,
        fabricated_candidate_count: 0,
      },
    }
  }

  return {
    candidate_count: parsed.data.candidates.length,
    bounded_candidate_count: parsed.data.candidates.length <= maxParentDecisionCandidates,
    trust_field_completeness: fieldCompleteness(parsed.data.candidates, trustFieldNames),
    parent_decision_value: fieldCompleteness(parsed.data.candidates, parentDecisionFieldNames),
    unsupported_claim_absent: unsupportedClaimAbsent,
    no_result_behavior: {
      expected: input.fixture.expect === "no_result",
      passed: input.fixture.expect === "no_result" ? false : null,
      fabricated_candidate_count: input.fixture.expect === "no_result" ? parsed.data.candidates.length : 0,
    },
  }
}

export function marketScenarioSummary(results: readonly EvalResultForMarket[]) {
  const surfaces = results.flatMap((result) => [result.market.structured, result.market.prompt_path])
  const totalCandidates = sum(surfaces.map((surface) => surface.candidate_count))
  const overLimitSurfaceCount = surfaces.filter((surface) => !surface.bounded_candidate_count).length
  const parentCompleteCandidates = sum(
    surfaces.map((surface) => surface.parent_decision_value.complete_candidate_count),
  )
  const trustCompleteCandidates = sum(
    surfaces.map((surface) => surface.trust_field_completeness.complete_candidate_count),
  )
  const unsupportedClaimFailureCount = surfaces.filter((surface) => !surface.unsupported_claim_absent).length
  const expectedNoResultSurfaces = surfaces.filter((surface) => surface.no_result_behavior.expected)
  const passedNoResultSurfaces = expectedNoResultSurfaces.filter(
    (surface) => surface.no_result_behavior.passed === true,
  ).length
  const fabricatedCandidateCount = sum(
    expectedNoResultSurfaces.map((surface) => surface.no_result_behavior.fabricated_candidate_count),
  )
  const candidateCountStatus = overLimitSurfaceCount === 0 ? "pass" : "fail"
  const parentDecisionStatus = parentCompleteCandidates === totalCandidates ? "pass" : "fail"
  const trustStatus = trustCompleteCandidates === totalCandidates ? "pass" : "fail"
  const unsupportedClaimStatus = unsupportedClaimFailureCount === 0 ? "pass" : "fail"
  const noResultStatus =
    expectedNoResultSurfaces.length > 0 &&
    passedNoResultSurfaces === expectedNoResultSurfaces.length &&
    fabricatedCandidateCount === 0
      ? "pass"
      : "fail"

  return {
    scenario_count: results.length,
    evaluated_surface_count: surfaces.length,
    candidate_count: {
      max_allowed_per_response: maxParentDecisionCandidates,
      maximum_observed: Math.max(...surfaces.map((surface) => surface.candidate_count)),
      over_limit_surface_count: overLimitSurfaceCount,
      total_candidates: totalCandidates,
      status: candidateCountStatus,
    },
    parent_decision_value: {
      complete_candidate_count: parentCompleteCandidates,
      candidate_count: totalCandidates,
      incomplete_candidate_count: totalCandidates - parentCompleteCandidates,
      status: parentDecisionStatus,
    },
    trust_field_completeness: {
      complete_candidate_count: trustCompleteCandidates,
      candidate_count: totalCandidates,
      incomplete_candidate_count: totalCandidates - trustCompleteCandidates,
      missing_field_counts: mergeMissingFieldCounts(
        surfaces.map((surface) => surface.trust_field_completeness.missing_field_counts),
      ),
      status: trustStatus,
    },
    unsupported_claim_absence: {
      checked_surface_count: surfaces.length,
      failure_count: unsupportedClaimFailureCount,
      status: unsupportedClaimStatus,
    },
    no_result_behavior: {
      expected_surface_count: expectedNoResultSurfaces.length,
      passed_surface_count: passedNoResultSurfaces,
      fabricated_candidate_count: fabricatedCandidateCount,
      status: noResultStatus,
    },
    scoring_policy: {
      answer_volume_score: "not_used" as const,
      bounded_candidate_count_required: true as const,
    },
    status:
      candidateCountStatus === "pass" &&
      parentDecisionStatus === "pass" &&
      trustStatus === "pass" &&
      unsupportedClaimStatus === "pass" &&
      noResultStatus === "pass"
        ? "pass"
        : "fail",
  }
}

function emptyMarketSurfaceMetrics(
  fixture: EvalFixtureForMarket,
  unsupportedClaimAbsent: boolean,
): MarketSurfaceMetrics {
  return {
    candidate_count: 0,
    bounded_candidate_count: true,
    trust_field_completeness: emptyFieldCompleteness(),
    parent_decision_value: emptyFieldCompleteness(),
    unsupported_claim_absent: unsupportedClaimAbsent,
    no_result_behavior: {
      expected: fixture.expect === "no_result",
      passed: fixture.expect === "no_result" ? false : null,
      fabricated_candidate_count: 0,
    },
  }
}

function fieldCompleteness(
  candidates: readonly EvalCandidate[],
  fieldNames: readonly CandidateStringField[],
): FieldCompleteness {
  const missingFieldCounts: Record<string, number> = Object.fromEntries(
    fieldNames.map((fieldName) => [fieldName, 0]),
  )
  let completeCandidateCount = 0

  for (const candidate of candidates) {
    const missingFields = fieldNames.filter((fieldName) => !isFilled(candidate[fieldName]))
    if (missingFields.length === 0) completeCandidateCount += 1
    for (const fieldName of missingFields) missingFieldCounts[fieldName] = (missingFieldCounts[fieldName] ?? 0) + 1
  }

  return {
    complete_candidate_count: completeCandidateCount,
    candidate_count: candidates.length,
    missing_field_counts: missingFieldCounts,
  }
}

function emptyFieldCompleteness(): FieldCompleteness {
  return { complete_candidate_count: 0, candidate_count: 0, missing_field_counts: {} }
}

function mergeMissingFieldCounts(counts: readonly Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {}
  for (const count of counts) {
    for (const [key, value] of Object.entries(count)) merged[key] = (merged[key] ?? 0) + value
  }
  return merged
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function isFilled(value: string): boolean {
  return value.trim().length > 0
}
