---
slug: family-experience-mcp-first-build
status: plan-written
intent: clear
review_required: true
pending-action: write .omo/plans/family-experience-mcp-first-build.md
approach: one-tool TypeScript MCP server for family-experience recommendations, fixture-first plus one Seoul official-data adapter, with PlayMCP temporary-registration readiness
---

# Draft: family-experience-mcp-first-build

## Task classification

- Type: research-heavy / architecture planning.
- Tier: HEAVY.
- Reason: greenfield MCP server, external public APIs, deployment/registration surface, data provenance, and hackathon review constraints.
- Skills used:
  - `omo:ulw-plan`: user explicitly invoked it; planner-only, no product-code implementation.
  - `context7-mcp`: current MCP protocol and TypeScript SDK docs are relevant to tool schema, structured output, and HTTP transport.
- Skills intentionally skipped:
  - `omo:git-master`: no commit requested.
  - `omo:programming`: no product code edited in this planning turn.
  - `babygear-risk-radar` / `parentpick-guard`: not the selected first-priority branch.

## Problem Definition

- Goal: produce one decision-complete implementation plan for the first-priority `concept/family-experience-mcp` branch.
- Context: the repo already selected family-experience as the primary concept, with pharmacy as fallback and parent-trust on hold.
- Constraints:
  - planning only; product code must not be changed in this turn.
  - use official/public data sources first.
  - do not fabricate age fit, reservation state, or live/current claims.
  - PlayMCP review rewards creativity, convenience, stability, accurate data, and security.
- Success criteria for the later worker:
  - one MCP tool, `find_family_experiences`, can answer the first golden prompt with Top 3 cards.
  - missing age, no-result, and source-failure prompts behave safely.
  - local HTTP MCP smoke proves tool metadata and tool call behavior.
  - PlayMCP temporary-registration payload/fields are ready.
- Done-when for this planning turn: approval brief is recorded here and the user explicitly approves or changes the approach.

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

| id | outcome | status | evidence path |
|---|---|---|---|
| C1 | TypeScript MCP server surface exposes one HTTP endpoint suitable for local smoke and later PlayMCP registration. | active | Context7 MCP TS SDK docs; `HTML.txt:224`, `HTML.txt:337` |
| C2 | `find_family_experiences` input/output schemas are strict, short, and provenance-bearing. | active | `concept/family-experience-mcp/MCP_TOOLS.md:3`, `concept/family-experience-mcp/REFINED_PROPOSAL.md:7` |
| C3 | Data lane uses deterministic fixture first and one official Seoul cultural-events adapter when a key exists. | active | `concept/family-experience-mcp/DATA_PIPELINE.md:3`, `concept/family-experience-mcp/MECE_RESEARCH.md:18` |
| C4 | Ranking/response renderer returns Top 3 with age-fit reason, confidence label, parent checks, and next action. | active | `PLANS.md:47`, `concept/family-experience-mcp/REFINED_PROPOSAL.md:19` |
| C5 | QA proves happy, missing-input, no-result, and source-failure behavior via agent-run commands. | active | `concept/family-experience-mcp/GOLDEN_PROMPTS.md:3`, `concept/family-experience-mcp/EXPERIMENTS.md:21` |
| C6 | PlayMCP temporary-registration readiness is prepared without requesting final review or public submission. | active | `HTML.txt:224`, `.omo/ulw-research/20260702-004308-parallel-strategy/playmcp-current-surface-summary.md:59` |

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->

| assumption | adopted default | rationale | reversible? |
|---|---|---|---|
| Implementation stack | TypeScript MCP SDK with Streamable HTTP endpoint and Zod validation. | Context7 shows TS SDK support for `McpServer`, `registerTool`, Zod `inputSchema`, and HTTP transport; PlayMCP needs endpoint validation. | yes |
| Product code location | `apps/family-experience-mcp/` under this repo. | Repo currently has docs/concepts only, so a new app folder avoids mutating concept docs as code. | yes |
| Public display name | `아이랑 어디가` for draft registration fields; code slug remains `family-experience-mcp`. | Final product name is open, but a human-readable default is needed for starter messages and screenshots. | yes |
| First source | Seoul cultural-events Open API as the first live adapter; deterministic fixture if key is absent. | Seoul source exposes date, place, target, fee, homepage/contact, coordinates, and program fields useful for family recommendations. | yes |
| National expansion | Defer TourAPI / national standard data until the Seoul golden prompts pass. | Existing stop rule says stop source expansion after the first stable demo prompt. | yes |
| PlayMCP action | Prepare temporary registration metadata and local endpoint proof; do not request review or final contest submission. | Official flow distinguishes temporary registration, review request, public visibility, and one-time submission. | yes |

