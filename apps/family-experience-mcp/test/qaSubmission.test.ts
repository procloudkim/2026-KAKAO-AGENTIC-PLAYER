import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { HoldoutCaseSchema, HoldoutManifestSchema, canonicalExpectedLabels, expectedFactsToInput, sha256, validateManifest } from "../scripts/qa-submission-contract.js"
import { FindFamilyExperiencesInputSchema } from "../src/schemas.js"
import { evaluateHoldout } from "../scripts/qa-submission.js"

function caseLine(id: string, label: "positive" | "no_results" | "invalid_input", missingField: "location" | "date_range" = "location") {
  const recordId = `holdout-record-${id}`
  return HoldoutCaseSchema.parse({
    case_id: id,
    source_record_ids: [recordId],
    input: label === "invalid_input" ? missingField === "location" ? { prompt: "내일 24개월 아이와 박물관" } : { prompt: "서울에서 4살 아이와 체험" } : { location: "Seoul", date_range: { start: "2026-07-11", end: "2026-07-11" }, child_age: 4 },
    expected_label: label,
    expected_source_calls: label === "invalid_input" ? 0 : 1,
    expected_facts: label === "invalid_input" ? { missing_fields: [missingField] } : { location: "Seoul", date_range: { start: "2026-07-11", end: "2026-07-11" }, child_age: 4 },
    source_records: [{
      id: recordId, raw_snapshot_id: `snapshot-${id}`, mode: "fixture", title: "Seoul indoor craft", city: label === "no_results" ? "Busan" : "Seoul",
      date: { start: "2026-07-11", end: "2026-07-11", time_text: "10:00" }, venue: { name: "Hall", address: "Seoul" },
      source: { id: "culture-portal-oneview", mode: "fixture", url: `https://example.invalid/${id}`, raw_snapshot_id: `snapshot-${id}` },
      retrieved_at: "2026-07-10T00:00:00Z", confidence: { date: "source-stated", venue: "source-stated", age_fit: "source-stated", reservation: "unknown" },
      parent_check: { age_fit: "confirm", reservation: "confirmation_needed", live_status: "fixture_not_live" }, child_stages: ["preschool"],
      min_child_age: 3, max_child_age: 6, indoor_outdoor: "indoor", target_age_text: "ages 3-6", program_text: "indoor craft",
      reservation_url: null, contact: null, fee_text: "confirm", tags: ["craft"], suitability: "happy_prompt_match", fixture_notice: "sealed synthetic record",
    }],
  })
}

function fixture() {
  const cases = [caseLine("h-pos-1", "positive"), caseLine("h-pos-2", "positive"), caseLine("h-none-1", "no_results"), caseLine("h-none-2", "no_results"), caseLine("h-bad-1", "invalid_input", "location"), caseLine("h-bad-2", "invalid_input", "date_range")]
  const raw = `${cases.map((item) => JSON.stringify(item)).join("\n")}\n`
  const manifest = HoldoutManifestSchema.parse({
    holdout_sha256: sha256(raw), expected_labels_sha256: sha256(canonicalExpectedLabels(cases)), author: "independent evaluator author",
    provenance: "synthetic test only", revealed_after_snapshot: "training-snapshot-2026-07-10", training_ids: ["training-only-1"],
    case_ids: cases.map(({ case_id }) => case_id), source_record_ids: cases.flatMap(({ source_record_ids }) => source_record_ids),
  })
  return { cases, raw, manifest }
}

