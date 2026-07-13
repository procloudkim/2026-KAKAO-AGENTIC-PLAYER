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

const koreanGradeRangeHints: readonly KoreanAgeRangeHint[] = [
  { pattern: /(?:\ucd08\ub4f1\ud559\uad50|\ucd08\ub4f1)\s*\d+\s*(?:[~-]\s*\d+\s*)?\ud559\ub144/, range: { min: 7, max: 12 } },
  { pattern: /(?:\uc911\ud559\uad50|\uc911)\s*\d+\s*(?:[~-]\s*\d+\s*)?\ud559\ub144/, range: { min: 13, max: 15 } },
  { pattern: /(?:\uace0\ub4f1\ud559\uad50|\uace0\ub4f1|\uace0)\s*\d+\s*(?:[~-]\s*\d+\s*)?\ud559\ub144/, range: { min: 16, max: childAgeMax } },
] as const

const koreanAgeRangeHints: readonly KoreanAgeRangeHint[] = [
  { pattern: /\ucd08\ub4f1\ud559\uc0dd|\ucd08\ub4f1\uc0dd/, range: { min: 7, max: childAgeMax } },
  { pattern: /\uc911\ud559\uc0dd|\uccad\uc18c\ub144/, range: { min: 13, max: childAgeMax } },
  { pattern: /\uace0\ub4f1\ud559\uc0dd/, range: { min: 16, max: childAgeMax } },
]

export function parseSeoulAgeTarget(text: string): AgeRange | undefined {
  const normalized = text.normalize("NFKC").replace(/\s+/gu, " ").trim()
  if (normalized.includes("\uc804\uccb4") || /\uc804\s*\uc5f0\ub839/u.test(normalized)) {
    return { min: childAgeMin, max: childAgeMax }
  }

  const yearRange = parseKoreanYearRange(normalized)
  if (yearRange !== undefined) {
    return yearRange
  }

  const monthRange = parseKoreanMonthRange(normalized)
  if (monthRange !== undefined) {
    return monthRange
  }

  const englishRange = parseEnglishAgeRange(normalized)
  if (englishRange !== undefined) {
    return englishRange
  }

  const gradeRange = koreanGradeRangeHints.find((hint) => hint.pattern.test(normalized))?.range
  if (gradeRange !== undefined) {
    return gradeRange
  }
  const hintedRange = koreanAgeRangeHints.find((hint) => hint.pattern.test(normalized))?.range
  if (hintedRange !== undefined) {
    return hintedRange
  }

  return undefined
}

function parseKoreanYearRange(text: string): AgeRange | undefined {
  const bounded = /(?:\ub9cc\s*)?(\d{1,2})\s*\uc138\s*(?:\uc774\uc0c1|\ubd80\ud130)\s*(?:,|~|-|\ubd80\ud130|\uc774\uba70|\ud558\uace0|\s)*\s*(?:\ub9cc\s*)?(\d{1,2})\s*\uc138\s*(?:\uc774\ud558|\uae4c\uc9c0)/u.exec(text)
  if (bounded !== null) {
    return clampAgeRange(numberAt(bounded, 1), numberAt(bounded, 2))
  }

  const range = /(?:\ub9cc\s*)?(\d{1,2})\s*\uc138?\s*(?:~|\u223c|\u301c|-|\u2013|\u2014|\ubd80\ud130)\s*(?:\ub9cc\s*)?(\d{1,2})\s*\uc138/u.exec(text)
  if (range !== null) {
    return clampAgeRange(numberAt(range, 1), numberAt(range, 2))
  }

  const boundary = /(?:\ub9cc\s*)?(\d{1,2})\s*\uc138\s*(\uc774\uc0c1|\uc774\ud558|\ubbf8\ub9cc|\ucd08\uacfc)/u.exec(text)
  if (boundary !== null) {
    const age = numberAt(boundary, 1)
    switch (boundary[2]) {
      case "\uc774\uc0c1": return clampAgeRange(age, childAgeMax)
      case "\uc774\ud558": return clampAgeRange(childAgeMin, age)
      case "\ubbf8\ub9cc": return clampAgeRange(childAgeMin, age - 1)
      case "\ucd08\uacfc": return clampAgeRange(age + 1, childAgeMax)
      default: return undefined
    }
  }

  if (/\uac1c\uc6d4/u.test(text)) {
    return undefined
  }
  const single = /(?:^|[^\d])(?:\ub9cc\s*)?(\d{1,2})\s*\uc138(?:\s*(?:\uc544\ub3d9|\uc5b4\ub9b0\uc774))?(?:$|[^\d])/u.exec(text)
  return single === null ? undefined : clampAgeRange(numberAt(single, 1), numberAt(single, 1))
}

