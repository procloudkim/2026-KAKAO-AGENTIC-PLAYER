import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client"
import type { z } from "zod/v4"

import { DEFAULT_FAMILY_EXPERIENCE_PORT } from "../src/config.js"
import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"
import type { ChildStage, DateRange } from "../src/types.js"

const toolName = "find_family_experiences"
const waitDelayMs = 250
const fixtureServerPort = DEFAULT_FAMILY_EXPERIENCE_PORT
const sourceFailurePort = 3346
const cardFields: readonly string[] = [
  "title",
  "date_time_venue",
  "fee_age",
  "source_warning",
  "actions",
]
const forbiddenClaims = ["전국 모든 행사", "전국 전체", "예약 가능", "예약가능", "운영 중", "실시간", "live now", "currently open", "suitable for all", "아이에게 적합함"] as const

type GoldenArguments = {
  readonly location: string
  readonly date_range: DateRange
  readonly child_age?: number
  readonly child_stage?: ChildStage
}
type ActionCard = Readonly<Record<string, string>>
type StructuredContent = z.infer<typeof FindFamilyExperiencesStructuredContentSchema>
type Check = { readonly name: string; readonly passed: boolean; readonly detail: string }
type CapturedCall = {
  readonly isError: boolean; readonly text: string; readonly action_cards: readonly ActionCard[]
  readonly structuredContent?: StructuredContent
  readonly transportError?: string
}
type Scenario = {
  readonly id: string; readonly fileName: string; readonly prompt: string
  readonly request: GoldenArguments
  readonly sourceFailureServer: boolean
  readonly evaluate: (call: CapturedCall) => readonly Check[]
}

const scenarios: readonly Scenario[] = [
  {
    id: "happy",
    fileName: "golden-family-experience-happy.json",
    prompt: "이번 토요일 서울에서 4살 아이랑 갈 만한 실내 체험 3개만 골라줘. 너무 멀지 않고 예약/문의 링크가 있으면 좋아.",
    request: { location: "Seoul", date_range: { start: "2026-07-04", end: "2026-07-04" }, child_age: 4 },
    sourceFailureServer: false,
    evaluate: happyChecks,
  },
  {
    id: "missing-age",
    fileName: "golden-family-experience-missing-age.json",
    prompt: "이번 주말 아이랑 갈 만한 체험행사 골라줘.",
    request: { location: "Seoul", date_range: { start: "2026-07-04", end: "2026-07-05" } },
    sourceFailureServer: false,
    evaluate: missingAgeChecks,
  },
  {
    id: "no-result",
    fileName: "golden-family-experience-no-result.json",
    prompt: "오늘 밤 늦게 2살 아이와 갈 수 있는 무료 실내 체험을 찾아줘.",
    request: { location: "Seoul", date_range: { start: "2026-07-02", end: "2026-07-02" }, child_age: 2 },
    sourceFailureServer: false,
    evaluate: noResultChecks,
  },
  {
    id: "source-failure",
    fileName: "golden-family-experience-source-failure.json",
    prompt: "서울에서 4살 아이랑 갈 만한 실내 체험 3개만 골라줘.",
    request: { location: "Seoul", date_range: { start: "2026-07-04", end: "2026-07-04" }, child_age: 4 },
    sourceFailureServer: true,
    evaluate: sourceFailureChecks,
  },
]

function happyChecks(call: CapturedCall): readonly Check[] {
  const candidates = call.structuredContent?.ok === true ? call.structuredContent.candidates : []
  return [
    ck("fixture_mode", call.structuredContent?.mode === "fixture", "fixture mode is visible"),
    ck("exactly_three_candidates", candidates.length === 3, `candidate_count=${candidates.length}`),
    ck("exactly_three_action_cards", call.action_cards.length === 3, `card_count=${call.action_cards.length}`),
    ck("card_fields_complete", call.action_cards.every(hasCompleteActionCard), "every card exposes the parent action contract"),
    ck("card_titles_match_candidates", sameTitles(candidates, call.action_cards), "cards align with returned candidates"),
    ck("no_unsupported_claims", !hasForbiddenClaim(call), "no unsupported public claim text"),
  ]
}

