# family-experience-mcp-first-build - Work Plan

## TL;DR (For humans)

**What you'll get:** A first working MCP server named `아이랑 어디가` that answers one parent job: "이번 주말 서울에서 4살 아이랑 갈 만한 실내 체험 3개만 골라줘." It will return three short, source-labeled candidate cards with age-fit reason, parent checks, and one next action.

**Why this approach:** Build one stable tool first, with deterministic fixture data before live API dependency, then add one official Seoul cultural-events adapter behind the same contract. This keeps the PlayMCP demo useful even if API keys are not ready, while preventing unsupported live/age-fit claims.

**What it will NOT do:** It will not build the pharmacy or baby-product concepts in this pass. It will not claim nationwide coverage, reservation availability, live freshness, or child suitability unless the source supports the claim. It will not submit for PlayMCP review or the one-time contest entry.

**Effort:** Medium
**Risk:** Medium - the main risk is official event records having weak age/stage text, so confidence labels and safe fallback behavior are mandatory.
**Decisions to sanity-check:** Default public name is `아이랑 어디가`; first live source is Seoul cultural events; fixture mode remains allowed and clearly labeled.

Your next move: start execution with `$omo:start-work .omo/plans/family-experience-mcp-first-build.md`, or ask for a high-accuracy plan review first. Full execution detail follows below.

---

> TL;DR (machine): Medium effort, medium risk, new TypeScript MCP app under `apps/family-experience-mcp/` exposing one `find_family_experiences` tool with fixture-first data, optional Seoul adapter, golden-prompt QA, and PlayMCP temporary-registration readiness.

## Scope
### Must have
- New implementation lives under `apps/family-experience-mcp/`.
- TypeScript MCP server using current MCP TypeScript SDK docs:
  - server imports follow Context7-documented patterns: `createMcpHandler`, `McpServer`, Zod `inputSchema`, and Streamable HTTP client/server smoke.
  - endpoint path is `/mcp`.
  - server name is `family-experience-mcp`; public display name is `아이랑 어디가`.
- Exactly one public MCP tool in the first build:
  - `find_family_experiences(location, child_age?, child_stage?, date_range, indoor_outdoor?, budget?, must_have?, max_distance_hint?)`.
  - Require `location`, `date_range`, and one of `child_age` or `child_stage`.
  - `location` may be a city, district, or compact Korean place phrase.
  - `date_range` accepts natural labels used by golden prompts (`today`, `weekend`, `this_saturday`, or explicit ISO date range) plus a raw text field.
- Structured output contains:
  - `query`.
  - `results` with maximum three candidates.
  - `warnings`.
  - `source_summary`.
  - `next_action`.
  - `mode`: `fixture`, `live`, or `mixed`.
- Every candidate contains required fields:
  - `title`, `date_time`, `venue`, `address`, `age_fit_label`, `age_fit_reason`, `indoor_outdoor`, `fee_text`, `source_name`, `source_url`, `retrieved_at`, `confidence`, `parent_check`, `next_action`.
- Optional/nullable candidate fields:
  - `reservation_url`, `contact`; include them only when sourced, and never turn absence into a reservation/contact claim.
- Age-fit labels are limited to:
  - `source-stated`
  - `inferred`
  - `unknown`
- Confidence/freshness labels are limited to:
  - `source-stated`
  - `computed`
  - `inferred`
  - `unknown`
  - `stale`
- Data pipeline stages:
  - source registry.
  - adapter boundary.
  - raw snapshot / fixture id.
  - normalizer.
  - child-fit and practicality ranking.
  - response renderer.
  - typed failures.
- Data sources:
  - deterministic fixture source is mandatory.
  - Seoul cultural-events adapter is optional at runtime and active only when `SEOUL_OPEN_DATA_KEY` exists.
  - If live source fails or key is absent, the tool must return fixture-labeled output only when `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true`; otherwise return a safe error result with `isError: true`.
- Golden prompt coverage:
  - happy path: "이번 토요일 서울에서 4살 아이랑 갈 만한 실내 체험 3개만 골라줘. 너무 멀지 않고 예약/문의 링크가 있으면 좋아."
  - missing age: "이번 주말 아이랑 갈 만한 체험행사 골라줘."
  - no confident result: "오늘 밤 늦게 2살 아이와 갈 수 있는 무료 실내 체험을 찾아줘."
  - source failure: Seoul adapter forced to fail while fixture is disabled.
- PlayMCP temporary-registration readiness:
  - name: `아이랑 어디가`.
  - identifier: `familyexp`.
  - description under 500 chars.
  - three starter messages, each under 40 chars.
  - endpoint note: `/mcp`.
  - response visibility notes.
  - no final review request, no public switch, no one-time contest submission.
- Evidence files are written under `.omo/evidence/`.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not modify the sibling workspaces `D:\KLab\workspace\2026-휴일약국` or `D:\KLab\workspace\2026-06-07-harness`.
- Do not build `pharmacy-now-mcp` or `parent-trust-mcp` in this pass.
- Do not create real git branches unless the user explicitly asks later.
- Do not request PlayMCP final review or complete one-time contest submission.
- Do not scrape unofficial event pages.
- Do not add TourAPI, national performance-event data, images, maps, weather, account/login, or Kakao Tools widget work before this plan's final verification passes.
- Do not claim:
  - "전국 모든 행사"
  - "예약 가능"
  - "운영 중"
  - "아이에게 적합함"
  - "실시간"
  unless the specific source field supports that exact claim.
