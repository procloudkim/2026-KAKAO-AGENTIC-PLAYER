import {
  DEFAULT_FAMILY_EXPERIENCE_ETL_CACHE_DIR,
  DEFAULT_FAMILY_EXPERIENCE_ETL_MAX_PAGES,
  DEFAULT_FAMILY_EXPERIENCE_ETL_TTL_HOURS,
  FAMILY_EXPERIENCE_SOURCE_SET_VALUES,
  loadFamilyExperienceConfig,
  type FamilyExperienceSourceSetEntry,
} from "../config.js"
import { NationwideEtlInputError } from "./errors.js"
import type { NationwideEtlOptions } from "./nationwide.js"

type CliParseInput = {
  readonly args: readonly string[]
  readonly env?: NodeJS.ProcessEnv
}

type FlagState = {
  readonly cacheDir?: string
  readonly fixture: boolean
  readonly maxPages?: number
  readonly mode: "dry-run" | "write-cache"
  readonly sourceSet?: readonly FamilyExperienceSourceSetEntry[]
  readonly ttlHours?: number
}

export function parseNationwideEtlArgs(input: CliParseInput): NationwideEtlOptions {
  const config = loadFamilyExperienceConfig(input.env)
  const state = parseFlags(input.args)
  const sourceSet = state.sourceSet ?? config.sourceSet ?? ["kto_tourapi"]
  const maxPages = state.maxPages ?? config.etlMaxPages ?? DEFAULT_FAMILY_EXPERIENCE_ETL_MAX_PAGES
  if (maxPages > 10) {
    throw new NationwideEtlInputError("--max-pages must be at most 10")
  }

  return {
    cacheDir: state.cacheDir ?? config.etlCacheDir ?? DEFAULT_FAMILY_EXPERIENCE_ETL_CACHE_DIR,
    fixture: state.fixture,
    maxPages,
    mode: state.mode,
    sourceSet,
    ttlHours: state.ttlHours ?? config.etlTtlHours ?? DEFAULT_FAMILY_EXPERIENCE_ETL_TTL_HOURS,
    ...(input.env === undefined ? {} : { env: input.env }),
  }
}

function parseFlags(args: readonly string[]): FlagState {
  const mutableSources: FamilyExperienceSourceSetEntry[] = []
  let cacheDir: string | undefined
  let fixture = false
  let maxPages: number | undefined
  let mode: "dry-run" | "write-cache" | undefined
  let ttlHours: number | undefined

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === undefined) {
      continue
    }
    const nextValue = args[index + 1]
    if (arg === "--fixture") {
      fixture = true
    } else if (arg === "--live") {
      fixture = false
    } else if (arg === "--dry-run") {
      mode = setMode(mode, "dry-run")
    } else if (arg === "--write-cache") {
      mode = setMode(mode, "write-cache")
    } else if (arg === "--source" || arg === "--sources" || arg === "--source-set") {
      mutableSources.push(...parseSourceSet(nextValue, arg))
      index += 1
    } else if (arg.startsWith("--source=")) {
      mutableSources.push(...parseSourceSet(arg.slice("--source=".length), "--source"))
    } else if (arg.startsWith("--sources=")) {
      mutableSources.push(...parseSourceSet(arg.slice("--sources=".length), "--sources"))
    } else if (arg.startsWith("--source-set=")) {
      mutableSources.push(...parseSourceSet(arg.slice("--source-set=".length), "--source-set"))
    } else if (arg === "--cache-dir") {
      cacheDir = parseStringValue({ flag: arg, value: nextValue })
      index += 1
    } else if (arg.startsWith("--cache-dir=")) {
      cacheDir = parseStringValue({ flag: "--cache-dir", value: arg.slice("--cache-dir=".length) })
    } else if (arg === "--max-pages") {
      maxPages = parsePositiveInteger({ flag: arg, value: nextValue })
      index += 1
    } else if (arg.startsWith("--max-pages=")) {
      maxPages = parsePositiveInteger({ flag: "--max-pages", value: arg.slice("--max-pages=".length) })
    } else if (arg === "--ttl-hours") {
      ttlHours = parsePositiveInteger({ flag: arg, value: nextValue })
      index += 1
    } else if (arg.startsWith("--ttl-hours=")) {
      ttlHours = parsePositiveInteger({ flag: "--ttl-hours", value: arg.slice("--ttl-hours=".length) })
    } else {
      throw new NationwideEtlInputError(`Unknown ETL argument: ${arg}`)
    }
  }

  return {
    fixture,
    mode: mode ?? "dry-run",
    ...(cacheDir === undefined ? {} : { cacheDir }),
    ...(maxPages === undefined ? {} : { maxPages }),
    ...(mutableSources.length === 0 ? {} : { sourceSet: mutableSources }),
    ...(ttlHours === undefined ? {} : { ttlHours }),
  }
}

function setMode(current: "dry-run" | "write-cache" | undefined, next: "dry-run" | "write-cache"): "dry-run" | "write-cache" {
  if (current !== undefined && current !== next) {
    throw new NationwideEtlInputError("Choose exactly one of --dry-run or --write-cache")
  }
  return next
}

function parseStringValue(input: { readonly flag: string; readonly value: string | undefined }): string {
  if (input.value === undefined || input.value.trim().length === 0) {
    throw new NationwideEtlInputError(`${input.flag} requires a non-empty value`)
  }
  return input.value
}

function parsePositiveInteger(input: { readonly flag: string; readonly value: string | undefined }): number {
  const value = Number(input.value)
  if (input.value === undefined || !Number.isInteger(value) || value < 1) {
    throw new NationwideEtlInputError(`${input.flag} must be a positive integer`)
  }
  return value
}

function parseSourceSet(value: string | undefined, flag: string): readonly FamilyExperienceSourceSetEntry[] {
  if (value === undefined) {
    throw new NationwideEtlInputError(`${flag} requires a value`)
  }
  const sourceSet = value.split(",").map((source) => source.trim()).filter((source) => source.length > 0)
  if (sourceSet.length === 0) {
    throw new NationwideEtlInputError("source set must contain at least one source")
  }
  return sourceSet.map((source) => {
    if (!isSourceSetEntry(source)) {
      throw new NationwideEtlInputError(`Invalid source id: ${source}`)
    }
    return source
  })
}

function isSourceSetEntry(value: string): value is FamilyExperienceSourceSetEntry {
  return FAMILY_EXPERIENCE_SOURCE_SET_VALUES.some((source) => source === value)
}
