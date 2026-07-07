# Ultraresearch Synthesis: No-HITL Winning Readiness for Family Experience MCP

Date: 2026-07-02 KST

Workers: 8 first-wave agents plus main-thread expansion. Waves: 3. Verifications: 3 executed local/network checks. Final format: markdown.

## Problem Definition

Goal: determine what is still required to complete the selected Kakao AGENTIC PLAYER 10 MCP at a high contest level while eliminating human-in-the-loop from internal build and QA wherever possible.

Context: the repo has three concept branches, but the selected first execution target is `family-experience-mcp`, public name `아이랑 어디가`. The plan builds one MCP tool that returns short parent-action Top 3 cards for child-friendly experiences, first through fixture data and optionally Seoul official cultural-events data.

Constraints:

- Do not build pharmacy or parent-trust in this pass.
- Do not claim nationwide/live/reservation/child suitability without source support.
- Do not scrape unofficial event pages.
- Do not request PlayMCP final review or one-time contest submission from automation.
- Use no-HITL for internal verification, not for external Kakao review/voting/legal gates.

Success criteria:

- Local MCP server starts and `/health` returns exact HTTP 200.
- MCP client lists exactly one public tool, `find_family_experiences`.
- Golden prompts prove happy path, missing-age clarification, no-result safety, and source-failure safety.
- `verify`, `typecheck`, unit tests, MCP smoke, golden smoke, secret scan, claim scan, source scan, and port cleanup receipts pass.
- PlayMCP temporary-registration docs are ready without requesting final review/submission.

Done-when: all task GREEN receipts and final F1-F4 receipts exist under `.omo/evidence/`, and the app directory `apps/family-experience-mcp/` exists with passing verification.

## Executive Summary

The correct answer is not "remove every human." It is "remove every human from internal QA, evidence capture, and regression judgment; explicitly mark Kakao's external review, public switch, final one-time submission, judging, and user voting as external gates." Kakao's official page defines those process steps, so a fully autonomous end-to-end contest submission claim would be false.

The current repo is execution-ready as a plan, not product-complete. The high-accuracy reviewed plan is strong, but `apps/family-experience-mcp/` does not yet exist and no task/final GREEN receipts exist. The immediate next move is implementation from `.omo/plans/family-experience-mcp-first-build.md`, with one research-driven update: competition is not empty. `키즈허브` and several tourism/culture MCPs overlap the surface, so the winning edge must be narrower and sharper: age/stage evidence labels, official-source provenance, Top 3 action cards, strict no-fabrication, and reliable one-turn chat behavior.

## Evidence Brief

### Authoritative Source Map

1. Kakao official contest page: schedule, registration/review flow, visibility, one-time submission, judging criteria, review timing, and legal/data warranties.
2. Seoul Open Data OA-15486: official Seoul cultural-events source, event fields, daily refresh, and public license metadata.
3. MCP TypeScript SDK v2 docs: `McpServer`, `registerTool`, `structuredContent`, `isError`, split packages, and client `listTools`/`callTool` behavior.
4. Repo plan and concept docs: local source-governance, verification gates, no-scraping boundary, age-fit/confidence labels, and final checks.
5. Executed verification artifacts: PlayMCP catalog scrape, npm metadata, current implementation-state check.

### Verified Facts

- Kakao requires PlayMCP registration/review, public visibility before participation, and one-time participation submission.
- Kakao evaluates creativity, convenience, and stability; final stage includes internal judging and user voting.
- Seoul OA-15486 includes cultural-event fields such as target audience, dates, venue, fee, homepage/contact-like fields, daily refresh, and license metadata.
- MCP split packages currently resolve to `2.0.0-beta.1`; legacy `@modelcontextprotocol/sdk` resolves to `1.29.0`.
- The public PlayMCP catalog sweep returned 212 entries across 18 pages.
- The current repo lacks `apps/family-experience-mcp/` and lacks task/final GREEN receipts.

### Inferences

