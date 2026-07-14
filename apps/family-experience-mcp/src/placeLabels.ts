const MEANINGLESS_PLACE_LABELS = new Set([
  "행사장",
  "장소",
  "미정",
  "장소 미정",
  "venue",
  "place",
  "unknown",
  "tbd",
  "t.b.d.",
  "to be determined",
  "n/a",
  "na",
])

export function normalizeKakaoDestinationLabel(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

export function isMeaningfulPlaceLabel(value: string): boolean {
  const normalized = normalizeKakaoDestinationLabel(value).toLowerCase()
  return normalized.length > 0 && !MEANINGLESS_PLACE_LABELS.has(normalized)
}

export function encodeKakaoDestinationLabel(value: string): string {
  return encodeURIComponent(normalizeKakaoDestinationLabel(value)).replace(
    /[!'()*]/gu,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

export function escapeMarkdownLinkLabel(value: string): string {
  return escapeMarkdownText(normalizeKakaoDestinationLabel(value))
}

export function escapeMarkdownText(value: string): string {
  return value
    .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/[\\`*_{}\[\]<>|]/gu, "\\$&")
}
