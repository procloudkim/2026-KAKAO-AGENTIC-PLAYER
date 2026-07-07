import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import * as z from "zod/v4"

import type { FamilyExperienceConfig } from "../src/config.js"
import { callFindFamilyExperiences } from "../src/mcp.js"
import { fixtureSourceAdapter } from "../src/sources/fixture.js"
import type { FamilyExperienceSourceAdapter } from "../src/sources/types.js"
import { evalPromptPathChecks, evalResultChecks, type Check } from "./eval-prompt-checks.js"
import {
  marketScenarioSummary,
  marketSurfaceMetrics,
  type MarketSurfaceMetrics,
} from "./eval-market-metrics.js"
import { argValue, evidenceDir, fixturesDir, hasArg, positiveIntArg } from "./eval-prompt-cli.js"
import { buildCoverageSummary, EvalCoverageSchema } from "./eval-prompt-coverage.js"

const EvalFixtureSchema = z
  .object({
    id: z.string().trim().min(1),
    group: z.string().trim().min(1),
    prompt: z.string().trim().min(1),
    request: z.unknown(),
    expect: z.enum(["success", "clarification", "no_result"]),
    expectUnsupportedClaimFailure: z.boolean().optional(),
    expectDataText: z.string().trim().min(1).optional(),
    coverage: EvalCoverageSchema.optional(),
  })
  .strict()

const EvalFixtureListSchema = z.union([EvalFixtureSchema, z.array(EvalFixtureSchema)])

type EvalFixture = z.infer<typeof EvalFixtureSchema>
type EvalResult = {
  readonly id: string
  readonly group: string
  readonly prompt: string
  readonly expect: EvalFixture["expect"]
  readonly latency_ms: number
  readonly prompt_path: {
    readonly latency_ms: number
    readonly accepted: boolean
  }
  readonly market: {
    readonly structured: MarketSurfaceMetrics
    readonly prompt_path: MarketSurfaceMetrics
  }
  readonly passed: boolean
  readonly checks: readonly Check[]
}
type EvalRuntime = {
  readonly cacheDir?: string
}
type EvalCallOptions = {
  readonly config: FamilyExperienceConfig
  readonly sourceAdapter?: FamilyExperienceSourceAdapter
}

async function loadFixtures(): Promise<readonly EvalFixture[]> {
  const entries = await readdir(fixturesDir(), { withFileTypes: true })
  const fixtures: EvalFixture[] = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue
    }

    const parsed = EvalFixtureListSchema.parse(
      JSON.parse(await readFile(resolve(fixturesDir(), entry.name), "utf8")),
    )
    fixtures.push(...(Array.isArray(parsed) ? parsed : [parsed]))
  }

  return fixtures
}

function directPromptFixture(): EvalFixture | undefined {
  const prompt = argValue("--prompt")
  if (prompt === undefined) {
    return undefined
  }

  if (!hasArg("--expect-clarification")) {
    throw new Error("--prompt currently requires --expect-clarification")
  }

  return {
    id: "direct-prompt",
    group: "direct",
    prompt,
    request: {
      location: "Seoul",
      date_range: { start: "2026-07-04", end: "2026-07-05" },
    },
    expect: "clarification",
  }
}

function evalRuntime(): EvalRuntime {
  const cacheDir = argValue("--cache-dir")
  return cacheDir === undefined ? {} : { cacheDir: resolve(process.cwd(), cacheDir) }
}