- Do not hide `inferred`, `unknown`, or `stale` confidence.
- Do not print API keys, bearer tokens, keyed URLs, or raw secrets in logs, test snapshots, returned tool content, or evidence.
- Do not use `as any`, `@ts-ignore`, `@ts-expect-error`, skipped tests, deleted tests, or fake green checks.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for behavior-bearing modules. Use Vitest for schema, pipeline, ranking, renderer, adapter failure, and MCP client smoke. Use TypeScript typecheck for contract safety. Use an exact HTTP 200 assertion and MCP client smoke for real-surface endpoint proof.
- Primary commands, run from repo root unless a todo says otherwise:
  - `cd apps/family-experience-mcp && npm install`
  - `cd apps/family-experience-mcp && npm test -- --run`
  - `cd apps/family-experience-mcp && npm run typecheck`
  - `cd apps/family-experience-mcp && npm run verify`
  - `cd apps/family-experience-mcp && npm run dev:http`
  - `STATUS="$(curl -sS -o "$EVIDENCE_DIR/health.json" -w "%{http_code}" http://127.0.0.1:3345/health || true)"; test "$STATUS" = "200"; grep -q "family-experience-mcp" "$EVIDENCE_DIR/health.json"`
  - `cd apps/family-experience-mcp && npm run smoke:mcp`
- RED rule:
  - Before implementing behavior in each todo, add or run the failing test/smoke named in that todo and save the failing output to the listed `.omo/evidence/task-*-RED.txt`.
  - Then implement the smallest code needed and save the passing output to `.omo/evidence/task-*-GREEN.txt`.
- Real-surface proof:
  - HTTP health: `STATUS="$(curl -sS -o "$EVIDENCE_DIR/health.json" -w "%{http_code}" http://127.0.0.1:3345/health || true)"; test "$STATUS" = "200"; grep -q "family-experience-mcp" "$EVIDENCE_DIR/health.json"`.
  - MCP metadata and call: `npm run smoke:mcp`, which must connect to `http://127.0.0.1:3345/mcp`, list tools, and call `find_family_experiences`.
- Path discipline:
  - Exact QA invocations must be launched from the repository root.
  - Use `REPO_ROOT="$(pwd)"` inside Git Bash snippets.
  - Do not hard-code a developer-specific absolute workspace path.
  - Scripts that write artifacts must accept `EVIDENCE_DIR`; smoke scripts must write to `$REPO_ROOT/.omo/evidence`, not app-local `.omo/evidence`.
- Cleanup proof:
  - after HTTP QA, stop the dev server and record a `LISTENING`-only port check receipt, e.g. `netstat -ano | grep ":3345" | grep LISTENING`, in `.omo/evidence/final-cleanup-family-experience-mcp-first-build.txt`.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1: scaffold package, schemas, fixture/source contract. Todos 1-3.
- Wave 2: pipeline behavior, MCP surface, live adapter. Todos 4-6. Todo 6 can start after Todo 3 and run alongside Todo 4, but must not be wired into the tool until Todo 5 exists.
- Wave 3: golden QA, PlayMCP metadata, hardening. Todos 7-9.
- Final wave: F1-F4 audits.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 5, 7, 9 | none |
| 2 | 1 | 3, 4, 5, 7, 9 | none |
| 3 | 2 | 4, 6, 7, 9 | none |
| 4 | 3 | 5, 7, 9 | 6 |
| 5 | 4 | 7, 8, 9 | 6 |
| 6 | 3 | 7, 9 | 4 |
| 7 | 5, 6 | 8, 9 | none |
| 8 | 5, 7 | 9 | none |
| 9 | 7, 8 | final verification | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Scaffold `apps/family-experience-mcp` as a minimal TypeScript MCP app.
  What to do / Must NOT do: Create `apps/family-experience-mcp/package.json`, `tsconfig.json`, `src/`, `test/`, and `scripts/` only. Add scripts `dev:http`, `test`, `typecheck`, `verify`, `smoke:mcp`, and `smoke:golden`. Use Node 20+ assumptions. Add dependencies following current MCP TypeScript SDK docs: `@modelcontextprotocol/server`, `@modelcontextprotocol/node`, `@modelcontextprotocol/client`, `zod`; dev dependencies `typescript`, `tsx`, `vitest`, `@types/node`. Do not add application logic beyond a minimal health server if needed for package verification.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2, 5, 7, 9
  References (executor has NO interview context - be exhaustive): `.omo/drafts/family-experience-mcp-first-build.md:60`; `.omo/drafts/family-experience-mcp-first-build.md:117`; `.omo/drafts/family-experience-mcp-first-build.md:127`; Context7 `/modelcontextprotocol/typescript-sdk` docs for `createMcpHandler`, `McpServer`, `toNodeHandler`, Zod, and HTTP transport; `HTML.txt:224`; `HTML.txt:337`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm install && npm run typecheck && npm test -- --run` exits 0. `package-lock.json` exists. `npm run verify` exists and runs `typecheck` plus tests.
  QA scenarios (name the exact tool + invocation): happy: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'REPO_ROOT="$(pwd)"; cd "$REPO_ROOT/apps/family-experience-mcp" && npm run verify'` expects exit 0, Evidence `.omo/evidence/task-1-scaffold-GREEN.txt`; failure: before adding package scripts, run `& 'C:\Program Files\Git\bin\bash.exe' -lc 'REPO_ROOT="$(pwd)"; cd "$REPO_ROOT/apps/family-experience-mcp" && npm run verify'` and capture missing-script or missing-directory failure, Evidence `.omo/evidence/task-1-scaffold-RED.txt`.
  Commit: Y | `build(family-experience): scaffold mcp app`

