import type { FindFamilyExperiencesInput } from "../schemas.js"

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type ScheduleEligibility =
  | { readonly status: "eligible"; readonly reason: "source_schedule_matches" }
  | {
      readonly status: "ineligible"
      readonly reason: "closed_weekday" | "open_weekday_mismatch" | "time_window_mismatch"
    }
  | { readonly status: "unknown"; readonly reason: "missing_or_ambiguous_schedule" }

type ScheduleEligibilityRequest = {
  readonly requestRange: FindFamilyExperiencesInput["date_range"]
  readonly candidateRange: FindFamilyExperiencesInput["date_range"]
  readonly timeOfDay?: FindFamilyExperiencesInput["time_of_day"]
  readonly timeText: string
}

const weekdayTokens: Readonly<Record<string, Weekday>> = {
  일: 0,
  일요일: 0,
  월: 1,
  월요일: 1,
  화: 2,
  화요일: 2,
  수: 3,
  수요일: 3,
  목: 4,
  목요일: 4,
  금: 5,
  금요일: 5,
  토: 6,
  토요일: 6,
}

const timeWindows = {
  morning: { start: 5 * 60, end: 12 * 60 },
  afternoon: { start: 12 * 60, end: 18 * 60 },
  evening: { start: 18 * 60, end: 24 * 60 },
} as const

export function evaluateScheduleEligibility(
  request: ScheduleEligibilityRequest,
): ScheduleEligibility {
  const timeText = request.timeText.normalize("NFKC").trim()
  const closedWeekdays = parseClosedWeekdays(timeText)
  const openWeekdays = parseOpenWeekdays(timeText)
  const overlappingDates = representativeOverlappingDates(
    request.requestRange,
    request.candidateRange,
  )

  if (overlappingDates.length > 0) {
    const weekdayResult = overlappingDates.some((date) => {
      const weekday = date.getUTCDay() as Weekday
      return !closedWeekdays.has(weekday) &&
        (openWeekdays.size === 0 || openWeekdays.has(weekday))
    })

    if (!weekdayResult) {
      const everyOverlappingDateIsClosed = overlappingDates.every((date) =>
        closedWeekdays.has(date.getUTCDay() as Weekday),
      )
      return {
        status: "ineligible",
        reason: everyOverlappingDateIsClosed ? "closed_weekday" : "open_weekday_mismatch",
      }
    }
  }

  if (request.timeOfDay === undefined) {
    return closedWeekdays.size > 0 || openWeekdays.size > 0 || parseTimeIntervals(timeText).length > 0
      ? { status: "eligible", reason: "source_schedule_matches" }
      : { status: "unknown", reason: "missing_or_ambiguous_schedule" }
  }

  const intervals = parseTimeIntervals(timeText)
  if (intervals.length === 0) {
    return { status: "unknown", reason: "missing_or_ambiguous_schedule" }
  }

  const window = timeWindows[request.timeOfDay]
  const matches = intervals.some((interval) =>
    overlaps(interval, window) ||
    overlaps(interval, { start: window.start + 24 * 60, end: window.end + 24 * 60 }),
  )
  return matches
    ? { status: "eligible", reason: "source_schedule_matches" }
    : { status: "ineligible", reason: "time_window_mismatch" }
}

function parseClosedWeekdays(text: string): ReadonlySet<Weekday> {
  const result = new Set<Weekday>()
  const token = "(?:월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일)"
  const patterns = [
    new RegExp(`(${token})\\s*(?:은|는|마다)?\\s*(?:휴무|휴관|휴장|운영\\s*(?:안\\s*함|하지\\s*않음))`, "gu"),
    new RegExp(`(?:휴무|휴관|휴장)\\s*[:：]?\\s*(?:매주\\s*)?(${token})`, "gu"),
  ]

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      addWeekday(result, match[1])
    }
  }

  const english = [
    [0, /closed\s+(?:on\s+)?sundays?|sundays?\s+closed/iu],
    [1, /closed\s+(?:on\s+)?mondays?|mondays?\s+closed/iu],
    [2, /closed\s+(?:on\s+)?tuesdays?|tuesdays?\s+closed/iu],
    [3, /closed\s+(?:on\s+)?wednesdays?|wednesdays?\s+closed/iu],
    [4, /closed\s+(?:on\s+)?thursdays?|thursdays?\s+closed/iu],
    [5, /closed\s+(?:on\s+)?fridays?|fridays?\s+closed/iu],
    [6, /closed\s+(?:on\s+)?saturdays?|saturdays?\s+closed/iu],
  ] as const
  for (const [weekday, pattern] of english) {
    if (pattern.test(text)) result.add(weekday)
  }

  return result
}

