import type { CallToolResult } from "@modelcontextprotocol/server"
import { McpServer } from "@modelcontextprotocol/server"

import {
  callFindFamilyExperiences,
  type FindFamilyExperiencesToolOptions,
} from "./findFamilyExperiencesTool.js"
import { parseLooseFamilyPromptDetails } from "./promptParser.js"
import {
  EvaluateFamilyRecommendationInputSchema,
  FamilyExperienceSourceListInputSchema,
  FamilyExperienceSourceListSchema,
  ParseFamilyExperienceRequestInputSchema,
  ParseFamilyExperienceRequestResultSchema,
  SearchFamilyExperienceCandidatesInputSchema,
} from "./mcpToolSchemas.js"
import {
  FindFamilyExperiencesMcpInputSchema,
  FindFamilyExperiencesStructuredContentSchema,
  type FamilyExperienceMcpInput,
  type FindFamilyExperiencesInput,
} from "./schemas.js"

export const FAMILY_EXPERIENCE_TOOL_NAME = "find_family_experiences"
export const RECOMMEND_FAMILY_EXPERIENCES_TOOL_NAME = "recommend_family_experiences"
export const PARSE_FAMILY_EXPERIENCE_REQUEST_TOOL_NAME = "parse_family_experience_request"
export const SEARCH_FAMILY_EXPERIENCE_CANDIDATES_TOOL_NAME = "search_family_experience_candidates"
export const LIST_FAMILY_EXPERIENCE_SOURCES_TOOL_NAME = "list_family_experience_sources"
export const EVALUATE_FAMILY_RECOMMENDATION_QUALITY_TOOL_NAME = "evaluate_family_recommendation_quality"

export const FAMILY_EXPERIENCE_PUBLIC_TOOLS = [
  RECOMMEND_FAMILY_EXPERIENCES_TOOL_NAME,
  PARSE_FAMILY_EXPERIENCE_REQUEST_TOOL_NAME,
  SEARCH_FAMILY_EXPERIENCE_CANDIDATES_TOOL_NAME,
  LIST_FAMILY_EXPERIENCE_SOURCES_TOOL_NAME,
  EVALUATE_FAMILY_RECOMMENDATION_QUALITY_TOOL_NAME,
  FAMILY_EXPERIENCE_TOOL_NAME,
] as const

type McpServerOptions = FindFamilyExperiencesToolOptions

export function createFamilyExperienceMcpServer(options: McpServerOptions = {}): McpServer {
  const server = new McpServer({ name: "family-experience-mcp", version: "0.1.0" })

  server.registerTool(
    RECOMMEND_FAMILY_EXPERIENCES_TOOL_NAME,
    {
      title: "가족 체험 추천",
      description:
        "아이 나이/발달단계, 날짜, 지역, 실내외 조건을 바탕으로 근거 있는 가족 체험 후보를 최대 3개 추천합니다.",
      inputSchema: FindFamilyExperiencesMcpInputSchema,
      outputSchema: FindFamilyExperiencesStructuredContentSchema,
    },
    async (input) => callFindFamilyExperiences(input, { ...options, toolName: RECOMMEND_FAMILY_EXPERIENCES_TOOL_NAME }),
  )

  server.registerTool(
    PARSE_FAMILY_EXPERIENCE_REQUEST_TOOL_NAME,
    {
      title: "가족 체험 요청 파싱",
      description:
        "한국어 자연어 요청에서 지역, 날짜, 아이 나이/단계, 실내외 선호, 검색 키워드와 누락 조건을 구조화합니다.",
      inputSchema: ParseFamilyExperienceRequestInputSchema,
      outputSchema: ParseFamilyExperienceRequestResultSchema,
    },
    async (input) => callParseFamilyExperienceRequest(input),
  )

  server.registerTool(
    SEARCH_FAMILY_EXPERIENCE_CANDIDATES_TOOL_NAME,
    {
      title: "가족 체험 후보 검색",
      description:
        "명시 조건으로 후보를 검색합니다. 결과는 추천보다 원자료 확인과 후보 비교에 초점을 둡니다.",
      inputSchema: SearchFamilyExperienceCandidatesInputSchema,
      outputSchema: FindFamilyExperiencesStructuredContentSchema,
    },
    async (input) => callFindFamilyExperiences(input, { ...options, toolName: SEARCH_FAMILY_EXPERIENCE_CANDIDATES_TOOL_NAME }),
  )

  server.registerTool(
    LIST_FAMILY_EXPERIENCE_SOURCES_TOOL_NAME,
    {
      title: "가족 체험 데이터 소스",
      description:
        "아이랑 어디가가 사용하는 공개 데이터 소스, 인증 필요 여부, 캐시/실시간 경계, 금지 claim을 설명합니다.",
      inputSchema: FamilyExperienceSourceListInputSchema,
      outputSchema: FamilyExperienceSourceListSchema,
    },
    async () => callListFamilyExperienceSources(),
  )

  server.registerTool(
    EVALUATE_FAMILY_RECOMMENDATION_QUALITY_TOOL_NAME,
    {
      title: "가족 체험 추천 품질 점검",
      description:
        "요청 조건 기준으로 추천 결과가 출처, 연령 근거, 날짜/지역, 보호자 확인사항, 금지 claim 경계를 갖췄는지 점검합니다.",
      inputSchema: EvaluateFamilyRecommendationInputSchema,
      outputSchema: FindFamilyExperiencesStructuredContentSchema,
    },
    async (input) => callFindFamilyExperiences(input, { ...options, toolName: EVALUATE_FAMILY_RECOMMENDATION_QUALITY_TOOL_NAME }),
  )

  server.registerTool(
    FAMILY_EXPERIENCE_TOOL_NAME,
    {
      title: "아이랑 어디가 호환 도구",
      description:
        "이전 버전 호환용 alias입니다. 새 호출에는 recommend_family_experiences를 우선 사용하세요.",
      inputSchema: FindFamilyExperiencesMcpInputSchema,
      outputSchema: FindFamilyExperiencesStructuredContentSchema,
    },
    async (input) => callFindFamilyExperiences(input, { ...options, toolName: FAMILY_EXPERIENCE_TOOL_NAME }),
  )

  return server
}

