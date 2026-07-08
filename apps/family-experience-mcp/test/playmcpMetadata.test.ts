import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const docsDir = resolve(process.cwd(), "docs")
const expectedDocs = [
  "PLAYMCP_TEMP_REGISTRATION.md",
  "RUNBOOK.md",
  "SUBMISSION_COPY_DRAFT.md",
] as const

async function readDoc(fileName: (typeof expectedDocs)[number]): Promise<string> {
  return readFile(resolve(docsDir, fileName), "utf8")
}

function extractMetadataValue(source: string, label: string): string {
  const line = source
    .split(/\r?\n/u)
    .find((candidate) => candidate.startsWith(`| ${label} |`))
  if (line === undefined) {
    throw new Error(`Missing metadata row: ${label}`)
  }

  const cells = line
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
  const value = cells[1]
  if (value === undefined) {
    throw new Error(`Missing metadata value: ${label}`)
  }
  return value
}

function extractStarterMessages(source: string): readonly string[] {
  const starterBlock = source.match(
    /## Starter Messages\s+(?<block>[\s\S]*?)(?:\n## |\n$)/u,
  )?.groups?.["block"]
  if (starterBlock === undefined) {
    throw new Error("Missing starter messages section")
  }
  return starterBlock
    .split(/\r?\n/u)
    .filter((line) => /^\d+\.\s+/u.test(line))
    .map((line) => line.replace(/^\d+\.\s+/u, "").trim())
}

function expectNoReleaseActionClaim(source: string): void {
  const blockedReviewPhrase = ["등록 및 심사 요청을", "진행"].join(" ")

  expect(source).not.toContain(blockedReviewPhrase)
  expect(source).not.toMatch(/심사\s*(요청|접수).*(완료|진행|제출)/u)
  expect(source).not.toMatch(/(review|submission).*(requested|completed)/iu)
}

function escapeRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
}

function expectNoUnsupportedProductClaim(source: string): void {
  const blockedClaims = [
    ["전국 모든 ", "행사"].join(""),
    ["전국 ", "전체"].join(""),
    ["예약 ", "가능"].join(""),
    ["운영 ", "중"].join(""),
    ["실", "시간"].join(""),
    ["아이에게 ", "적합함"].join(""),
  ]
  const unsupportedPositiveClaimPattern = new RegExp(
    blockedClaims
      .map((claim) => `${escapeRegExp(claim)}(?![^\\n.]{0,80}(않|없|금지|제공하지|보장하지))`)
      .join("|"),
    "u",
  )

  expect(source).not.toMatch(unsupportedPositiveClaimPattern)
}

describe("Todo 8 PlayMCP temporary-registration metadata", () => {
  it("keeps the PlayMCP temporary-registration package within console constraints", async () => {
    // Given: the operator-facing PlayMCP temporary-registration docs are present.
    const registrationDoc = await readDoc("PLAYMCP_TEMP_REGISTRATION.md")
    const runbookDoc = await readDoc("RUNBOOK.md")
    const copyDraftDoc = await readDoc("SUBMISSION_COPY_DRAFT.md")

    // When: the PlayMCP metadata fields are extracted from the source-of-truth doc.
    const name = extractMetadataValue(registrationDoc, "Name")
    const identifier = extractMetadataValue(registrationDoc, "Identifier")
    const endpoint = extractMetadataValue(registrationDoc, "Endpoint path")
    const description = extractMetadataValue(registrationDoc, "Description")
    const starters = extractStarterMessages(registrationDoc)
    const combinedDocs = [registrationDoc, runbookDoc, copyDraftDoc].join("\n")

    // Then: the package is valid for temporary testing without release actions.
    expect(name).toBe("아이랑 어디가")
    expect(identifier).toBe("family")
    expect(identifier.length).toBeLessThanOrEqual(16)
    expect(endpoint).toBe("/mcp")
    expect(description.length).toBeLessThanOrEqual(500)
    expect(starters).toHaveLength(3)
    expect(starters.every((starter) => starter.length <= 80)).toBe(true)
    expect(registrationDoc).toContain("임시 등록")
    expect(combinedDocs).toContain("fixture/demo")
    expect(combinedDocs).toContain("DEMO_PACK.md")
    expectNoUnsupportedProductClaim(combinedDocs)
    expectNoReleaseActionClaim(combinedDocs)
  })
})