- [x] 2. Define schemas, domain types, typed failures, and redaction-safe config.
  What to do / Must NOT do: Add `src/schemas.ts`, `src/types.ts`, `src/config.ts`, and tests. Define `FindFamilyExperiencesInputSchema` with required `location`, required `date_range`, and XOR-style requirement for `child_age` or `child_stage`. Define `FamilyExperienceCandidate`, `FindFamilyExperiencesResult`, `ToolFailureCode`, and `ToolMode`. Define output schema if supported by current SDK; otherwise define Zod result schema and validate before returning `structuredContent`. Config reads `PORT` default `3345`, `FAMILY_EXPERIENCE_ALLOW_FIXTURE`, `SEOUL_OPEN_DATA_KEY`, and `SEOUL_OPEN_DATA_BASE_URL`; it must expose redacted diagnostics only.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 3, 4, 5, 7, 9
  References (executor has NO interview context - be exhaustive): `concept/family-experience-mcp/MCP_TOOLS.md:3`; `concept/family-experience-mcp/DATA_PIPELINE.md:22`; `concept/DATA_PIPELINE_ARCHITECTURE.md:34`; `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/quality-gate-2026-07-02.md:56`; Context7 `/modelcontextprotocol/modelcontextprotocol` docs for `inputSchema`, optional `outputSchema`, `structuredContent`, and `isError`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm test -- --run test/schemas.test.ts test/config.test.ts && npm run typecheck` exits 0. Tests prove missing age/stage fails validation, valid child_age passes, valid child_stage passes, and redacted config never includes the raw Seoul key.
  QA scenarios (name the exact tool + invocation): happy: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'REPO_ROOT="$(pwd)"; cd "$REPO_ROOT/apps/family-experience-mcp" && npm test -- --run test/schemas.test.ts test/config.test.ts'` expects exit 0 and assertions named `requires child_age or child_stage` and `redacts SEOUL_OPEN_DATA_KEY`, Evidence `.omo/evidence/task-2-schemas-GREEN.txt`; failure: first add the missing-age validation test and run the same command before implementation, expecting validation to wrongly pass or module missing, Evidence `.omo/evidence/task-2-schemas-RED.txt`.
  Commit: Y | `feat(family-experience): define tool schemas and safe config`

- [x] 3. Build source registry, fixture source, raw snapshot ids, and adapter boundary.
  What to do / Must NOT do: Add `src/sources/registry.ts`, `src/sources/fixture.ts`, `src/sources/types.ts`, and `test/sources.test.ts`. Registry must include `fixture-family-experience-v1` and `seoul-culture-events` with role, authority tier, URL, freshness expectation, cache TTL, allowed claims, and redaction policy. Fixture records must include at least four Seoul records, with at least three matching the happy prompt and one unsuitable/edge record. Fixture records must be explicitly labeled `mode: "fixture"` and must not imply live/current status.
  Parallelization: Wave 1 | Blocked by: 2 | Blocks: 4, 6, 7, 9
  References (executor has NO interview context - be exhaustive): `concept/DATA_PIPELINE_ARCHITECTURE.md:11`; `concept/DATA_PIPELINE_ARCHITECTURE.md:24`; `concept/DATA_PIPELINE_ARCHITECTURE.md:56`; `concept/family-experience-mcp/DATA_PIPELINE.md:3`; `concept/family-experience-mcp/MECE_RESEARCH.md:18`; `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/final-prd.md:15`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm test -- --run test/sources.test.ts && npm run typecheck` exits 0. Tests assert unregistered sources cannot be authoritative, fixture records expose fixture IDs, and all fixture candidates include date, venue, source, retrieved_at, confidence, and parent_check.
  QA scenarios (name the exact tool + invocation): happy: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'REPO_ROOT="$(pwd)"; cd "$REPO_ROOT/apps/family-experience-mcp" && npm test -- --run test/sources.test.ts'` expects exit 0 and test name `fixture source returns auditable records`, Evidence `.omo/evidence/task-3-sources-GREEN.txt`; failure: before implementing fixture source, run the same command after adding the test and capture module/test failure, Evidence `.omo/evidence/task-3-sources-RED.txt`.
  Commit: Y | `feat(family-experience): add source registry and fixtures`

- [x] 4. Implement normalizer, age-fit labeling, ranking, and response renderer.
  What to do / Must NOT do: Add `src/pipeline/normalize.ts`, `src/pipeline/rank.ts`, `src/pipeline/render.ts`, and tests. Ranking order: date overlap first, location relevance second, source-stated age/target text third, indoor/outdoor preference fourth, completeness of fee/reservation/contact fifth. Age-fit labels must be exactly `source-stated`, `inferred`, or `unknown`; `computed` and `stale` may appear only as confidence/freshness labels and must never imply child suitability. If age fit is inferred from title/program text, include the source text in `age_fit_reason`. Renderer returns at most three candidates, never fills missing fields with fake values, and never says or implies reservation/contact availability when `reservation_url` or `contact` is absent.
  Parallelization: Wave 2 | Blocked by: 3 | Blocks: 5, 7, 9 | Can parallelize with: 6
  References (executor has NO interview context - be exhaustive): `PLANS.md:49`; `concept/family-experience-mcp/DATA_PIPELINE.md:44`; `concept/family-experience-mcp/MECE_RESEARCH.md:55`; `concept/family-experience-mcp/REFINED_PROPOSAL.md:19`; `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/risk-editor-backstop.md:5`; `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/quality-gate-2026-07-02.md:88`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm test -- --run test/pipeline.test.ts && npm run typecheck` exits 0. Tests assert happy prompt returns exactly three, missing age returns clarification/failure state, no-result path fabricates nothing, inferred age labels are visible, missing `reservation_url`/`contact` does not produce a reservation/contact claim, and `computed`/`stale` are rejected as `age_fit_label` values.
  QA scenarios (name the exact tool + invocation): happy: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'REPO_ROOT="$(pwd)"; cd "$REPO_ROOT/apps/family-experience-mcp" && npm test -- --run test/pipeline.test.ts'` expects exit 0 and tests named `returns top three fixture candidates`, `does not fabricate no-result matches`, `does not claim reservation availability when reservation_url is missing`, and `rejects computed or stale age fit labels`, Evidence `.omo/evidence/task-4-pipeline-GREEN.txt`; failure: add no-result, missing-reservation, and invalid-age-fit-label tests before implementation and run same command, expecting fabricated-result, reservation-claim, or invalid-label assertion to fail or module missing, Evidence `.omo/evidence/task-4-pipeline-RED.txt`.
  Commit: Y | `feat(family-experience): rank and render parent action cards`