describe("sealed submission evaluator", () => {
  it("PIN:EXPECTED_FACT_TRANSLATION maps independent environment facts to production constraints", () => {
    const expectedFacts = HoldoutCaseSchema.parse(caseLine("translation", "positive")).expected_facts
    const translated = expectedFactsToInput({ ...expectedFacts, indoor_outdoor: "indoor", keywords: ["craft"] })

    expect(FindFamilyExperiencesInputSchema.parse(translated)).toMatchObject({
      indoor_outdoor_preference: "indoor",
      keywords: ["craft"],
    })
  })
  it("PIN:FAIL_CLOSED_QA rejects missing labels, duplicate IDs, overlap, and bad hashes", () => {
    const { cases, raw, manifest } = fixture()
    const duplicateCases = [...cases.slice(0, 5), caseLine("h-pos-1", "positive")]
    const broken = { ...manifest, holdout_sha256: "0".repeat(64), expected_labels_sha256: "1".repeat(64), training_ids: [cases[0]?.case_id ?? ""] }
    expect(validateManifest(broken, raw, duplicateCases)).toEqual(expect.arrayContaining(["duplicate case id", "holdout/training id overlap", "holdout hash mismatch", "expected-label hash mismatch"]))
    expect(() => HoldoutCaseSchema.parse({ ...cases[0], expected_label: undefined })).toThrow()
  })

  it("PIN:HOLDOUT_ANTITAUTOLOGY rejects zero or category-vacuous sets", () => {
    const { manifest } = fixture()
    expect(validateManifest(manifest, "", [])).toEqual(expect.arrayContaining(["holdout requires at least six non-vacuous cases", "missing category: positive", "missing category: no_results", "missing category: invalid_input"]))
    const positiveOnly = Array.from({ length: 6 }, (_, index) => caseLine(`only-${index}`, "positive"))
    expect(validateManifest(manifest, "wrong", positiveOnly)).toEqual(expect.arrayContaining(["missing category: no_results", "missing category: invalid_input"]))
  })

  it("PIN:EXPECTED_CONTRACT_HASH rejects expected-fact tampering with an unchanged manifest", () => {
    const { cases, raw, manifest } = fixture()
    const tampered = cases.map((item, index) => index === 0 ? HoldoutCaseSchema.parse({ ...item, expected_facts: { ...item.expected_facts, location: "Busan" } }) : item)
    expect(validateManifest(manifest, raw, tampered)).toContain("expected-label hash mismatch")
  })

  it("PIN:EXPECTED_CONTRACT_HASH rejects source-call tampering with an unchanged manifest", () => {
    const { cases, raw, manifest } = fixture()
    const tampered = cases.map((item, index) => index === 0 ? HoldoutCaseSchema.parse({ ...item, expected_source_calls: 2 }) : item)
    expect(validateManifest(manifest, raw, tampered)).toEqual(expect.arrayContaining(["expected-label hash mismatch", "h-pos-1: successful lookup requires exactly one source call"]))
  })

  it("requires each case's declared and actual source record IDs to be the same unique set", () => {
    const { cases, raw, manifest } = fixture()
    const first = cases[0]
    if (first === undefined) throw new Error("missing first holdout case")
    const actual = first.source_records[0]
    if (actual === undefined) throw new Error("missing first source record")

    const declaredExtra = cases.map((item, index) => index === 0
      ? HoldoutCaseSchema.parse({ ...item, source_record_ids: [...item.source_record_ids, "declared-only"] })
      : item)
    const actualExtra = cases.map((item, index) => index === 0
      ? HoldoutCaseSchema.parse({ ...item, source_records: [...item.source_records, { ...actual, id: "actual-only" }] })
      : item)
    const actualDuplicate = cases.map((item, index) => index === 0
      ? HoldoutCaseSchema.parse({ ...item, source_records: [...item.source_records, actual] })
      : item)

    expect(validateManifest(manifest, raw, declaredExtra)).toContain(
      "h-pos-1: source record id binding mismatch",
    )
    expect(validateManifest(manifest, raw, actualExtra)).toContain(
      "h-pos-1: source record id binding mismatch",
    )
    expect(validateManifest(manifest, raw, actualDuplicate)).toContain(
      "h-pos-1: duplicate source record id binding",
    )
  })

  it("rejects incomplete positive facts and invalid-input source calls", () => {
    const { cases, raw, manifest } = fixture()
    const tampered = cases.map((item, index) => index === 0 ? HoldoutCaseSchema.parse({ ...item, expected_facts: { location: "Seoul", child_age: 4 } }) : index === 4 ? HoldoutCaseSchema.parse({ ...item, expected_source_calls: 1 }) : item)
    expect(validateManifest(manifest, raw, tampered)).toEqual(expect.arrayContaining(["h-pos-1: positive expected_facts require location, date_range, and child selector", "h-bad-1: invalid_input contract mismatch"]))
  })

  it("accepts a six-case disjoint synthetic manifest assembled in memory", () => {
    const { cases, raw, manifest } = fixture()
    expect(validateManifest(manifest, raw, cases)).toEqual([])
  })

  it("fails closed without a sibling manifest", async () => {
    const directory = await mkdtemp(join(tmpdir(), "qa-submission-missing-"))
    const path = join(directory, "sealed.jsonl")
    await writeFile(path, `${JSON.stringify(caseLine("missing-manifest", "positive"))}\n`, "utf8")
    await expect(evaluateHoldout(path)).rejects.toThrow()
  })

  it("runs a passing six-case synthetic holdout assembled only in a temp directory", async () => {
    const { cases, raw, manifest } = fixture()
    const directory = await mkdtemp(join(tmpdir(), "qa-submission-pass-"))
    const path = join(directory, "sealed.jsonl")
    await writeFile(path, raw, "utf8")
    await writeFile(`${path}.manifest.json`, JSON.stringify(manifest), "utf8")
    const result = await evaluateHoldout(path)
    expect(result.status, JSON.stringify(result.failures)).toBe("PASS")
    expect(result.cases).toEqual({ total: 6, passed: 6 })
    expect(cases).toHaveLength(6)
  })

  it("PIN:HOLDOUT_ANTITAUTOLOGY rejects one hard expected-fact violation", async () => {
    const base = fixture()
    const cases = base.cases.map((item, index) => index === 0 ? HoldoutCaseSchema.parse({ ...item, expected_facts: { ...item.expected_facts, location: "Busan" } }) : item)
    const raw = `${cases.map((item) => JSON.stringify(item)).join("\n")}\n`
    const manifest = HoldoutManifestSchema.parse({ ...base.manifest, holdout_sha256: sha256(raw), expected_labels_sha256: sha256(canonicalExpectedLabels(cases)) })
    const directory = await mkdtemp(join(tmpdir(), "qa-submission-violation-"))
    const path = join(directory, "sealed.jsonl")
    await writeFile(path, raw, "utf8")
    await writeFile(`${path}.manifest.json`, JSON.stringify(manifest), "utf8")
    const result = await evaluateHoldout(path)
    expect(result.status).toBe("FAIL")
    expect(result.failures[0]?.reasons).toContain("holdout-record-h-pos-1: location constraint")
  })
})
