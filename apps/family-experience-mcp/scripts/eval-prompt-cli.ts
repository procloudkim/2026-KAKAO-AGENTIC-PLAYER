import { resolve } from "node:path"

export function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index < 0) {
    return undefined
  }
  return process.argv[index + 1]
}

export function hasArg(name: string): boolean {
  return process.argv.includes(name)
}

export function evidenceDir(): string {
  return resolve(argValue("--evidence-dir") ?? resolve(process.cwd(), "../../.omo/evidence/winning-sdd/eval"))
}

export function fixturesDir(): string {
  return resolve(process.cwd(), argValue("--fixtures-dir") ?? "test/fixtures/eval")
}

export function positiveIntArg(name: string): number | undefined {
  const rawValue = argValue(name)
  if (rawValue === undefined) {
    return undefined
  }

  const value = Number.parseInt(rawValue, 10)
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`)
  }
  return value
}