- [x] 5. Register `find_family_experiences` and expose HTTP MCP plus health endpoint.
  What to do / Must NOT do: Add `src/server.ts`, `src/mcp.ts`, and `src/health.ts` if useful. Use `new McpServer({ name: "family-experience-mcp", version: "0.1.0" })`. Register exactly one tool named `find_family_experiences`. Tool result returns both `content: [{ type: "text", text: <short Korean summary> }]` and `structuredContent` matching the result schema. Error cases return `isError: true` with a safe Korean message and structured failure metadata. HTTP server listens on `127.0.0.1:${PORT}` and serves `/mcp` plus `/health`. Do not log raw input beyond redacted debug fields.
  Parallelization: Wave 2 | Blocked by: 4 | Blocks: 7, 8, 9 | Can parallelize with: 6
  References (executor has NO interview context - be exhaustive): Context7 `/modelcontextprotocol/typescript-sdk` docs for `createMcpHandler`, `McpServer`, `registerTool`, `toNodeHandler`, and HTTP transport; Context7 `/modelcontextprotocol/modelcontextprotocol` docs for `CallToolResult`, `structuredContent`, and `isError`; `.omo/drafts/family-experience-mcp-first-build.md:47`; `.omo/drafts/family-experience-mcp-first-build.md:99`; `.omo/drafts/family-experience-mcp-first-build.md:100`; `.omo/drafts/family-experience-mcp-first-build.md:117`; `.omo/drafts/family-experience-mcp-first-build.md:128`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm run typecheck && npm test -- --run test/mcp.test.ts` exits 0. With server running, a `curl -w "%{http_code}"` health probe must equal exactly `200` and body must contain `family-experience-mcp`. `npm run smoke:mcp -- --assert-tool-count=1` lists exactly one tool and calls it successfully in fixture mode.
  QA scenarios (name the exact tool + invocation): happy HTTP+MCP: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'set -euo pipefail; REPO_ROOT="$(pwd)"; EVIDENCE_DIR="$REPO_ROOT/.omo/evidence"; cd "$REPO_ROOT/apps/family-experience-mcp"; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/task-5-preflight-listening.txt"; then exit 1; else echo "no LISTENING on :3345 before start" > "$EVIDENCE_DIR/task-5-preflight-listening.txt"; fi; FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http > "$EVIDENCE_DIR/task-5-server.log" 2>&1 & SERVER_PID=$!; trap "kill $SERVER_PID 2>/dev/null || true" EXIT; for i in {1..30}; do STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health 2>/dev/null || true)"; test "$STATUS" = "200" && break; sleep 1; done; STATUS="$(curl -sS -D "$EVIDENCE_DIR/task-5-health.headers" -o "$EVIDENCE_DIR/task-5-health.json" -w "%{http_code}" http://127.0.0.1:3345/health || true)"; test "$STATUS" = "200"; grep -q "family-experience-mcp" "$EVIDENCE_DIR/task-5-health.json"; FAMILY_EXPERIENCE_ALLOW_FIXTURE=true EVIDENCE_DIR="$EVIDENCE_DIR" npm run smoke:mcp -- --assert-tool-count=1; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null || true; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/task-5-cleanup-listening.txt"; then exit 1; else echo "no LISTENING on :3345" > "$EVIDENCE_DIR/task-5-cleanup-listening.txt"; fi'` expects exact HTTP 200, exactly one listed tool named `find_family_experiences`, and `structuredContent.results.length === 3`, Evidence `.omo/evidence/task-5-mcp-GREEN.txt`; failure: run the same command before registering the tool or with `FAMILY_EXPERIENCE_ALLOW_FIXTURE=false SEOUL_OPEN_DATA_KEY=`, expecting safe failure not fabricated output, Evidence `.omo/evidence/task-5-mcp-RED.txt`.
  Commit: Y | `feat(family-experience): expose mcp tool over http`

