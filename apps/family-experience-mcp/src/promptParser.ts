import {
  currentDateRange,
  lateMonthRange,
  monthDayRange,
  nextMonthRange,
  nextWeekendRange,
  thisWeekRange,
  tomorrowDateRange,
  yearMonthDayRange,
} from "./dateRange.js"
import { seoulDistrictsInText } from "./location.js"
import { FindFamilyExperiencesInputSchema, type FindFamilyExperiencesInput } from "./schemas.js"
import type { IndoorOutdoor } from "./sources/types.js"

const locationMatchers = [
  { pattern: /서울|\bseoul\b/iu, location: "Seoul" },
  { pattern: /부산|\bbusan\b/iu, location: "Busan" },
  { pattern: /대구|\bdaegu\b/iu, location: "Daegu" },
  { pattern: /대전|\bdaejeon\b/iu, location: "Daejeon" },
  { pattern: /광주|\bgwangju\b/iu, location: "Gwangju" },
  { pattern: /인천|\bincheon\b/iu, location: "Incheon" },
  { pattern: /울산|\bulsan\b/iu, location: "Ulsan" },
  { pattern: /세종|\bsejong\b/iu, location: "Sejong" },
  { pattern: /경기도|경기|\bgyeonggi\b/iu, location: "Gyeonggi" },
  { pattern: /강원|\bgangwon\b/iu, location: "Gangwon" },
  { pattern: /충청북도|충북|\bchungbuk\b/iu, location: "Chungbuk" },
  { pattern: /충청남도|충남|\bchungnam\b/iu, location: "Chungnam" },
  { pattern: /충청|\bchungcheong\b/iu, location: "Chungcheong" },
  { pattern: /전북특별자치도|전라북도|전북|\bjeonbuk\b/iu, location: "Jeonbuk" },
  { pattern: /전남광주통합특별시|전라남도|전남|\bjeonnam\b/iu, location: "Jeonnam" },
  { pattern: /전라도|전라|\bjeolla\b/iu, location: "Jeolla" },
  { pattern: /경상북도|경북|\bgyeongbuk\b/iu, location: "Gyeongbuk" },
  { pattern: /경상남도|경남|\bgyeongnam\b/iu, location: "Gyeongnam" },
  { pattern: /경상권|경상|\bgyeongsang\b/iu, location: "Gyeongsang" },
  { pattern: /제주|\bjeju\b/iu, location: "Jeju" },
] as const

type ParseChildAgeResult =
  | { readonly status: "absent" }
  | { readonly status: "ambiguous" }
  | { readonly status: "invalid" }
  | { readonly status: "valid"; readonly age: number }

type ParseChildStageResult =
  | { readonly status: "absent" }
  | { readonly status: "ambiguous" }
  | { readonly status: "valid"; readonly stage: NonNullable<FindFamilyExperiencesInput["child_stage"]> }

type ParseLocationResult =
  | { readonly status: "absent" }
  | { readonly status: "ambiguous" }
  | { readonly status: "valid"; readonly location: string }

type ParseDateRangeResult =
  | { readonly status: "absent" }
  | { readonly status: "ambiguous" }
  | { readonly status: "valid"; readonly dateRange: FindFamilyExperiencesInput["date_range"] }

type LoosePromptFailureReason =
  | "ambiguous_child_selector"
  | "ambiguous_date"
  | "ambiguous_location"
  | "invalid_child_age"
  | "missing_child_selector"
  | "missing_fields"

export type ParseLooseFamilyPromptResult =
  | { readonly ok: true; readonly input: FindFamilyExperiencesInput }
  | {
      readonly ok: false
      readonly reason: LoosePromptFailureReason
      readonly missing_fields?: readonly string[]
    }

export type ParseLooseFamilyPromptDetailsResult =
  | {
      readonly ok: true
      readonly input: FindFamilyExperiencesInput & {
        readonly indoor_outdoor_preference?: IndoorOutdoor
        readonly time_of_day?: FindFamilyExperiencesInput["time_of_day"]
        readonly keywords?: string[]
      }
      readonly assumptions: string[]
      readonly missing_fields: string[]
      readonly keywords: string[]
    }
  | {
      readonly ok: false
      readonly reason: LoosePromptFailureReason
      readonly missing_fields?: readonly string[]
    }

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
    ...(parsed.input.time_of_day === undefined ? {} : { time_of_day: parsed.input.time_of_day }),
    ...(parsed.input.indoor_outdoor_preference === undefined
      ? {}
      : { indoor_outdoor_preference: parsed.input.indoor_outdoor_preference }),
    ...(parsed.input.keywords === undefined ? {} : { keywords: parsed.input.keywords }),
  }

  return { ok: true, input: FindFamilyExperiencesInputSchema.parse(input) }
}

