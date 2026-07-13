import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { describe, expect, it } from "vitest"

import { buildMetadata, writeCache } from "../src/etl/cache.js"
import { parseLooseFamilyPrompt } from "../src/promptParser.js"
import type { FamilyExperienceSourceRecord, RawSourceSnapshot } from "../src/sources/types.js"
import {
  EXPECTED_PRODUCTION_SOURCE_SET,
  parseStarterMessages,
  runProductionCacheQa,
  type ProductionCacheQaReceipt,
} from "../scripts/qa-production-cache.js"

const STARTERS = [
  "이번 주말 서울에서 4살 아이와 갈 만한 실내 체험 장소를 추천해줘.",
  "내일 서울에서 비가 와도 24개월 아이와 갈 수 있는 키즈 체험이나 박물관을 찾아줘.",
  "이번 주말 부산에서 초등학교 저학년 아이와 갈 수 있는 가족 행사 3개를 출처와 함께 정리해줘.",
] as const

type Scenario = {
  readonly root: string
  readonly cacheDir: string
  readonly starterDoc: string
  readonly output: string
}

async function makeScenario(input: {
  readonly fixture?: boolean
  readonly generatedAt?: string
  readonly invalidAgeEvidenceIndex?: number
  readonly prompts?: readonly string[]
  readonly sourceSet?: readonly ["kto_tourapi"] | readonly ["culture_portal"]
} = {}): Promise<Scenario> {
  const root = await mkdtemp(join(tmpdir(), "qa-production-cache-"))
  const cacheDir = join(root, "cache")
  const starterDoc = join(root, "starters.md")
  const output = join(root, "receipt.json")
  const prompts = input.prompts ?? STARTERS
  const fixture = input.fixture ?? false
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const sourceSet = input.sourceSet ?? EXPECTED_PRODUCTION_SOURCE_SET
  const records = STARTERS.map((prompt, index) => recordForPrompt(prompt, index + 1, fixture))
  const rawSnapshots = STARTERS.flatMap((_, index) => rawSnapshotsForRecord(
    index + 1,
    generatedAt,
    input.invalidAgeEvidenceIndex === index + 1 ? "wrong-content-id" : undefined,
  ))
  const metadata = buildMetadata({
    generatedAt,
    fixture,
    maxPages: 1,
    mode: "write-cache",
    rawSnapshots,
    records,
    sourceSet,
    sourceSummaries: [{ ok: true, records: records.length, raw_snapshots: rawSnapshots.length }],
    ttlHours: 24,
  })

  await writeCache({ cacheDir, metadata, rawSnapshots, records })
  await writeFile(starterDoc, starterMarkdown(prompts), "utf8")
  return { root, cacheDir, starterDoc, output }
}

function recordForPrompt(
  prompt: string,
  index: number,
  fixture: boolean,
): FamilyExperienceSourceRecord {
  const parsed = parseLooseFamilyPrompt(prompt)
  if (!parsed.ok) throw new Error(`test starter ${index} did not parse`)
  const rawSnapshotId = `kto-tourapi-events:search:test-${index}`
  const ageEvidenceSnapshotId = `kto-tourapi-events:detail:test-${index}`
  const childStages = parsed.input.child_stage === undefined
    ? ["infant", "toddler", "preschool", "school_age"] as const
    : [parsed.input.child_stage]

  return {
    id: `kto-tourapi-events:test-${index}`,
    raw_snapshot_id: rawSnapshotId,
    age_evidence_snapshot_id: ageEvidenceSnapshotId,
    mode: fixture ? "fixture" : "live",
    title: `KTO family experience ${index}`,
    city: parsed.input.location,
    date: {
      start: parsed.input.date_range.start,
      end: parsed.input.date_range.end,
      time_text: "10:00-17:00",
    },
    venue: {
      name: `KTO venue ${index}`,
      address: `${parsed.input.location} official venue ${index}`,
    },
    source: {
      id: "kto-tourapi-events",
      mode: fixture ? "fixture" : "live",
      url: `https://apis.data.go.kr/B551011/KorService2/detailIntro2?contentId=test-${index}`,
      raw_snapshot_id: rawSnapshotId,
    },
    retrieved_at: new Date().toISOString(),
    confidence: {
      date: "api-returned",
      venue: "api-returned",
      age_fit: "source-stated",
      reservation: "unknown",
    },
    parent_check: {
      age_fit: "The source listing states a child age range for this family program.",
      reservation: "confirmation_needed",
      live_status: fixture ? "fixture_not_live" : "source_timestamp_required",
    },
    child_stages: childStages,
    min_child_age: 0,
    max_child_age: 17,
    indoor_outdoor: parsed.input.indoor_outdoor_preference ?? "mixed",
    target_age_text: "children ages 0-17 with a guardian",
    program_text: `Official family program listing ${index}.`,
    reservation_url: null,
    contact: null,
    fee_text: "Confirm fees on the official source.",
    tags: ["family", ...(parsed.input.keywords ?? [])],
    suitability: "happy_prompt_match",
    fixture_notice: "Synthetic KTO-shaped cache record used only by this test.",
  }
}