function parseKoreanMonthRange(text: string): AgeRange | undefined {
  const range = /(\d{1,3})\s*\uac1c\uc6d4\s*(?:~|\u223c|\u301c|-|\u2013|\u2014|\ubd80\ud130)\s*(\d{1,3})\s*\uac1c\uc6d4/u.exec(text)
  if (range !== null) {
    const minMonths = numberAt(range, 1)
    const maxMonths = numberAt(range, 2)
    return minMonths > maxMonths
      ? undefined
      : clampAgeRange(Math.ceil(minMonths / 12), Math.floor((maxMonths + 1) / 12) - 1)
  }

  const boundary = /(\d{1,3})\s*\uac1c\uc6d4\s*(\uc774\uc0c1|\uc774\ud558|\ubbf8\ub9cc|\ucd08\uacfc)/u.exec(text)
  if (boundary === null) {
    return undefined
  }
  const months = numberAt(boundary, 1)
  switch (boundary[2]) {
    case "\uc774\uc0c1": return clampAgeRange(Math.ceil(months / 12), childAgeMax)
    case "\uc774\ud558": return clampAgeRange(childAgeMin, Math.floor((months + 1) / 12) - 1)
    case "\ubbf8\ub9cc": return clampAgeRange(childAgeMin, Math.floor(months / 12) - 1)
    case "\ucd08\uacfc": return clampAgeRange(Math.floor(months / 12) + 1, childAgeMax)
    default: return undefined
  }
}

function parseEnglishAgeRange(text: string): AgeRange | undefined {
  const range = /(?:ages?\s+(\d{1,2})\s*(?:~|-|to)\s*(\d{1,2})|(\d{1,2})\s*(?:~|-|to)\s*(\d{1,2})\s*years?(?:\s*old)?)/iu.exec(text)
  if (range !== null) {
    return clampAgeRange(
      Number.parseInt(range[1] ?? range[3] ?? "", 10),
      Number.parseInt(range[2] ?? range[4] ?? "", 10),
    )
  }
  const minimum = /(?:ages?\s+(\d{1,2})\s*(?:and\s+older|and\s+up|or\s+older|\+)|(\d{1,2})\s*years?\s*(?:and\s+older|and\s+up|or\s+older|\+))/iu.exec(text)
  if (minimum !== null) {
    return clampAgeRange(Number.parseInt(minimum[1] ?? minimum[2] ?? "", 10), childAgeMax)
  }
  const maximum = /(?:under\s+(\d{1,2})|(?:ages?\s*)?(\d{1,2})\s*(?:years?\s*)?(?:and\s+younger|or\s+younger))/iu.exec(text)
  if (maximum !== null) {
    const underAge = maximum[1]
    const inclusiveAge = maximum[2]
    return underAge === undefined
      ? clampAgeRange(childAgeMin, Number.parseInt(inclusiveAge ?? "", 10))
      : clampAgeRange(childAgeMin, Number.parseInt(underAge, 10) - 1)
  }
  return undefined
}

function clampAgeRange(rawMin: number, rawMax: number): AgeRange | undefined {
  const min = Math.max(childAgeMin, rawMin)
  const max = Math.min(childAgeMax, rawMax)
  return Number.isInteger(rawMin) && Number.isInteger(rawMax) && min <= max ? { min, max } : undefined
}

function numberAt(match: RegExpExecArray, index: number): number {
  return Number.parseInt(match[index] ?? "", 10)
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
