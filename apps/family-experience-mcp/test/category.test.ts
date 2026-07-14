import { describe, expect, it } from "vitest"

import { classifyFamilyExperienceCategory } from "../src/pipeline/category.js"

describe("family experience category classification", () => {
  it("separates activity type from traditional and history topics", () => {
    expect(
      classifyFamilyExperienceCategory({
        title: "서울 왕궁수문장 교대의식",
        program_text: "서울 왕궁수문장 교대의식",
        tags: ["kto-tourapi"],
      }),
    ).toEqual({
      activity_type: "performance",
      topic_tags: ["traditional", "history"],
      category_basis: "inferred",
    })
  })

  it("recognizes Korean visual-art listings without treating them as traditional", () => {
    expect(
      classifyFamilyExperienceCategory({
        title: "아시아프 (ASYAAF 100)",
        program_text: "아시아프 (ASYAAF 100)",
        tags: ["kto-tourapi"],
      }),
    ).toEqual({
      activity_type: "exhibition",
      topic_tags: ["art"],
      category_basis: "inferred",
    })
  })

  it("prefers a source-native category tag over title inference", () => {
    expect(
      classifyFamilyExperienceCategory({
        title: "개방 수장고 개편",
        program_text: "개방 수장고 개편",
        tags: ["culture-portal", "전시"],
      }),
    ).toMatchObject({
      activity_type: "exhibition",
      category_basis: "source-stated",
    })
  })

  it("does not turn generic experience or event wording into a fake category", () => {
    expect(
      classifyFamilyExperienceCategory({
        title: "가족 체험 행사",
        program_text: "가족 체험 행사",
        tags: ["kto-tourapi"],
      }),
    ).toEqual({
      activity_type: "other",
      topic_tags: [],
      category_basis: "unknown",
    })
  })

  it("keeps mixed source tags and title-derived topics conservatively inferred", () => {
    expect(
      classifyFamilyExperienceCategory({
        title: "AI 과학 체험",
        program_text: "로봇 코딩",
        tags: ["전시"],
      }),
    ).toEqual({
      activity_type: "exhibition",
      topic_tags: ["science", "technology"],
      category_basis: "inferred",
    })
  })
})
