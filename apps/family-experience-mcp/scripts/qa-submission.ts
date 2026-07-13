import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { Client } from "@modelcontextprotocol/client"
import { InMemoryTransport } from "@modelcontextprotocol/server"

import { createFamilyExperienceMcpServer } from "../src/mcp.js"
import { FindFamilyExperiencesInputSchema, FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"
import type { FamilyExperienceSourceAdapter, FamilyExperienceSourceRecord, SourceAdapterRequest } from "../src/sources/types.js"
import { HoldoutManifestSchema, checkCandidates, expectedFactsToInput, readHoldout, validateManifest } from "./qa-submission-contract.js"

type Failure = { readonly case_id: string; readonly reasons: readonly string[] }
type CaseMeasurement = { readonly case_id: string; readonly source_calls: number; readonly result_chars: number; readonly outcome: string; readonly constraints: readonly string[] }
type QaResult = { readonly status: "PASS" | "FAIL"; readonly mode: "contract" | "holdout"; readonly hashes?: { readonly holdout_sha256: string; readonly expected_labels_sha256: string }; readonly cases: { readonly total: number; readonly passed: number }; readonly nonvacuity: { readonly positive: number; readonly no_results: number; readonly invalid_input: number }; readonly failures: readonly Failure[]; readonly measurements: readonly CaseMeasurement[] }

const baseConfig = { host: "127.0.0.1", port: 3345, allowFixture: true, seoulOpenDataBaseUrl: "http://127.0.0.1" } as const

async function callTool(input: Record<string, unknown>, records: readonly FamilyExperienceSourceRecord[]): Promise<{ readonly result: Awaited<ReturnType<Client["callTool"]>>; readonly sourceCalls: number; readonly requests: readonly SourceAdapterRequest[] }> {
  const requests: SourceAdapterRequest[] = []
  const adapter: FamilyExperienceSourceAdapter = { source_id: "culture-portal-oneview", mode: "fixture", list: async (request) => {
    requests.push(request)
    return { ok: true, source_id: "culture-portal-oneview", mode: "fixture", retrieved_at: "2026-07-11T00:00:00.000Z", raw_snapshots: [], records }
  } }
  const server = createFamilyExperienceMcpServer({ config: baseConfig, sourceAdapter: adapter })
  const client = new Client({ name: "sealed-submission-evaluator", version: "1.0.0" })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  try {
    await server.connect(serverTransport); await client.connect(clientTransport)
    return { result: await client.callTool({ name: "find_family_experiences", arguments: input }), sourceCalls: requests.length, requests }
  } finally { await client.close(); await server.close() }
}

function outcomeOf(structured: unknown): string {
  const parsed = FindFamilyExperiencesStructuredContentSchema.safeParse(structured)
  if (!parsed.success) return "invalid_payload"
  return parsed.data.ok ? "positive" : parsed.data.failure.code
}

export async function evaluateHoldout(path: string): Promise<QaResult> {
  const { raw, cases } = await readHoldout(path)
  const manifest = HoldoutManifestSchema.parse(JSON.parse(await readFile(`${path}.manifest.json`, "utf8")))
  const failures: Failure[] = validateManifest(manifest, raw, cases).map((reason) => ({ case_id: "manifest", reasons: [reason] }))
  const measurements: CaseMeasurement[] = []
  if (failures.length === 0) for (const item of cases) {
    const called = await callTool(item.input, item.source_records)
    const chars = JSON.stringify(called.result).length
    const outcome = outcomeOf(called.result.structuredContent)
    const reasons: string[] = []
    if (outcome !== item.expected_label) reasons.push(`outcome ${outcome} != ${item.expected_label}`)
    if (called.sourceCalls !== item.expected_source_calls) reasons.push(`source calls ${called.sourceCalls} != ${item.expected_source_calls}`)
    if (chars > 4_000) reasons.push(`result payload ${chars} > 4000`)
    if (item.expected_label === "positive") {
      const expectedInput = FindFamilyExperiencesInputSchema.safeParse(expectedFactsToInput(item.expected_facts))
      if (expectedInput.success) reasons.push(...checkCandidates(expectedInput.data, item.source_records, called.result.structuredContent))
      else reasons.push("positive expected_facts do not define complete constraints")
    }
    const parsed = FindFamilyExperiencesStructuredContentSchema.safeParse(called.result.structuredContent)
    if (item.expected_label === "invalid_input") {
      const actual = parsed.success && !parsed.data.ok ? parsed.data.failure.missing_fields ?? [] : []
      const expected = item.expected_facts.missing_fields ?? []
      if (JSON.stringify(actual) !== JSON.stringify(expected)) reasons.push(`invalid_input missing_fields ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`)
    }
    if (reasons.length > 0) failures.push({ case_id: item.case_id, reasons })
    measurements.push({ case_id: item.case_id, source_calls: called.sourceCalls, result_chars: chars, outcome, constraints: reasons })
  }
  const counts = { positive: cases.filter(({ expected_label }) => expected_label === "positive").length, no_results: cases.filter(({ expected_label }) => expected_label === "no_results").length, invalid_input: cases.filter(({ expected_label }) => expected_label === "invalid_input").length }
  return { status: failures.length === 0 ? "PASS" : "FAIL", mode: "holdout", hashes: { holdout_sha256: manifest.holdout_sha256, expected_labels_sha256: manifest.expected_labels_sha256 }, cases: { total: cases.length, passed: cases.length - failures.filter(({ case_id }) => case_id !== "manifest").length }, nonvacuity: counts, failures, measurements }
}

export async function evaluateContract(): Promise<QaResult> {
  const here = dirname(fileURLToPath(import.meta.url)); const prd = await readFile(resolve(here, "../docs/PRODUCT_PRD_SOT.md"), "utf8")
  const section = /## Core User Prompts([\s\S]*?)## Public Tool Contract/u.exec(prd)?.[1] ?? ""
  const prompts = [...section.matchAll(/^\d+\. `([^`]+)`$/gmu)].map((match) => match[1]).filter((prompt): prompt is string => prompt !== undefined)
  const failures: Failure[] = []; const measurements: CaseMeasurement[] = []
  if (prompts.length !== 3) failures.push({ case_id: "prd", reasons: ["expected exactly three backtick starter prompts"] })
  const server = createFamilyExperienceMcpServer({ config: baseConfig }); const client = new Client({ name: "contract-surface-evaluator", version: "1.0.0" }); const pair = InMemoryTransport.createLinkedPair()
  try { await server.connect(pair[1]); await client.connect(pair[0]); const tools = await client.listTools(); const annotations = tools.tools[0]?.annotations
    if (tools.tools.length !== 1 || JSON.stringify(tools).length > 4_500 || annotations?.title === undefined || annotations.readOnlyHint !== true || annotations.destructiveHint !== false || annotations.openWorldHint !== true || annotations.idempotentHint !== true) failures.push({ case_id: "tool-list", reasons: ["one-tool/annotation/list-size contract failed"] })
  } finally { await client.close(); await server.close() }
  for (const [index, prompt] of prompts.entries()) { const called = await callTool({ prompt }, []); const chars = JSON.stringify(called.result).length; const outcome = outcomeOf(called.result.structuredContent); const reasons: string[] = []
    if (index === 0) { if (!new Set(["positive", "no_results"]).has(outcome)) reasons.push("starter #1 must succeed or honestly return no_results"); if (chars > 4_000) reasons.push("result exceeds 4000 chars") }
    else { const parsed = FindFamilyExperiencesStructuredContentSchema.safeParse(called.result.structuredContent); if (outcome !== "invalid_input" || !parsed.success || parsed.data.ok || parsed.data.failure.missing_fields?.join(",") !== "location") reasons.push("must be typed invalid_input with exactly [location]"); if (called.sourceCalls !== 0) reasons.push("invalid input called source"); const text = called.result.content[0]; if (text?.type !== "text" || text.text.length > 500) reasons.push("unsafe or non-concise TextContent") }
    if (reasons.length > 0) failures.push({ case_id: `starter-${index + 1}`, reasons }); measurements.push({ case_id: `starter-${index + 1}`, source_calls: called.sourceCalls, result_chars: chars, outcome, constraints: reasons }) }
  return { status: failures.length === 0 ? "PASS" : "FAIL", mode: "contract", cases: { total: prompts.length, passed: prompts.length - failures.filter(({ case_id }) => case_id.startsWith("starter-")).length }, nonvacuity: { positive: measurements.filter(({ outcome }) => outcome === "positive").length, no_results: measurements.filter(({ outcome }) => outcome === "no_results").length, invalid_input: measurements.filter(({ outcome }) => outcome === "invalid_input").length }, failures, measurements }
}

async function writeAtomic(path: string, value: QaResult): Promise<void> { await mkdir(dirname(path), { recursive: true }); const temporary = `${path}.${randomUUID()}.tmp`; try { await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8"); await rename(temporary, path) } finally { await rm(temporary, { force: true }) } }

async function main(): Promise<void> { // no-excuse-ok: catch
  try { const args = process.argv.slice(2); const value = (flag: string): string | undefined => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1] }; const mode = value("--mode"); const output = value("--output"); if (output === undefined || (mode !== "contract" && mode !== "holdout")) throw new Error("usage: --mode contract|holdout [--holdout file.jsonl] --output result.json"); await rm(output, { force: true }); const holdout = value("--holdout"); const result = mode === "contract" ? await evaluateContract() : holdout === undefined ? (() => { throw new Error("--holdout is required") })() : await evaluateHoldout(holdout); await writeAtomic(output, result); process.exitCode = result.status === "PASS" ? 0 : 1
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 }
}
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
