export const MAX_CACHE_FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1_000

export type CacheFreshness =
  | { readonly status: "invalid" }
  | {
      readonly status: "fresh" | "stale"
      readonly ageSeconds: number
      readonly expiresAtMs: number
    }

export function assessCacheFreshness(input: {
  readonly generatedAt: string
  readonly now: Date
  readonly ttlHours: number
}): CacheFreshness {
  const generatedAtMs = Date.parse(input.generatedAt)
  const nowMs = input.now.getTime()

  if (
    !Number.isFinite(generatedAtMs) ||
    !Number.isFinite(nowMs) ||
    generatedAtMs - nowMs > MAX_CACHE_FUTURE_CLOCK_SKEW_MS
  ) {
    return { status: "invalid" }
  }

  const expiresAtMs = generatedAtMs + input.ttlHours * 60 * 60 * 1_000
  return {
    status: expiresAtMs < nowMs ? "stale" : "fresh",
    ageSeconds: Math.max(0, Math.floor((nowMs - generatedAtMs) / 1_000)),
    expiresAtMs,
  }
}
