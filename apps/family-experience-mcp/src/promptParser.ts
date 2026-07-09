import {
  currentDateRange,
  lateMonthRange,
  monthDayRange,
  nextMonthRange,
  nextWeekendRange,
  thisWeekRange,
  tomorrowDateRange,
} from "./dateRange.js"
import { FindFamilyExperiencesInputSchema, type FindFamilyExperiencesInput } from "./schemas.js"
import type { IndoorOutdoor } from "./sources/types.js"

const locationMatchers = [
  { pattern: /서울/u, location: "Seoul" },
  { pattern: /부산/u, location: "Busan" },
  { pattern: /대구/u, location: "Daegu" },
  { pattern: /대전/u, location: "Daejeon" },
  { pattern: /광주/u, location: "Gwangju" },
  { pattern: /인천/u, location: "Incheon" },
  { pattern: /경기|경기도/u, location: "Gyeonggi" },
  { pattern: /강원/u, location: "Gangwon" },
  { pattern: /충청/u, location: "Chungcheong" },
  { pattern: /전라|전라도/u, location: "Jeolla" },
  { pattern: /경상|경상권/u, location: "Gyeongsang" },
  { pattern: /제주/u, location: "Jeju" },
  { pattern: /울산/u, location: "Ulsan" },
] as const

export type ParseLooseFamilyPromptResult =
  | { readonly ok: true; readonly input: FindFamilyExperiencesInput }
  | { readonly ok: false; readonly reason: "missing_child_selector" }

export type ParseLooseFamilyPromptDetailsResult =
  | {
      readonly ok: true
      readonly input: FindFamilyExperiencesInput & {
        readonly indoor_outdoor_preference?: IndoorOutdoor
        readonly keywords?: string[]
      }
      readonly assumptions: string[]
      readonly missing_fields: string[]
      readonly keywords: string[]
    }
  | { readonly ok: false; readonly reason: "missing_child_selector" }

export function parseLooseFamilyPrompt(prompt: string): ParseLooseFamilyPromptResult {
  const parsed = parseLooseFamilyPromptDetails(prompt)

  if (!parsed.ok) {
    return parsed
  }

  const input = {
    location: parsed.input.location,
    date_range: parsed.input.date_range,
    ...(parsed.input.child_age === undefined ? {} : { child_age: parsed.input.child_age }),
    ...(parsed.input.child_stage === undefined ? {} : { child_stage: parsed.input.child_stage }),
  }

  return { ok: true, input: FindFamilyExperiencesInputSchema.parse(input) }
}

export function parseLooseFamilyPromptDetails(prompt: string): ParseLooseFamilyPromptDetailsResult {
  const childAge = parseChildAge(prompt)
  const childStage = childAge === undefined ? parseChildStage(prompt) : undefined

  if (childAge === undefined && childStage === undefined) {
    return { ok: false, reason: "missing_child_selector" }
  }

  const keywords = parseKeywords(prompt)
  const indoorOutdoorPreference = parseIndoorOutdoorPreference(prompt)

  return {
    ok: true,
    input: {
      location: parseLocation(prompt),
      date_range: parseDateRange(prompt),
      ...(childAge === undefined ? {} : { child_age: childAge }),
      ...(childStage === undefined ? {} : { child_stage: childStage }),
      ...(indoorOutdoorPreference === undefined ? {} : { indoor_outdoor_preference: indoorOutdoorPreference }),
      ...(keywords.length === 0 ? {} : { keywords }),
    },
    assumptions: parseAssumptions(prompt),
    missing_fields: [],
    keywords,
  }
}