- [x] 6. Add optional Seoul cultural-events adapter behind the source contract.
  What to do / Must NOT do: Add `src/sources/seoulCulture.ts` and `test/seoulCulture.test.ts`. Adapter must be disabled when `SEOUL_OPEN_DATA_KEY` is absent. It must build requests without logging keyed URLs, classify failures into `missing_key`, `permission_failure`, `source_failure`, `malformed_source`, or `no_match`, and normalize only stable source fields. It must never be required for fixture-mode golden QA. Use current official source fields from Seoul cultural-events API; if exact response field names differ during implementation, preserve raw field names in the adapter test fixture and update the source registry note.
  Parallelization: Wave 2 | Blocked by: 3 | Blocks: 7, 9 | Can parallelize with: 4 and 5 until wiring
  References (executor has NO interview context - be exhaustive): `concept/family-experience-mcp/MECE_RESEARCH.md:22`; `concept/family-experience-mcp/DATA_PIPELINE.md:3`; `concept/DATA_PIPELINE_ARCHITECTURE.md:64`; `.omo/drafts/family-experience-mcp-first-build.md:95`; official Seoul source `https://data.seoul.go.kr/dataList/OA-15486/S/1/datasetView.do`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm test -- --run test/seoulCulture.test.ts && npm run typecheck` exits 0. Tests assert no-key path returns typed failure, keyed URL is redacted in diagnostics, malformed payload returns typed failure, and a saved sample row normalizes into a candidate with source fields.
  QA scenarios (name the exact tool + invocation): happy: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'REPO_ROOT="$(pwd)"; cd "$REPO_ROOT/apps/family-experience-mcp" && npm test -- --run test/seoulCulture.test.ts'` expects exit 0 and test `redacts keyed url`, Evidence `.omo/evidence/task-6-seoul-adapter-GREEN.txt`; failure: run same command after adding no-key/redaction tests but before implementation, expecting failure, Evidence `.omo/evidence/task-6-seoul-adapter-RED.txt`.
  Commit: Y | `feat(family-experience): add seoul culture adapter`

