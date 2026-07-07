export function redactDiagnosticText(text: string, env: NodeJS.ProcessEnv = process.env): string {
  const secretNames = [
    "SEOUL_OPEN_DATA_KEY",
    "CULTURE_PORTAL_SERVICE_KEY",
    "KTO_TOURAPI_SERVICE_KEY",
    "PUBLIC_DATA_STANDARD_SERVICE_KEY",
  ] as const
  const envRedacted = secretNames.reduce((current, name) => {
    const value = env[name]
    if (value === undefined || value.trim().length < 4) {
      return current
    }
    return current
      .split(value)
      .join("<redacted>")
      .split(encodeURIComponent(value))
      .join("<redacted>")
  }, text)

  return envRedacted
    .replaceAll(/([?&](?:serviceKey|apiKey|KEY|key)=)(?!<redacted>|%3Credacted%3E)[^&\s"']+/g, "$1<redacted>")
    .replaceAll(/\/[A-Za-z0-9_-]{20,}(\/json\/)/g, "/<redacted>$1")
}
