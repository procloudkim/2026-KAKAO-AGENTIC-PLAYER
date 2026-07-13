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
        name: "find_family_experiences",
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
