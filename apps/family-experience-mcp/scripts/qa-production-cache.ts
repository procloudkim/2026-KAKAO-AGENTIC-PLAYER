import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  DEFAULT_FAMILY_EXPERIENCE_HOST,
  DEFAULT_FAMILY_EXPERIENCE_PORT,
  DEFAULT_SEOUL_OPEN_DATA_BASE_URL,
  type FamilyExperienceSourceSetEntry,
} from "../src/config.js"
import { ETL_CACHE_FILES } from "../src/etl/cache.js"
import { getCacheOperationalStatus } from "../src/etl/cacheStatus.js"
import {
  type CacheMetadata,
  type CacheRawSnapshot,
  type CacheRecord,
  cacheRecordSchema,
  countJsonlRecords,
  parseCacheMetadata,
  parseCacheRawSnapshots,
  sha256Hex,
  validateCacheContract,
} from "../src/etl/cacheContract.js"
import { MAX_MCP_RESULT_CHARACTERS } from "../src/findFamilyExperienceToolResponse.js"
import { callFindFamilyExperiences } from "../src/mcp.js"
import { SourceRecordSchema, type ParsedSourceRecord } from "../src/pipeline/sourceRecord.js"
import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"

type ReceiptStatus = "PASS" | "FAIL"

export const EXPECTED_PRODUCTION_SOURCE_SET = ["kto_tourapi"] as const satisfies readonly FamilyExperienceSourceSetEntry[]

type StarterReceipt = {
  readonly index: number
  readonly prompt: string
  readonly result: ReceiptStatus
  readonly candidate_count: number
  readonly result_characters: number
  readonly failure_code?: string
}

type CacheHashes = {
  readonly metadata_sha256?: string
  readonly normalized_records_sha256?: string
  readonly raw_snapshots_sha256?: string
  readonly starter_doc_sha256?: string
}

export type ProductionCacheQaReceipt = {
  readonly status: ReceiptStatus
  readonly checked_at: string
  readonly hashes: CacheHashes
  readonly expected_source_set: readonly string[]
  readonly source_set: readonly string[]
  readonly eligible_count: number
  readonly starters: readonly StarterReceipt[]
  readonly failures: readonly string[]
}

export type ProductionCacheQaInput = {
  readonly cacheDir: string
  readonly expectedSourceSet: readonly FamilyExperienceSourceSetEntry[]
  readonly starterDoc: string
  readonly output?: string
}

type CacheFiles = {
  readonly metadata: CacheMetadata
  readonly metadataText: string
  readonly records: readonly CacheRecord[]
  readonly sourceRecords: readonly ParsedSourceRecord[]
  readonly recordsText: string
  readonly rawSnapshots: readonly CacheRawSnapshot[]
  readonly rawSnapshotsText: string
}

class ProductionCacheQaFailure extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = "ProductionCacheQaFailure"
  }
}

