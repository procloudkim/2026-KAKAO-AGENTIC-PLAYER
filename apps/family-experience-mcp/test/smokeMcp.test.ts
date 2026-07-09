import { spawnSync } from "node:child_process"

import { describe, expect, it } from "vitest"
import { z } from "zod/v4"

process.env["FAMILY_EXPERIENCE_REFERENCE_DATE"] = "2026-07-04"

const SmokeReportSchema = z.object({
  called: z.literal("recommend_family_experiences"),
  candidate_count: z.number(),
  failure_code: z.string().optional(),
  prompt: z.string(),
  result_ok: z.boolean(),
  text: z.string(),
  tools: z.array(z.string()).min(5),
})

function runSmokeMcp(args: readonly string[]) {
  return spawnSync(process.execPath, ["--import", "tsx", "scripts/smoke-mcp.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  })
}

describe("smoke MCP CLI", () => {
  it("returns a Seoul preschool indoor candidate for the PlayMCP starter prompt", () => {
    // Given: PlayMCP calls the public MCP tool with the starter prompt users see first.
    const prompt = "이번 주말 서울에서 4살 아이와 갈 만한 실내 체험 장소"

    // When: the smoke runs through the real MCP client/server surface with seeded cache data.
    const result = runSmokeMcp(["--assert-tool-count=6", "--prompt", prompt])

    // Then: the response is a useful source-grounded candidate, not a configuration failure.
    expect(result.status).toBe(0)
    expect(result.stderr).toBe("")
    const report = SmokeReportSchema.parse(JSON.parse(result.stdout))
    expect(report).toMatchObject({ prompt, result_ok: true })
    expect(report.candidate_count).toBeGreaterThanOrEqual(1)
    expect(report.failure_code).toBeUndefined()
    expect(report.text).toContain("source_name:")
    expect(report.text).toContain("source_url:")
    expect(report.text).toContain("parent_check:")
    expect(report.text).toContain("next_action:")
  })

  it("keeps starter edge prompts out of the missing-configuration path", () => {
    // Given: PlayMCP starter prompts include infant/rainy-day and vague school-age requests.
    const prompts = [
      "내일 비가 오는데 24개월 아이와 갈 수 있는 키즈 체험이나 박물관을 찾아줘",
      "초등학교 저학년 아이와 주말에 갈 수 있는 가족 행사 3개를 출처와 함께 정리해줘",
    ] as const

    for (const prompt of prompts) {
      // When: each prompt is sent through the real smoke client path.
      const result = runSmokeMcp(["--assert-tool-count=6", "--prompt", prompt])

      // Then: no starter prompt should fail as a deployment/configuration problem.
      expect(result.status).toBe(0)
      expect(result.stderr).toBe("")
      const report = SmokeReportSchema.parse(JSON.parse(result.stdout))
      expect(report).toMatchObject({ prompt, result_ok: true })
      expect(report.candidate_count).toBeGreaterThanOrEqual(1)
      expect(report.failure_code).toBeUndefined()
    }
  })

  it("uses the prompt passed as a space-separated CLI value", () => {
    // Given: the documented Todo 11 smoke command passes --prompt and its value as separate argv tokens.
    const prompt = "2099년 화성에서 초등학생이 참여할 수 있는 체험행사 3개"

    // When: the smoke runs through the real CLI surface and expects the no-result error path.
    const result = runSmokeMcp(["--skip-seed", "--prompt", prompt, "--expect-error"])

    // Then: the report proves the supplied prompt reached the MCP call instead of the default prompt.
    expect(result.status).toBe(0)
    expect(result.stderr).toBe("")
    expect(JSON.parse(result.stdout)).toMatchObject({
      prompt,
      result_ok: false,
      failure_code: "missing_configuration",
      candidate_count: 0,
    })
  })
})