export function parseLooseFamilyPromptDetails(prompt: string): ParseLooseFamilyPromptDetailsResult {
  const normalizedPrompt = prompt.normalize("NFKC")
  const locationResult = parseLocation(normalizedPrompt)
  const dateRangeResult = parseDateRange(normalizedPrompt)
  const childAge = parseChildAge(normalizedPrompt)
  const childStage = parseChildStage(normalizedPrompt)

  if (locationResult.status === "ambiguous") {
    return { ok: false, reason: "ambiguous_location" }
  }
  if (dateRangeResult.status === "ambiguous") {
    return { ok: false, reason: "ambiguous_date" }
  }
  if (childAge.status === "invalid") {
    return { ok: false, reason: "invalid_child_age" }
  }
  if (childAge.status === "ambiguous" || (childAge.status === "absent" && childStage.status === "ambiguous")) {
    return { ok: false, reason: "ambiguous_child_selector" }
  }
  if (
    childAge.status === "valid" &&
    childStage.status !== "absent" &&
    /둘\s*다|동시|\bboth\b/iu.test(normalizedPrompt)
  ) {
    return { ok: false, reason: "ambiguous_child_selector" }
  }

  const location = locationResult.status === "valid" ? locationResult.location : undefined
  const dateRange = dateRangeResult.status === "valid" ? dateRangeResult.dateRange : undefined
  const selectedChildStage = childAge.status === "absent" && childStage.status === "valid"
    ? childStage.stage
    : undefined
  const missingFields = [
    ...(location === undefined ? ["location"] : []),
    ...(dateRange === undefined ? ["date_range"] : []),
    ...(childAge.status === "absent" && selectedChildStage === undefined ? ["child_selector"] : []),
  ]
  if (
    location === undefined ||
    dateRange === undefined ||
    (childAge.status === "absent" && selectedChildStage === undefined)
  ) {
    return { ok: false, reason: "missing_fields", missing_fields: missingFields }
  }

  const keywords = parseKeywords(normalizedPrompt)
  const indoorOutdoorPreference = parseIndoorOutdoorPreference(normalizedPrompt)
  const timeOfDay = parseTimeOfDay(normalizedPrompt)

  return {
    ok: true,
    input: {
      location,
      date_range: dateRange,
      ...(childAge.status === "valid" ? { child_age: childAge.age } : {}),
      ...(selectedChildStage === undefined ? {} : { child_stage: selectedChildStage }),
      ...(timeOfDay === undefined ? {} : { time_of_day: timeOfDay }),
      ...(indoorOutdoorPreference === undefined ? {} : { indoor_outdoor_preference: indoorOutdoorPreference }),
      ...(keywords.length === 0 ? {} : { keywords }),
    },
    assumptions: parseAssumptions(normalizedPrompt),
    missing_fields: [],
    keywords,
  }
}

function parseTimeOfDay(prompt: string): FindFamilyExperiencesInput["time_of_day"] | undefined {
  if (/오전|아침|morning/iu.test(prompt)) {
    return "morning"
  }

  if (/오후|낮|afternoon/iu.test(prompt)) {
    return "afternoon"
  }

  if (/저녁|밤|야간|evening|night/iu.test(prompt)) {
    return "evening"
  }

  return undefined
}

function parseChildAge(prompt: string): ParseChildAgeResult {
  const ages: number[] = []
  let invalid = false
  for (const match of prompt.matchAll(/(?<![\d.])(-?\d+(?:\.\d+)?)\s*개월/gu)) {
    const months = Number(match[1])
    if (!Number.isSafeInteger(months) || months < 0 || months > 215) invalid = true
    else ages.push(Math.floor(months / 12))
  }
  for (const match of prompt.matchAll(/(?<![\d.])(?:만\s*)?(-?\d+(?:\.\d+)?)\s*(?:살|세)/gu)) {
    const age = Number(match[1])
    if (!Number.isSafeInteger(age) || age < 0 || age > 17) invalid = true
    else ages.push(age)
  }
  if (invalid) return { status: "invalid" }
  const uniqueAges = [...new Set(ages)]
  if (uniqueAges.length === 0) return { status: "absent" }
  if (uniqueAges.length > 1) return { status: "ambiguous" }
  return { status: "valid", age: uniqueAges[0] ?? 0 }
}