function parseChildAge(prompt: string): number | undefined {
  const monthMatch = /(\d{1,2})\s*개월/u.exec(prompt)
  if (monthMatch !== null) {
    const months = Number.parseInt(monthMatch[1] ?? "", 10)
    if (Number.isInteger(months) && months >= 0 && months <= 216) {
      return Math.floor(months / 12)
    }
  }

  const ageMatch = /(\d{1,2})\s*살/u.exec(prompt)
  const yearAgeMatch = ageMatch ?? /(\d{1,2})\s*세/u.exec(prompt)
  if (yearAgeMatch === null) {
    return undefined
  }

  const age = Number.parseInt(yearAgeMatch[1] ?? "", 10)
  return Number.isInteger(age) && age >= 0 && age <= 17 ? age : undefined
}

function parseChildStage(prompt: string): FindFamilyExperiencesInput["child_stage"] | undefined {
  if (/신생아|영아|아기|개월/u.test(prompt)) {
    return "infant"
  }

  if (/유아|미취학|어린이집/u.test(prompt)) {
    return "preschool"
  }

  if (/초등|초등학생|저학년/u.test(prompt)) {
    return "school_age"
  }

  if (/청소년|중학생|고등학생/u.test(prompt)) {
    return "teen"
  }

  return undefined
}

function parseLocation(prompt: string): string {
  for (const matcher of locationMatchers) {
    if (matcher.pattern.test(prompt)) {
      return matcher.location
    }
  }

  const district = /(중구|종로구|노원구)/u.exec(prompt)?.[1]
  if (district !== undefined) {
    switch (district) {
      case "중구":
        return "Jung-gu"
      case "종로구":
        return "Jongno-gu"
      case "노원구":
        return "Nowon-gu"
      default:
        return "Seoul"
    }
  }

  return "Seoul"
}

function parseDateRange(prompt: string): FindFamilyExperiencesInput["date_range"] {
  if (/오늘/u.test(prompt)) {
    return currentDateRange()
  }

  if (/내일/u.test(prompt)) {
    return tomorrowDateRange()
  }

  if (/주말/u.test(prompt)) {
    return nextWeekendRange()
  }

  if (/이번 주/u.test(prompt)) {
    return thisWeekRange()
  }

  if (/다음 달/u.test(prompt)) {
    return nextMonthRange()
  }

  if (/7월\s*말/u.test(prompt)) {
    return lateMonthRange(6)
  }

  const julyDate = /7월\s*(\d{1,2})\s*일?/u.exec(prompt)?.[1]
  if (julyDate !== undefined) {
    const day = Number.parseInt(julyDate, 10)
    if (Number.isInteger(day) && day >= 1 && day <= 31) {
      return monthDayRange(6, day)
    }
  }

  return nextWeekendRange()
}

function parseIndoorOutdoorPreference(prompt: string): IndoorOutdoor | undefined {
  if (/실내|비|우천|미술관|박물관|공연장/u.test(prompt)) {
    return "indoor"
  }

  if (/실외|야외|공원|숲|축제|운동장/u.test(prompt)) {
    return "outdoor"
  }

  return undefined
}

function parseKeywords(prompt: string): string[] {
  const keywordMatchers = [
    ["museum", /박물관|미술관|전시/u],
    ["performance", /공연|연극|뮤지컬/u],
    ["festival", /축제|행사/u],
    ["craft", /공예|만들기|체험/u],
    ["free", /무료/u],
    ["rainy_day", /비|우천/u],
  ] as const

  return keywordMatchers
    .filter(([, pattern]) => pattern.test(prompt))
    .map(([keyword]) => keyword)
}

function parseAssumptions(prompt: string): string[] {
  const assumptions: string[] = []

  if (!/(서울|부산|대구|대전|광주|인천|경기|강원|충청|전라|경상|제주|울산|중구|종로구|노원구)/u.test(prompt)) {
    assumptions.push("지역이 없으면 서울 기준으로 시작합니다.")
  }

  if (!/(오늘|내일|주말|이번 주|다음 달|7월)/u.test(prompt)) {
    assumptions.push("날짜가 없으면 가까운 주말 기준으로 시작합니다.")
  }

  return assumptions
}
