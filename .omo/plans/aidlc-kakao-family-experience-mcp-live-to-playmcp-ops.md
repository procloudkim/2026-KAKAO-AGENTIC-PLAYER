# aidlc-kakao-family-experience-mcp-live-to-playmcp-ops - Work Plan

## TL;DR (For humans)
**What you'll get:** "아이랑 어디가"를 PlayMCP에 올릴 수 있는 방향으로, 현재 fixture 데모를 live-source/hosted-endpoint proof 중심의 대회 제출 패키지로 끌어올린다. 첫 파도는 서울 공식 문화행사 API 실행 가능성, MCP HTTP 표면, 검증 증거를 닫는다.

**Why this approach:** 세 주제 중 가족 체험 추천이 카카오톡 자연어 UX와 반복 사용성에 가장 잘 맞고, 현재 repo도 이 트랙이 가장 완성되어 있다. 남은 핵심 리스크는 더 많은 아이디어가 아니라 live 데이터와 운영 증명이다.

**What it will NOT do:** 전국/실시간/예약확정/아동안전 적합성 같은 과장 claim은 하지 않는다. PlayMCP 공개 심사, 대표 이미지 업로드, contest submission이 끝났다고 쓰지 않는다.

**Effort:** Short
**Risk:** Medium - live Seoul API key availability and Kakao review details remain outside local control.
**Decisions to sanity-check:** family-experience remains primary; holiday pharmacy is fallback only if live event proof fails; parent-trust is a later safety product.

Your next move: run a real `SEOUL_OPEN_DATA_KEY` smoke if the key is available, then proceed to PlayMCP temporary registration.

---

> TL;DR (machine): Short/Medium-risk plan to close live Seoul source proof, hosted MCP proof, and PlayMCP readiness evidence for the family-experience MCP.

## Scope
### Must have
- One public MCP tool remains `find_family_experiences`.
- Seoul official-data adapter can execute live JSON when `SEOUL_OPEN_DATA_KEY` is configured.
- Fixture mode remains explicit and opt-in.
- Every recommendation response preserves source/freshness/confidence/parent-check/next-action packaging.
- `/health` and `/mcp` are locally smoke-tested.
- Evidence artifacts are written under `.omo/evidence/`.
### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not add a second public MCP tool in this wave.
- Do not claim nationwide coverage, real-time freshness, reservation guarantee, current opening status, or age safety.
- Do not scrape unofficial pages or add browser parsing.
- Do not log or write raw `SEOUL_OPEN_DATA_KEY`, keyed URLs, child-identifying text, or unredacted source failures.
- Do not mark PlayMCP final review, public switch, representative image upload, or contest submission as done.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for the live HTTP JSON requester; existing Vitest and MCP smoke tests for regression coverage.
- Evidence:
  - `.omo/evidence/task-1-live-http-json-RED.txt`
  - `.omo/evidence/task-1-live-http-json-GREEN.txt`
  - `.omo/evidence/task-2-hosted-surface-GREEN.txt`
  - `.omo/evidence/task-3-final-verify-GREEN.txt`

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1: plan lock, live source execution primitive, local hosted surface proof.
- Wave 2: full verification, docs/evidence refresh, residual-risk statement.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 3 | none |
| 2 | 1 | 3, final verification | docs evidence refresh |
| 3 | 2 | final verification | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Add a redaction-safe live HTTP JSON requester for Seoul Open Data.
  What to do / Must NOT do: add a small requester module and unit/integration test with a local HTTP server; wire `createSeoulCultureSourceAdapter` to use it when no injected `requestJson` exists; do not use bare fetch, do not expose keyed URLs in errors, do not grow `seoulCulture.ts` past the size ceiling.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2, 3
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/src/sources/seoulCulture.ts:64`; `apps/family-experience-mcp/test/seoulCulture.test.ts:44`; `apps/family-experience-mcp/docs/QA_REPORT.md:24`
  Acceptance criteria (agent-executable): `npm test -- --run test/httpJson.test.ts test/seoulCulture.test.ts` exits 0 and the test evidence shows RED then GREEN.
  QA scenarios (name the exact tool + invocation): happy: local HTTP JSON response parses to unknown payload; failure: HTTP 500 and transport diagnostics use redacted URL only. Evidence `.omo/evidence/task-1-live-http-json-GREEN.txt`.
  Commit: N | feat(family-experience): enable live Seoul JSON requester
- [x] 2. Prove hosted local MCP surface still works.
  What to do / Must NOT do: start the local HTTP server with fixture mode enabled, check `/health`, call `/mcp` through the existing smoke client, then clean up the process; do not leave a listener on port 3345.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 3
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/src/server.ts:37`; `apps/family-experience-mcp/scripts/smoke-mcp.ts:24`; `apps/family-experience-mcp/docs/RUNBOOK.md:24`
  Acceptance criteria (agent-executable): health returns HTTP 200 JSON and `npm run smoke:mcp -- --assert-tool-count=1` exits 0.
  QA scenarios (name the exact tool + invocation): happy: fixture server returns exactly one public tool and successful candidate package; failure: no fixture/no key source-failure remains tested by golden smoke. Evidence `.omo/evidence/task-2-hosted-surface-GREEN.txt`.
  Commit: N | test(family-experience): prove hosted MCP surface
- [x] 3. Refresh readiness evidence and residual-risk statement.
  What to do / Must NOT do: run full verify/scans/golden smoke; update QA docs only if evidence changes; state live-key availability honestly; do not claim public PlayMCP submission.
  Parallelization: Wave 2 | Blocked by: 1, 2 | Blocks: final verification
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/package.json:9`; `apps/family-experience-mcp/docs/QA_REPORT.md:17`; `.omo/ulw-research/20260702-211500-aidlc-kakao-mcp-ops-plan-foundation/SYNTHESIS.md:52`
  Acceptance criteria (agent-executable): `npm run verify && npm run scan:secrets && npm run scan:claims && npm run scan:sources` exits 0; golden smoke exits 0; no secret patterns appear in evidence.
  QA scenarios (name the exact tool + invocation): happy: full local proof green; failure: if no `SEOUL_OPEN_DATA_KEY`, live public freshness remains residual risk, not a failed local build. Evidence `.omo/evidence/task-3-final-verify-GREEN.txt`.
  Commit: N | docs(family-experience): refresh readiness evidence

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. Plan compliance audit: all three todos completed with evidence under `.omo/evidence/`.
- [x] F2. Code quality review: typecheck passed; touched pure LOC is 108/245/76; escape-hatch scan returned no matches.
- [x] F3. Real manual QA: `/health`, `/mcp`, `smoke:mcp`, and `smoke:golden` were driven through local HTTP servers.
- [x] F4. Scope fidelity: no extra public tool, no scraper, no unsupported public-release claim, and no PlayMCP submission claim were added.

## Commit strategy
- Do not commit in this wave unless the user explicitly asks.
- Keep the diff scoped to `apps/family-experience-mcp`, `.omo/plans`, `.omo/drafts`, and `.omo/evidence`.
- Preserve unrelated untracked repo content.

## Success criteria
- The approved plan exists and reflects the family-experience primary decision.
- Live Seoul adapter has a default redaction-safe HTTP JSON path when a key is configured.
- Existing fixture/golden behavior remains green.
- Hosted local MCP proof is captured.
- Residual risks are explicit: real key availability, Kakao review, representative image, Kakao Tools finalist details, public submission.