function parseChildStage(prompt: string): ParseChildStageResult {
  const stages = [
    ["infant", /신생아|영아|아기/u],
    ["toddler", /걸음마|토들러/iu],
    ["preschool", /유아|미취학|어린이집/u],
    ["school_age", /초등|초등학생|저학년/u],
    ["teen", /청소년|중학생|고등학생/u],
  ] as const satisfies readonly (readonly [NonNullable<FindFamilyExperiencesInput["child_stage"]>, RegExp])[]
  const matches = stages.filter(([, pattern]) => pattern.test(prompt)).map(([stage]) => stage)
  if (matches.length === 0) return { status: "absent" }
  if (matches.length > 1) return { status: "ambiguous" }
  return { status: "valid", stage: matches[0] ?? "infant" }
}

function parseLocation(prompt: string): ParseLocationResult {
  const mergedProvince = /전남광주통합특별시(?:\s+([^\s]+))?/u.exec(prompt)
  if (mergedProvince !== null) {
    const administrativeUnit = mergedProvince[1]
    return {
      status: "valid",
      location: administrativeUnit !== undefined && ["동구", "서구", "남구", "북구", "광산구"].includes(administrativeUnit)
        ? "Gwangju"
        : "Jeonnam",
    }
  }

  const districts = [...new Set(seoulDistrictsInText(prompt))]
  if (districts.length > 1) return { status: "ambiguous" }

  const regions = reduceBroadRegionParents(
    [...new Set(locationMatchers.filter(({ pattern }) => pattern.test(prompt)).map(({ location }) => location))],
  )
  if (districts.length === 1) {
    return regions.some((region) => region !== "Seoul")
      ? { status: "ambiguous" }
      : { status: "valid", location: districts[0] ?? "Seoul" }
  }
  if (regions.length === 0) return { status: "absent" }
  if (regions.length > 1) return { status: "ambiguous" }
  return { status: "valid", location: regions[0] ?? "Seoul" }
}

