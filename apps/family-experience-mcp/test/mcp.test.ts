import { Client } from "@modelcontextprotocol/client"
import { InMemoryTransport } from "@modelcontextprotocol/server"
import { describe, expect, it } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import { getHealthStatus } from "../src/health.js"
import {
  createFamilyExperienceMcpServer,
  FAMILY_EXPERIENCE_PUBLIC_TOOLS,
} from "../src/mcp.js"
import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"

process.env["FAMILY_EXPERIENCE_REFERENCE_DATE"] = "2026-07-04"

const fixtureConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: true,
  seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
}

describe("Todo 5 MCP server", () => {
  it("PIN:ONE_TOOL registers one annotated public tool and calls it", async () => {
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
          prompt: "서울에서 오늘 4살이랑 갈 곳",
        },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: the product-facing tool surface is exposed and the recommendation returns Korean text plus structured data.
      expect(tools.tools.map((tool) => tool.name)).toEqual(["find_family_experiences"])
      expect(tools.tools[0]?.inputSchema).toMatchObject({
        type: "object",
        properties: {
          prompt: expect.any(Object),
          location: expect.any(Object),
          date_range: expect.any(Object),
          child_age: expect.any(Object),
          child_stage: expect.any(Object),
        },
      })
      expect(tools.tools[0]?.inputSchema).not.toHaveProperty("anyOf")
      expect(tools.tools).toHaveLength(1)
      expect(JSON.stringify(tools).length).toBeLessThanOrEqual(4_500)
      for (const tool of tools.tools) {
        expect(tool.annotations).toEqual({
          title: "Find family experiences / 가족 체험 찾기",
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: true,
          idempotentHint: true,
        })
      }
      expect(JSON.stringify(result).length).toBeLessThanOrEqual(4_000)
      expect(result.isError, JSON.stringify(result)).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0]).toMatchObject({
        type: "text",
        text: expect.stringMatching(/후보 [1-3]개/),
      })
      expect(structuredContent.ok).toBe(true)
      if (!structuredContent.ok) {
        throw new Error(structuredContent.failure.message)
      }
      expect(structuredContent.candidates.length).toBeGreaterThanOrEqual(1)
      expect(structuredContent.candidates.length).toBeLessThanOrEqual(3)
      expect(structuredContent.candidates.every((candidate) => candidate.source === "fixture")).toBe(
        true,
      )
    } finally {
      await client.close()
      await server.close()
    }
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
          prompt: "이번 주말 서울에서 아이랑 갈 곳",
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
          missing_fields: ["child_selector"],
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
          prompt: "서울에서 오늘 4살이랑 갈 곳",
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
      expect(structuredContent.candidates.length).toBeGreaterThanOrEqual(1)
      expect(structuredContent.candidates.length).toBeLessThanOrEqual(3)
      expect(structuredContent.candidates[0]?.date_time).toContain("2026-07-04")
      expect(structuredContent.candidates[0]?.age_fit_reason).toContain("ages 4")
    } finally {
      await client.close()
      await server.close()
    }
  })

  it("reports health with service name and public MCP tools", () => {
    // Given: redaction-safe runtime config is available.
    const health = getHealthStatus(fixtureConfig)

    // When / Then: the health payload exposes identity and tool count only.
    expect(health).toMatchObject({
      name: "family-experience-mcp",
      version: "0.1.0",
      tools: [...FAMILY_EXPERIENCE_PUBLIC_TOOLS],
      config: {
        allowFixture: true,
        toolMode: "fixture",
        liveProviderConfigured: false,
      },
    })
    expect(JSON.stringify(health)).not.toMatch(/127\.0\.0\.1|https?:\/\/|seoulOpenDataKey|[A-Za-z]:[\\/]/i)
  })
})
