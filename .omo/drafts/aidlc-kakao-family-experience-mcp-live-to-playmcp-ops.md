---
slug: aidlc-kakao-family-experience-mcp-live-to-playmcp-ops
status: approved-for-execution
intent: clear
pending-action: execute first wave: live source proof plus hosted endpoint readiness
approach: keep family-experience as the primary Kakao MCP, close the live Seoul adapter gap, preserve fixture-only labels, and verify through the MCP HTTP surface
---

# Draft: aidlc-kakao-family-experience-mcp-live-to-playmcp-ops

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
- C1 | durable plan for "아이랑 어디가" live-to-PlayMCP execution | active | .omo/plans/aidlc-kakao-family-experience-mcp-live-to-playmcp-ops.md
- C2 | live Seoul official-data adapter can execute a real HTTP JSON request when SEOUL_OPEN_DATA_KEY is present | active | .omo/evidence/task-1-live-http-json-GREEN.txt
- C3 | local hosted MCP surface stays stable at /health and /mcp | active | .omo/evidence/task-2-hosted-surface-GREEN.txt
- C4 | PlayMCP public review, representative image, Kakao Tools finalist work | deferred | apps/family-experience-mcp/docs/RUNBOOK.md

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
- Primary concept | family-experience-mcp | strongest KakaoTalk-shaped repeated-use demo, current repo already has the most complete MCP package | reversible only before public review
- Source strategy | Seoul official culture events first, fixture only for deterministic QA | avoids unsupported nationwide/live claims | reversible by adding registered official source adapters later
- Tool strategy | one public tool, find_family_experiences | keeps PlayMCP review surface small and reliable | reversible after first public proof
- Execution strategy | close live proof and hosted proof before more features | current residual risks are operations/data proof, not ideation | reversible only with documented kill rule

## Findings (cited - path:lines)
- .omo/ulw-research/20260702-211500-aidlc-kakao-mcp-ops-plan-foundation/SYNTHESIS.md:11-18 selects family-experience-mcp and defines the chat promise, source/freshness/confidence edge, and one-tool stance.
- apps/family-experience-mcp/docs/QA_REPORT.md:17-28 records current local verification and explicitly leaves live source proof, final review, representative image, and submission as residual risks.
- apps/family-experience-mcp/src/sources/seoulCulture.ts:64-82 currently returns a source_failure when requestJson is not injected, so a real key alone cannot prove live source execution.
- apps/family-experience-mcp/src/mcp.ts:149-165 selects fixture first, then live Seoul only when fixture is disabled and a key is present.
- apps/family-experience-mcp/docs/RUNBOOK.md:24-34 documents local /health and /mcp checks and PlayMCP temporary endpoint expectations.

## Decisions (with rationale)
- D1: Build the contest entry around "아이랑 어디가" and do not restart the three-concept debate.
- D2: Implement the smallest missing live-source primitive: a redaction-safe HTTP JSON requester for the Seoul official adapter.
- D3: Keep fixture mode explicit and opt-in through FAMILY_EXPERIENCE_ALLOW_FIXTURE=true.
- D4: Treat Kakao public review, representative image, and Kakao Tools widget work as later gates, not claims of completion.

## Scope IN
- Update the approved ULW plan artifact.
- Add live HTTP JSON execution for the Seoul adapter without exposing keyed URLs or raw secrets.
- Preserve existing one-tool MCP contract and fixture/golden behavior.
- Verify by typecheck, tests, scans, and MCP HTTP smoke where possible.

## Scope OUT (Must NOT have)
- No nationwide coverage claim.
- No reservation availability or "currently open" claim.
- No fabricated child suitability claim beyond source-stated or clearly inferred labels.
- No PlayMCP public review/submission claim.
- No scraping, browser parser, unofficial event-page crawling, or extra public MCP tool.

## Open questions
- Whether SEOUL_OPEN_DATA_KEY is available locally for a real live API smoke. If absent, the adapter can still be unit/integration verified against a local HTTP server, but public live freshness remains unproven.
- Exact Kakao Tools finalist widget requirements remain unknown until official finalist-stage guidance is obtained.

## Approval gate
status: approved
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