## Findings (cited - path:lines)

- `PLANS.md:7` selects `concept/family-experience-mcp` as primary, `concept/pharmacy-now-mcp` as fallback, and `concept/parent-trust-mcp` as hold.
- `PLANS.md:34` gives the next path: start family-experience, build one `find_family_experiences` endpoint, use deterministic demo data if keys are not ready, add one Seoul open-data adapter if available, test happy/missing/API-failure, and prepare PlayMCP temporary registration.
- `PLANS.md:49` requires every MCP answer to include Top 3 choices, fit reasons, source/freshness, parent verification, and one next action.
- `research/decisions/2026-07-01-three-mcp-idea-branches.md:16` scores family-experience highest at 27, with pharmacy 23 and parent-trust 21.
- `research/decisions/2026-07-01-three-mcp-idea-branches.md:28` says family-experience has instantly visible chat value, lower medical/legal sensitivity than baby safety, and lower availability criticality than pharmacy.
- `research/methods/2026-07-01-three-mcp-idea-branches.md:12` chose concept-branch bootstrap over immediately creating three git branches or broad data-source crawling.
- `.omo/ulw-research/20260702-004308-parallel-strategy/SYNTHESIS.md:7` concluded building all three to submission quality in parallel is disadvantageous, while keeping fallback tracks is useful.
- `.omo/ulw-research/20260702-004308-parallel-strategy/SYNTHESIS.md:50` recommends a 48-72 hour model: implement/scaffold family-experience only, one public tool, deterministic demo data plus one official adapter if ready, then PlayMCP temporary registration.
- `.omo/ulw-research/20260702-004308-parallel-strategy/playmcp-current-surface-summary.md:40` found no direct keyword overlap for `체험`, `가족`, `어린이`, `행사`, `박물관`, or `체험학습`; `공연` has ArtBridge overlap but not child-age/family-experience specificity.
- `.omo/ulw-research/20260702-004308-parallel-strategy/playmcp-current-surface-summary.md:63` says PlayMCP supports temporary registration and later review request; endpoint validation checks tool metadata.
- `concept/family-experience-mcp/README.md:20` defines first scope as Seoul-first, one child age/stage, today/weekend/date range, and Top 3 output.
- `concept/family-experience-mcp/README.md:27` says to stop or narrow if event records lack date, place, age/target or program clue, contact/homepage, and source freshness.
- `concept/family-experience-mcp/DATA_PIPELINE.md:3` prioritizes Seoul cultural events first, TourAPI second, national cultural festival/performance data later, and excludes weak sources.
- `concept/family-experience-mcp/DATA_PIPELINE.md:22` lists normalized candidate fields including source, URL, retrieved_at, date, venue, address, coordinates, target age text, program text, indoor/outdoor, fee, reservation URL, contact, confidence, and parent checks.
- `concept/family-experience-mcp/DATA_PIPELINE.md:44` forbids claiming suitability unless source/program text supports it, requires inferred age fit to be labeled, and forbids scraping until terms/robots are recorded.
- `concept/family-experience-mcp/MCP_TOOLS.md:3` defines `find_family_experiences` as Tool 1 with inputs for location, child age, date range, indoor/outdoor, budget, and must-have constraints.
- `concept/family-experience-mcp/GOLDEN_PROMPTS.md:3` provides happy, missing-age, no-result, and data-failure golden prompts.
- `concept/family-experience-mcp/EXPERIMENTS.md:21` promotes only when Top 3/source/freshness, concise missing-age clarification, no fabricated no-result behavior, and safe source failure all pass.
- `concept/DATA_PIPELINE_ARCHITECTURE.md:11` requires source registry, adapter, raw snapshot, normalization, confidence/provenance, cache/stale, masking, and response card stages.
- `concept/DATA_PIPELINE_ARCHITECTURE.md:56` sets family-experience TTL at 6-24 hours, with source date and official/reservation link visible.
- `research/briefs/2026-07-01-mcp-data-pipeline-architecture-and-failure-modes.md:89` chose separated registry/adapters/normalization/provenance/response rendering and rejected monolithic adapters, ETL-first, and broad scraping.
- `HTML.txt:224` says non-final MCP servers can be saved as temporary registration for PlayMCP testing; `HTML.txt:228` reserves review request for final submission-ready servers.
- `HTML.txt:239` says approved servers initially become private, and `HTML.txt:242` says AGENTIC PLAYER10 participation requires changing visibility to public.
- `HTML.txt:254` says final preliminary submission is one-time.
- `HTML.txt:316` lists judging factors: creativity, convenience, stability, accurate data, and no security issue.
- `HTML.txt:337` says review can take up to 7 business days and requests by 2026-07-07 are planned for review by 2026-07-10.
- Current official PlayMCP `llms.txt` confirms PlayMCP is Kakao's MCP-based tool integration platform/playground, approved servers are public, the developer console manages registration, and the gateway/toolbox model is used: https://playmcp.kakao.com/llms.txt
- Current Seoul Open Data page for `OA-15486` confirms Seoul cultural events provide category, district, event name, venue, dates, target users, fee, homepage, inquiry, coordinates, start/end date, free/paid, and event time: https://data.seoul.go.kr/dataList/OA-15486/S/1/datasetView.do
- Current data.go.kr page for national performance events confirms fields such as event name, place, content, dates/times, fee, phone, age of admission, homepage, reservation info, parking, address, latitude, longitude, quarterly update, and 2026-01-12 modified date: https://www.data.go.kr/data/15013106/standard.do
- Current TourAPI page confirms nationwide tourism/event/location/detail/image APIs exist and can provide latest tourism information, but age-fit is not the core schema: https://www.data.go.kr/data/15101578/openapi.do
- Context7 `/modelcontextprotocol/modelcontextprotocol` confirms MCP tools use `inputSchema`, may expose `outputSchema`, return `CallToolResult` with `content`, optional `structuredContent`, and `isError`, and must validate/sanitize tool outputs.
- Context7 `/modelcontextprotocol/typescript-sdk` confirms TypeScript SDK patterns for `McpServer`, `registerTool`, Zod `inputSchema`, HTTP transport, and error tool results.

