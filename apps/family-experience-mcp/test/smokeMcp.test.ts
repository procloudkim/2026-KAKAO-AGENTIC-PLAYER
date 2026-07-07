import { spawnSync } from "node:child_process"

import { describe, expect, it } from "vitest"

function runSmokeMcp(args: readonly string[]) {
  return spawnSync(process.execPath, ["--import", "tsx", "scripts/smoke-mcp.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  })
}

describe("smoke MCP CLI", () => {
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
