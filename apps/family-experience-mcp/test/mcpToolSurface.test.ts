import { Client } from "@modelcontextprotocol/client"
import { InMemoryTransport } from "@modelcontextprotocol/server"
import { describe, expect, it } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import { createFamilyExperienceMcpServer } from "../src/mcp.js"
import { FindFamilyExperiencesStructuredContentSchema } from "../src/schemas.js"

process.env["FAMILY_EXPERIENCE_REFERENCE_DATE"] = "2026-07-04"

const fixtureConfig: FamilyExperienceConfig = {
  host: "127.0.0.1",
  port: 3345,
  allowFixture: true,
  seoulOpenDataBaseUrl: "http://openapi.seoul.go.kr:8088",
}

describe("Family experience MCP tool surface", () => {
  it("parses Korean family intent as a first-class MCP tool", async () => {
    // Given: the MCP server exposes a parser tool for broad natural Korean requests.
    const server = createFamilyExperienceMcpServer({ config: fixtureConfig })
    const client = new Client({ name: "mcp-parser-test-client", version: "0.1.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    try {
      await server.connect(serverTransport)
      await client.connect(clientTransport)

      // When: a parent asks with months, weather, region, and venue preference in one sentence.
      const result = await client.callTool({
        name: "parse_family_experience_request",
        arguments: {
          prompt: "내일 비가 오는데 서울에서 24개월 아이와 갈 수 있는 박물관",
        },
      })

      // Then: the parser returns structured child, region, and indoor preference fields.
      expect(result.isError).toBeUndefined()
      expect(result.structuredContent).toMatchObject({
        ok: true,
        parsed: {
          input: {
            location: "Seoul",
            child_age: 2,
            indoor_outdoor_preference: "indoor",
          },
          keywords: expect.arrayContaining(["museum", "rainy_day"]),
        },
      })
    } finally {
      await client.close()
      await server.close()
    }
  })

  it("lists source boundaries as a first-class MCP tool", async () => {
    // Given: source policy must be inspectable before trusting recommendations.
    const server = createFamilyExperienceMcpServer({ config: fixtureConfig })
    const client = new Client({ name: "mcp-source-list-test-client", version: "0.1.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    try {
      await server.connect(serverTransport)
      await client.connect(clientTransport)

      // When: the source-list tool is called.
      const result = await client.callTool({
        name: "list_family_experience_sources",
        arguments: {},
      })

      // Then: it exposes source coverage and unsupported claim boundaries.
      expect(result.isError).toBeUndefined()
      expect(result.structuredContent).toMatchObject({
        sources: expect.arrayContaining([
          expect.objectContaining({ id: "culture_portal" }),
          expect.objectContaining({ id: "kto_tourapi" }),
          expect.objectContaining({ id: "national_culture_festival" }),
        ]),
        unsupported_claims: expect.arrayContaining([
          "booking availability is not asserted",
          "coverage completeness is not asserted",
        ]),
      })
    } finally {
      await client.close()
      await server.close()
    }
  })

  it("accepts structured recommendation arguments without the loose prompt wrapper", async () => {
    // Given: PlayMCP can call tools with extracted structured arguments.
    const server = createFamilyExperienceMcpServer({ config: fixtureConfig })
    const client = new Client({ name: "mcp-structured-recommend-test-client", version: "0.1.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

    try {
      await server.connect(serverTransport)
      await client.connect(clientTransport)

      // When: the recommendation tool receives explicit fields.
      const result = await client.callTool({
        name: "recommend_family_experiences",
        arguments: {
          location: "Seoul",
          date_range: { start: "2026-07-04", end: "2026-07-05" },
          child_age: 4,
          indoor_outdoor_preference: "indoor",
        },
      })
      const structuredContent = FindFamilyExperiencesStructuredContentSchema.parse(
        result.structuredContent,
      )

      // Then: it returns candidates without requiring prompt re-parsing.
      expect(result.isError).toBeUndefined()
      expect(structuredContent.ok).toBe(true)
      if (!structuredContent.ok) {
        throw new Error(structuredContent.failure.message)
      }
      expect(structuredContent.candidates.length).toBeGreaterThan(0)
    } finally {
      await client.close()
      await server.close()
    }
  })
})
