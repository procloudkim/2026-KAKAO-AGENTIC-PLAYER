import * as z from "zod/v4"

export const evalCoverageRegionValues = [
  "Seoul",
  "Busan",
  "Daegu",
  "Daejeon",
  "Gwangju",
  "Incheon",
  "Gyeonggi",
  "Gangwon",
  "Chungcheong",
  "Jeolla",
  "Gyeongsang",
  "Jeju",
] as const

const childStageValues = ["infant", "toddler", "preschool", "school_age"] as const
const feeValues = ["free", "paid"] as const
const environmentValues = ["indoor", "outdoor"] as const

export const EvalCoverageSchema = z
  .object({
    regions: z.array(z.enum(evalCoverageRegionValues)).min(1).optional(),
    child_stages: z.array(z.enum(childStageValues)).min(1).optional(),
    fee: z.enum(feeValues).optional(),
    environment: z.enum(environmentValues).optional(),
    no_result: z.boolean().optional(),
    unsupported_claim: z.boolean().optional(),
    prompt_injection: z.boolean().optional(),
  })
  .strict()

export type EvalCoverage = z.infer<typeof EvalCoverageSchema>
type Region = (typeof evalCoverageRegionValues)[number]
type ChildStage = (typeof childStageValues)[number]
type Fee = (typeof feeValues)[number]
type Environment = (typeof environmentValues)[number]

export type CoverageFixture = {
  readonly coverage?: EvalCoverage | undefined
  readonly expect: "success" | "clarification" | "no_result"
}

export type CoverageSummary = {
  readonly required: boolean
  readonly prompt_count_minimum: number | null
  readonly prompt_count_expected: number | null
  readonly region_counts: Record<Region, number>
  readonly child_stage_counts: Record<ChildStage, number>
  readonly fee_counts: Record<Fee, number>
  readonly environment_counts: Record<Environment, number>
  readonly no_result_count: number
  readonly unsupported_claim_prompt_count: number
  readonly prompt_injection_count: number
  readonly missing_buckets: readonly string[]
  readonly status: "pass" | "fail" | "not_required"
}

export function buildCoverageSummary(input: {
  readonly fixtures: readonly CoverageFixture[]
  readonly minPrompts?: number | undefined
  readonly expectedPrompts?: number | undefined
  readonly required: boolean
}): CoverageSummary {
  const regionCounts = emptyRegionCounts()
  const childStageCounts = emptyChildStageCounts()
  const feeCounts = emptyFeeCounts()
  const environmentCounts = emptyEnvironmentCounts()

  let noResultCount = 0
  let unsupportedClaimPromptCount = 0
  let promptInjectionCount = 0

  for (const fixture of input.fixtures) {
    for (const region of fixture.coverage?.regions ?? []) {
      regionCounts[region] += 1
    }
    for (const childStage of fixture.coverage?.child_stages ?? []) {
      childStageCounts[childStage] += 1
    }
    if (fixture.coverage?.fee !== undefined) {
      feeCounts[fixture.coverage.fee] += 1
    }
    if (fixture.coverage?.environment !== undefined) {
      environmentCounts[fixture.coverage.environment] += 1
    }
    if (fixture.expect === "no_result" || fixture.coverage?.no_result === true) {
      noResultCount += 1
    }
    if (fixture.coverage?.unsupported_claim === true) {
      unsupportedClaimPromptCount += 1
    }
    if (fixture.coverage?.prompt_injection === true) {
      promptInjectionCount += 1
    }
  }

  const missingBuckets = input.required
    ? missingCoverageBuckets({
        fixtureCount: input.fixtures.length,
        minPrompts: input.minPrompts,
        expectedPrompts: input.expectedPrompts,
        regionCounts,
        childStageCounts,
        feeCounts,
        environmentCounts,
        noResultCount,
        unsupportedClaimPromptCount,
        promptInjectionCount,
      })
    : []

  return {
    required: input.required,
    prompt_count_minimum: input.minPrompts ?? null,
    prompt_count_expected: input.expectedPrompts ?? null,
    region_counts: regionCounts,
    child_stage_counts: childStageCounts,
    fee_counts: feeCounts,
    environment_counts: environmentCounts,
    no_result_count: noResultCount,
    unsupported_claim_prompt_count: unsupportedClaimPromptCount,
    prompt_injection_count: promptInjectionCount,
    missing_buckets: missingBuckets,
    status: input.required ? (missingBuckets.length === 0 ? "pass" : "fail") : "not_required",
  }
}

function missingCoverageBuckets(input: {
  readonly fixtureCount: number
  readonly minPrompts: number | undefined
  readonly expectedPrompts: number | undefined
  readonly regionCounts: Record<Region, number>
  readonly childStageCounts: Record<ChildStage, number>
  readonly feeCounts: Record<Fee, number>
  readonly environmentCounts: Record<Environment, number>
  readonly noResultCount: number
  readonly unsupportedClaimPromptCount: number
  readonly promptInjectionCount: number
}): readonly string[] {
  const missing: string[] = []
  if (input.minPrompts !== undefined && input.fixtureCount < input.minPrompts) {
    missing.push(`prompt_count>=${input.minPrompts}`)
  }
  if (input.expectedPrompts !== undefined && input.fixtureCount !== input.expectedPrompts) {
    missing.push(`prompt_count=${input.expectedPrompts}`)
  }
  missing.push(...missingKeys("region", input.regionCounts))
  missing.push(...missingKeys("child_stage", input.childStageCounts))
  missing.push(...missingKeys("fee", input.feeCounts))
  missing.push(...missingKeys("environment", input.environmentCounts))
  if (input.noResultCount === 0) {
    missing.push("no_result")
  }
  if (input.unsupportedClaimPromptCount === 0) {
    missing.push("unsupported_claim")
  }
  if (input.promptInjectionCount === 0) {
    missing.push("prompt_injection")
  }
  return missing
}

function emptyRegionCounts(): Record<Region, number> {
  return {
    Seoul: 0,
    Busan: 0,
    Daegu: 0,
    Daejeon: 0,
    Gwangju: 0,
    Incheon: 0,
    Gyeonggi: 0,
    Gangwon: 0,
    Chungcheong: 0,
    Jeolla: 0,
    Gyeongsang: 0,
    Jeju: 0,
  }
}

function emptyChildStageCounts(): Record<ChildStage, number> {
  return {
    infant: 0,
    toddler: 0,
    preschool: 0,
    school_age: 0,
  }
}

function emptyFeeCounts(): Record<Fee, number> {
  return {
    free: 0,
    paid: 0,
  }
}

function emptyEnvironmentCounts(): Record<Environment, number> {
  return {
    indoor: 0,
    outdoor: 0,
  }
}

function missingKeys<TKey extends string>(
  bucket: string,
  counts: Record<TKey, number>,
): readonly string[] {
  return Object.entries(counts)
    .filter(([, count]) => count === 0)
    .map(([key]) => `${bucket}:${key}`)
}
