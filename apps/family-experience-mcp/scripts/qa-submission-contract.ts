import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"

import * as z from "zod/v4"

import type { FindFamilyExperiencesInput } from "../src/schemas.js"
import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"
import type { FamilyExperienceSourceRecord } from "../src/sources/types.js"

const ExpectedOutcomeSchema = z.enum(["positive", "no_results", "invalid_input"])
const MissingFieldSchema = z.enum(["location", "date_range", "child_selector"])
const ExpectedFactsSchema = z.object({
  location: z.string().min(1).optional(),
  date_range: z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict().optional(),
  child_age: z.number().int().min(0).max(17).optional(),
  child_stage: z.enum(["infant", "toddler", "preschool", "school_age", "teen"]).optional(),
  indoor_outdoor: z.enum(["indoor", "outdoor", "mixed"]).optional(),
  keywords: z.array(z.string().min(1)).optional(),
  missing_fields: z.array(MissingFieldSchema).min(1).optional(),
}).strict()

const SourceRecordSchema = z.object({
  id: z.string().min(1), raw_snapshot_id: z.string().min(1), mode: z.enum(["fixture", "live"]),
  title: z.string().min(1), city: z.string().min(1),
  date: z.object({ start: z.string(), end: z.string(), time_text: z.string() }).strict(),
  venue: z.object({ name: z.string(), address: z.string() }).strict(),
  source: z.object({ id: z.enum(["fixture-family-experience-v1", "seoul-culture-events", "culture-portal-oneview", "kto-tourapi-events", "national-culture-festival-standard"]), mode: z.enum(["fixture", "live"]), url: z.string().url(), raw_snapshot_id: z.string() }).strict(),
  retrieved_at: z.string().min(1),
  confidence: z.object({ date: z.enum(["source-stated", "api-returned", "computed", "inferred", "stale", "unknown"]), venue: z.enum(["source-stated", "api-returned", "computed", "inferred", "stale", "unknown"]), age_fit: z.enum(["source-stated", "api-returned", "computed", "inferred", "stale", "unknown"]), reservation: z.enum(["source-stated", "api-returned", "computed", "inferred", "stale", "unknown"]) }).strict(),
  parent_check: z.object({ age_fit: z.string(), reservation: z.literal("confirmation_needed"), live_status: z.enum(["fixture_not_live", "source_timestamp_required"]) }).strict(),
  child_stages: z.array(z.enum(["infant", "toddler", "preschool", "school_age", "teen"])),
  min_child_age: z.number().int(), max_child_age: z.number().int(),
  indoor_outdoor: z.enum(["indoor", "outdoor", "mixed", "unknown"]),
  target_age_text: z.string(), program_text: z.string(), reservation_url: z.string().nullable(),
  contact: z.string().nullable(), fee_text: z.string(), tags: z.array(z.string()),
  suitability: z.enum(["happy_prompt_match", "edge_unsuitable"]), fixture_notice: z.string(),
}).strict()

export const HoldoutCaseSchema = z.object({
  case_id: z.string().min(1), source_record_ids: z.array(z.string().min(1)).min(1),
  input: z.record(z.string(), z.unknown()), expected_label: ExpectedOutcomeSchema,
  expected_source_calls: z.number().int().min(0), expected_facts: ExpectedFactsSchema,
  source_records: z.array(SourceRecordSchema),
}).strict()
export type HoldoutCase = z.infer<typeof HoldoutCaseSchema>

export function expectedFactsToInput(expectedFacts: HoldoutCase["expected_facts"]): Record<string, unknown> {
  return {
    ...(expectedFacts.location === undefined ? {} : { location: expectedFacts.location }),
    ...(expectedFacts.date_range === undefined ? {} : { date_range: expectedFacts.date_range }),
    ...(expectedFacts.child_age === undefined ? {} : { child_age: expectedFacts.child_age }),
    ...(expectedFacts.child_stage === undefined ? {} : { child_stage: expectedFacts.child_stage }),
    ...(expectedFacts.indoor_outdoor === undefined
      ? {}
      : { indoor_outdoor_preference: expectedFacts.indoor_outdoor }),
    ...(expectedFacts.keywords === undefined ? {} : { keywords: expectedFacts.keywords }),
  }
}

