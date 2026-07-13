import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawn } from "node:child_process"

import { describe, expect, it } from "vitest"
import { z } from "zod/v4"

import { validatePerformanceSamples } from "../scripts/qa-compiled-http.js"

const ReceiptSchema = z.object({
  pin: z.literal("PIN:COMPILED_HTTP_MATRIX"),
  status: z.literal("PASS"),
  gates: z.record(z.string(), z.object({ status: z.literal("PASS"), detail: z.unknown() })),
  cleanup: z.object({ pid_dead: z.literal(true), port_free: z.literal(true) }),
})

describe("compiled HTTP performance threshold", () => {
  it("records and enforces both batch and observed per-request averages", () => {
    const summary = validatePerformanceSamples([40, 60, 80], 90)

    expect(summary).toMatchObject({
      samples: 3,
      average_ms: 30,
      observed_average_ms: 60,
      p99_ms: 80,
    })
    expect(() => validatePerformanceSamples([150, 150], 100)).toThrow(
      "observed per-request average",
    )
  })
})

it("writes a passing compiled HTTP QA receipt when the production server satisfies the matrix", async () => {
  // Given: a unique output path for the compiled-production QA receipt.
  const directory = await mkdtemp(join(tmpdir(), "qa-compiled-http-test-"))
  const output = join(directory, "receipt.json")
  const legacyReleaseOutput = resolve(
    import.meta.dirname,
    "../../../.omo/evidence/family-experience-submission-ready/c003-release/compiled-http/receipt.json",
  )
  const legacyBefore = await readOptionalFile(legacyReleaseOutput)

  try {
    // When: the runner drives the compiled server through its real HTTP surface.
    const exitCode = await new Promise<number>((resolveExit, reject) => {
      const child = spawn(
        process.execPath,
        ["--import", "tsx", "scripts/qa-compiled-http.ts", "--output", output],
        { cwd: resolve(import.meta.dirname, ".."), stdio: "pipe" },
      )
      let stderr = ""
      let stdout = ""
      child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
        stdout += chunk
      })
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
        stderr += chunk
      })
      child.once("error", reject)
      child.once("exit", (code) => {
        if (code === null) {
          reject(new Error("compiled HTTP QA runner terminated without an exit code"))
          return
        }
        if (code !== 0) {
          reject(new Error(`compiled HTTP QA runner exited ${code}: ${stdout.slice(-2_000)} ${stderr.slice(-2_000)}`))
          return
        }
        resolveExit(code)
      })
    })

    // Then: execution succeeds and the fail-closed receipt validates.
    expect(exitCode).toBe(0)
    const receipt = ReceiptSchema.parse(JSON.parse(await readFile(output, "utf8")))
    expect(await readOptionalFile(legacyReleaseOutput)).toEqual(legacyBefore)
    expect(Object.keys(receipt.gates).length).toBeGreaterThanOrEqual(8)
    expect(receipt.gates["mcp_lifecycle"]?.detail).toMatchObject({
      pin: "PIN:PERSISTENT_MCP_LIFECYCLE",
      valid_ok: true,
      invalid_code: "invalid_input",
      unknown_safe: true,
    })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}, 180_000)

async function readOptionalFile(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8")
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined
    throw error
  }
}
