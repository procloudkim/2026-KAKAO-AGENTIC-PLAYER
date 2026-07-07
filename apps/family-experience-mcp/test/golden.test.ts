import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"
import * as z from "zod/v4"

import {
  FamilyExperienceCandidateSchema,
  FindFamilyExperiencesStructuredContentSchema,
} from "../src/schemas.js"

const ActionCardSchema = z
  .object({
    title: z.string().trim().min(1),
    date_time: z.string().trim().min(1),
    venue: z.string().trim().min(1),
    address: z.string().trim().min(1),
    age_fit_label: z.string().trim().min(1),
    age_fit_reason: z.string().trim().min(1),
    indoor_outdoor: z.string().trim().min(1),
    fee_text: z.string().trim().min(1),
    source_name: z.string().trim().min(1),
    source_url: z.string().url(),
    retrieved_at: z.string().trim().min(1),
    confidence: z.string().trim().min(1),
    mode: z.string().trim().min(1),
    warnings: z.string().trim().min(1),
    source_summary: z.string().trim().min(1),
    parent_check: z.string().trim().min(1),
    next_action: z.string().trim().min(1),
  })
  .strict()

const GoldenArtifactSchema = z
  .object({
    response: z
      .object({
        isError: z.boolean(),
        text: z.string(),
        action_cards: z.array(ActionCardSchema),
        structuredContent: FindFamilyExperiencesStructuredContentSchema.optional(),
        transportError: z.string().optional(),
      })
      .strict(),
    passed: z.boolean(),
  })
  .passthrough()

type GoldenArtifact = z.infer<typeof GoldenArtifactSchema>

const evidenceDir = resolve(process.cwd(), "../../.omo/evidence")
const unsupportedPublicClaimPattern =
  /전국 모든 행사|전국 전체|예약 가능|예약가능|운영 중|실시간|아이에게 적합함|안전 인증|safety certified|safe for children|available to book|book now|currently open|live now/i

async function readGolden(fileName: string): Promise<GoldenArtifact> {
  return GoldenArtifactSchema.parse(
    JSON.parse(await readFile(resolve(evidenceDir, fileName), "utf8")),
  )
}