export const HoldoutManifestSchema = z.object({
  holdout_sha256: z.string().regex(/^[a-f0-9]{64}$/), expected_labels_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  author: z.string().min(1), provenance: z.string().min(1), revealed_after_snapshot: z.string().min(1),
  training_ids: z.array(z.string().min(1)).min(1), case_ids: z.array(z.string().min(1)).min(1),
  source_record_ids: z.array(z.string().min(1)).min(1),
}).strict()
export type HoldoutManifest = z.infer<typeof HoldoutManifestSchema>

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex")
}

export function canonicalExpectedLabels(cases: readonly HoldoutCase[]): string {
  return JSON.stringify(cases.map(({ case_id, expected_label, expected_source_calls, expected_facts, source_record_ids }) => ({
    case_id,
    expected_label,
    expected_source_calls,
    expected_facts: {
      ...(expected_facts.location === undefined ? {} : { location: expected_facts.location }),
      ...(expected_facts.date_range === undefined ? {} : { date_range: expected_facts.date_range }),
      ...(expected_facts.child_age === undefined ? {} : { child_age: expected_facts.child_age }),
      ...(expected_facts.child_stage === undefined ? {} : { child_stage: expected_facts.child_stage }),
      ...(expected_facts.indoor_outdoor === undefined ? {} : { indoor_outdoor: expected_facts.indoor_outdoor }),
      ...(expected_facts.keywords === undefined ? {} : { keywords: [...expected_facts.keywords].sort() }),
      ...(expected_facts.missing_fields === undefined ? {} : { missing_fields: [...expected_facts.missing_fields].sort() }),
    },
    source_record_ids: [...source_record_ids].sort(),
  })).sort((left, right) => left.case_id.localeCompare(right.case_id)))
}

export async function readHoldout(path: string): Promise<{ readonly raw: string; readonly cases: readonly HoldoutCase[] }> {
  const raw = await readFile(path, "utf8")
  const lines = raw.split(/\r?\n/u).filter((line) => line.trim().length > 0)
  return { raw, cases: lines.map((line) => HoldoutCaseSchema.parse(JSON.parse(line))) }
}

