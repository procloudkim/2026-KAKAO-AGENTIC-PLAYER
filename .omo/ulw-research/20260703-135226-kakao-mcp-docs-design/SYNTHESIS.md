# ULW-Research Synthesis: Kakao Official MCP Docs Design Mapping

Date: 2026-07-03

## Executive Summary

Yes. The official Kakao/PlayMCP design requirement is understood as a remote MCP service pipeline, not a local chatbot demo. The required competition path is:

1. Create a Kakao Cloud MCP server endpoint.
2. Register that endpoint in PlayMCP developer console.
3. Use temporary registration only for non-final testing.
4. Request review when final.
5. After review, switch visibility from "나에게만 공개" to "전체 공개".
6. Submit once through the AGENTIC PLAYER 10 preliminary button.

For this repo, `apps/family-experience-mcp` is aligned with the prelim PlayMCP direction: it exposes `/mcp`, has one focused tool, uses server-side secrets, redacts keys, keeps temporary registration docs, and avoids unsupported claims. It is not yet complete for contest submission because there is no confirmed Kakao Cloud deployment, PlayMCP final review, public visibility switch, representative image upload, or final submission.

## Official Requirements

Sources:

- Kakao official AGENTIC PLAYER 10 page, accessed 2026-07-03.
- Kakao official press release, accessed 2026-07-03.
- KakaoCloud official MCP Kubernetes tutorial, accessed 2026-07-03.
- PlayMCP console/help material captured in `참고문서-카카오/MCP카카오홈페이지요소.txt` and web fetches, accessed 2026-07-03.

Verified official requirements:

- Prelim period is 2026-06-15 to 2026-07-14; 20 finalists are selected.
- Kakao Cloud endpoint creation is the expected first step.
- PlayMCP registration uses the Kakao Cloud-created MCP server endpoint.
- Temporary registration is for testing and should not be submitted for review.
- Final builds require "등록 및 심사 요청".
- After review, initial visibility is "나에게만 공개"; contest participation requires "전체 공개".
- Submission is one-time only.
- Review can take up to 7 business days.
- Judging criteria are creativity, convenience, and stability.
- Stability includes stable operation, accurate data, and no security issue.
- Finalists must do Kakao Tools additional development.
- Kakao Tools differs from PlayMCP because it supports widget additions and requires a stricter MCP standard.
- Entrants must have lawful rights to the service/data and must not infringe third-party rights.
- False information can cancel PlayMCP registration and award eligibility.
- KakaoCloud official tutorial confirms remote cloud MCP should use HTTP/SSE-style transport; stdio is only for local processes and cannot be used in remote Kubernetes.

## Repo Mapping

Implemented / tested:

- `apps/family-experience-mcp/src/server.ts`: exposes `/health` and `/mcp`.
- `apps/family-experience-mcp/src/mcp.ts`: registers one public tool, `find_family_experiences`.
- `apps/family-experience-mcp/src/schemas.ts`: validates location, date range, and child age/stage.
- `apps/family-experience-mcp/src/config.ts`: keeps provider key diagnostics redacted.
- `apps/family-experience-mcp/src/sources/registry.ts`: registers source authority, allowed claims, confidence labels, and redaction policy.
- `apps/family-experience-mcp/docs/RUNBOOK.md`: documents PlayMCP temporary/private flow, `/mcp`, `.env` secret handling, and pre-share scans.
- `apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md`: stores temporary registration metadata and avoids public-submission claims.
- `apps/family-experience-mcp/docs/QA_REPORT.md`: records verification and explicitly says no final review, public switch, image upload, or contest submission was performed.
- Tests cover one-tool MCP discovery, metadata guardrails, secret redaction, source governance, claim boundaries, and Seoul adapter redaction.

Current local evidence:

- `npm run verify` was reported passing in `apps/family-experience-mcp/docs/QA_REPORT.md`.
- `npm run scan:secrets`, `npm run scan:claims`, and `npm run scan:sources` were reported passing in `apps/family-experience-mcp/docs/QA_REPORT.md`.
- Hosted local MCP proof was reported for `/health` and `/mcp` with exactly one tool.

## Design Verdict

The design direction is correct for Kakao official requirements if the MVP remains:

- One remote HTTP MCP endpoint ending in `/mcp`.
- One highly practical tool: `find_family_experiences`.
- Short Top 3 recommendations with source, date, age-fit basis, parent checks, and next action.
- No unsupported claims about live freshness, nationwide coverage, reservation status, operating status, or child suitability.
- Server-side `.env`/secret-manager keys only.
- No copied copyrighted data, no unsafe crawling, no raw keyed URLs in logs or docs.
- Temporary/private PlayMCP registration first, then final review only after hosted endpoint and evidence pass.

This fits the user's thesis: "개떡같이 채팅해도 찰떡같이 결과를 알려주는" MCP should package search, filtering, and source-backed decision support into a compact chat result.

## Gaps

- Actual Kakao Cloud deployment endpoint is not yet confirmed in this synthesis.
- PlayMCP final review has not been requested.
- Public visibility switch has not been performed.
- Contest preliminary submission has not been performed.
- Official Notion guide target was referenced by Kakao, but the full body was not publicly recoverable in this session.
- Kakao Tools widget schema and stricter MCP validation details remain unresolved beyond the official contest-page statement.
- `package.json` version is `0.0.0`, while runtime/health was reported as `0.1.0`; align before public registration.

## Next Smallest Safe Move

Prepare the remote deployment gate:

1. Align package/runtime version.
2. Deploy `apps/family-experience-mcp` to a public HTTPS Kakao Cloud endpoint.
3. Set deployment secrets through the platform secret manager, not copied `.env`.
4. Verify `/health` and `/mcp`.
5. Run `npm run verify && npm run scan:secrets && npm run scan:claims && npm run scan:sources`.
6. Register in PlayMCP as temporary/private first.
7. Only after private PlayMCP tool discovery passes, request final review.

