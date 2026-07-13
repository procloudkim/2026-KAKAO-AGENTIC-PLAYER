export const MAX_CACHE_FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1_000
export const MAX_CACHE_STALE_GRACE_HOURS = 7 * 24

export type CacheFreshness =
  | { readonly status: "invalid" }
  | {
      readonly status: "fresh" | "stale"
      readonly ageSeconds: number
      readonly expiresAtMs: number
    }

export type CacheServingFreshness =
  | { readonly status: "invalid" }
  | {
      readonly status: "fresh" | "stale_servable" | "expired"
      readonly ageSeconds: number
      readonly expiresAtMs: number
      readonly staleGraceExpiresAtMs: number
    }

export function defaultCacheStaleGraceHours(ttlHours: number): number {
  if (!Number.isFinite(ttlHours) || ttlHours <= 0) {
    return 0
  }

  return Math.min(ttlHours, MAX_CACHE_STALE_GRACE_HOURS)
}

export function assessCacheFreshness(input: {
  readonly generatedAt: string
  readonly now: Date
  readonly ttlHours: number
}): CacheFreshness {
  const clock = parseCacheClock(input)
  if (clock === undefined) {
    return { status: "invalid" }
  }

  return {
    status: clock.expiresAtMs < clock.nowMs ? "stale" : "fresh",
    ageSeconds: clock.ageSeconds,
    expiresAtMs: clock.expiresAtMs,
  }
}

export function assessCacheServingFreshness(input: {
  readonly generatedAt: string
  readonly now: Date
  readonly staleGraceHours: number
  readonly ttlHours: number
}): CacheServingFreshness {
  const clock = parseCacheClock(input)
  if (
    clock === undefined ||
    !Number.isFinite(input.staleGraceHours) ||
    input.staleGraceHours < 0 ||
    input.staleGraceHours > MAX_CACHE_STALE_GRACE_HOURS
  ) {
    return { status: "invalid" }
  }

  const staleGraceExpiresAtMs = clock.expiresAtMs + input.staleGraceHours * 60 * 60 * 1_000
  if (!Number.isFinite(staleGraceExpiresAtMs)) {
    return { status: "invalid" }
  }

  return {
    status:
      clock.nowMs <= clock.expiresAtMs
        ? "fresh"
        : clock.nowMs <= staleGraceExpiresAtMs
          ? "stale_servable"
          : "expired",
    ageSeconds: clock.ageSeconds,
    expiresAtMs: clock.expiresAtMs,
    staleGraceExpiresAtMs,
  }
}

function parseCacheClock(input: {
  readonly generatedAt: string
  readonly now: Date
  readonly ttlHours: number
}):
  | {
      readonly ageSeconds: number
      readonly expiresAtMs: number
      readonly generatedAtMs: number
      readonly nowMs: number
    }
  | undefined {
  const generatedAtMs = Date.parse(input.generatedAt)
  const nowMs = input.now.getTime()
  const expiresAtMs = generatedAtMs + input.ttlHours * 60 * 60 * 1_000

  if (
    !Number.isFinite(generatedAtMs) ||
    !Number.isFinite(nowMs) ||
    !Number.isFinite(input.ttlHours) ||
    input.ttlHours <= 0 ||
    !Number.isFinite(expiresAtMs) ||
    generatedAtMs - nowMs > MAX_CACHE_FUTURE_CLOCK_SKEW_MS
  ) {
    return undefined
  }

  return {
    generatedAtMs,
    nowMs,
    expiresAtMs,
    ageSeconds: Math.max(0, Math.floor((nowMs - generatedAtMs) / 1_000)),
  }
}
