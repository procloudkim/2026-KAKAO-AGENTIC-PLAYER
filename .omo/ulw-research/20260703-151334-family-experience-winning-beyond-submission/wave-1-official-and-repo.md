# Wave 1: Official Criteria And Repo State

## Official Sources

- Kakao AGENTIC PLAYER 10 page confirms preliminary flow, Kakao Cloud endpoint, PlayMCP registration, review, public visibility switch, one-time submission, finalist Kakao Tools development, judging criteria, and review timing.
- Kakao press release confirms this is a PlayMCP-based Kakao Tools development contest and that 20 finalists are exposed through Kakao Tools to KakaoTalk users for voting.
- KakaoCloud MCP Kubernetes tutorial confirms remote MCP should use HTTP/SSE style transport and that stdio is not usable in remote Kubernetes.

## Repo Sources

- `apps/family-experience-mcp/docs/QA_REPORT.md`: local gates pass; residual risks are live freshness, no real SEOUL live smoke, no PlayMCP final review, no public switch, no image upload, no contest submission.
- `apps/family-experience-mcp/docs/DECISIONS.md`: fixture-first, optional Seoul adapter, no source expansion, no unsupported claims.
- `concept/DATA_PIPELINE_ARCHITECTURE.md`: official/source-backed action-card architecture and claim boundaries.
- `concept/family-experience-mcp/REFINED_PROPOSAL.md`: Top 3 parent-facing promise and response card fields.

## Key Findings

1. Submission-readiness is necessary but not enough. Official judging explicitly includes creativity, convenience, and stability.
2. Current build is strongest on stability guardrails: one tool, redaction, claim scans, source registry, deterministic QA.
3. Current build is weakest on live user value: real event freshness, deployed live proof, and broad enough data coverage for parents outside one narrow demo lane.
4. Kakao Tools finals imply richer response/widget readiness, not just text-only MCP operation.

## EXPAND

- LEAD: Turn official judging criteria into measurable gates for this project.
- LEAD: Define "search-quality improvement" as an eval harness, not a slogan.
- LEAD: Map Kakao Tools/finals readiness to future widget/action-card requirements.
- LEAD: Build public-vote narrative and demo package beyond code.