function parseOpenWeekdays(text: string): ReadonlySet<Weekday> {
  const result = new Set<Weekday>()
  const match = /매주\s*((?:월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일)(?:\s*[,·/및과]\s*(?:월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일))*)/u.exec(text)
  if (match === null) return result

  const tail = text.slice(match.index + match[0].length, match.index + match[0].length + 16)
  if (/휴무|휴관|휴장|운영\s*(?:안|하지)/u.test(tail)) return result

  for (const token of match[1]?.match(/월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일/gu) ?? []) {
    addWeekday(result, token)
  }
  return result
}

function addWeekday(result: Set<Weekday>, token: string | undefined): void {
  if (token === undefined) return
  const weekday = weekdayTokens[token]
  if (weekday !== undefined) result.add(weekday)
}

type MinuteInterval = { readonly start: number; readonly end: number }

function parseTimeIntervals(text: string): readonly MinuteInterval[] {
  const intervals: MinuteInterval[] = []
  const intervalPattern = /(오전|오후)?\s*(\d{1,2})(?::(\d{2})|시(?:\s*(\d{1,2})분?)?)\s*(?:~|〜|∼|-|–|—|부터)\s*(오전|오후)?\s*(\d{1,2})(?::(\d{2})|시(?:\s*(\d{1,2})분?)?)/gu

  for (const match of text.matchAll(intervalPattern)) {
    const start = toMinute(match[1], match[2], match[3] ?? match[4])
    const end = toMinute(match[5], match[6], match[7] ?? match[8])
    if (start === undefined || end === undefined) continue
    intervals.push({ start, end: end <= start ? end + 24 * 60 : end })
  }

  const textWithoutRanges = text.replace(
    /(오전|오후)?\s*(\d{1,2})(?::(\d{2})|시(?:\s*(\d{1,2})분?)?)\s*(?:~|〜|∼|-|–|—|부터)\s*(오전|오후)?\s*(\d{1,2})(?::(\d{2})|시(?:\s*(\d{1,2})분?)?)/gu,
    " ",
  )
  const pointPattern = /(오전|오후)?\s*(\d{1,2})(?::(\d{2})|시(?:\s*(\d{1,2})분?)?)/gu
  for (const match of textWithoutRanges.matchAll(pointPattern)) {
    const minute = toMinute(match[1], match[2], match[3] ?? match[4])
    if (minute !== undefined) {
      intervals.push({ start: minute, end: minute + 1 })
    }
  }

  return intervals
}

function toMinute(
  meridiem: string | undefined,
  hourText: string | undefined,
  minuteText: string | undefined,
): number | undefined {
  if (hourText === undefined) return undefined
  let hour = Number(hourText)
  const minute = minuteText === undefined ? 0 : Number(minuteText)
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return undefined
  }
  if (meridiem !== undefined) {
    if (hour < 1 || hour > 12) return undefined
    if (meridiem === "오전" && hour === 12) hour = 0
    if (meridiem === "오후" && hour < 12) hour += 12
  } else if (hour < 0 || hour > 23) {
    return undefined
  }
  return hour * 60 + minute
}

function overlaps(left: MinuteInterval, right: MinuteInterval): boolean {
  return left.start < right.end && left.end > right.start
}

function representativeOverlappingDates(
  requestRange: FindFamilyExperiencesInput["date_range"],
  candidateRange: FindFamilyExperiencesInput["date_range"],
): readonly Date[] {
  const start = requestRange.start > candidateRange.start ? requestRange.start : candidateRange.start
  const end = requestRange.end < candidateRange.end ? requestRange.end : candidateRange.end
  if (start > end) return []

  const startDate = new Date(`${start}T00:00:00.000Z`)
  const endDate = new Date(`${end}T00:00:00.000Z`)
  const result: Date[] = []
  for (
    let current = startDate.getTime();
    current <= endDate.getTime() && result.length < 7;
    current += 24 * 60 * 60 * 1_000
  ) {
    result.push(new Date(current))
  }
  return result
}
