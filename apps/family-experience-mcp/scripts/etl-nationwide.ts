import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  NationwideEtlInputError,
  parseNationwideEtlArgs,
  redactDiagnosticText,
  runNationwideEtl,
} from "../src/etl/nationwide.js"

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const defaultProofDir = resolve(
  appRoot,
  "../..",
  ".omo/evidence/family-experience-market-ready-platform/etl",
)

async function main(): Promise<void> {
  const options = parseNationwideEtlArgs({ args: process.argv.slice(2), env: process.env })
  const report = await runNationwideEtl(options)
  const proof = await writeProof({
    body: {
      ok: report.ok,
      report,
    },
    env: process.env,
    kind: "etl-proof",
  })
  console.log(redactDiagnosticText(JSON.stringify({ ...report, proof }, null, 2)))
  process.exitCode = report.ok ? 0 : 2
}

main().catch((error: unknown) => {
  const message =
    error instanceof NationwideEtlInputError || error instanceof Error
      ? error.message
      : "unknown nationwide ETL failure"
  writeProof({
    body: {
      ok: false,
      failure: {
        code: error instanceof NationwideEtlInputError ? "invalid_input" : "etl_failed",
        message,
      },
    },
    env: process.env,
    kind: "etl-proof-error",
  })
    .then((proof) => {
      console.error(redactDiagnosticText(JSON.stringify({ ...proof, failure: message }, null, 2)))
    })
    .catch((proofError: unknown) => {
      const proofMessage = proofError instanceof Error ? proofError.message : "proof write failed"
      console.error(redactDiagnosticText(`${message}\n${proofMessage}`))
    })
  process.exitCode = 1
})

type ProofBody = {
  readonly ok: boolean
  readonly report?: unknown
  readonly failure?: {
    readonly code: "invalid_input" | "etl_failed"
    readonly message: string
  }
}

type ProofReceipt = {
  readonly evidence_dir: string
  readonly latest_path: string
  readonly timestamped_path: string
  readonly redaction_verified: boolean
}

async function writeProof(input: {
  readonly body: ProofBody
  readonly env: NodeJS.ProcessEnv
  readonly kind: "etl-proof" | "etl-proof-error"
}): Promise<ProofReceipt> {
  const generatedAt = new Date().toISOString()
  const evidenceDir = resolve(input.env["FAMILY_EXPERIENCE_ETL_PROOF_DIR"] ?? defaultProofDir)
  const fileStem = `${input.kind}-${generatedAt.replaceAll(/[:.]/g, "-")}`
  const latestPath = resolve(evidenceDir, "etl-proof-latest.json")
  const timestampedPath = resolve(evidenceDir, `${fileStem}.json`)
  const body = {
    schema_version: 1,
    generated_at: generatedAt,
    command: {
      argv: process.argv.slice(2),
      cwd: process.cwd(),
      node: process.version,
    },
    ...input.body,
  }
  const redactedBodyText = redactDiagnosticText(JSON.stringify(body, null, 2), input.env)
  const redactionVerified = redactDiagnosticText(redactedBodyText, input.env) === redactedBodyText
  const proofText = redactDiagnosticText(
    JSON.stringify(
      {
        ...body,
        proof: {
          evidence_dir: evidenceDir,
          latest_path: latestPath,
          timestamped_path: timestampedPath,
          redaction_verified: redactionVerified,
        },
      },
      null,
      2,
    ),
    input.env,
  )

  await mkdir(evidenceDir, { recursive: true })
  await Promise.all([
    writeFile(latestPath, `${proofText}\n`, "utf8"),
    writeFile(timestampedPath, `${proofText}\n`, "utf8"),
  ])

  return {
    evidence_dir: evidenceDir,
    latest_path: latestPath,
    timestamped_path: timestampedPath,
    redaction_verified: redactionVerified,
  }
}