function rawSnapshotsForRecord(
  index: number,
  retrievedAt: string,
  contentIdOverride?: string,
): readonly RawSourceSnapshot[] {
  return [
    {
      snapshot_id: `kto-tourapi-events:search:test-${index}`,
      source_id: "kto-tourapi-events",
      retrieved_at: retrievedAt,
      request_hash: `search-${index}`,
      payload_ref: "searchFestival2",
      response_sha256: `${index}`.repeat(64),
    },
    {
      snapshot_id: `kto-tourapi-events:detail:test-${index}`,
      source_id: "kto-tourapi-events",
      retrieved_at: retrievedAt,
      request_hash: `detail-${index}`,
      payload_ref: "detailIntro2",
      response_sha256: `${index}`.repeat(64),
      evidence: {
        content_id: contentIdOverride ?? `test-${index}`,
        age_limit: "children ages 0-17 with a guardian",
      },
    },
  ]
}

function starterMarkdown(prompts: readonly string[]): string {
  return [
    "# Registration test",
    "1. 이 번호 문장은 Starter Messages 밖에 있으므로 실행하면 안 됩니다.",
    "",
    "## Starter Messages",
    "",
    ...prompts.map((prompt, index) => `${index + 1}. ${prompt}`),
    "",
    "Starter 설명 문장은 실행 대상이 아닙니다.",
    "",
    "## Later Section",
    "",
    "1. 이 번호 문장도 실행하면 안 됩니다.",
    "",
  ].join("\n")
}

async function runCli(scenario: Scenario): Promise<{
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(
      process.execPath,
      [
        "--import",
        "tsx",
        "scripts/qa-production-cache.ts",
        "--cache-dir",
        scenario.cacheDir,
        "--expected-source-set",
        "kto_tourapi",
        "--starter-doc",
        scenario.starterDoc,
        "--output",
        scenario.output,
      ],
      { cwd: resolve(import.meta.dirname, ".."), stdio: "pipe" },
    )
    let stdout = ""
    let stderr = ""
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk })
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk })
    child.once("error", reject)
    child.once("exit", (code) => {
      if (code === null) {
        reject(new Error("production cache QA terminated without an exit code"))
        return
      }
      resolveRun({ exitCode: code, stdout, stderr })
    })
  })
}