async function evaluateFixture(fixture: EvalFixture, runtime: EvalRuntime): Promise<EvalResult> {
  const startedAt = Date.now()
  const result = await callFindFamilyExperiences(fixture.request, evalCallOptions(fixture, runtime))
  const latencyMs = Date.now() - startedAt
  const text = result.content[0]?.type === "text" ? result.content[0].text : ""
  const checks = evalResultChecks({
    fixture,
    isError: result.isError === true,
    text,
    structuredContent: result.structuredContent,
    latencyMs,
  })
  const promptStartedAt = Date.now()
  const promptResult = await callFindFamilyExperiences(
    { prompt: fixture.prompt },
    evalCallOptions(fixture, runtime),
  )
  const promptLatencyMs = Date.now() - promptStartedAt
  const promptText = promptResult.content[0]?.type === "text" ? promptResult.content[0].text : ""
  const promptChecks = evalPromptPathChecks({
    fixture,
    isError: promptResult.isError === true,
    text: promptText,
    structuredContent: promptResult.structuredContent,
  })
  const allChecks = [...checks, ...promptChecks]

  return {
    id: fixture.id,
    group: fixture.group,
    prompt: fixture.prompt,
    expect: fixture.expect,
    latency_ms: latencyMs,
    prompt_path: {
      latency_ms: promptLatencyMs,
      accepted: promptChecks.every((check) => check.passed),
    },
    market: {
      structured: marketSurfaceMetrics({
        fixture,
        isError: result.isError === true,
        structuredContent: result.structuredContent,
        checks,
        unsupportedClaimCheckName: "no_unsupported_claim",
      }),
      prompt_path: marketSurfaceMetrics({
        fixture,
        isError: promptResult.isError === true,
        structuredContent: promptResult.structuredContent,
        checks: promptChecks,
        unsupportedClaimCheckName: "prompt_path_no_unsupported_claim",
      }),
    },
    passed: allChecks.every((check) => check.passed),
    checks: allChecks,
  }
}

function evalCallOptions(fixture: EvalFixture, runtime: EvalRuntime): EvalCallOptions {
  const baseConfig = {
    host: "127.0.0.1",
    port: 3345,
    seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
  }

  if (runtime.cacheDir !== undefined) {
    return {
      config: {
        ...baseConfig,
        allowFixture: false,
        etlCacheDir: runtime.cacheDir,
      },
    }
  }

  if (fixture.expect === "clarification") {
    return {
      config: {
        ...baseConfig,
        allowFixture: true,
      },
    }
  }

  return {
    config: {
      ...baseConfig,
      allowFixture: true,
    },
    sourceAdapter: fixtureSourceAdapter,
  }
}

async function main(): Promise<void> {
  const directFixture = directPromptFixture()
  const group = argValue("--group")
  const runtime = evalRuntime()
  const minimumPrompts = positiveIntArg("--min-prompts")
  const exactPrompts = positiveIntArg("--expected-prompts")
  const fixtures =
    directFixture === undefined
      ? (await loadFixtures()).filter((fixture) => group === undefined || fixture.group === group)
      : [directFixture]

  if (fixtures.length === 0) {
    throw new Error("No eval prompts selected")
  }

  const outputDir = evidenceDir()
  await mkdir(outputDir, { recursive: true })
  const results = []
  for (const fixture of fixtures) {
    results.push(await evaluateFixture(fixture, runtime))
  }

  const passedCount = results.filter((result) => result.passed).length
  const passRate = passedCount / results.length
  const unsupportedClaimFailures = results.flatMap((result) =>
    result.checks.filter((check) => check.name === "no_unsupported_claim" && !check.passed),
  ).length
  const promptPathFailures = results.flatMap((result) =>
    result.checks.filter((check) => check.name.startsWith("prompt_path_") && !check.passed),
  ).length
  const promptPathAcceptedCount = results.filter((result) => result.prompt_path.accepted).length
  const coverage = buildCoverageSummary({
    fixtures,
    minPrompts: minimumPrompts,
    expectedPrompts: exactPrompts,
    required: hasArg("--require-nationwide-coverage"),
  })
  const marketScenarios = marketScenarioSummary(results)
  const summary = {
    prompt_count: results.length,
    passed_count: passedCount,
    pass_rate: Number(passRate.toFixed(4)),
    unsupported_claim_failures: unsupportedClaimFailures,
    prompt_path: {
      accepted_count: promptPathAcceptedCount,
      failure_count: promptPathFailures,
      mode: "public_loose_prompt",
    },
    market_scenarios: marketScenarios,
    coverage,
    latency_ms_max: Math.max(...results.map((result) => result.latency_ms)),
    status:
      passRate >= 0.9 &&
      unsupportedClaimFailures === 0 &&
      promptPathFailures === 0 &&
      marketScenarios.status === "pass" &&
      coverage.status !== "fail"
        ? "pass"
        : "fail",
  }

  await writeFile(resolve(outputDir, "results.json"), `${JSON.stringify(results, null, 2)}\n`, "utf8")
  await writeFile(resolve(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8")
  console.log(JSON.stringify(summary, null, 2))

  if (summary.status !== "pass") {
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "unknown eval failure")
  process.exitCode = 1
})