export { callFindFamilyExperiences }

function callParseFamilyExperienceRequest(input: unknown): CallToolResult {
  const parsedInput = ParseFamilyExperienceRequestInputSchema.safeParse(input)

  if (!parsedInput.success) {
    const structuredContent = ParseFamilyExperienceRequestResultSchema.parse({
      ok: false,
      failure: {
        code: "invalid_input",
        message: parsedInput.error.issues.map((issue) => issue.message).join("; "),
        retryable: false,
      },
    })
    return {
      isError: true,
      content: [{ type: "text", text: "요청 문장을 파싱하지 못했습니다. prompt를 입력해 주세요." }],
      structuredContent,
    }
  }

  const parsedPrompt = parseLooseFamilyPromptDetails(parsedInput.data.prompt)

  if (!parsedPrompt.ok) {
    const structuredContent = ParseFamilyExperienceRequestResultSchema.parse({
      ok: false,
      failure: { code: "invalid_input", message: parsedPrompt.reason, retryable: false },
    })
    return {
      isError: true,
      content: [{ type: "text", text: "아이 나이 또는 발달 단계가 필요합니다." }],
      structuredContent,
    }
  }

  const structuredContent = ParseFamilyExperienceRequestResultSchema.parse({
    ok: true,
    parsed: {
      input: parsedPrompt.input,
      assumptions: parsedPrompt.assumptions,
      missing_fields: parsedPrompt.missing_fields,
      keywords: parsedPrompt.keywords,
    },
  })

  return {
    content: [{ type: "text", text: summarizeParsedRequest(parsedPrompt.input) }],
    structuredContent,
  }
}

function callListFamilyExperienceSources(): CallToolResult {
  const structuredContent = FamilyExperienceSourceListSchema.parse({
    sources: [
      {
        id: "seoul_open_data",
        role: "city_authority",
        coverage: "서울 문화/행사 데이터. 서울 조건에서 우선 사용합니다.",
        authentication: "SEOUL_OPEN_DATA_KEY when live API is used",
        runtime_boundary: "cache-first; live call is for ETL proof or configured Seoul fallback",
      },
      {
        id: "culture_portal",
        role: "national_authority",
        coverage: "문화포털 한눈에보는 문화정보. 전국 확장 캐시의 주요 후보 소스입니다.",
        authentication: "CULTURE_PORTAL_SERVICE_KEY for ETL/live proof",
        runtime_boundary: "cache-first in MCP runtime",
      },
      {
        id: "kto_tourapi",
        role: "national_authority",
        coverage: "한국관광공사 국문 관광정보. 관광/행사 후보 보강에 사용합니다.",
        authentication: "KTO_TOURAPI_SERVICE_KEY for ETL/live proof",
        runtime_boundary: "cache-first in MCP runtime",
      },
      {
        id: "national_culture_festival",
        role: "standard_dataset",
        coverage: "전국문화축제표준데이터 CSV fallback. API key 없이 로컬 CSV로 정규화합니다.",
        authentication: "none for CSV fallback",
        runtime_boundary: "local CSV to cache; not a live/open-now proof",
      },
    ],
    unsupported_claims: [
      "coverage completeness is not asserted",
      "current venue status is not asserted",
      "booking availability is not asserted",
      "child suitability and safety are not guaranteed",
    ],
  })

  return {
    content: [
      {
        type: "text",
        text: "공개 데이터와 검증 캐시 기반입니다. 실제 방문 전 일정, 장소, 비용, 대상 연령은 보호자가 공식 출처에서 재확인해야 합니다.",
      },
    ],
    structuredContent,
  }
}

function summarizeParsedRequest(input: FindFamilyExperiencesInput & Pick<FamilyExperienceMcpInput, "indoor_outdoor_preference">): string {
  const childSelector =
    input.child_age === undefined ? `child_stage=${input.child_stage ?? "unknown"}` : `child_age=${input.child_age}`

  return [
    "요청을 구조화했습니다.",
    `location=${input.location}`,
    `date_range=${input.date_range.start}~${input.date_range.end}`,
    childSelector,
    `indoor_outdoor=${input.indoor_outdoor_preference ?? "unknown"}`,
  ].join("\n")
}
