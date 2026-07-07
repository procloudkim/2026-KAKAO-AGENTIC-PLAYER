# ULW Research Notepad: Family Experience MCP Turnaround

Date: 2026-07-07

## Bootstrap

Tier: HEAVY. Reason: contest submission strategy depends on external official requirements, KakaoCloud deployment, API keys, security, and operational evidence.

Skills used:

- `omo:ulw-research`: explicit user request to research a turnaround strategy.
- `mcp__codegraph.codegraph_explore`: repository has `.codegraph`; used to inspect MCP architecture before local file reads.

Team/subagent status:

- Codex `multi_agent_v1`/teammode tools are not exposed in this session. Fallback: main-thread saturation using official web sources, CodeGraph, local docs, and execution probes.

## Problem Definition

Goal: find the fastest credible way to turn the current Family Experience MCP from "technical MVP but weak submission confidence" into a contest-submittable and judge-credible MCP.

Context:

- Current product is `아이랑 어디가`, a Family Experience MCP with one public tool: `find_family_experiences`.
- Official contest path requires KakaoCloud endpoint, PlayMCP registration, review, public switch, and one-time preliminary submission.
- User's concern is whether the current state is too weak and how to recover.

Constraints:

- Do not print raw API keys.
- Do not claim deployment/review/public/submission has happened without evidence.
- Avoid unsupported claims: nationwide complete coverage, real-time freshness, reservation/open-now, child-safety certification.

Success criteria:

1. Separate minimum submit gate from winning-grade gate.
2. Identify blockers verified in this session.
3. Provide a ranked turnaround plan with stop/go decisions.

## Evidence Captured

Official sources checked:

- Kakao AGENTIC PLAYER 10 page.
- KakaoCloud MCP deployment tutorial.
- MCP Inspector documentation.
- MCP introduction.

Repo evidence checked:

- CodeGraph: `types.ts`, `schemas.ts`, `etl/nationwide.ts`, `etl/cacheQuery.ts`, `sources/types.ts`.
- Local docs: `QA_REPORT.md`, `HOST_REQUIREMENTS_SOT.md`, previous requirement recheck synthesis, `package.json`.

Execution probes:

- `.env` key presence probe: all four key variables missing in current local `.env`.
- Docker daemon probe: unavailable.
- `npm run verify`: PASS, 17 test files / 90 tests.

## Findings

- The implementation is not empty or broken: typecheck and tests pass.
- The core product shape is usable: one focused tool, typed schema, cache-first ETL, parent-facing output fields.
- The current weakness is evidence and operations, not baseline code.
- KakaoCloud deployment proof is missing.
- PlayMCP information load proof is missing.
- Current local `.env` does not contain the expected provider keys.
- Docker daemon is not available, so local Docker build proof cannot be captured right now.
- Static/fixture cache alone is not strong enough for a winning-grade claim.

## Decision

Do not broaden the product. Narrow the promise and harden the evidence chain.

Chosen path: "72-hour credibility sprint"

1. Deployment proof first.
2. Official-source cache proof second.
3. PlayMCP tool-discovery and starter-prompt proof third.
4. Submission copy and screenshots fourth.
5. Only after that, improve ranking/UX.

Rejected alternatives:

- Add more features now: increases failure surface and does not solve review readiness.
- Claim nationwide/live coverage: unsupported and risky under contest false-info rules.
- Wait for a perfect data platform: misses submission timing and overbuilds the preliminary gate.