- [x] 7. Add golden prompt smoke runner and capture four behavior proofs.
  What to do / Must NOT do: Add `scripts/smoke-golden.ts`, `test/golden.test.ts`, and `docs/GOLDEN_RESULTS.md`. The smoke runner calls the local MCP endpoint, not internal functions, for the four golden scenarios. It must write JSON artifacts under `.omo/evidence/` without secrets. The Korean text response must stay under eight bullet-like lines for the happy path and include Top 3, why these fit, source/freshness, parent check, and next action.
  Parallelization: Wave 3 | Blocked by: 5, 6 | Blocks: 8, 9
  References (executor has NO interview context - be exhaustive): `concept/family-experience-mcp/GOLDEN_PROMPTS.md:3`; `concept/family-experience-mcp/EXPERIMENTS.md:21`; `PLANS.md:41`; `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/quality-gate-2026-07-02.md:56`
  Acceptance criteria (agent-executable): with server running on port 3345, `& 'C:\Program Files\Git\bin\bash.exe' -lc 'REPO_ROOT="$(pwd)"; EVIDENCE_DIR="$REPO_ROOT/.omo/evidence"; cd "$REPO_ROOT/apps/family-experience-mcp" && EVIDENCE_DIR="$EVIDENCE_DIR" FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:golden'` exits 0 and writes `$REPO_ROOT/.omo/evidence/golden-family-experience-happy.json`, `$REPO_ROOT/.omo/evidence/golden-family-experience-missing-age.json`, `$REPO_ROOT/.omo/evidence/golden-family-experience-no-result.json`, and `$REPO_ROOT/.omo/evidence/golden-family-experience-source-failure.json`.
  QA scenarios (name the exact tool + invocation): happy: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'set -euo pipefail; REPO_ROOT="$(pwd)"; EVIDENCE_DIR="$REPO_ROOT/.omo/evidence"; cd "$REPO_ROOT/apps/family-experience-mcp"; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/task-7-preflight-listening.txt"; then exit 1; else echo "no LISTENING on :3345 before start" > "$EVIDENCE_DIR/task-7-preflight-listening.txt"; fi; FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http > "$EVIDENCE_DIR/task-7-server.log" 2>&1 & SERVER_PID=$!; trap "kill $SERVER_PID 2>/dev/null || true" EXIT; for i in {1..30}; do STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health 2>/dev/null || true)"; test "$STATUS" = "200" && break; sleep 1; done; STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health || true)"; test "$STATUS" = "200"; FAMILY_EXPERIENCE_ALLOW_FIXTURE=true EVIDENCE_DIR="$EVIDENCE_DIR" npm run smoke:golden; test -s "$EVIDENCE_DIR/golden-family-experience-happy.json"; test -s "$EVIDENCE_DIR/golden-family-experience-missing-age.json"; test -s "$EVIDENCE_DIR/golden-family-experience-no-result.json"; test -s "$EVIDENCE_DIR/golden-family-experience-source-failure.json"; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null || true; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/task-7-cleanup-listening.txt"; then exit 1; else echo "no LISTENING on :3345" > "$EVIDENCE_DIR/task-7-cleanup-listening.txt"; fi'` expects exact HTTP 200, four evidence JSON files, happy result count 3, missing-age clarification, no-result count 0, source-failure `isError: true`, Evidence `.omo/evidence/task-7-golden-GREEN.txt`; failure: run the same smoke with `FAMILY_EXPERIENCE_ALLOW_FIXTURE=false SEOUL_OPEN_DATA_KEY=` and source-failure scenario, expecting safe `isError: true` and no candidates, Evidence `.omo/evidence/task-7-source-failure-RED.txt`.
  Commit: Y | `test(family-experience): add golden prompt smoke checks`

- [x] 8. Prepare PlayMCP temporary-registration package and operator runbook.
  What to do / Must NOT do: Add `apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md`, `apps/family-experience-mcp/docs/RUNBOOK.md`, and `apps/family-experience-mcp/docs/SUBMISSION_COPY_DRAFT.md`. Include temporary registration only, not review request. Include name `아이랑 어디가`, identifier `familyexp`, endpoint `/mcp`, description under 500 chars, three starter messages under 40 chars, auth method recommendation for current build, response visibility note, and copy guardrails. Mention representative image requirement as a TODO only; do not generate or submit an image unless separately requested.
  Parallelization: Wave 3 | Blocked by: 5, 7 | Blocks: 9
  References (executor has NO interview context - be exhaustive): `HTML.txt:224`; `HTML.txt:228`; `HTML.txt:239`; `HTML.txt:254`; `HTML.txt:316`; `HTML.txt:337`; `.omo/ulw-research/20260702-004308-parallel-strategy/playmcp-current-surface-summary.md:59`; `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/risk-editor-backstop.md:11`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm run verify` exits 0. A small script or test validates description length <= 500, identifier length <= 16, starter message count 3, and each starter message length <= 40. `docs/PLAYMCP_TEMP_REGISTRATION.md` contains "임시 등록" and does not contain "등록 및 심사 요청을 진행".
  QA scenarios (name the exact tool + invocation): happy: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'REPO_ROOT="$(pwd)"; cd "$REPO_ROOT/apps/family-experience-mcp" && npm test -- --run test/playmcpMetadata.test.ts'` expects exit 0 and length checks pass, Evidence `.omo/evidence/task-8-playmcp-metadata-GREEN.txt`; failure: add metadata length tests before docs are written and run same command, expecting missing docs or length failure, Evidence `.omo/evidence/task-8-playmcp-metadata-RED.txt`.
  Commit: Y | `docs(family-experience): prepare playmcp temp registration`

- [x] 9. Final hardening: verify, security redaction, cleanup, and fallback decision.
  What to do / Must NOT do: Add or update `apps/family-experience-mcp/docs/DECISIONS.md` and `apps/family-experience-mcp/docs/QA_REPORT.md`. Add scripts `scan:secrets`, `scan:claims`, and `scan:sources` or equivalent tests. `scan:secrets` must fail on unredacted secret patterns. `scan:claims` must fail on unsupported public claims and be context-aware or scoped to app docs/src/test plus newly generated golden JSON evidence, not the whole historical `.omo/evidence/` directory. `scan:sources` must fail on unregistered/unofficial event source URLs and scraper/browser-parser dependencies or imports such as `cheerio`, `puppeteer`, `playwright`, `jsdom`, or `got-scraping`. Run full verification. Confirm no secret-like values appear in logs/evidence. Confirm source expansion remains stopped. Confirm fallback to pharmacy is not triggered unless golden prompt QA fails because event records lack date/place/age clue/contact/freshness. Do not commit if verification fails.
  Parallelization: Wave 3 | Blocked by: 7, 8 | Blocks: final verification
  References (executor has NO interview context - be exhaustive): `.omo/ulw-research/20260702-004308-parallel-strategy/SYNTHESIS.md:72`; `.prd-session/2026-07-01-three-concept-debate/TRACE_SUMMARY.md:21`; `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/quality-gate-2026-07-02.md:20`; `concept/family-experience-mcp/README.md:27`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm run verify && npm run scan:secrets && npm run scan:claims && npm run scan:sources` exits 0. `& 'C:\Program Files\Git\bin\bash.exe' -lc 'set -euo pipefail; REPO_ROOT="$(pwd)"; EVIDENCE_DIR="$REPO_ROOT/.omo/evidence"; cd "$REPO_ROOT/apps/family-experience-mcp"; npm run verify; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/task-9-preflight-listening.txt"; then exit 1; else echo "no LISTENING on :3345 before start" > "$EVIDENCE_DIR/task-9-preflight-listening.txt"; fi; FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http > "$EVIDENCE_DIR/task-9-server.log" 2>&1 & SERVER_PID=$!; trap "kill $SERVER_PID 2>/dev/null || true" EXIT; for i in {1..30}; do STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health 2>/dev/null || true)"; test "$STATUS" = "200" && break; sleep 1; done; STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health || true)"; test "$STATUS" = "200"; EVIDENCE_DIR="$EVIDENCE_DIR" FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:golden; npm run scan:secrets; npm run scan:claims; npm run scan:sources; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null || true; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/task-9-cleanup-listening.txt"; then exit 1; else echo "no LISTENING on :3345" > "$EVIDENCE_DIR/task-9-cleanup-listening.txt"; fi'` exits 0.
  QA scenarios (name the exact tool + invocation): happy: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'set -euo pipefail; REPO_ROOT="$(pwd)"; EVIDENCE_DIR="$REPO_ROOT/.omo/evidence"; cd "$REPO_ROOT/apps/family-experience-mcp"; npm run verify; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/task-9-preflight-listening.txt"; then exit 1; else echo "no LISTENING on :3345 before start" > "$EVIDENCE_DIR/task-9-preflight-listening.txt"; fi; FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http > "$EVIDENCE_DIR/task-9-server.log" 2>&1 & SERVER_PID=$!; trap "kill $SERVER_PID 2>/dev/null || true" EXIT; for i in {1..30}; do STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health 2>/dev/null || true)"; test "$STATUS" = "200" && break; sleep 1; done; STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health || true)"; test "$STATUS" = "200"; EVIDENCE_DIR="$EVIDENCE_DIR" FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:golden; npm run scan:secrets; npm run scan:claims; npm run scan:sources; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null || true; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/task-9-cleanup-listening.txt"; then exit 1; else echo "no LISTENING on :3345" > "$EVIDENCE_DIR/task-9-cleanup-listening.txt"; fi'` expects exact HTTP 200 and exit 0, Evidence `.omo/evidence/task-9-final-verify-GREEN.txt`; failure: write a dummy unredacted secret to `$REPO_ROOT/.omo/evidence/task-9-dummy-secret.tmp`, run `& 'C:\Program Files\Git\bin\bash.exe' -lc 'REPO_ROOT="$(pwd)"; cd "$REPO_ROOT/apps/family-experience-mcp" && npm run scan:secrets'`, expect non-zero, then remove the dummy file and record cleanup, Evidence `.omo/evidence/task-9-secret-scan-RED.txt` and `.omo/evidence/task-9-secret-scan-cleanup.txt`; source failure: create exact temp file `apps/family-experience-mcp/test/fixtures/unregistered-source.tmp.ts` using `& 'C:\Program Files\Git\bin\bash.exe' -lc 'set -euo pipefail; REPO_ROOT="$(pwd)"; TMP="$REPO_ROOT/apps/family-experience-mcp/test/fixtures/unregistered-source.tmp.ts"; mkdir -p "$(dirname "$TMP")"; printf "%s\n" "import \"cheerio\";" "export const badSource = \"https://example.com/unregistered\";" > "$TMP"; cd "$REPO_ROOT/apps/family-experience-mcp"; if npm run scan:sources; then rm -f "$TMP"; exit 1; else status=$?; rm -f "$TMP"; echo "removed $TMP" > "$REPO_ROOT/.omo/evidence/task-9-source-scan-cleanup.txt"; test "$status" -ne 0; fi'`, expect non-zero from `scan:sources`, Evidence `.omo/evidence/task-9-source-scan-RED.txt` and `.omo/evidence/task-9-source-scan-cleanup.txt`.
  Commit: Y | `chore(family-experience): verify mcp readiness`

## Final verification wave
> Runs serially after ALL todos, in F1 -> F2 -> F3 -> F4 order, so server-based checks cannot collide on port 3345. ALL must APPROVE through agent-executed evidence. User approval is a post-verification release/submission gate, not a QA dependency.
- [x] F1. Plan compliance audit
  Invocation: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'set -euo pipefail; REPO_ROOT="$(pwd)"; EVIDENCE_DIR="$REPO_ROOT/.omo/evidence"; test -f "$REPO_ROOT/apps/family-experience-mcp/package.json"; test -f "$REPO_ROOT/apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md"; ! test -e "$REPO_ROOT/apps/pharmacy-now-mcp"; ! test -e "$REPO_ROOT/apps/parent-trust-mcp"; for f in task-1-scaffold-GREEN.txt task-2-schemas-GREEN.txt task-3-sources-GREEN.txt task-4-pipeline-GREEN.txt task-5-mcp-GREEN.txt task-6-seoul-adapter-GREEN.txt task-7-golden-GREEN.txt task-8-playmcp-metadata-GREEN.txt task-9-final-verify-GREEN.txt; do test -s "$REPO_ROOT/.omo/evidence/$f"; done; cd "$REPO_ROOT/apps/family-experience-mcp"; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/final-F1-preflight-listening.txt"; then exit 1; else echo "no LISTENING on :3345 before start" > "$EVIDENCE_DIR/final-F1-preflight-listening.txt"; fi; FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http > "$EVIDENCE_DIR/final-F1-server.log" 2>&1 & SERVER_PID=$!; trap "kill $SERVER_PID 2>/dev/null || true" EXIT; for i in {1..30}; do STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health 2>/dev/null || true)"; test "$STATUS" = "200" && break; sleep 1; done; STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health || true)"; test "$STATUS" = "200"; EVIDENCE_DIR="$EVIDENCE_DIR" FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:mcp -- --assert-tool-count=1; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null || true; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/final-F1-cleanup-listening.txt"; then exit 1; else echo "no LISTENING on :3345" > "$EVIDENCE_DIR/final-F1-cleanup-listening.txt"; fi'`
  Approval condition: `smoke:mcp -- --assert-tool-count=1` proves exactly one public tool is exposed; all todos' evidence files exist; no out-of-scope app folders for pharmacy or parent trust were created.
  Evidence: `.omo/evidence/final-F1-plan-compliance.txt`