function missingAgeChecks(call: CapturedCall): readonly Check[] {
  const text = `${call.text} ${call.transportError ?? ""}`
  return [
    ck("is_error", call.isError, "missing age does not rank candidates"),
    ck("no_candidates", call.structuredContent?.ok !== true, "no fabricated candidate list"),
    ck("korean_parent_clarification", /아이 나이|발달 단계/.test(call.text), "Korean clarification asks for child age or stage"),
    ck("no_english_sdk_validation", !/Input validation error|Invalid arguments|Provide exactly/.test(text), "main visible text is not SDK validation"),
    ck("no_unsupported_claims", !hasForbiddenClaim(call), "no unsupported public claim text"),
  ]
}

function noResultChecks(call: CapturedCall): readonly Check[] {
  return [
    ck("is_error", call.isError, "no confident result is a safe error outcome"),
    ck("zero_candidates", call.structuredContent?.ok !== true, "no candidates are fabricated"),
    ck("relax_exactly_one_constraint", /날짜 범위 하나만/.test(call.text) && !/예산|거리|실내|budget|distance|indoor/.test(call.text), "suggests relaxing exactly the date range"),
    ck("no_unsupported_claims", !hasForbiddenClaim(call), "no unsupported public claim text"),
  ]
}

function sourceFailureChecks(call: CapturedCall): readonly Check[] {
  return [
    ck("is_error_true", call.isError, "source failure sets isError true"),
    ck("no_candidates", call.structuredContent?.ok !== true, "no candidates on source failure"),
    ck("safe_korean_message", /현재 설정|공식 데이터|fixture 모드/.test(call.text), "safe Korean source-failure text"),
    ck("no_raw_keyed_url", !hasRawSecretOrKeyedUrl(call), "no raw secret or keyed URL"),
  ]
}

async function callTool(targetEndpoint: string, request: GoldenArguments): Promise<CapturedCall> {
  const client = new Client({ name: "family-experience-golden-smoke", version: "0.1.0" })
  const transport = new StreamableHTTPClientTransport(new URL(targetEndpoint))
  try {
    await client.connect(transport)
    const result = await client.callTool({ name: toolName, arguments: request })
    const firstContent = result.content[0]
    const text = firstContent?.type === "text" ? firstContent.text : ""
    const parsed = FindFamilyExperiencesStructuredContentSchema.safeParse(result.structuredContent)
    const base = { isError: result.isError === true, text, action_cards: parseActionCards(text) }
    return parsed.success ? { ...base, structuredContent: parsed.data } : base
  } catch (error: unknown) {
    return { isError: true, text: "", action_cards: [], transportError: error instanceof Error ? error.message : "unknown MCP call failure" }
  } finally {
    await transport.close()
    await client.close()
  }
}

function parseActionCards(text: string): readonly ActionCard[] {
  const cards: ActionCard[] = []
  let draft: Record<string, string> = {}
  for (const line of text.split("\n")) {
    const title = /^\d+\.\s+(.+)$/u.exec(line)?.[1]
    if (title !== undefined) {
      pushComplete(cards, draft)
      draft = { title }
      continue
    }

    const field = /^\s+(날짜·장소|비용·연령|출처|지도|길찾기|공식 확인|확인):\s+(.+)$/u.exec(line)
    if (field === null || field[1] === undefined || field[2] === undefined) continue
    switch (field[1]) {
      case "날짜·장소":
        draft["date_time_venue"] = field[2]
        break
      case "비용·연령":
        draft["fee_age"] = field[2]
        break
      case "출처":
        draft["source_warning"] = field[2]
        break
      case "지도":
      case "길찾기":
      case "공식 확인":
      case "확인":
        draft["actions"] = [draft["actions"], `${field[1]}: ${field[2]}`]
          .filter(isFilled)
          .join(" | ")
        break
    }
  }
  pushComplete(cards, draft)
  return cards
}

function pushComplete(cards: ActionCard[], draft: Record<string, string>): void {
  if (cardFields.every((field) => isFilled(draft[field]))) {
    cards.push({ ...draft })
  }
}

function hasCompleteActionCard(card: ActionCard): boolean {
  return cardFields.every((field) => isFilled(card[field]))
}

function sameTitles(candidates: readonly { readonly title: string }[], cards: readonly ActionCard[]): boolean {
  return candidates.length === cards.length && candidates.every((candidate, index) => candidate.title === cards[index]?.["title"])
}

function evidenceDir(): string {
  return resolve(process.env["EVIDENCE_DIR"] ?? resolve(process.cwd(), "../../.omo/evidence"))
}

