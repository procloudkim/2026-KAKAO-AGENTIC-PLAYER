import { describe, expect, it } from "vitest"

import {
  createGracefulShutdown,
  lifecycleModeForPlatform,
  lifecycleModeForRun,
} from "../src/serverLifecycle.js"

describe("server lifecycle platform mode", () => {
  it("uses signal-only shutdown outside Windows", () => {
    // Given: the service runs in the Linux deployment container or on macOS.
    const nonWindowsPlatforms = ["linux", "darwin"] as const

    // When / Then: MSYS ancestor probing is disabled on both platforms.
    for (const platform of nonWindowsPlatforms) {
      expect(lifecycleModeForPlatform(platform)).toBe("signals_only")
    }
  })

  it("retains the Windows ancestor watcher for Git Bash development", () => {
    // Given / When: the service runs on Windows.
    const mode = lifecycleModeForPlatform("win32")

    // Then: the Windows-specific watcher remains enabled.
    expect(mode).toBe("windows_ancestors")
    expect(lifecycleModeForRun("win32", [])).toBe("windows_ancestors")
    expect(lifecycleModeForRun("win32", ["--signals-only"])).toBe("signals_only")
  })

  it("PIN:GRACEFUL_DRAIN waits for listener close before a successful exit", () => {
    // Given: shutdown dependencies expose completion and a bounded force timer.
    const events: string[] = []
    let completeClose: ((error?: Error) => void) | undefined
    let force: (() => void) | undefined
    const shutdown = createGracefulShutdown({
      graceMs: 5_000,
      close: (complete) => { events.push("close"); completeClose = complete },
      forceClose: () => events.push("force-close"),
      exit: (code) => events.push(`exit:${code}`),
      schedule: (callback, delayMs) => { events.push(`timer:${delayMs}`); force = callback; return 1 },
      cancel: () => events.push("cancel"),
    })

    // When: graceful shutdown begins and the listener completes normally.
    shutdown()
    expect(events).toEqual(["timer:5000", "close"])
    completeClose?.()

    // Then: completion cancels force-close and exits successfully exactly once.
    expect(events).toEqual(["timer:5000", "close", "cancel", "exit:0"])
    force?.()
    expect(events).toEqual(["timer:5000", "close", "cancel", "exit:0"])
  })

  it("PIN:GRACEFUL_DRAIN force-closes and exits nonzero when grace expires", () => {
    // Given: the listener does not finish draining before the configured grace.
    const events: string[] = []
    let force: (() => void) | undefined
    const shutdown = createGracefulShutdown({
      graceMs: 8_000,
      close: () => events.push("close"),
      forceClose: () => events.push("force-close"),
      exit: (code) => events.push(`exit:${code}`),
      schedule: (callback) => { force = callback; return 1 },
      cancel: () => events.push("cancel"),
    })

    // When: the grace timer expires.
    shutdown()
    force?.()

    // Then: active connections are forced closed and incomplete work is not reported as success.
    expect(events).toEqual(["close", "force-close", "exit:1"])
  })

  it("PIN:GRACEFUL_DRAIN waits for active request cleanup after listener close", async () => {
    // Given: listener close can finish before request-scoped MCP cleanup drains.
    const events: string[] = []
    let completeClose: ((error?: Error) => void) | undefined
    let completeDrain: (() => void) | undefined
    const drain = new Promise<void>((resolve) => { completeDrain = resolve })
    const shutdown = createGracefulShutdown({
      graceMs: 5_000,
      close: (complete) => { events.push("close"); completeClose = complete },
      drain: async () => { events.push("drain"); await drain },
      forceClose: () => events.push("force-close"),
      exit: (code) => events.push(`exit:${code}`),
      schedule: () => 1,
      cancel: () => events.push("cancel"),
    })

    // When: the listener closes while one request cleanup is still pending.
    shutdown()
    completeClose?.()
    expect(events).toEqual(["close", "drain"])
    completeDrain?.()
    await drain
    await Promise.resolve()

    // Then: successful exit occurs only after the request drain completes.
    expect(events).toEqual(["close", "drain", "cancel", "exit:0"])
  })
})