function parseDateRange(prompt: string): ParseDateRangeResult {
  const normalized = prompt.normalize("NFKC")
  const fullDateTokens = [
    ...[...normalized.matchAll(/(?<!\d)(\d{4}|\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/gu)]
      .map((match) => dateToken(match, dateRangeFromParts(match[1], match[2], match[3]))),
    ...[...normalized.matchAll(/(?<!\d)(\d{4}|\d{2})\s*([./-])\s*(\d{1,2})\s*\2\s*(\d{1,2})(?!\d)/gu)]
      .map((match) => dateToken(match, dateRangeFromParts(match[1], match[3], match[4]))),
  ]
  if (fullDateTokens.length > 0) {
    return explicitDateTokenResult(normalized, fullDateTokens)
  }

  const monthDayTokens = [
    ...[...normalized.matchAll(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/gu)]
      .map((match) => dateToken(match, monthDayRange(numberAt(match, 1) - 1, numberAt(match, 2)))),
    ...[...normalized.matchAll(/(?<![\d./])(\d{1,2})\s*([./])\s*(\d{1,2})(?!\s*\2\s*\d)/gu)]
      .map((match) => dateToken(match, monthDayRange(numberAt(match, 1) - 1, numberAt(match, 3)))),
  ]
  if (monthDayTokens.length > 0) {
    return explicitDateTokenResult(normalized, monthDayTokens)
  }

  const relativeRanges = [
    ...(/오늘/u.test(normalized) ? [currentDateRange()] : []),
    ...(/내일/u.test(normalized) ? [tomorrowDateRange()] : []),
    ...(/주말/u.test(normalized) ? [nextWeekendRange()] : []),
    ...(/이번 주/u.test(normalized) && !/이번 주말/u.test(normalized) ? [thisWeekRange()] : []),
    ...(/다음 달/u.test(normalized) ? [nextMonthRange()] : []),
    ...(/7월\s*말/u.test(normalized) ? [lateMonthRange(6)] : []),
  ]
  return relativeRanges.length === 0 ? { status: "absent" } : uniqueDateRangeResult(relativeRanges)
}

type ParsedRegionLocation = (typeof locationMatchers)[number]["location"]

function reduceBroadRegionParents(
  regions: readonly ParsedRegionLocation[],
): readonly ParsedRegionLocation[] {
  const reduced = new Set(regions)
  if (reduced.has("Chungbuk") || reduced.has("Chungnam")) reduced.delete("Chungcheong")
  if (reduced.has("Jeonbuk") || reduced.has("Jeonnam")) reduced.delete("Jeolla")
  if (reduced.has("Gyeongbuk") || reduced.has("Gyeongnam")) reduced.delete("Gyeongsang")
  return [...reduced]
}

function dateRangeFromParts(
  yearText: string | undefined,
  monthText: string | undefined,
  dayText: string | undefined,
): FindFamilyExperiencesInput["date_range"] | undefined {
  const parsedYear = Number.parseInt(yearText ?? "", 10)
  const year = yearText?.length === 2 ? 2_000 + parsedYear : parsedYear
  return yearMonthDayRange(
    year,
    Number.parseInt(monthText ?? "", 10) - 1,
    Number.parseInt(dayText ?? "", 10),
  )
}

type ParsedDateToken = {
  readonly end: number
  readonly index: number
  readonly range: FindFamilyExperiencesInput["date_range"] | undefined
}

function dateToken(
  match: RegExpMatchArray,
  range: FindFamilyExperiencesInput["date_range"] | undefined,
): ParsedDateToken {
  const index = match.index ?? 0
  return { index, end: index + match[0].length, range }
}

function explicitDateTokenResult(
  prompt: string,
  tokens: readonly ParsedDateToken[],
): ParseDateRangeResult {
  const sorted = [...tokens].sort((left, right) => left.index - right.index)
  if (sorted.some((token) => token.range === undefined)) return { status: "absent" }
  const first = sorted[0]
  if (first?.range === undefined) return { status: "absent" }
  if (sorted.length === 1) return { status: "valid", dateRange: first.range }
  const second = sorted[1]
  if (sorted.length !== 2 || second?.range === undefined) return { status: "ambiguous" }

  const delimiter = prompt.slice(first.end, second.index)
  if (!/^\s*(?:~|∼|〜|부터|–|—)\s*$/u.test(delimiter)) return { status: "ambiguous" }
  if (second.range.end < first.range.start) return { status: "absent" }
  return {
    status: "valid",
    dateRange: { start: first.range.start, end: second.range.end },
  }
}

function uniqueDateRangeResult(
  ranges: readonly FindFamilyExperiencesInput["date_range"][],
): ParseDateRangeResult {
  const unique = [...new Map(ranges.map((range) => [`${range.start}:${range.end}`, range])).values()]
  const only = unique[0]
  if (only === undefined) return { status: "absent" }
  if (unique.length > 1) return { status: "ambiguous" }
  return { status: "valid", dateRange: only }
}

function numberAt(match: RegExpMatchArray, index: number): number {
  return Number.parseInt(match[index] ?? "", 10)
}

function parseIndoorOutdoorPreference(prompt: string): IndoorOutdoor | undefined {
  if (/실내|비|우천|미술관|박물관|공연장/u.test(prompt)) {
    return "indoor"
  }

  if (/실외|야외|공원|숲|운동장/u.test(prompt)) {
    return "outdoor"
  }

  return undefined
}

function parseKeywords(prompt: string): string[] {
  const keywordMatchers = [
    ["museum", /박물관|미술관|전시/u],
    ["performance", /공연|연극|뮤지컬/u],
    ["festival", /축제|행사/u],
    ["craft", /공예|만들기/u],
    ["free", /무료/u],
    ["rainy_day", /비|우천/u],
  ] as const

  return keywordMatchers
    .filter(([, pattern]) => pattern.test(prompt))
    .map(([keyword]) => keyword)
}

function parseAssumptions(prompt: string): string[] {
  const assumptions: string[] = []

  if (/체험/u.test(prompt) && !/공예|만들기/u.test(prompt)) {
    assumptions.push("‘체험’은 일반 요청어로 해석해 키워드 일치 조건에서 제외했습니다.")
  }

  if (parseLocation(prompt).status === "absent") {
    assumptions.push("지역이 없으면 서울 기준으로 시작합니다.")
  }

  if (parseDateRange(prompt).status === "absent") {
    assumptions.push("날짜가 없으면 가까운 주말 기준으로 시작합니다.")
  }

  return assumptions
}