export function parseStarterMessages(markdown: string): readonly string[] {
  const lines = markdown.split(/\r?\n/u)
  const headingIndex = lines.findIndex((line) => /^## Starter Messages\s*$/u.test(line))

  if (headingIndex === -1) {
    throw new ProductionCacheQaFailure("starter_section_missing")
  }

  const nextHeadingOffset = lines
    .slice(headingIndex + 1)
    .findIndex((line) => /^##\s+/u.test(line))
  const sectionEnd = nextHeadingOffset === -1 ? lines.length : headingIndex + 1 + nextHeadingOffset
  const numbered = lines
    .slice(headingIndex + 1, sectionEnd)
    .flatMap((line) => {
      const match = /^\s*(\d+)\.\s+(.+?)\s*$/u.exec(line)
      return match === null ? [] : [{ number: Number.parseInt(match[1] ?? "", 10), prompt: match[2] ?? "" }]
    })

  if (
    numbered.length !== 3 ||
    numbered.some((entry, index) => entry.number !== index + 1 || entry.prompt.length === 0)
  ) {
    throw new ProductionCacheQaFailure("starter_section_requires_exactly_1_2_3")
  }

  return numbered.map((entry) => entry.prompt)
}

export async function runProductionCacheQa(
  input: ProductionCacheQaInput,
): Promise<ProductionCacheQaReceipt> {
  const receipt = await evaluateProductionCacheQa(input)

  if (input.output === undefined) {
    return receipt
  }

  try {
    await writeReceipt(input.output, receipt)
    return receipt
  } catch (error: unknown) {
    if (!(error instanceof Error)) throw error
    return {
      ...receipt,
      status: "FAIL",
      failures: [...receipt.failures, "output_write_failed"],
    }
  }
}

async function evaluateProductionCacheQa(
  input: ProductionCacheQaInput,
): Promise<ProductionCacheQaReceipt> {
  const checkedAt = new Date().toISOString()
  let starterDocText: string
  let prompts: readonly string[]

  try {
    starterDocText = await readFile(input.starterDoc, "utf8")
    prompts = parseStarterMessages(starterDocText)
  } catch (error: unknown) {
    return emptyFailureReceipt(
      checkedAt,
      input.expectedSourceSet,
      safeFailureCode(error, "starter_doc_unavailable"),
    )
  }

  const starterHash = sha256Hex(starterDocText)
  let cache: CacheFiles

  try {
    cache = await readCacheFiles(input.cacheDir)
  } catch (error: unknown) {
    const failure = safeFailureCode(error, "cache_files_unavailable")
    return {
      status: "FAIL",
      checked_at: checkedAt,
      hashes: { starter_doc_sha256: starterHash },
      expected_source_set: input.expectedSourceSet,
      source_set: [],
      eligible_count: 0,
      starters: unrunStarters(prompts),
      failures: [failure],
    }
  }

  const hashes = {
    metadata_sha256: sha256Hex(cache.metadataText),
    normalized_records_sha256: sha256Hex(cache.recordsText),
    raw_snapshots_sha256: sha256Hex(cache.rawSnapshotsText),
    starter_doc_sha256: starterHash,
  } as const
  const eligibleCount = cache.sourceRecords.filter((record) => hasBoundKtoAgeEvidence(record, cache.rawSnapshots)).length
  const preflightFailures = validateProductionCache({
    cache,
    cacheDir: input.cacheDir,
    eligibleCount,
    expectedSourceSet: input.expectedSourceSet,
  })

  if (preflightFailures.length > 0) {
    return {
      status: "FAIL",
      checked_at: checkedAt,
      hashes,
      expected_source_set: input.expectedSourceSet,
      source_set: cache.metadata.source_set,
      eligible_count: eligibleCount,
      starters: unrunStarters(prompts),
      failures: preflightFailures,
    }
  }

  const starterReceipts = await Promise.all(
    prompts.map((prompt, index) => runStarter({
      cacheDir: input.cacheDir,
      index: index + 1,
      prompt,
      sourceSet: input.expectedSourceSet,
    })),
  )
  const starterFailures = starterReceipts
    .filter((starter) => starter.result === "FAIL")
    .map((starter) => `starter_${starter.index}:${starter.failure_code ?? "failed"}`)

  return {
    status: starterFailures.length === 0 ? "PASS" : "FAIL",
    checked_at: checkedAt,
    hashes,
    expected_source_set: input.expectedSourceSet,
    source_set: cache.metadata.source_set,
    eligible_count: eligibleCount,
    starters: starterReceipts,
    failures: starterFailures,
  }
}

async function readCacheFiles(cacheDir: string): Promise<CacheFiles> {
  let metadataText: string
  let recordsText: string
  let rawSnapshotsText: string

  try {
    ;[metadataText, recordsText, rawSnapshotsText] = await Promise.all([
      readFile(resolve(cacheDir, ETL_CACHE_FILES.metadata), "utf8"),
      readFile(resolve(cacheDir, ETL_CACHE_FILES.normalized), "utf8"),
      readFile(resolve(cacheDir, ETL_CACHE_FILES.rawSnapshots), "utf8"),
    ])
  } catch (error: unknown) {
    if (!(error instanceof Error)) throw error
    throw new ProductionCacheQaFailure("cache_files_unavailable")
  }

  let rawMetadata: unknown
  try {
    rawMetadata = JSON.parse(metadataText)
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error
    throw new ProductionCacheQaFailure("cache_metadata_invalid_json")
  }
  const metadata = parseCacheMetadata(rawMetadata)
  if (metadata === undefined) {
    throw new ProductionCacheQaFailure("cache_metadata_invalid")
  }

  const records: CacheRecord[] = []
  const sourceRecords: ParsedSourceRecord[] = []
  for (const line of recordsText.split(/\r?\n/u).filter((entry) => entry.trim().length > 0)) {
    let rawRecord: unknown
    try {
      rawRecord = JSON.parse(line)
    } catch (error: unknown) {
      if (!(error instanceof SyntaxError)) throw error
      throw new ProductionCacheQaFailure("cache_record_invalid_json")
    }
    const record = cacheRecordSchema.safeParse(rawRecord)
    if (!record.success) {
      throw new ProductionCacheQaFailure("cache_record_invalid")
    }
    const sourceRecord = SourceRecordSchema.safeParse(rawRecord)
    if (!sourceRecord.success) {
      throw new ProductionCacheQaFailure("cache_source_record_invalid")
    }
    records.push(record.data)
    sourceRecords.push(sourceRecord.data)
  }

  const rawSnapshots = parseCacheRawSnapshots(rawSnapshotsText)
  if (rawSnapshots === undefined) {
    throw new ProductionCacheQaFailure("cache_raw_snapshot_invalid")
  }

  return { metadata, metadataText, records, sourceRecords, recordsText, rawSnapshots, rawSnapshotsText }
}

function hasBoundKtoAgeEvidence(
  record: ParsedSourceRecord,
  rawSnapshots: readonly CacheRawSnapshot[],
): boolean {
  if (
    record.source.id !== "kto-tourapi-events" ||
    record.confidence.age_fit !== "source-stated" ||
    !record.id.startsWith("kto-tourapi-events:")
  ) {
    return false
  }
  const evidenceSnapshot = rawSnapshots.find(
    (snapshot) => snapshot.snapshot_id === record.age_evidence_snapshot_id,
  )
  return (
    evidenceSnapshot?.source_id === "kto-tourapi-events" &&
    evidenceSnapshot.payload_ref === "detailIntro2" &&
    evidenceSnapshot.response_sha256 !== undefined &&
    evidenceSnapshot.evidence?.content_id === record.id.slice("kto-tourapi-events:".length) &&
    evidenceSnapshot.evidence.age_limit === record.target_age_text
  )
}

function validateProductionCache(input: {
  readonly cache: CacheFiles
  readonly cacheDir: string
  readonly eligibleCount: number
  readonly expectedSourceSet: readonly FamilyExperienceSourceSetEntry[]
}): readonly string[] {
  const failures: string[] = []
  const contract = validateCacheContract({
    metadata: input.cache.metadata,
    records: input.cache.records,
    recordsText: input.cache.recordsText,
    rawSnapshotsText: input.cache.rawSnapshotsText,
  })
  const status = getCacheOperationalStatus({
    allowFixture: false,
    cacheDir: input.cacheDir,
    sourceSet: input.expectedSourceSet,
  })

  if (!contract.ok) failures.push("cache_contract_invalid")
  if (!sourceSetsEqual(input.cache.metadata.source_set, input.expectedSourceSet)) {
    failures.push("cache_source_set_mismatch")
  }
  if (input.cache.metadata.fixture) failures.push("cache_fixture_must_be_false")
  if (input.cache.metadata.mode !== "write-cache") failures.push("cache_mode_must_be_write-cache")
  if (input.cache.metadata.counts.failures !== 0) failures.push("cache_failed_sources_must_be_zero")
  if (input.cache.metadata.file_digests === undefined) failures.push("cache_file_digests_missing")
  if (input.cache.metadata.source_provenance === undefined) failures.push("cache_source_provenance_missing")
  if (
    input.cache.metadata.raw_snapshots_present !== true ||
    input.cache.metadata.counts.raw_snapshots < 1 ||
    countJsonlRecords(input.cache.rawSnapshotsText) < 1
  ) {
    failures.push("cache_raw_snapshots_missing")
  }
  if (
    input.cache.metadata.source_provenance?.some(
      (source) => !source.raw_snapshot_present || source.raw_snapshots < 1,
    ) === true
  ) {
    failures.push("cache_source_raw_snapshots_missing")
  }
  if (status.status !== "fresh" || status.mode !== "live") failures.push("cache_status_must_be_fresh_live")
  if (status.source_health.failed_sources !== 0) failures.push("cache_operational_failed_sources_must_be_zero")
  if (
    input.cache.sourceRecords.some(
      (record) =>
        record.source.id === "kto-tourapi-events" &&
        record.confidence.age_fit === "source-stated" &&
        !hasBoundKtoAgeEvidence(record, input.cache.rawSnapshots),
    )
  ) {
    failures.push("cache_kto_age_evidence_invalid")
  }
  if (input.eligibleCount < 3) failures.push("cache_requires_three_age_eligible_records")

  return [...new Set(failures)]
}

async function runStarter(input: {
  readonly cacheDir: string
  readonly index: number
  readonly prompt: string
  readonly sourceSet: readonly FamilyExperienceSourceSetEntry[]
}): Promise<StarterReceipt> {
  try {
    const result = await callFindFamilyExperiences(
      { prompt: input.prompt },
      {
        config: {
          host: DEFAULT_FAMILY_EXPERIENCE_HOST,
          port: DEFAULT_FAMILY_EXPERIENCE_PORT,
          allowFixture: false,
          seoulOpenDataBaseUrl: DEFAULT_SEOUL_OPEN_DATA_BASE_URL,
          etlCacheDir: input.cacheDir,
          sourceSet: input.sourceSet,
        },
      },
    )
    const resultCharacters = JSON.stringify(result).length
    if (/https?:\/\/apis\.data\.go\.kr\b|\/(?:detailCommon2|detailIntro2)(?:\?|\b)/iu.test(JSON.stringify(result))) {
      return failedStarter(input, "authenticated_provider_api_url_exposed", resultCharacters)
    }
    const structured = FindFamilyExperiencesStructuredContentSchema.safeParse(result.structuredContent)

    if (!structured.success) {
      return failedStarter(input, "structured_result_invalid", resultCharacters)
    }
    if (!structured.data.ok) {
      return failedStarter(input, structured.data.failure.code, resultCharacters)
    }

    const candidateCount = structured.data.candidates.length
    if (structured.data.mode !== "live") {
      return failedStarter(input, "result_mode_not_live", resultCharacters, candidateCount)
    }
    if (candidateCount < 1 || candidateCount > 3) {
      return failedStarter(input, "candidate_count_out_of_range", resultCharacters, candidateCount)
    }
    if (structured.data.candidates.some((candidate) => candidate.age_fit_label === "unknown")) {
      return failedStarter(input, "candidate_age_fit_unknown", resultCharacters, candidateCount)
    }
    if (resultCharacters > MAX_MCP_RESULT_CHARACTERS) {
      return failedStarter(input, "result_character_budget_exceeded", resultCharacters, candidateCount)
    }

    return {
      index: input.index,
      prompt: input.prompt,
      result: "PASS",
      candidate_count: candidateCount,
      result_characters: resultCharacters,
    }
  } catch (error: unknown) {
    if (!(error instanceof Error)) throw error
    return failedStarter(input, "tool_call_failed", 0)
  }
}

function failedStarter(
  input: { readonly index: number; readonly prompt: string },
  failureCode: string,
  resultCharacters: number,
  candidateCount = 0,
): StarterReceipt {
  return {
    index: input.index,
    prompt: input.prompt,
    result: "FAIL",
    candidate_count: candidateCount,
    result_characters: resultCharacters,
    failure_code: failureCode,
  }
}

function unrunStarters(prompts: readonly string[]): readonly StarterReceipt[] {
  return prompts.map((prompt, index) => failedStarter(
    { index: index + 1, prompt },
    "cache_preflight_failed",
    0,
  ))
}

function emptyFailureReceipt(
  checkedAt: string,
  expectedSourceSet: readonly FamilyExperienceSourceSetEntry[],
  failure: string,
): ProductionCacheQaReceipt {
  return {
    status: "FAIL",
    checked_at: checkedAt,
    hashes: {},
    expected_source_set: expectedSourceSet,
    source_set: [],
    eligible_count: 0,
    starters: [],
    failures: [failure],
  }
}

function sourceSetsEqual(
  observed: readonly FamilyExperienceSourceSetEntry[],
  expected: readonly FamilyExperienceSourceSetEntry[],
): boolean {
  return [...new Set(observed)].sort().join("\0") === [...new Set(expected)].sort().join("\0")
}

function safeFailureCode(error: unknown, fallback: string): string {
  return error instanceof ProductionCacheQaFailure ? error.code : fallback
}

async function writeReceipt(path: string, receipt: ProductionCacheQaReceipt): Promise<void> {
  const output = resolve(path)
  const temporary = `${output}.${randomUUID()}.tmp`
  await mkdir(dirname(output), { recursive: true })
  try {
    await writeFile(temporary, `${JSON.stringify(receipt, null, 2)}\n`, "utf8")
    await rename(temporary, output)
  } finally {
    await rm(temporary, { force: true })
  }
}

function parseArguments(argv: readonly string[]): ProductionCacheQaInput {
  const values = new Map<string, string>()
  const known = new Set(["--cache-dir", "--expected-source-set", "--starter-doc", "--output"])

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === undefined) continue
    const equalsIndex = argument.indexOf("=")
    const key = equalsIndex === -1 ? argument : argument.slice(0, equalsIndex)
    const inlineValue = equalsIndex === -1 ? undefined : argument.slice(equalsIndex + 1)
    if (!known.has(key) || values.has(key)) {
      throw new ProductionCacheQaFailure("invalid_arguments")
    }
    const nextValue = inlineValue ?? argv[index + 1]
    if (nextValue === undefined || nextValue.startsWith("--") || nextValue.trim().length === 0) {
      throw new ProductionCacheQaFailure("invalid_arguments")
    }
    values.set(key, nextValue)
    if (inlineValue === undefined) index += 1
  }

  const cacheDir = values.get("--cache-dir")
  const expectedSourceSetValue = values.get("--expected-source-set")
  const starterDoc = values.get("--starter-doc")
  const output = values.get("--output")
  if (cacheDir === undefined || expectedSourceSetValue === undefined || starterDoc === undefined) {
    throw new ProductionCacheQaFailure("required_arguments_missing")
  }

  const expectedSourceSet = expectedSourceSetValue.split(",").map((source) => source.trim())
  if (
    expectedSourceSet.length !== EXPECTED_PRODUCTION_SOURCE_SET.length ||
    expectedSourceSet.some((source, index) => source !== EXPECTED_PRODUCTION_SOURCE_SET[index])
  ) {
    throw new ProductionCacheQaFailure("expected_source_set_must_be_kto_tourapi")
  }

  return {
    cacheDir,
    expectedSourceSet: EXPECTED_PRODUCTION_SOURCE_SET,
    starterDoc,
    ...(output === undefined ? {} : { output }),
  }
}

async function main(): Promise<void> {
  let receipt: ProductionCacheQaReceipt
  try {
    const input = parseArguments(process.argv.slice(2))
    if (input.output !== undefined) {
      await rm(resolve(input.output), { force: true })
    }
    receipt = await runProductionCacheQa(input)
  } catch (error: unknown) {
    receipt = emptyFailureReceipt(
      new Date().toISOString(),
      EXPECTED_PRODUCTION_SOURCE_SET,
      safeFailureCode(error, "internal_error"),
    )
  }
  process.stdout.write(`${JSON.stringify(receipt)}\n`)
  if (receipt.status !== "PASS") process.exitCode = 1
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