## Decisions (with rationale)

- Chosen method: one-tool-first MCP server.
  - Why: repo decision and public-surface research both say one stable, reviewable MCP beats three half-built submissions.
- Chosen stack: TypeScript MCP SDK.
  - Why: current docs support schema-first tools, structured results, and HTTP transport; this is closer to PlayMCP endpoint validation than a local-only script.
- Chosen first data method: fixture-first plus one Seoul official-data adapter.
  - Why: fixture mode removes API-key dependency for RED/GREEN and smoke tests; Seoul cultural events have the most directly useful family-experience fields.
- Chosen output contract: Top 3 cards plus provenance and parent-check language.
  - Why: this is already shared across repo docs and minimizes report-like output.
- Fallback method: if Seoul live data is blocked or too sparse, keep the same schema and run deterministic fixture mode for registration smoke while evaluating pharmacy fallback separately.
  - Why: no fabricated current/live claims; the user can still demo the chat promise safely.

## Scope IN

- Create a downstream execution plan for a new `apps/family-experience-mcp/` TypeScript MCP server.
- Plan exactly one public tool: `find_family_experiences`.
- Plan strict input validation:
  - required: `location`, `child_age` or `child_stage`, `date_range`.
  - optional: `indoor_outdoor`, `budget`, `must_have`, `max_distance_hint`.
- Plan structured output:
  - `query`, `results`, `warnings`, `source_summary`, `next_action`.
  - each result includes title, date/time, venue/address, age-fit reason, fee/reservation/contact if present, source/retrieved_at, confidence, parent check.
- Plan a source registry, deterministic fixtures, Seoul cultural-events adapter, normalizer, ranking, response renderer, and typed failures.
- Plan four golden prompt checks: happy path, missing age, no confident results, and data/API failure.
- Plan PlayMCP temporary-registration readiness:
  - server name, identifier, description, starter messages, endpoint path, tool metadata smoke, and response visibility notes.

## Scope OUT (Must NOT have)

- Do not build all three concepts in parallel.
- Do not create real git branches until the user explicitly asks.
- Do not request PlayMCP final review or one-time contest submission.
- Do not claim live availability, reservation availability, child suitability, or age fit unless source/program text supports it.
- Do not scrape unofficial event pages.
- Do not add national/worldwide data sources before the Seoul-first golden prompts pass.
- Do not store or print API keys, bearer tokens, keyed URLs, or private user data.
- Do not turn the answer into a long directory/report; Top 3 only for the first MVP.

## Open questions

- Resolved by user reply `$omo:ulw-plan 진행`: proceed with default public display name `아이랑 어디가`.
- Everything else is handled by defaults in this draft.

## Approval gate
status: approved-and-written
pending action: execution only after the user invokes a worker/start command, for example `$omo:start-work .omo/plans/family-experience-mcp-first-build.md`.
approval received: user replied `$omo:ulw-plan 진행`, interpreted as approval to write the plan, not approval to implement product code.
high accuracy review requested: user replied `고정밀리뷰 진행`.
plan path: `.omo/plans/family-experience-mcp-first-build.md`
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