export function validateManifest(manifest: HoldoutManifest, raw: string, cases: readonly HoldoutCase[]): readonly string[] {
  const failures: string[] = []
  const caseIds = cases.map(({ case_id }) => case_id)
  const recordIds = cases.flatMap(({ source_record_ids }) => source_record_ids)
  const categories = new Set(cases.map(({ expected_label }) => expected_label))
  if (cases.length < 6) failures.push("holdout requires at least six non-vacuous cases")
  for (const category of ExpectedOutcomeSchema.options) if (!categories.has(category)) failures.push(`missing category: ${category}`)
  for (const [name, ids] of [["case", caseIds], ["source record", recordIds], ["training", manifest.training_ids]] satisfies readonly (readonly [string, readonly string[]])[]) {
    if (new Set(ids).size !== ids.length) failures.push(`duplicate ${name} id`)
  }
  const training = new Set(manifest.training_ids)
  if (caseIds.some((id) => training.has(id)) || recordIds.some((id) => training.has(id))) failures.push("holdout/training id overlap")
  if (sha256(raw) !== manifest.holdout_sha256) failures.push("holdout hash mismatch")
  if (sha256(canonicalExpectedLabels(cases)) !== manifest.expected_labels_sha256) failures.push("expected-label hash mismatch")
  if (JSON.stringify(caseIds) !== JSON.stringify(manifest.case_ids)) failures.push("manifest case_ids mismatch")
  if (JSON.stringify(recordIds) !== JSON.stringify(manifest.source_record_ids)) failures.push("manifest source_record_ids mismatch")
  if (cases.some((item) => item.source_records.length === 0 || item.source_record_ids.length === 0)) failures.push("vacuous source records")
  for (const item of cases) {
    const declaredRecordIds = item.source_record_ids
    const actualRecordIds = item.source_records.map((record) => record.id)
    if (
      new Set(declaredRecordIds).size !== declaredRecordIds.length ||
      new Set(actualRecordIds).size !== actualRecordIds.length
    ) {
      failures.push(`${item.case_id}: duplicate source record id binding`)
    }
    const declaredSet = new Set(declaredRecordIds)
    const actualSet = new Set(actualRecordIds)
    if (
      declaredSet.size !== actualSet.size ||
      declaredRecordIds.some((id) => !actualSet.has(id)) ||
      actualRecordIds.some((id) => !declaredSet.has(id))
    ) {
      failures.push(`${item.case_id}: source record id binding mismatch`)
    }
    const facts = item.expected_facts
    if (item.expected_label === "positive" && (facts.location === undefined || facts.date_range === undefined || (facts.child_age === undefined && facts.child_stage === undefined) || facts.missing_fields !== undefined)) failures.push(`${item.case_id}: positive expected_facts require location, date_range, and child selector`)
    if (item.expected_label === "invalid_input" && (item.expected_source_calls !== 0 || facts.missing_fields === undefined || new Set(facts.missing_fields).size !== facts.missing_fields.length)) failures.push(`${item.case_id}: invalid_input contract mismatch`)
    if (item.expected_label !== "invalid_input" && item.expected_source_calls !== 1) failures.push(`${item.case_id}: successful lookup requires exactly one source call`)
  }
  return failures
}

export function checkCandidates(input: FindFamilyExperiencesInput, records: readonly FamilyExperienceSourceRecord[], structured: unknown): readonly string[] {
  const parsed = FindFamilyExperiencesStructuredContentSchema.safeParse(structured)
  if (!parsed.success || !parsed.data.ok) return ["expected successful structured result"]
  const failures: string[] = []
  if (parsed.data.candidates.length === 0) failures.push("positive result requires at least one candidate")
  for (const candidate of parsed.data.candidates) {
    const record = records.find(({ id }) => id === candidate.id)
    if (record === undefined) { failures.push(`${candidate.id}: candidate absent from injected facts`); continue }
    if (!record.city.toLowerCase().includes(input.location.toLowerCase())) failures.push(`${candidate.id}: location constraint`)
    if (record.date.start > input.date_range.end || record.date.end < input.date_range.start) failures.push(`${candidate.id}: date constraint`)
    if (input.child_age !== undefined && (input.child_age < record.min_child_age || input.child_age > record.max_child_age)) failures.push(`${candidate.id}: age constraint`)
    if (input.child_stage !== undefined && !record.child_stages.includes(input.child_stage)) failures.push(`${candidate.id}: child-stage constraint`)
    if (input.indoor_outdoor_preference !== undefined && record.indoor_outdoor !== input.indoor_outdoor_preference && record.indoor_outdoor !== "mixed") failures.push(`${candidate.id}: environment constraint`)
    const searchable = `${record.title} ${record.program_text} ${record.tags.join(" ")}`.toLowerCase()
    if (input.keywords?.some((keyword) => !searchable.includes(keyword.toLowerCase())) === true) failures.push(`${candidate.id}: keyword constraint`)
    if (candidate.indoor_outdoor === "unknown" && input.indoor_outdoor_preference !== undefined) failures.push(`${candidate.id}: unexpected requested unknown`)
    if (candidate.age_fit_label === "unknown" && (input.child_age !== undefined || input.child_stage !== undefined)) failures.push(`${candidate.id}: unexpected age unknown`)
  }
  return failures
}
