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
        "Airang Where / 아이랑 어디가: Find source-grounded family experiences in pages of up to three by child age or stage, date, location, venue preference, and keywords. Location accepts a province/city or any Seoul district, including short Korean names such as 강남. Loose prompts accept common numeric or Korean date formats in any field order. For structured calls, send child_age or child_stage, not both. When the user asks for more, call this tool with the previous result's next_cursor as the only cursor argument; never invent or modify it. A new prompt or structured query starts over. Returns evidence and parent verification steps, without guaranteeing availability, safety, or suitability.",
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
