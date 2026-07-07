import type { FindFamilyExperiencesInput } from "./schemas.js"

const defaultWeekendRange = { start: "2026-07-04", end: "2026-07-05" } as const
const defaultTodayRange = { start: "2026-07-04", end: "2026-07-04" } as const
const defaultThisWeekRange = { start: "2026-07-04", end: "2026-07-10" } as const
const defaultNextMonthRange = { start: "2026-08-01", end: "2026-08-02" } as const
const defaultLateJulyRange = { start: "2026-07-30", end: "2026-07-31" } as const
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

export function parseLooseFamilyPrompt(prompt: string): ParseLooseFamilyPromptResult {
  const childAge = parseChildAge(prompt)
  const childStage = childAge === undefined ? parseChildStage(prompt) : undefined

  if (childAge === undefined && childStage === undefined) {
    return { ok: false, reason: "missing_child_selector" }
  }

  return {
    ok: true,
    input: {
      location: parseLocation(prompt),
      date_range: parseDateRange(prompt),
      ...(childAge === undefined ? {} : { child_age: childAge }),
      ...(childStage === undefined ? {} : { child_stage: childStage }),
    },
  }
}

function parseChildAge(prompt: string): number | undefined {
  const ageMatch = /(\d{1,2})\s*살/u.exec(prompt)
  if (ageMatch === null) {
    return undefined
  }

  const age = Number.parseInt(ageMatch[1] ?? "", 10)
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
    return defaultTodayRange
  }

  if (/이번 주/u.test(prompt)) {
    return defaultThisWeekRange
  }

  if (/다음 달/u.test(prompt)) {
    return defaultNextMonthRange
  }

  if (/7월\s*말/u.test(prompt)) {
    return defaultLateJulyRange
  }

  const julyDate = /7월\s*(\d{1,2})\s*일?/u.exec(prompt)?.[1]
  if (julyDate !== undefined) {
    const day = Number.parseInt(julyDate, 10)
    if (Number.isInteger(day) && day >= 1 && day <= 31) {
      const date = `2026-07-${day.toString().padStart(2, "0")}`
      return { start: date, end: date }
    }
  }

  return defaultWeekendRange
}
