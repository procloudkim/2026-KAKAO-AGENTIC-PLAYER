import { McpServer } from "@modelcontextprotocol/server"

import {
  callFindFamilyExperiences,
  type FindFamilyExperiencesToolOptions,
} from "./findFamilyExperiencesTool.js"
import {
  FindFamilyExperiencesMcpInputSchema,
} from "./schemas.js"

export const FAMILY_EXPERIENCE_TOOL_NAME = "find_family_experiences"
export const FAMILY_EXPERIENCE_PUBLIC_TOOLS = [FAMILY_EXPERIENCE_TOOL_NAME] as const

type McpServerOptions = FindFamilyExperiencesToolOptions

export function createFamilyExperienceMcpServer(options: McpServerOptions = {}): McpServer {
  const server = new McpServer({ name: "family-experience-mcp", version: "0.1.0" })

  server.registerTool(
    FAMILY_EXPERIENCE_TOOL_NAME,
    {
      title: "Find family experiences / 가족 체험 찾기",
      description:
        "Airang Where / 아이랑 어디가: Find up to three source-grounded family experiences by child age or stage, date, location, venue preference, and keywords. For structured calls, send child_age or child_stage, not both. Returns evidence, caveats, and parent verification steps; it does not guarantee availability, safety, or suitability.",
      inputSchema: FindFamilyExperiencesMcpInputSchema,
      annotations: {
        title: "Find family experiences / 가족 체험 찾기",
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
        idempotentHint: true,
      },
    },
    async (input) => callFindFamilyExperiences(input, { ...options, toolName: FAMILY_EXPERIENCE_TOOL_NAME }),
  )

  return server
}

export { callFindFamilyExperiences }
