import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createMcpConcurrencyGate,
  createMcpRateLimiter,
  hashMcpRateLimitKey,
} from "../src/mcpRequestLimits.js"

afterEach(() => {
  vi.useRealTimers()
})

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
    limiter.close()
  })

  it("hashes the raw socket address with a process-scoped secret", () => {
    // Given: one raw socket address and two independent process secrets.
    const rawAddress = "203.0.113.42"
    const firstSecret = new Uint8Array(32).fill(1)
    const secondSecret = new Uint8Array(32).fill(2)

    // When: the rate-limit storage key is derived.
    const first = hashMcpRateLimitKey(rawAddress, firstSecret)
    const second = hashMcpRateLimitKey(rawAddress, secondSecret)

    // Then: the key is bounded, pseudonymous, and cannot be linked across process secrets.
    expect(first).toMatch(/^[a-f0-9]{64}$/u)
    expect(first).not.toContain(rawAddress)
    expect(first).not.toBe(second)
  })

  it("expires a retained rate-limit key without requiring another cleanup scan", () => {
    // Given: a full one-request bucket and a frozen injected application clock.
    vi.useFakeTimers()
    const limiter = createMcpRateLimiter({
      limit: 1,
      windowMs: 10_000,
      now: () => 1_000,
      secret: new Uint8Array(32).fill(3),
    })
    expect(limiter.consume("198.51.100.7")).toEqual({ allowed: true })
    expect(limiter.consume("198.51.100.7")).toEqual({
      allowed: false,
      retryAfterSeconds: 10,
    })

    // When: wall-clock timers reach the bounded retention window.
    vi.advanceTimersByTime(10_000)

    // Then: the old bucket is gone even though the injected cleanup clock did not move.
    expect(limiter.consume("198.51.100.7")).toEqual({ allowed: true })
    limiter.close()
    expect(vi.getTimerCount()).toBe(0)
  })
})
