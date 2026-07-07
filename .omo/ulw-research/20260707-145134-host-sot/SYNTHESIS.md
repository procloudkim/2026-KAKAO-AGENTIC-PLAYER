# ULW-Research Synthesis: Host Requirements SOT

Date: 2026-07-07

## Executive Summary

The organizer/host requirements are now consolidated in `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`. The document separates official public sources from the user-provided organizer notice excerpt because the `kko.to` short links redirected through a page that was not fetchable in this environment.

The AGENTIC PLAYER 10 public page confirms the contest submission flow: create a KakaoCloud MCP server endpoint, register it in PlayMCP, use temporary registration for testing when not final, request review when ready, switch to all-public after approval, and submit once through the Player preliminary entry flow. The exact endpoint pattern `https://mcp-name.playmcp-endpoint.kakaocloud.io/mcp`, outbound egress IPs, and current PlayMCP-in-KC secret limitation come from the organizer notice excerpt provided by the user.

## Source Map

| Source | Status | Finding |
| --- | --- | --- |
| `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10` | Official public | Confirms KakaoCloud endpoint creation, PlayMCP registration, temporary registration, review request, all-public switch, and one-time preliminary submission flow. |
| `https://modelcontextprotocol.io/` | Official public | Confirms MCP as the standard protocol for AI applications connecting to tools/data/workflows. |
| `https://modelcontextprotocol.io/docs/tools/inspector` | Official public | Confirms MCP Inspector is for testing/debugging MCP servers, tools, schemas, and execution results. |
| `https://docs.kakaocloud.com/en/tutorial/container/k8s-engine-mcp` | Official public | Confirms remote KakaoCloud MCP deployment is HTTPS/load-balancer oriented and `stdio` is not suitable for remote Kubernetes. |
| `https://playmcp.kakao.com/` plus Kakao public pages | Official public | Confirms PlayMCP public platform surface. |
| User-provided organizer notice excerpt | Organizer guidance | Provides exact KC endpoint pattern, console update flow, egress IP ranges, and current env/Secret injection limitation. |

## Verified Claims

| Claim | Verdict | Evidence |
| --- | --- | --- |
| Public contest flow requires KakaoCloud endpoint before PlayMCP registration. | Confirmed | AGENTIC PLAYER 10 public page. |
| Temporary registration should not be treated as final review. | Confirmed | AGENTIC PLAYER 10 public page. |
| After review approval, visibility must be changed to all-public before preliminary entry. | Confirmed | AGENTIC PLAYER 10 public page. |
| MCP Inspector can inspect/test MCP tools and schemas. | Confirmed | MCP Inspector official docs. |
| Remote KakaoCloud MCP should use remote HTTP/HTTPS transport, not local `stdio`. | Confirmed | KakaoCloud MCP deployment docs. |
| Exact host pattern `https://mcp-name.playmcp-endpoint.kakaocloud.io/mcp`. | Organizer-notice confirmed, not independently public-confirmed | User-provided organizer excerpt; public sources did not expose the exact canonical hostname pattern. |
| PlayMCP-in-KC currently lacks env/Secret injection. | Organizer-notice confirmed, time-sensitive | User-provided organizer excerpt dated in this workspace on 2026-07-07. Must re-check before deployment because the notice says support is planned for July week 2. |

## Repository Changes

- Added `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`.
- Updated `apps/family-experience-mcp/docs/RUNBOOK.md` to reference the SOT and separate generic secret-manager deployment from PlayMCP-in-KC host-specific constraints.
- Updated `apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md` with endpoint update and `정보 불러오기` / `등록 및 심사 요청` stop-line guidance.
- Updated `apps/family-experience-mcp/docs/FAMILY_EXPERIENCE_ONE_PAGER.html` to show the KC host gate and secret boundary.
- Updated `apps/family-experience-mcp/scripts/scan-sources.ts` to allow official host/platform documentation URLs and the PlayMCP-in-KC endpoint hostname pattern without weakening event-source governance.

## Verification

Run from `apps/family-experience-mcp`:

| Command | Result |
| --- | --- |
| `npm run verify` | PASS: typecheck, 17 test files, 90 tests. |
| `npm run scan:secrets` | PASS: 141 files scanned. |
| `npm run scan:sources` | PASS: 89 files scanned. |
| `npm run scan:claims` | PASS: 122 files scanned. |

Visual/manual QA:

- Rendered `docs/FAMILY_EXPERIENCE_ONE_PAGER.html` with local Chrome headless.
- Fresh screenshot: `.omo/evidence/host-requirements-sot-20260707/one-pager-host-sot-tall.png`.
- Fixed a CJK wrapping issue in the header status card before final capture.

## Remaining Human Decisions

1. Confirm current PlayMCP-in-KC env/Secret injection status in the latest organizer notice or console.
2. Choose secret strategy before deployment: prefer env/Secret injection if available; otherwise explicitly approve the temporary private image workaround and rotate/remove keys later.
3. Deploy to KakaoCloud PlayMCP-in-KC and obtain the real HTTPS `/mcp` endpoint.
4. Update PlayMCP MCP information, click `정보 불러오기`, and verify tool discovery.
5. Click `등록 및 심사 요청` only after real endpoint smoke passes.
6. After approval, switch to all-public and perform the one-time AGENTIC PLAYER 10 preliminary submission.
