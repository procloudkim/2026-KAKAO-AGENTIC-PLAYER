import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client"
import { InMemoryTransport } from "@modelcontextprotocol/server"
import { z } from "zod/v4"

import {
  DEFAULT_FAMILY_EXPERIENCE_HOST,
  DEFAULT_FAMILY_EXPERIENCE_PORT,
  DEFAULT_SEOUL_OPEN_DATA_BASE_URL,
} from "../src/config.js"
import { buildMetadata, writeCache } from "../src/etl/cache.js"
import { createFamilyExperienceMcpServer } from "../src/mcp.js"
import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"
import { smokeRecords } from "./smoke-mcp-fixtures.js"

const primaryToolName = "find_family_experiences"

const ArgumentsSchema = z.object({
  assertToolCount: z.coerce.number().int().positive().optional(),
  cacheDir: z.string().trim().min(1).optional(),
  expectError: z.boolean().default(false),
  prompt: z.string().trim().min(1).optional(),
  skipSeed: z.boolean().default(false),
})

function parseArguments(argv: readonly string[]): z.infer<typeof ArgumentsSchema> {
  const values = new Map<string, string | boolean>()

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === undefined) {
      continue
    }

    const equalsIndex = argument.indexOf("=")
    const rawKey = equalsIndex === -1 ? argument : argument.slice(0, equalsIndex)
    const rawValue = equalsIndex === -1 ? undefined : argument.slice(equalsIndex + 1)
    const nextArgument = argv[index + 1]
    const nextValue =
      rawValue ?? (nextArgument !== undefined && !nextArgument.startsWith("--") ? nextArgument : undefined)
    const consumedNextValue = rawValue === undefined && nextValue !== undefined

    if (rawKey === "--assert-tool-count" && nextValue !== undefined) {
      values.set("assertToolCount", nextValue)
      if (consumedNextValue) {
        index += 1
      }
    } else if (rawKey === "--cache-dir" && nextValue !== undefined) {
      values.set("cacheDir", nextValue)
      if (consumedNextValue) {
        index += 1
      }
    } else if (rawKey === "--prompt" && nextValue !== undefined) {
      values.set("prompt", nextValue)
      if (consumedNextValue) {
        index += 1
      }
    } else if (rawKey === "--expect-error") {
      values.set("expectError", true)
    } else if (rawKey === "--skip-seed") {
      values.set("skipSeed", true)
    }
  }

  return ArgumentsSchema.parse(Object.fromEntries(values))
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2))
  const endpoint = process.env["MCP_ENDPOINT"]

  if (endpoint !== undefined) {
    await runHttpSmoke({ args, endpoint })
    return
  }

  await runInMemorySmoke(args)
}

async function runHttpSmoke(input: {
  readonly args: z.infer<typeof ArgumentsSchema>
  readonly endpoint: string
}): Promise<void> {
  const client = new Client({ name: "family-experience-mcp-smoke", version: "0.1.0" })
  const transport = new StreamableHTTPClientTransport(new URL(input.endpoint))

  try {
    await client.connect(transport)
    await callAndReport({ client, args: input.args, endpoint: input.endpoint })
  } finally {
    await transport.close()
    await client.close()
  }
}

async function runInMemorySmoke(args: z.infer<typeof ArgumentsSchema>): Promise<void> {
  const generatedCacheDir = args.cacheDir ?? await mkdtemp(join(tmpdir(), "family-experience-mcp-smoke-"))
  const removeCache = args.cacheDir === undefined
  const server = createFamilyExperienceMcpServer({
    config: {
      host: DEFAULT_FAMILY_EXPERIENCE_HOST,
      port: DEFAULT_FAMILY_EXPERIENCE_PORT,
      allowFixture: !args.skipSeed,
      seoulOpenDataBaseUrl: DEFAULT_SEOUL_OPEN_DATA_BASE_URL,
      etlCacheDir: generatedCacheDir,
      etlTtlHours: 24,
    },
  })
  const client = new Client({ name: "family-experience-mcp-smoke", version: "0.1.0" })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  try {
    if (!args.skipSeed) {
      await writeSmokeCache(generatedCacheDir)
    }

    await server.connect(serverTransport)
    await client.connect(clientTransport)
    await callAndReport({ client, args, endpoint: "in-memory", cacheDir: generatedCacheDir })
  } finally {
    await client.close()
    await server.close()
    if (removeCache) {
      await rm(generatedCacheDir, { recursive: true, force: true })
    }
  }
}

async function callAndReport(input: {
  readonly client: Client
  readonly args: z.infer<typeof ArgumentsSchema>
  readonly endpoint: string
  readonly cacheDir?: string
}): Promise<void> {
  const tools = await input.client.listTools()
  const toolNames = tools.tools.map((tool) => tool.name)
  const toolListCharacters = JSON.stringify(tools).length

  if (input.args.assertToolCount !== undefined && toolNames.length !== input.args.assertToolCount) {
    throw new Error(`Expected ${input.args.assertToolCount} tools, received ${toolNames.length}: ${toolNames.join(", ")}`)
  }

  if (!toolNames.includes(primaryToolName)) {
    throw new Error(`Unexpected MCP tool list: ${toolNames.join(", ")}`)
  }

  if (toolListCharacters > 4_500) {
    throw new Error(`MCP tool list exceeds 4500 characters: ${toolListCharacters}`)
  }

  const result = await input.client.callTool({
    name: primaryToolName,
    arguments: {
      prompt: input.args.prompt ?? "부산 이번 주말 4살 실내",
    },
  })
  const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(result.structuredContent)
  const resultCharacters = JSON.stringify(result).length

  if (structuredContent.ok && resultCharacters > 4_000) {
    throw new Error(`Successful MCP result exceeds 4000 characters: ${resultCharacters}`)
  }

  if (input.args.expectError && structuredContent.ok) {
    throw new Error("Expected MCP smoke error but received candidates.")
  }

  if (!input.args.expectError && !structuredContent.ok) {
    throw new Error(`Expected successful cache result: ${structuredContent.failure.code}`)
  }

  const firstContent = result.content[0]

  console.log(
    JSON.stringify(
      {
        endpoint: input.endpoint,
        cache_dir: input.cacheDir,
        tools: toolNames,
        tool_list_characters: toolListCharacters,
        called: primaryToolName,
        prompt: input.args.prompt ?? "부산 이번 주말 4살 실내",
        result_ok: structuredContent.ok,
        mode: structuredContent.mode,
        candidate_count: structuredContent.ok ? structuredContent.candidates.length : 0,
        result_characters: resultCharacters,
        first_source: structuredContent.ok ? structuredContent.candidates[0]?.source : undefined,
        failure_code: structuredContent.ok ? undefined : structuredContent.failure.code,
        text: firstContent?.type === "text" ? firstContent.text : "",
      },
      null,
      2,
    ),
  )
}

async function writeSmokeCache(cacheDir: string): Promise<void> {
  const records = smokeRecords()
  const metadata = buildMetadata({
    generatedAt: new Date().toISOString(),
    fixture: true,
    maxPages: 1,
    mode: "write-cache",
    rawSnapshots: [],
    records,
    sourceSet: ["culture_portal", "kto_tourapi"],
    sourceSummaries: [{ ok: true }, { ok: true }],
    ttlHours: 24,
  })

  await writeCache({ cacheDir, metadata, rawSnapshots: [], records })
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown smoke failure"
  console.error(message)
  process.exitCode = 1
})
