export function isSafeNoResultFailure(input: {
  readonly code: string
  readonly message: string
}): boolean {
  if (input.code === "no_results") {
    return true
  }

  return input.code === "missing_configuration" && /no matching records/i.test(input.message)
}
