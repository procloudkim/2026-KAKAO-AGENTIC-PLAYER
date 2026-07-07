const secretEnvNamePattern = /(KEY|SECRET|TOKEN|PASSWORD)/i
const secretLikePattern = /\b[A-Z0-9_]*(?:SECRET|TOKEN|KEY)[A-Z0-9_]{8,}\b/gi
const keyedUrlPattern = /([?&](?:KEY|key|serviceKey|apikey|apiKey|token)=)[A-Za-z0-9][A-Za-z0-9._~-]{7,}/g
const pathKeyPattern = /https?:\/\/[^\s"'<>]+\/[A-Za-z0-9][A-Za-z0-9._~-]{19,}\/(?:json|xml|api|culturalEventInfo)\b/gi
const bearerPattern = /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/g

export function redactOperationalText(text: string): string {
  const envRedacted = secretEnvValues().reduce(
    (current, secret) => current.split(secret).join("<redacted>"),
    text,
  )
  return envRedacted
    .replace(bearerPattern, "Bearer <redacted>")
    .replace(keyedUrlPattern, "$1<redacted>")
    .replace(pathKeyPattern, (url) => redactPathKeyedUrl(url))
    .replace(secretLikePattern, "<redacted>")
}

function redactPathKeyedUrl(url: string): string {
  const parts = url.split("/")
  return parts
    .map((part) => (isSecretLikePathPart(part) ? "<redacted>" : part))
    .join("/")
}

function isSecretLikePathPart(part: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._~-]{19,}$/.test(part)
}

function secretEnvValues(): readonly string[] {
  return Object.entries(process.env)
    .filter(([name, value]) => secretEnvNamePattern.test(name) && value !== undefined && value.length >= 8)
    .map(([, value]) => value ?? "")
    .filter((value) => value.length >= 8)
}
