import { describe, expect, it } from "vitest"

import {
  validateConcurrentPerformanceSamples,
  validatePerformanceSamples,
} from "../scripts/qa-compiled-http.js"

// The process-level compiled HTTP matrix is owned by qa:submission, which runs it
// once with a fresh receipt after Vitest. Keep this file to deterministic unit checks.
describe("compiled HTTP performance threshold", () => {
  it("records batch diagnostics while enforcing the observed per-request average", () => {
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
    expect(validatePerformanceSamples([40, 60, 80], 900).average_ms).toBe(300)
  })

  it("separates concurrent throughput from queued request wall time without weakening p99", () => {
    const summary = validateConcurrentPerformanceSamples([110, 110], 100)

    expect(summary).toMatchObject({
      samples: 2,
      average_ms: 50,
      observed_average_ms: 110,
      p99_ms: 110,
    })
    expect(() => validateConcurrentPerformanceSamples([110, 110], 250)).toThrow(
      "concurrent throughput average",
    )
    expect(() => validateConcurrentPerformanceSamples([3_001], 100)).toThrow(
      "concurrent p99",
    )
  })
})
