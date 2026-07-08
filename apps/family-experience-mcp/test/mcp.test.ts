import { Client } from "@modelcontextprotocol/client"
import { InMemoryTransport } from "@modelcontextprotocol/server"
import { describe, expect, it } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import { getHealthStatus } from "../src/health.js"
import {
  callFindFamilyExperiences,
  createFamilyExperienceMcpServer,
  FAMILY_EXPERIENCE_PUBLIC_TOOLS,
} from "../src/mcp.js"
import {
  FindFamilyExperiencesInputSchema,
  FindFamilyExperiencesStructuredContentSchema,
} from "../src/schemas.js"

const fixtureConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: true,
  seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
}

const noFixtureConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: false,
  seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
}

const happyInput = FindFamilyExperiencesInputSchema.parse({
  location: "Seoul",
  date_range: { start: "2026-07-04", end: "2026-07-04" },
  child_age: 4,
})

describe("Todo 5 MCP server", () => {
  it("registers exactly one public tool and calls it successfully in fixture mode", async () => {
    // Given: an MCP server wired to the deterministic fixture source.
    const server = createFamilyExperienceMcpServer({ config: fixtureConfig })
    const client = new Client({ name: "mcp-test-client", version: "0.1.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    try {
      await server.connect(serverTransport)
      await client.connect(clientTransport)

      // When: an MCP client lists tools and calls the public family experience tool.
      const tools = await client.listTools()
      const result = await client.callTool({
        name: "find_family_experiences",
        arguments: {
          prompt: "오늘 비오는데 4살이랑 갈 곳",
        },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: no extra public tool is exposed and the call returns Korean text plus structured data.
      expect(tools.tools.map((tool) => tool.name)).toEqual([...FAMILY_EXPERIENCE_PUBLIC_TOOLS])
      expect(tools.tools[0]?.inputSchema).toMatchObject({
        type: "object",
        required: ["prompt"],
      })
      expect(tools.tools[0]?.inputSchema).not.toHaveProperty("anyOf")
      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0]).toMatchObject({
        type: "text",
        text: expect.stringContaining("후보 3개"),
      })
      expect(structuredContent.ok).toBe(true)
      if (!structuredContent.ok) {
        throw new Error(structuredContent.failure.message)
      }
      expect(structuredContent.candidates).toHaveLength(3)
      expect(structuredContent.candidates.every((candidate) => candidate.source === "fixture")).toBe(
        true,
      )
    } finally {
      await client.close()
      await server.close()
    }
  })

  it("returns a safe tool error when live source is not configured and fixture mode is disabled", async () => {
    // Given: runtime config has no live key and does not allow fixture fallback.
    const result = await callFindFamilyExperiences(happyInput, { config: noFixtureConfig })

    // When: the structured failure metadata is parsed through the public schema.
    const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
      result.structuredContent,
    )

    // Then: the tool reports a safe Korean error without fabricated candidates.
    expect(result.isError).toBe(true)
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("fixture 모드"),
    })
    expect(structuredContent).toMatchObject({
      ok: false,
      mode: "live",
      failure: {
        code: "missing_configuration",
        retryable: false,
      },
    })
    expect("candidates" in structuredContent).toBe(false)
  })

  it("returns Korean clarification through the MCP surface when prompt child age is missing", async () => {
    // Given: an MCP client sends a prompt without a child suitability selector.
    const server = createFamilyExperienceMcpServer({ config: fixtureConfig })
    const client = new Client({ name: "mcp-missing-age-test-client", version: "0.1.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    try {
      await server.connect(serverTransport)
      await client.connect(clientTransport)

      // When: the public tool is called without child_age or child_stage in the prompt.
      const result = await client.callTool({
        name: "find_family_experiences",
        arguments: {
          prompt: "이번 주말 아이랑 갈 곳",
        },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: the handler returns a Korean parent-facing clarification instead of SDK text.
      expect(result.isError).toBe(true)
      expect(result.content[0]).toMatchObject({
        type: "text",
        text: expect.stringContaining("아이 나이"),
      })
      expect(result.content[0]).not.toMatchObject({
        type: "text",
        text: expect.stringContaining("Input validation error"),
      })
      expect(structuredContent).toMatchObject({
        ok: false,
        mode: "fixture",
        failure: {
          code: "invalid_input",
          retryable: false,
        },
      })
    } finally {
      await client.close()
      await server.close()
    }
  })

  it("parses loose Korean prompt input through the MCP surface", async () => {
    // Given: a parent sends a compact Korean prompt instead of structured fields.
    const server = createFamilyExperienceMcpServer({ config: fixtureConfig })
    const client = new Client({ name: "mcp-loose-prompt-test-client", version: "0.1.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    try {
      await server.connect(serverTransport)
      await client.connect(clientTransport)

      // When: the public tool receives a prompt with age, date, and condition.
      const result = await client.callTool({
        name: "find_family_experiences",
        arguments: {
          prompt: "오늘 비오는데 4살이랑 갈 곳",
        },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: the prompt is deterministically parsed and still returns action cards.
      expect(result.isError).toBeUndefined()
      expect(structuredContent.ok).toBe(true)
      if (!structuredContent.ok) {
        throw new Error(structuredContent.failure.message)
      }
      expect(structuredContent.candidates).toHaveLength(3)
      expect(structuredContent.candidates[0]?.date_time).toContain("2026-07-04")
      expect(structuredContent.candidates[0]?.age_fit_reason).toContain("ages 4")
    } finally {
      await client.close()
      await server.close()
    }
  })

  it("clarifies loose Korean prompt input when child age or stage is missing", async () => {
    // Given: a compact Korean prompt omits the child selector.
    const result = await callFindFamilyExperiences(
      { prompt: "이번 주말 아이랑 갈 곳" },
      { config: fixtureConfig },
    )

    // When: the structured failure metadata is parsed.
    const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
      result.structuredContent,
    )

    // Then: the tool asks for the missing child age/stage instead of fabricating candidates.
    expect(result.isError).toBe(true)
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("아이 나이"),
    })
    expect(structuredContent).toMatchObject({
      ok: false,
      mode: "fixture",
      failure: {
        code: "invalid_input",
        retryable: false,
      },
    })
  })

  it("reports health with service name and exactly one MCP tool", () => {
    // Given: redaction-safe runtime config is available.
    const health = getHealthStatus(fixtureConfig)

    // When / Then: the health payload exposes identity and tool count only.
    expect(health).toMatchObject({
      ok: true,
      name: "family-experience-mcp",
      version: "0.1.0",
      tools: ["find_family_experiences"],
      config: {
        host: "127.0.0.1",
        allowFixture: true,
        seoulOpenDataKey: "missing",
      },
    })
  })
})
