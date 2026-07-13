import { describe, expect, it } from "vitest"

import { evaluateScheduleEligibility } from "../src/pipeline/scheduleEligibility.js"

const annualCandidateRange = {
  start: "2026-01-01",
  end: "2026-12-31",
}

function requestFor(
  start: string,
  end: string,
  timeText: string,
  timeOfDay?: "morning" | "afternoon" | "evening",
) {
  return evaluateScheduleEligibility({
    requestRange: { start, end },
    candidateRange: annualCandidateRange,
    timeText,
    ...(timeOfDay === undefined ? {} : { timeOfDay }),
  })
}

describe("family experience schedule eligibility", () => {
  it("excludes a source-stated Monday closure on the exact requested Monday", () => {
    expect(
      requestFor(
        "2026-08-03",
        "2026-08-03",
        "11:00 / 14:00※ 매주 월요일 휴무",
      ),
    ).toEqual({ status: "ineligible", reason: "closed_weekday" })
  })

  it("keeps the same source schedule on a non-closed weekday", () => {
    expect(
      requestFor(
        "2026-08-04",
        "2026-08-04",
        "11:00 / 14:00※ 매주 월요일 휴무",
      ),
    ).toEqual({ status: "eligible", reason: "source_schedule_matches" })
  })

  it("enforces positive operating weekdays and accepts their standalone session time", () => {
    expect(requestFor("2026-08-03", "2026-08-03", "매주 토, 일 14:00")).toEqual({
      status: "ineligible",
      reason: "open_weekday_mismatch",
    })
    expect(
      requestFor("2026-08-08", "2026-08-08", "매주 토, 일 14:00", "afternoon"),
    ).toEqual({ status: "eligible", reason: "source_schedule_matches" })
  })

  it("rejects a night-only event for a morning request", () => {
    expect(requestFor("2026-08-03", "2026-08-03", "20:00~23:00", "morning")).toEqual({
      status: "ineligible",
      reason: "time_window_mismatch",
    })
    expect(requestFor("2026-08-03", "2026-08-03", "10:00~18:00", "morning")).toEqual({
      status: "eligible",
      reason: "source_schedule_matches",
    })
  })

  it("returns unknown when an explicit time request lacks parseable schedule evidence", () => {
    expect(
      requestFor("2026-08-03", "2026-08-03", "프로그램 별 상이함", "morning"),
    ).toEqual({ status: "unknown", reason: "missing_or_ambiguous_schedule" })
  })

  it("keeps a multi-day request when at least one overlapping day is operational", () => {
    expect(
      requestFor(
        "2026-08-03",
        "2026-08-04",
        "11:00 / 14:00※ 매주 월요일 휴무",
      ),
    ).toEqual({ status: "eligible", reason: "source_schedule_matches" })
    expect(
      requestFor("2026-08-03", "2026-08-08", "매주 토, 일 14:00"),
    ).toEqual({ status: "eligible", reason: "source_schedule_matches" })
  })

  it("handles a cross-midnight interval without turning it into an all-day match", () => {
    expect(requestFor("2026-08-03", "2026-08-03", "20:00~00:30", "evening")).toEqual({
      status: "eligible",
      reason: "source_schedule_matches",
    })
    expect(requestFor("2026-08-03", "2026-08-03", "20:00~00:30", "morning")).toEqual({
      status: "ineligible",
      reason: "time_window_mismatch",
    })
  })
})
