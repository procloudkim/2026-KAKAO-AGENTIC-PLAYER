import { describe, expect, it } from "vitest"

import { parseSeoulAgeTarget } from "../src/sources/ageTarget.js"

describe("Korean source age target parsing", () => {
  it.each(["\uc804 \uc5f0\ub839", "\uc804\uc5f0\ub839"])("treats %s as an all-child source age range", (text) => {
    expect(parseSeoulAgeTarget(text)).toEqual({ min: 0, max: 17 })
  })

  it("parses an explicit Korean minimum age", () => {
    expect(parseSeoulAgeTarget("\ub9cc 7\uc138 \uc774\uc0c1")).toEqual({ min: 7, max: 17 })
  })

  it.each([
    ["8\uc138 \ubbf8\ub9cc", { min: 0, max: 7 }],
    ["8\uc138 \uc774\ud558", { min: 0, max: 8 }],
    ["8\uc138 \ucd08\uacfc", { min: 9, max: 17 }],
    ["\ub9cc 5\uc138~13\uc138", { min: 5, max: 13 }],
    ["5\uc138 \uc774\uc0c1 13\uc138 \uc774\ud558", { min: 5, max: 13 }],
    ["\ub9cc 7\uc138", { min: 7, max: 7 }],
  ])("parses strict year age expression %s", (text, expected) => {
    expect(parseSeoulAgeTarget(text)).toEqual(expected)
  })

  it.each([
    ["12\uac1c\uc6d4 \ubbf8\ub9cc", { min: 0, max: 0 }],
    ["24\uac1c\uc6d4 \ubbf8\ub9cc", { min: 0, max: 1 }],
    ["18\uac1c\uc6d4 \uc774\uc0c1", { min: 2, max: 17 }],
    ["12\uac1c\uc6d4~24\uac1c\uc6d4", { min: 1, max: 1 }],
  ])("conservatively converts month age expression %s", (text, expected) => {
    expect(parseSeoulAgeTarget(text)).toEqual(expected)
  })

  it("keeps school-grade ranges distinct from literal year ages", () => {
    expect(parseSeoulAgeTarget("초등학교 4~6학년 어린이 15명")).toEqual({ min: 7, max: 12 })
  })

  it("requires an English age cue before accepting a numeric range", () => {
    expect(parseSeoulAgeTarget("8 years and older")).toEqual({ min: 8, max: 17 })
    expect(parseSeoulAgeTarget("capacity 4-6 people")).toBeUndefined()
  })

  it.each([
    "12\uac1c\uc6d4",
    "5\uc138~13\uac1c\uc6d4",
    "\uc815\uc6d0 8\uba85",
    "2026\ub144 8\uc6d4 1\uc77c",
    "18\uc138 \uc774\uc0c1",
  ])("does not guess from unrelated or unsafe numeric text %s", (text) => {
    expect(parseSeoulAgeTarget(text)).toBeUndefined()
  })
})