- Full no-HITL is impossible for the external contest lifecycle because Kakao review, visibility switching, one-time submission, judging, and voting are external process gates.
- Internal no-HITL is feasible if all acceptance checks remain scriptable and evidence-producing.
- "No competitor" should be rejected. The market has partial competitors; `키즈허브` is the most important one.

### Unknowns

- Exact PlayMCP/Kakao Tools runtime acceptance behavior for the implemented endpoint until temporary registration and real smoke occur.
- Exact live Seoul API response shape under the user's key until adapter implementation tests against the current API.
- Whether Kakao Tools widget requirements will add additional structured UI constraints after preliminary selection.

### Risks

- SDK beta churn can break imports or protocol behavior.
- Event source records may not contain enough child-age suitability fields.
- Overclaiming "safe", "suitable", "live", "reservation available", or "nationwide" can hurt stability/legal credibility.
- Competitors already cover broad parenting and tourism; a generic event finder will not stand out.

## Method Selection

Candidate methods:

1. Build all three ideas in parallel.
2. Build a broad nationwide family-experience recommender immediately.
3. Build one narrow family-experience MCP first with fixture-first verification and one optional official source.
4. Pivot to pharmacy because the repo has more prior implementation context.
5. Pivot to parent-trust because the existing local plugin is closer to mature.

Chosen method: method 3. It gives the best balance of contest differentiation, user value, data safety, and no-HITL verifiability.

Fallback method: pharmacy MCP if family-experience golden prompt QA fails because event records lack date/place/age clue/contact/freshness.

Rejected alternatives:

- All-three parallel build: too much surface area before the review window; lowers evidence quality.
- Broad nationwide first build: creates source-rights, coverage, and suitability overclaim risk.
- Pharmacy first: practical but more commoditized in the current PlayMCP catalog, and the user explicitly wants the family-experience draft concretized.
- Parent-trust first: strong safety value, but product claims and evidence matching are more legally sensitive.

## Execution Plan

Baseline: implement exactly one TypeScript MCP app under `apps/family-experience-mcp/` with one public tool, fixture-first behavior, optional Seoul adapter, and no final PlayMCP submission.

Controllable variables: source mode, ranking weights, age/stage labels, response length, scan scopes, and package versions.

Fixed variables: one public tool, `/mcp` endpoint, `/health` exact 200 check, source labels, no unofficial scraping, no unsupported claims, and no sibling workspace modification.

Budget ladder:

1. Task 1-3: scaffold, schemas, source registry/fixtures.
2. Task 4-6: pipeline, MCP surface, optional Seoul adapter.
3. Task 7-9: golden smoke, PlayMCP temp-registration docs, scans/hardening.
4. F1-F4: compliance, code quality, real-surface QA, scope fidelity.

Promotion rule: move to the next wave only when the current wave's RED/GREEN evidence files exist and the listed commands pass.

Kill rule: stop or fallback if the app cannot return useful Top 3 fixture answers, if source governance requires broad crawling, or if golden prompt safety fails.

Stop rule: stop after F1-F4 pass and before external PlayMCP review/submission actions.

Final evaluation rule: exact commands in `.omo/plans/family-experience-mcp-first-build.md` must pass and leave cleanup receipts.

Wall-clock estimate: 1 focused implementation pass for fixture-first MVP, plus extra time for optional live Seoul adapter debugging if key/API behavior differs.

RAM estimate: low; Node/TypeScript/Vitest plus one local HTTP server.

CPU/GPU/NPU split: CPU only; no GPU/NPU needed.

Reboot-required resources: none expected.

## Findings by Theme

### No-HITL Boundary

Consensus: internal QA can be no-HITL; external contest gates cannot.

Evidence:

- Kakao official flow includes registration/review, visibility change, and one-time participation submission.
- The plan already defines zero-human internal verification and final F1-F4 gates.

Verified: yes for process facts; the no-HITL limit is an inference from those facts.

### Data Pipeline

Consensus: first-build data pipeline is strong if it stays official-source-first and source-labeled.

Evidence:

- `concept/DATA_PIPELINE_ARCHITECTURE.md` defines source registry, adapter boundary, raw snapshot, normalization, confidence, cache/stale, redaction, and response card stages.
- `concept/family-experience-mcp/DATA_PIPELINE.md` defines normalized fields and safety rules.
- Seoul OA-15486 is a credible first live source, but age suitability remains source-specific and often weak.

Verified: yes at plan/source level; live adapter behavior remains unimplemented.

### MCP Feasibility

Consensus: feasible, but package/protocol versions must be pinned.

Evidence:

- MCP v2 docs show `new McpServer`, `registerTool`, `structuredContent`, and `isError` behavior.
- `verify-mcp-package-metadata.md` confirms split packages are currently beta-line `2.0.0-beta.1`.

Verified: yes for metadata and docs; implementation smoke still pending.

### Competitive Positioning

Consensus: partial competitors exist; differentiation must be sharper.

Evidence:

- `verify-playmcp-catalog-scrape.md` confirms 212 public catalog entries.
- `키즈허브` covers broad parenting, museums/cultural facilities, kids cafes, books by age, welfare, childcare, and routing.
- Tourism/culture MCPs cover events, attractions, festivals, and performances.

Verified: yes for public catalog observations. Exact market completeness remains limited to public PlayMCP catalog access.

## Codebase Findings

- `.omo/plans/family-experience-mcp-first-build.md`: implementation scope, no-HITL internal verification, final F1-F4 gates, and final success criteria.
- `.omo/evidence/family-experience-mcp-first-build-high-accuracy-fix-summary.md`: prior high-accuracy review status is PASS.
- `concept/DATA_PIPELINE_ARCHITECTURE.md`: MECE pipeline stages and family-experience no-overclaim boundaries.
- `concept/family-experience-mcp/DATA_PIPELINE.md`: normalized fields and safety rules.
- `schema/AGENTS.md`: OML role protocol.

## Verified Claims

| claim | verdict | evidence |
| --- | --- | --- |
| Repo has reviewed plan but no implementation app/GREEN receipts | CONFIRMED | `verify-repo-implementation-state.md` |
| MCP split packages are beta-line `2.0.0-beta.1`; legacy sdk is `1.29.0` | CONFIRMED | `verify-mcp-package-metadata.md` |
| Public PlayMCP catalog has 212 entries / 18 pages at scrape time | CONFIRMED | `verify-playmcp-catalog-scrape.md` |
| `키즈허브` is a major partial direct competitor | CONFIRMED | `verify-playmcp-catalog-scrape.md`, `assets/playmcp-neighbor-candidate-matrix.md` |
| Exact direct duplicate does not exist | UNRESOLVED | Catalog sweep supports no obvious duplicate but cannot prove absence |
| Full no-HITL contest lifecycle is impossible | ACCEPTED INFERENCE | Kakao official process facts in `claim-ledger.md` |

## Contradictions

- Earlier research phrasing implied no direct competitor. The all-page catalog sweep refutes the strong version. Resolution: assert only that no exact duplicate was verified; treat `키즈허브` as a high-risk partial competitor.
- User goal asks for HITL to be thoroughly excluded. Kakao official process requires external review/submission/voting gates. Resolution: exclude HITL from internal QA; preserve external gates as explicit non-automatable release steps.

## Gaps

- No product implementation yet.
- No live Seoul adapter smoke under a real key.
- No temporary PlayMCP registration smoke yet.
- No Kakao Tools widget proof yet.
- No evidence that national expansion sources can support child-age suitability without overclaiming.

## Expansion Trace

Wave 1:

- Repo traceability, no-HITL QA, data governance, OML precheck, official Kakao constraints, PlayMCP competitor gap, MCP SDK/protocol, official event-data sources.

Wave 2:

- Executed PlayMCP catalog scrape, npm package metadata check, repo implementation-state check.

Wave 3:

- Closed competitor differentiation, SDK beta risk, and HITL boundary leads.

Convergence: no unchecked research leads remain for the planning/quality-gate artifact. Remaining work is implementation execution.

