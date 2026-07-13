import { describe, expect, it } from "vitest"

import { createMcpConcurrencyGate, createMcpRateLimiter } from "../src/mcpRequestLimits.js"

describe("MCP concurrency gate", () => {
  it("PIN:RATE_AND_CONCURRENCY limits only simultaneous work and releases capacity", () => {
    // Given: two concurrent MCP requests occupy all process capacity.
    const gate = createMcpConcurrencyGate(2)
    const releaseFirst = gate.tryEnter()
    const releaseSecond = gate.tryEnter()
    if (releaseFirst === undefined || releaseSecond === undefined) {
      throw new Error("Expected initial concurrency capacity")
    }

    // When: another request arrives before either active request completes.
    const blocked = gate.tryEnter()

    // Then: it is rejected until one active request releases its slot.
    expect(blocked).toBeUndefined()
    releaseFirst()
    const releaseThird = gate.tryEnter()
    expect(releaseThird).toBeTypeOf("function")
    releaseSecond()
    releaseThird?.()
  })

  it("PIN:RATE_AND_CONCURRENCY bounds sequential invocations per stable socket key", () => {
    // Given: a two-request window and a deterministic clock.
    let nowMs = 1_000
    const limiter = createMcpRateLimiter({ limit: 2, windowMs: 10_000, now: () => nowMs })

    // When: one stable socket key attempts three invocations in the same window.
    const first = limiter.consume("127.0.0.1")
    const second = limiter.consume("127.0.0.1")
    const third = limiter.consume("127.0.0.1")

    // Then: only the third invocation is limited, with an integer retry delay.
    expect(first).toEqual({ allowed: true })
    expect(second).toEqual({ allowed: true })
    expect(third).toEqual({ allowed: false, retryAfterSeconds: 10 })
    nowMs += 10_000
    expect(limiter.consume("127.0.0.1")).toEqual({ allowed: true })
  })
})
