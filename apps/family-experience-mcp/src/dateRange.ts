import type { DateRange } from "./types.js"

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/u
const millisecondsPerDay = 24 * 60 * 60 * 1000

export function currentDateRange(): DateRange {
  const date = referenceDate()
  return singleDateRange(date)
}

export function tomorrowDateRange(): DateRange {
  return singleDateRange(addDays(referenceDate(), 1))
}

export function nextWeekendRange(): DateRange {
  const reference = referenceDate()
  const dayOfWeek = reference.getUTCDay()
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7
  const saturday = addDays(reference, daysUntilSaturday)
  return { start: formatDate(saturday), end: formatDate(addDays(saturday, 1)) }
}

export function thisWeekRange(): DateRange {
  const reference = referenceDate()
  return { start: formatDate(reference), end: formatDate(addDays(reference, 6)) }
}

export function nextMonthRange(): DateRange {
  const reference = referenceDate()
  const nextMonth = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1))
  return { start: formatDate(nextMonth), end: formatDate(addDays(nextMonth, 1)) }
}

export function lateMonthRange(monthIndex: number): DateRange {
  const reference = referenceDate()
  const year = resolveYearForMonth(monthIndex, reference)
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0))
  return { start: formatDate(addDays(lastDay, -1)), end: formatDate(lastDay) }
}

export function monthDayRange(monthIndex: number, day: number): DateRange {
  const reference = referenceDate()
  const date = new Date(Date.UTC(resolveYearForMonth(monthIndex, reference), monthIndex, day))
  if (date.getUTCMonth() !== monthIndex || date.getUTCDate() !== day) {
    return nextWeekendRange()
  }
  return singleDateRange(date)
}

function referenceDate(): Date {
  const configured = process.env["FAMILY_EXPERIENCE_REFERENCE_DATE"]
  if (configured !== undefined && dateOnlyPattern.test(configured)) {
    return parseDateOnly(configured)
  }
  return parseDateOnly(formatDate(new Date()))
}

function resolveYearForMonth(monthIndex: number, reference: Date): number {
  const currentYearDate = new Date(Date.UTC(reference.getUTCFullYear(), monthIndex, 1))
  return currentYearDate < reference ? reference.getUTCFullYear() + 1 : reference.getUTCFullYear()
}

function singleDateRange(date: Date): DateRange {
  const formatted = formatDate(date)
  return { start: formatted, end: formatted }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * millisecondsPerDay)
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