- [x] F2. Code quality review
  Invocation: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'set -euo pipefail; REPO_ROOT="$(pwd)"; cd "$REPO_ROOT/apps/family-experience-mcp"; npm run typecheck; npm test -- --run; ! grep -R -n -E "as any|@ts-ignore|@ts-expect-error|\\.skip\\(|\\.only\\(" src test'`
  Approval condition: typecheck and tests exit 0; no `as any`, `@ts-ignore`, `@ts-expect-error`, `.skip`, or `.only` in `src/` or `test/`.
  Evidence: `.omo/evidence/final-F2-code-quality.txt`
- [x] F3. Real manual QA
  Invocation: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'set -euo pipefail; REPO_ROOT="$(pwd)"; EVIDENCE_DIR="$REPO_ROOT/.omo/evidence"; cd "$REPO_ROOT/apps/family-experience-mcp"; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/final-F3-preflight-listening.txt"; then exit 1; else echo "no LISTENING on :3345 before start" > "$EVIDENCE_DIR/final-F3-preflight-listening.txt"; fi; FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http > "$EVIDENCE_DIR/final-F3-server.log" 2>&1 & SERVER_PID=$!; trap "kill $SERVER_PID 2>/dev/null || true" EXIT; for i in {1..30}; do STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health 2>/dev/null || true)"; test "$STATUS" = "200" && break; sleep 1; done; STATUS="$(curl -sS -D "$EVIDENCE_DIR/final-F3-health.headers" -o "$EVIDENCE_DIR/final-F3-health.json" -w "%{http_code}" http://127.0.0.1:3345/health || true)"; test "$STATUS" = "200"; grep -q "family-experience-mcp" "$EVIDENCE_DIR/final-F3-health.json"; EVIDENCE_DIR="$EVIDENCE_DIR" FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:mcp -- --assert-tool-count=1; EVIDENCE_DIR="$EVIDENCE_DIR" FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:golden; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null || true; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/final-cleanup-family-experience-mcp-first-build.txt"; then exit 1; else echo "no LISTENING on :3345" > "$EVIDENCE_DIR/final-cleanup-family-experience-mcp-first-build.txt"; fi'`
  Approval condition: health returns HTTP 200; MCP lists `find_family_experiences`; happy prompt returns three candidates; missing-age/no-result/source-failure behave safely.
  Evidence: `.omo/evidence/final-F3-real-manual-qa.txt`