describe("production cache QA", () => {
  it("emits and writes literal PASS for exactly the three Starter Messages", async () => {
    const scenario = await makeScenario()

    try {
      expect(parseStarterMessages(await readFile(scenario.starterDoc, "utf8"))).toEqual(STARTERS)

      const cli = await runCli(scenario)
      expect(cli.exitCode).toBe(0)
      expect(cli.stderr).toBe("")
      const stdoutReceipt = JSON.parse(cli.stdout) as ProductionCacheQaReceipt
      const writtenReceipt = JSON.parse(await readFile(scenario.output, "utf8")) as ProductionCacheQaReceipt

      expect(stdoutReceipt).toEqual(writtenReceipt)
      expect(stdoutReceipt).toMatchObject({
        status: "PASS",
        expected_source_set: ["kto_tourapi"],
        source_set: ["kto_tourapi"],
        eligible_count: 3,
        failures: [],
      })
      expect(stdoutReceipt.starters).toHaveLength(3)
      expect(stdoutReceipt.starters.every((starter) =>
        starter.result === "PASS" &&
        starter.candidate_count >= 1 &&
        starter.candidate_count <= 3 &&
        starter.result_characters <= 4_000
      )).toBe(true)
      expect(stdoutReceipt.hashes).toMatchObject({
        metadata_sha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
        normalized_records_sha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
        raw_snapshots_sha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
        starter_doc_sha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
      })
      expect(JSON.stringify(stdoutReceipt)).not.toContain(scenario.root)
    } finally {
      await rm(scenario.root, { recursive: true, force: true })
    }
  })

  it("rejects a stale live cache before starter execution", async () => {
    const scenario = await makeScenario({ generatedAt: "2020-01-01T00:00:00.000Z" })

    try {
      const receipt = await runProductionCacheQa({
        cacheDir: scenario.cacheDir,
        expectedSourceSet: EXPECTED_PRODUCTION_SOURCE_SET,
        starterDoc: scenario.starterDoc,
      })
      expect(receipt.status).toBe("FAIL")
      expect(receipt.failures).toContain("cache_status_must_be_fresh_live")
      expect(receipt.starters.every((starter) => starter.failure_code === "cache_preflight_failed")).toBe(true)
    } finally {
      await rm(scenario.root, { recursive: true, force: true })
    }
  })

  it("rejects a fixture cache when production fixture mode is disabled", async () => {
    const scenario = await makeScenario({ fixture: true })

    try {
      const receipt = await runProductionCacheQa({
        cacheDir: scenario.cacheDir,
        expectedSourceSet: EXPECTED_PRODUCTION_SOURCE_SET,
        starterDoc: scenario.starterDoc,
      })
      expect(receipt.status).toBe("FAIL")
      expect(receipt.failures).toContain("cache_fixture_must_be_false")
      expect(receipt.failures).toContain("cache_status_must_be_fresh_live")
    } finally {
      await rm(scenario.root, { recursive: true, force: true })
    }
  })

  it("rejects a fresh eligible cache when any exact starter has no result", async () => {
    const prompts = [
      "이번 주말 제주에서 4살 아이와 갈 만한 체험 장소를 추천해줘.",
      STARTERS[1],
      STARTERS[2],
    ] as const
    const scenario = await makeScenario({ prompts })

    try {
      const receipt = await runProductionCacheQa({
        cacheDir: scenario.cacheDir,
        expectedSourceSet: EXPECTED_PRODUCTION_SOURCE_SET,
        starterDoc: scenario.starterDoc,
      })
      expect(receipt.status).toBe("FAIL")
      expect(receipt.eligible_count).toBe(3)
      expect(receipt.starters[0]).toMatchObject({
        prompt: prompts[0],
        result: "FAIL",
        candidate_count: 0,
        failure_code: "no_results",
      })
      expect(receipt.failures).toContain("starter_1:no_results")
    } finally {
      await rm(scenario.root, { recursive: true, force: true })
    }
  })

  it("rejects source-stated KTO age data without matching detail evidence", async () => {
    const scenario = await makeScenario({ invalidAgeEvidenceIndex: 2 })

    try {
      const receipt = await runProductionCacheQa({
        cacheDir: scenario.cacheDir,
        expectedSourceSet: EXPECTED_PRODUCTION_SOURCE_SET,
        starterDoc: scenario.starterDoc,
      })

      expect(receipt.status).toBe("FAIL")
      expect(receipt.eligible_count).toBe(2)
      expect(receipt.failures).toEqual(expect.arrayContaining([
        "cache_contract_invalid",
        "cache_kto_age_evidence_invalid",
        "cache_requires_three_age_eligible_records",
      ]))
      expect(receipt.starters.every((starter) => starter.failure_code === "cache_preflight_failed")).toBe(true)
    } finally {
      await rm(scenario.root, { recursive: true, force: true })
    }
  })

  it("rejects metadata that does not match the explicit production source set", async () => {
    const scenario = await makeScenario({ sourceSet: ["culture_portal"] })

    try {
      const receipt = await runProductionCacheQa({
        cacheDir: scenario.cacheDir,
        expectedSourceSet: EXPECTED_PRODUCTION_SOURCE_SET,
        starterDoc: scenario.starterDoc,
      })

      expect(receipt).toMatchObject({
        status: "FAIL",
        expected_source_set: ["kto_tourapi"],
        source_set: ["culture_portal"],
      })
      expect(receipt.failures).toContain("cache_source_set_mismatch")
      expect(receipt.starters.every((starter) => starter.failure_code === "cache_preflight_failed")).toBe(true)
    } finally {
      await rm(scenario.root, { recursive: true, force: true })
    }
  })
})
