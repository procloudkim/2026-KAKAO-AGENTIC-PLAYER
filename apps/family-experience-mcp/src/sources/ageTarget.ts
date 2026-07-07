import type { ChildStage } from "../types.js"

export type AgeRange = { readonly min: number; readonly max: number }

type KoreanAgeRangeHint = { readonly pattern: RegExp; readonly range: AgeRange }

const childAgeMin = 0
const childAgeMax = 17
const stages = [
  ["infant", 0, 1],
  ["toddler", 1, 3],
  ["preschool", 3, 6],
  ["school_age", 6, 12],
  ["teen", 13, 17],
] as const satisfies readonly (readonly [ChildStage, number, number])[]

const koreanAgeRangeHints: readonly KoreanAgeRangeHint[] = [
  { pattern: /\ucd08\ub4f1\ud559\uc0dd|\ucd08\ub4f1\uc0dd/, range: { min: 7, max: childAgeMax } },
  { pattern: /\uc911\ud559\uc0dd|\uccad\uc18c\ub144/, range: { min: 13, max: childAgeMax } },
  { pattern: /\uace0\ub4f1\ud559\uc0dd/, range: { min: 16, max: childAgeMax } },
]

export function parseSeoulAgeTarget(text: string): AgeRange | undefined {
  if (text.includes("\uc804\uccb4")) {
    return { min: childAgeMin, max: childAgeMax }
  }
  const hintedRange = koreanAgeRangeHints.find((hint) => hint.pattern.test(text))?.range
  if (hintedRange !== undefined) {
    return hintedRange
  }
  const firstAge = text.match(/\d+/g)?.map(Number).at(0)
  if (firstAge === undefined) {
    return undefined
  }
  const rawRange = text.includes("\uc774\uc0c1") ? { min: firstAge, max: Number.POSITIVE_INFINITY } : { min: firstAge, max: firstAge }
  const min = Math.max(childAgeMin, rawRange.min)
  const max = Math.min(childAgeMax, rawRange.max)
  return min <= max ? { min, max } : undefined
}

export function stagesForAgeRange(ageRange: AgeRange): readonly ChildStage[] {
  return stages.filter((stage) => ageRange.min <= stage[2] && ageRange.max >= stage[1]).map((stage) => stage[0])
}

export function ageRangeMatchesChildAge(ageRange: AgeRange, childAge: number | undefined): boolean {
  if (childAge === undefined) {
    return true
  }
  return ageRange.min <= childAge && ageRange.max >= childAge
}

export function stagesMatchChildStage(recordStages: readonly ChildStage[], childStage: ChildStage | undefined): boolean {
  return childStage === undefined || recordStages.includes(childStage)
}