- [x] F4. Scope fidelity
  Invocation: `& 'C:\Program Files\Git\bin\bash.exe' -lc 'set -euo pipefail; REPO_ROOT="$(pwd)"; EVIDENCE_DIR="$REPO_ROOT/.omo/evidence"; git status --short > "$EVIDENCE_DIR/final-F4-repo-status.txt"; find "$REPO_ROOT/apps" -maxdepth 3 -type f | sort > "$EVIDENCE_DIR/final-F4-app-files.txt"; if test -d "D:/KLab/workspace/2026-휴일약국/.git"; then git -C "D:/KLab/workspace/2026-휴일약국" status --short > "$EVIDENCE_DIR/final-F4-sibling-holiday-pharmacy-status.txt"; fi; if test -d "D:/KLab/workspace/2026-06-07-harness/.git"; then git -C "D:/KLab/workspace/2026-06-07-harness" status --short > "$EVIDENCE_DIR/final-F4-sibling-harness-status.txt"; fi; cd "$REPO_ROOT/apps/family-experience-mcp"; npm run scan:claims; npm run scan:secrets; npm run scan:sources; claim_outputs=(); for f in "$EVIDENCE_DIR"/golden-family-experience-*.json; do test -e "$f" && claim_outputs+=("$f"); done; test "${#claim_outputs[@]}" -gt 0; ! grep -n -E "전국 모든 행사|전국 전체|예약 가능|예약가능|운영 중|실시간|live now|currently open|suitable for all|아이에게 적합함" "${claim_outputs[@]}"'`
  Approval condition: changes are limited to `apps/family-experience-mcp/` plus planned evidence/docs; sibling workspace status receipts are read-only; `scan:claims` covers app docs/src/test and simple grep covers only newly generated golden public-output JSON; `scan:sources` enforces registry-only official/fixture sources and no scraper/browser-parser dependencies/imports; no final PlayMCP review/submission action was taken.
  Evidence: `.omo/evidence/final-F4-scope-fidelity.txt`

## Commit strategy
- Commit only after each todo's acceptance criteria pass.
- Use conventional commits exactly as listed in each todo.
- Do not auto-commit unless the user has authorized committing in the execution turn. If not authorized, stage nothing and report the draft commit list.
- If committing is authorized, each commit footer must include:

```text
Plan: .omo/plans/family-experience-mcp-first-build.md
```

- Expected commit sequence:
  1. `build(family-experience): scaffold mcp app`
  2. `feat(family-experience): define tool schemas and safe config`
  3. `feat(family-experience): add source registry and fixtures`
  4. `feat(family-experience): rank and render parent action cards`
  5. `feat(family-experience): expose mcp tool over http`
  6. `feat(family-experience): add seoul culture adapter`
  7. `test(family-experience): add golden prompt smoke checks`
  8. `docs(family-experience): prepare playmcp temp registration`
  9. `chore(family-experience): verify mcp readiness`

## Success criteria
- MCP server starts locally on `127.0.0.1:3345`.
- `/health` returns HTTP 200.
- MCP client smoke lists exactly one public tool: `find_family_experiences`.
- Happy golden prompt returns exactly three candidate cards.
- Every returned card includes source/freshness, age-fit reason, confidence, parent check, and next action.
- Missing age/stage returns a concise clarification or structured error before strong ranking.
- No-result prompt returns no fabricated candidates and suggests relaxing one constraint.
- Source failure with fixture disabled returns `isError: true` and no fabricated candidates.
- Fixture output is clearly labeled as fixture/demo mode.
- Seoul adapter is optional and redacts keyed URLs/secrets.
- PlayMCP temporary-registration docs are ready, but review/submission is not requested.
- Full verification commands pass:
  - `cd apps/family-experience-mcp && npm run verify`
  - `& 'C:\Program Files\Git\bin\bash.exe' -lc 'set -euo pipefail; REPO_ROOT="$(pwd)"; EVIDENCE_DIR="$REPO_ROOT/.omo/evidence"; cd "$REPO_ROOT/apps/family-experience-mcp"; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/final-success-preflight-listening.txt"; then exit 1; else echo "no LISTENING on :3345 before start" > "$EVIDENCE_DIR/final-success-preflight-listening.txt"; fi; FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http > "$EVIDENCE_DIR/final-success-server.log" 2>&1 & SERVER_PID=$!; trap "kill $SERVER_PID 2>/dev/null || true" EXIT; for i in {1..30}; do STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health 2>/dev/null || true)"; test "$STATUS" = "200" && break; sleep 1; done; STATUS="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3345/health || true)"; test "$STATUS" = "200"; EVIDENCE_DIR="$EVIDENCE_DIR" FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:mcp -- --assert-tool-count=1; EVIDENCE_DIR="$EVIDENCE_DIR" FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:golden; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null || true; if netstat -ano | grep ":3345" | grep LISTENING > "$EVIDENCE_DIR/final-success-cleanup-listening.txt"; then exit 1; else echo "no LISTENING on :3345" > "$EVIDENCE_DIR/final-success-cleanup-listening.txt"; fi'`
- Cleanup receipt proves port 3345 is not left running.