describe("Todo 7 golden evidence semantics", () => {
  it("locks the happy golden action-card contract", async () => {
    // Given: the generated happy golden artifact exists.
    const artifact = await readGolden("golden-family-experience-happy.json")

    // When: its MCP structured output and user-visible cards are inspected.
    const structuredContent = artifact.response.structuredContent

    // Then: the evidence contains exactly three fixture cards with the full parent contract.
    expect(artifact.passed).toBe(true)
    expect(structuredContent?.ok).toBe(true)
    if (structuredContent?.ok !== true) {
      throw new Error("Expected happy golden structured content")
    }
    expect(structuredContent.mode).toBe("fixture")
    expect(structuredContent.candidates).toHaveLength(3)
    expect(artifact.response.action_cards).toHaveLength(3)
    expect(artifact.response.action_cards.map((card) => card.title)).toEqual(
      structuredContent.candidates.map((candidate) => candidate.title),
    )
    expect(JSON.stringify(artifact)).not.toMatch(unsupportedPublicClaimPattern)
  })

  it("rejects candidates missing the public trust contract", () => {
    // Given: a candidate-shaped payload omits parent_check from the public trust fields.
    const candidate = {
      id: "x",
      title: "x",
      location: "서울",
      starts_at: "2026-07-07",
      ends_at: "2026-07-07",
      source: "culture_portal",
      tags: [],
      child_stages: ["preschool"],
      min_child_age: 3,
      max_child_age: 5,
      date_time: "2026-07-07 10:00",
      venue: "x",
      address: "x",
      age_fit_label: "unknown",
      age_fit_reason: "source does not state age fit",
      indoor_outdoor: "unknown",
      fee_text: "confirm at source",
      source_name: "Culture Portal/KCISA",
      source_url: "https://example.test/source",
      retrieved_at: "2026-07-07T00:00:00.000Z",
      confidence: "date=source-stated; venue=source-stated; age_fit=unknown; reservation=unknown",
      mode: "live",
      warnings: "confirm at source before visiting",
      source_summary: "source-grounded candidate",
      next_action: "confirm at source before visiting",
    }

    // When: the public candidate schema parses it.
    const parsed = FamilyExperienceCandidateSchema.safeParse(candidate)

    // Then: the missing trust field is rejected.
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((issue) => issue.path.join("."))).toContain("parent_check")
  })

  it("rejects unsupported availability and safety language in public candidates", () => {
    // Given: a candidate includes all trust fields but claims unsupported availability and safety.
    const candidate = {
      id: "x",
      title: "예약 가능 안전 인증 체험",
      location: "서울",
      starts_at: "2026-07-07",
      ends_at: "2026-07-07",
      source: "culture_portal",
      tags: [],
      child_stages: ["preschool"],
      min_child_age: 3,
      max_child_age: 5,
      date_time: "2026-07-07 10:00",
      venue: "x",
      address: "x",
      age_fit_label: "unknown",
      age_fit_reason: "source does not state age fit",
      indoor_outdoor: "unknown",
      fee_text: "예약 가능",
      source_name: "Culture Portal/KCISA",
      source_url: "https://example.test/source",
      retrieved_at: "2026-07-07T00:00:00.000Z",
      confidence: "date=source-stated; venue=source-stated; age_fit=unknown; reservation=unknown",
      mode: "live",
      warnings: "운영 중",
      source_summary: "source-grounded candidate",
      parent_check: "아이에게 적합함",
      next_action: "book now",
    }

    // When: the public candidate schema parses it.
    const parsed = FamilyExperienceCandidateSchema.safeParse(candidate)

    // Then: unsupported public claims are rejected instead of reaching golden output.
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((issue) => issue.message).join("\n")).toMatch(
      /unsupported availability or safety claim/,
    )
  })

  it("locks Korean missing-age guidance without SDK validation text", async () => {
    // Given: the missing-age artifact was generated through the MCP surface.
    const artifact = await readGolden("golden-family-experience-missing-age.json")

    // When / Then: it asks for child age or stage in Korean and returns no candidates.
    expect(artifact.response.isError).toBe(true)
    expect(artifact.response.text).toMatch(/아이 나이|발달 단계/)
    expect(artifact.response.text).not.toMatch(/Input validation error|Invalid arguments|Provide exactly/)
    expect(artifact.response.structuredContent?.ok).toBe(false)
  })

  it("locks no-result safety and one-constraint relaxation", async () => {
    // Given: the no-result artifact was generated for an over-constrained request.
    const artifact = await readGolden("golden-family-experience-no-result.json")

    // When / Then: it fabricates no candidates and suggests relaxing only the date range.
    expect(artifact.response.isError).toBe(true)
    expect(artifact.response.structuredContent?.ok).toBe(false)
    expect(artifact.response.action_cards).toHaveLength(0)
    expect(artifact.response.text).toMatch(/날짜 범위 하나만/)
    expect(artifact.response.text).not.toMatch(/예산|거리|실내|budget|distance|indoor/)
  })

  it("locks source-failure safety", async () => {
    // Given: the source-failure artifact was generated with fixture disabled and no live key.
    const artifact = await readGolden("golden-family-experience-source-failure.json")

    // When / Then: it is a safe tool error without candidates or raw secrets.
    expect(artifact.response.isError).toBe(true)
    expect(artifact.response.structuredContent?.ok).toBe(false)
    expect(artifact.response.action_cards).toHaveLength(0)
    expect(artifact.response.text).toMatch(/현재 설정|공식 데이터|fixture 모드/)
    expect(JSON.stringify(artifact)).not.toMatch(/SEOUL_OPEN_DATA_KEY|[?&]KEY=|[?&]key=|\/[A-Za-z0-9]{20,}\//)
  })
})