function ck(name: string, passed: boolean, detail: string): Check {
  return { name, passed, detail }
}

function isFilled(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0
}

function hasForbiddenClaim(call: CapturedCall): boolean {
  const haystack = JSON.stringify({ text: call.text, action_cards: call.action_cards, structuredContent: call.structuredContent }).toLowerCase()
  return forbiddenClaims.some((claim) => haystack.includes(claim.toLowerCase()))
}

function hasRawSecretOrKeyedUrl(call: CapturedCall): boolean {
  return /SEOUL_OPEN_DATA_KEY|[?&]KEY=|[?&]key=|\/[A-Za-z0-9]{20,}\//.test(JSON.stringify(call))
}

async function withSourceFailureServer<T>(run: (targetEndpoint: string) => Promise<T>): Promise<T> {
  return withServer({ port: sourceFailurePort, allowFixture: false }, run)
}

async function withFixtureServer<T>(run: (targetEndpoint: string) => Promise<T>): Promise<T> {
  if (process.env["MCP_ENDPOINT"] !== undefined) {
    return run(process.env["MCP_ENDPOINT"])
  }

  return withServer({ port: fixtureServerPort, allowFixture: true }, run)
}

async function withServer<T>(
  options: { readonly port: number; readonly allowFixture: boolean },
  run: (targetEndpoint: string) => Promise<T>,
): Promise<T> {
  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(options.port),
    FAMILY_EXPERIENCE_ALLOW_FIXTURE: options.allowFixture ? "true" : "false",
    FAMILY_EXPERIENCE_ETL_CACHE_DIR: resolve(process.cwd(), ".golden-smoke-missing-cache"),
  }
  delete childEnv["SEOUL_OPEN_DATA_KEY"]
  const child = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], { cwd: process.cwd(), env: childEnv, stdio: "pipe", windowsHide: true })
  try {
    await waitForHealth(child, options.port)
    return await run(`http://127.0.0.1:${options.port}/mcp`)
  } finally {
    await stopChild(child)
  }
}

async function waitForHealth(child: ChildProcessWithoutNullStreams, port: number): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`smoke server on port ${port} exited early with code ${child.exitCode}`)
    }
    const response = await fetch(`http://127.0.0.1:${port}/health`).catch(() => undefined)
    if (response !== undefined) {
      return
    }
    await delay(waitDelayMs)
  }
  throw new Error(`smoke server on port ${port} did not become healthy`)
}

async function stopChild(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.exitCode !== null) {
    return
  }
  child.kill("SIGTERM")
  await new Promise<void>((resolveStop) => {
    child.once("exit", () => resolveStop())
    setTimeout(resolveStop, 2_000).unref()
  })
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, milliseconds))
}

async function executeScenario(scenario: Scenario, targetEndpoint: string) {
  const response = await callTool(targetEndpoint, scenario.request)
  const checks = scenario.evaluate(response)
  return { scenario: scenario.id, prompt: scenario.prompt, endpoint: targetEndpoint, request: scenario.request, response, checks, passed: checks.every((item) => item.passed) }
}

async function main(): Promise<void> {
  const outputDir = evidenceDir()
  const artifacts: Awaited<ReturnType<typeof executeScenario>>[] = []
  await mkdir(outputDir, { recursive: true })
  await withFixtureServer(async (fixtureEndpoint) => {
    for (const scenario of scenarios) {
      const artifact = scenario.sourceFailureServer ? await withSourceFailureServer((targetEndpoint) => executeScenario(scenario, targetEndpoint)) : await executeScenario(scenario, fixtureEndpoint)
      await writeFile(resolve(outputDir, scenario.fileName), `${JSON.stringify(artifact, null, 2)}\n`, "utf8")
      artifacts.push(artifact)
    }
  })
  const failures = artifacts.flatMap((artifact) => artifact.checks.filter((item) => !item.passed).map((item) => `${artifact.scenario}:${item.name}:${item.detail}`))
  console.log(JSON.stringify({ artifact_dir: outputDir, scenarios: artifacts.map(summary) }, null, 2))
  if (failures.length > 0) {
    throw new Error(`Golden smoke failed: ${failures.join("; ")}`)
  }
}

function summary(artifact: Awaited<ReturnType<typeof executeScenario>>) {
  return { id: artifact.scenario, passed: artifact.passed, isError: artifact.response.isError }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "unknown golden smoke failure")
  process.exitCode = 1
})
