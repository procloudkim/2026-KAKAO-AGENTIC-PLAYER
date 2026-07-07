# family-experience-market-ready-platform - Work Plan

## TL;DR (For humans)

**What you'll get:** `아이랑 어디가`를 해커톤 데모가 아니라 공개 베타로 내놓을 수 있는 서비스 수준으로 끌어올립니다. 핵심은 기능을 늘리는 것이 아니라, 공식 출처 기반 데이터, 신선도, 장애 대응, 보안, 배포, 부모용 UX 검증을 갖춘 작은 신뢰 서비스로 만드는 것입니다.

**Why this approach:** 현재 코드는 비어 있지 않고 로컬 검증도 통과하지만, 시장 출시에는 원격 운영 증거와 데이터 신뢰 체계가 부족합니다. 그래서 `find_family_experiences` 하나를 유지하고 그 주변에 데이터 공급망, 운영, 보안, 평가 체계를 붙입니다.

**What it will NOT do:** 계정, 결제, 예약, 카카오 선물, 아동 개인정보 저장, 전국 완전 커버리지, 실시간 운영중, 안전 인증 주장은 하지 않습니다.

**Effort:** XL
**Risk:** High - external provider keys, public endpoint operations, data freshness, and claim safety determine launch credibility.
**Decisions I made for you:** public beta first, one-tool MCP preserved, cache-first runtime, official-source ETL, staged coverage tiers, explicit unsupported-claim boundaries, no accounts/payments/bookings in this plan. Public beta means both PlayMCP public readiness and a portable HTTPS deployment posture, not full commercial launch.

Your next move: start work only after accepting this plan. Full execution detail follows below.

---

> TL;DR (machine): XL/high-risk plan to make `apps/family-experience-mcp` public-beta ready through product contract, data supply chain, MCP runtime, security, operations, UX evaluation, and launch governance.

## Scope

### Must have

- Keep the product centered on one MCP tool: `find_family_experiences`.
- Keep first-market launch to public beta quality, not full consumer platform quality.
- Preserve current claim boundaries: source-grounded recommendations only.
- Make data freshness and provenance explicit in code, docs, and output.
- Make runtime health and MCP tool discovery testable through deployed HTTP.
- Add repeatable ETL, cache, and source-health verification.
- Add operational SLOs, monitoring signals, alerting rules, runbook, rollback, and release gates.
- Add security/privacy gates for secrets, logs, dependency posture, abuse throttling, and no child personal data storage.
- Add UX evaluation for parent-facing usefulness, no-result cases, and unsupported-claim suppression.
- Prepare PlayMCP/Kakao Tools readiness without making the design Kakao-only.

### Must NOT have (guardrails, anti-slop, scope boundaries)

- No user accounts, profiles, child personal data storage, payments, bookings, reservation flow, or Kakao gift commerce in this plan.
- No claim of nationwide complete coverage.
- No claim of real-time freshness.
- No claim of open-now or operating-now status unless a specific source supports it and source-specific validation is implemented.
- No claim of child safety certification, medical advice, or legal advice.
- No raw API keys in repo, logs, screenshots, docs, cache files, Docker layers, or evidence artifacts.
- No baked API keys in PlayMCP-in-KC images unless the human operator explicitly approves the host-specific temporary exception, private registry use, rotation plan, and removal plan.
- No broad rewrite into a new app before the current MCP is remotely proven.
- No hidden fixture fallback in public-beta mode. Fixture mode must be disabled or explicitly labelled in outputs and health.
- No manual-only QA gate for launch readiness. Human console actions may be documented, but service behavior must be independently testable by agent-run commands.

## Verification strategy

> Zero human intervention for service behavior verification. Console-only actions are recorded as operator gates, not proof of runtime behavior.

- Test decision: TDD for behavior changes; tests-after only for docs/report-only changes; agent-executed QA always required.
- Human gate exception: selecting a PlayMCP-in-KC secret strategy is a human approval gate because the host notice may require image-baked keys until env/Secret injection exists. All runtime behavior remains agent-testable after that decision.
- Command convention: unless a todo explicitly says otherwise, run commands from repo root `D:\KLab\2026-Hackathon\2026-07-KAKAO-AGENTIC-PLAY`. Use `npm --prefix apps/family-experience-mcp run <script>` for package scripts. Use PowerShell for the listed one-liners.
- Frameworks and tools: `npm --prefix apps/family-experience-mcp run verify`, Vitest, TypeScript, repo scan scripts, `curl -i`, MCP JSON-RPC initialize/tools/list/tools/call, `npm --prefix apps/family-experience-mcp run smoke:mcp`, `npm --prefix apps/family-experience-mcp run eval:nationwide-prompts`, ETL dry-run/write-cache commands, Docker build/run when Docker is available.
- Evidence root: `.omo/evidence/family-experience-market-ready-platform/`.
- Required final proof:
- local verification PASS via `npm --prefix apps/family-experience-mcp run verify`
- secret/source/claim scans PASS via `npm --prefix apps/family-experience-mcp run scan:secrets`, `scan:sources`, and `scan:claims`
  - live or verified-cache ETL PASS
  - deployed `/health` PASS
  - deployed `/mcp` initialize PASS
  - deployed `tools/list` contains exactly `find_family_experiences`
  - deployed `tools/call` returns bounded parent-facing output
  - prompt evaluation PASS with no unsupported claims
  - runbook can reproduce deploy, cache refresh, rollback, and incident triage
  - beta SLO document defines at minimum: availability target, P95 tool latency target, cache freshness threshold, ETL source-success threshold, no-result anomaly threshold, and alert actions

## Execution strategy

### Parallel execution waves

- Wave 1: Product contract and launch claim boundary. Can run with data-source inventory.
- Wave 2: Data supply chain and source-health hardening. Depends on product claim boundary.
- Wave 3: Runtime, deployment, security, and observability. Can run partly in parallel after Wave 1, but final deployment depends on data cache decisions.
- Wave 4: UX evaluation, launch docs, and public-beta release gate. Depends on Waves 1-3.

### Dependency matrix

| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 6, 17 | 3 |
| 2 | 1 | 6, 17, 18 | 3 |
| 3 | none | 4, 5, 7 | 1, 2 |
| 4 | 3 | 5, 8, 9 | 6 |
| 5 | 4 | 8, 9, 17 | 6 |
| 6 | 1, 2 | 11, 17, 18 | 4, 5 |
| 7 | 3 | 8, 12 | 10 |
| 8 | 4, 5, 7 | 13, 14, 19 | 10, 11 |
| 9 | 5 | 13, 17 | 10, 11 |
| 10 | none | 12, 14 | 7 |
| 11 | 6 | 17, 18 | 8, 9 |
| 12 | 7, 10 | 14, 19 | 11 |
| 13 | 8, 9 | 15, 19 | 14 |
| 14 | 8, 10, 12 | 15, 19 | 13 |
| 15 | 13, 14 | 16, 20 | none |
| 16 | 15 | 20 | 17 |
| 17 | 2, 6, 9, 11 | 18, 20 | 16 |
| 18 | 2, 6, 17 | 20 | 16 |
| 19 | 8, 12, 13, 14 | 20 | 17, 18 |
| 20 | 16, 17, 18, 19 | Final verification | none |

## Todos

> Implementation + Test = ONE todo. Never separate.

- [x] 1. Rewrite the product contract around bounded parent decision support
  What to do / Must NOT do: Update `apps/family-experience-mcp/docs/DECISIONS.md`, `SUBMISSION_COPY_DRAFT.md`, `DEMO_PACK.md`, and `PLAYMCP_TEMP_REGISTRATION.md` so the market promise is "source-grounded family experience candidates", not complete event search. Must not claim nationwide completeness, real-time status, reservation, open-now, or safety certification.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2, 6, 17
  References (executor has NO interview context): `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`; `apps/family-experience-mcp/docs/QA_REPORT.md`; Kakao official evaluation page `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10`; draft `.omo/drafts/family-experience-market-ready-platform.md`
  Acceptance criteria (agent-executable): `npm --prefix apps/family-experience-mcp run scan:claims` exits 0 and every public copy file contains explicit unsupported-claim caveats.
  QA scenarios (exact tool + invocation):
  - Happy: `npm --prefix apps/family-experience-mcp run scan:claims | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-1-scan-claims.txt`; PASS if exit code 0.
  - Failure: `New-Item -ItemType Directory -Force .omo/tmp/market-plan | Out-Null; Set-Content .omo/tmp/market-plan/bad-claim.md '전국 완전 커버리지 보장'; npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan/bad-claim.md *> .omo/evidence/family-experience-market-ready-platform/task-1-negative-claim-scan.txt; Remove-Item -Recurse -Force .omo/tmp/market-plan`; PASS if command exits nonzero or the evidence records the scanner gap that Todo 2 must close.
  Commit: Y | `docs(product): bound family experience market promise`

- [x] 2. Convert forbidden-claim scanning into a market-launch gate
  What to do / Must NOT do: Extend `apps/family-experience-mcp/scripts/scan-claims.ts` with a documented `--include <path>` option and tests so launch copy, prompts, docs, fixtures, temporary QA files, and generated evidence cannot silently introduce unsupported claims. Must not globally weaken scanner rules for negative fixtures.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 6, 17, 18
  References: `apps/family-experience-mcp/scripts/scan-claims.ts`; `apps/family-experience-mcp/test/scanClaims.test.ts`; memory caution that scanner should not be globally weakened; `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`
  Acceptance criteria: `npm --prefix apps/family-experience-mcp run scan:claims` exits 0; tests include at least one positive allowed caveat and one rejected unsupported market claim.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run verify | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-2-verify.txt`; PASS if 17+ test files and all tests pass.
  - Failure: `New-Item -ItemType Directory -Force .omo/tmp/market-plan | Out-Null; Set-Content .omo/tmp/market-plan/bad-public-copy.md '실시간 운영중인 전국 모든 체험행사를 보장합니다'; npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan/bad-public-copy.md *> .omo/evidence/family-experience-market-ready-platform/task-2-negative-claim.txt; Remove-Item -Recurse -Force .omo/tmp/market-plan`; PASS if rejected.
  Commit: Y | `test(claims): gate market launch copy`

- [x] 3. Build a source inventory and coverage-tier ledger
  What to do / Must NOT do: Create or update a canonical source ledger documenting Culture Portal, KTO TourAPI, Seoul Open Data, national festival CSV, fixtures, authentication, licensing, freshness expectation, supported claims, and coverage tier. Extend `apps/family-experience-mcp/scripts/scan-sources.ts` with a documented `--include <path>` option for negative QA fixtures. Must not treat any source as nationwide-complete unless proven.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 4, 5, 7
  References: `apps/family-experience-mcp/src/sources/types.ts`; `apps/family-experience-mcp/src/config.ts`; `apps/family-experience-mcp/docs/DECISIONS.md`; `공공데이터-관련/전국문화축제표준데이터.csv`; `문화포털-관련/한눈에보는문화정보조회서비스_가이드.doc`
  Acceptance criteria: source ledger lists source id, institution, auth, freshness, license/terms pointer, allowed claims, unsupported claims, cache TTL, proof command, and launch tier. Launch tiers must include `tier0-fixture-only`, `tier1-source-proven-single-source`, `tier2-multi-source-cross-region`, and `tier3-market-claim-eligible`; only tier3 can appear in broad public copy.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run scan:sources | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-3-scan-sources.txt`; PASS if exit code 0.
  - Failure: `New-Item -ItemType Directory -Force .omo/tmp/market-plan | Out-Null; Set-Content .omo/tmp/market-plan/bad-source.md '| source | url |\n| bad | |'; npm --prefix apps/family-experience-mcp run scan:sources -- --include .omo/tmp/market-plan/bad-source.md *> .omo/evidence/family-experience-market-ready-platform/task-3-negative-source.txt; Remove-Item -Recurse -Force .omo/tmp/market-plan`; PASS if rejected or documented as scanner gap to fix before Todo 5.
  Commit: Y | `docs(data): define source coverage tiers`

- [x] 4. Harden ETL cache metadata and atomic publish into a production provenance contract
  What to do / Must NOT do: Extend `apps/family-experience-mcp/src/etl/cache.ts`, related schemas, and tests so cache metadata can support source-level generated time, TTL, record counts, failures, input source set, raw snapshot presence, fixture/live distinction, and atomic cache publish. Must not let `/mcp` read partially written JSONL or metadata during refresh. Must not break existing cache readers without migration or compatibility.
  Parallelization: Wave 2 | Blocked by: 3 | Blocks: 5, 8, 9
  References: `apps/family-experience-mcp/src/etl/cache.ts`; `apps/family-experience-mcp/src/etl/cacheQuery.ts`; `apps/family-experience-mcp/test/etlNationwide.test.ts`; `apps/family-experience-mcp/test/pipelineNationwide.test.ts`
  Acceptance criteria: tests prove metadata rejects invalid timestamps, stale cache, fixture/live mismatch, malformed records, and partial cache publish. Cache writes use temp files/directories plus atomic rename or an equivalent safe publish protocol.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run verify | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-4-verify.txt`; PASS if tests pass.
  - Failure: `node -e "const fs=require('fs'),p='.omo/tmp/market-plan/stale-cache';fs.rmSync(p,{recursive:true,force:true});fs.mkdirSync(p,{recursive:true});fs.writeFileSync(p+'/metadata.json',JSON.stringify({generated_at:'2000-01-01T00:00:00.000Z',fixture:false,ttl_hours:1},null,2));fs.writeFileSync(p+'/normalized-records.jsonl','');" ; npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir ../../.omo/tmp/market-plan/stale-cache *> .omo/evidence/family-experience-market-ready-platform/task-4-stale-cache.txt; Remove-Item -Recurse -Force .omo/tmp/market-plan`; PASS if tool returns bounded stale/missing_configuration failure and does not fabricate candidates.
  Commit: Y | `feat(etl): strengthen cache provenance metadata`

- [x] 5. Add source-health and ETL proof reports
  What to do / Must NOT do: Add a repeatable ETL proof command or report artifact that records source success/failure, normalized record count, raw snapshots, redaction verification, cache directory, and source-specific diagnostics. Must not output raw API keys or keyed URLs.
  Parallelization: Wave 2 | Blocked by: 4 | Blocks: 8, 9, 17
  References: `apps/family-experience-mcp/scripts/etl-nationwide.ts`; `apps/family-experience-mcp/src/etl/nationwide.ts`; `apps/family-experience-mcp/src/etl/redaction.ts`; `apps/family-experience-mcp/docs/QA_REPORT.md`
  Acceptance criteria: one command writes a redacted ETL proof under `.omo/evidence/family-experience-market-ready-platform/etl/` and scan:secrets passes against it.
  QA scenarios:
  - Happy: `Push-Location apps/family-experience-mcp; node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source culture_portal | Tee-Object ../../.omo/evidence/family-experience-market-ready-platform/task-5-culture-etl.txt; Pop-Location`; PASS if `ok=true` when key is present or returns a redacted missing-key diagnostic when absent.
  - Failure: `$env:CULTURE_PORTAL_SERVICE_KEY="<redacted-synthetic-secret>"; Push-Location apps/family-experience-mcp; node --import tsx scripts/etl-nationwide.ts --dry-run --source culture_portal *> ../../.omo/evidence/family-experience-market-ready-platform/task-5-redaction-negative.txt; Pop-Location; Remove-Item Env:CULTURE_PORTAL_SERVICE_KEY`; PASS if `<redacted-synthetic-secret>` does not appear in evidence.
  Commit: Y | `feat(etl): emit redacted source health proof`

- [x] 6. Make public output expose trust, freshness, and parent checks
  What to do / Must NOT do: Ensure `find_family_experiences` success output always includes source name, source URL when present, retrieved/generated timestamp, age-fit basis, confidence, warnings, parent_check, and next_action. Must not fabricate missing source details. If any `reservation_url`-like field exists, copy must say "confirm at source" and must not imply booking or availability.
  Parallelization: Wave 2 | Blocked by: 1, 2 | Blocks: 11, 17, 18
  References: `apps/family-experience-mcp/src/types.ts`; `apps/family-experience-mcp/src/schemas.ts`; `apps/family-experience-mcp/src/mcpSourceRecords.ts`; `apps/family-experience-mcp/test/golden.test.ts`; `apps/family-experience-mcp/test/mcpCache.test.ts`
  Acceptance criteria: golden output schema rejects candidates missing trust fields and rejects unsupported availability/safety language.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run smoke:golden | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-6-smoke-golden.txt`; PASS if all golden scenarios pass.
  - Failure: `Push-Location apps/family-experience-mcp; node --import tsx --input-type=module -e "import { FamilyExperienceCandidateSchema } from './src/schemas.ts'; const bad={id:'x',title:'x',location:'서울',starts_at:'2026-07-07',ends_at:'2026-07-07',source:'culture_portal',tags:[],child_stages:['preschool'],min_child_age:3,max_child_age:5,date_time:'x',venue:'x',address:'x',age_fit_label:'unknown',age_fit_reason:'x',indoor_outdoor:'unknown',fee_text:'x',source_name:'x',source_url:'https://example.com',retrieved_at:'x',confidence:'x',mode:'live',warnings:'x',source_summary:'x',next_action:'x'}; const r=FamilyExperienceCandidateSchema.safeParse(bad); console.log(JSON.stringify({success:r.success,issues:r.error?.issues},null,2)); process.exit(r.success?1:0)" *> ../../.omo/evidence/family-experience-market-ready-platform/task-6-negative-schema.txt; Pop-Location`; PASS if schema rejects missing `parent_check`.
  Commit: Y | `feat(output): expose source-grounded parent checks`

- [x] 7. Define portable deployment configuration and secret policy
  What to do / Must NOT do: Update `.env.example`, `RUNBOOK.md`, `HOST_REQUIREMENTS_SOT.md`, and deployment docs so local `.env`, KakaoCloud/PlayMCP-in-KC, and non-Kakao secret managers have clear rules. Extend `apps/family-experience-mcp/scripts/scan-secrets.ts` with a documented `--include <path>` option for negative QA fixtures. Must not instruct users to commit secrets. If PlayMCP-in-KC temporarily lacks env injection, record that as an explicit risk requiring human approval and post-submit rotation.
  Parallelization: Wave 3 | Blocked by: 3 | Blocks: 8, 12
  References: `apps/family-experience-mcp/.env.example`; `apps/family-experience-mcp/docs/RUNBOOK.md`; `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`; Twelve-Factor config guidance `https://12factor.net/config`
  Acceptance criteria: `npm --prefix apps/family-experience-mcp run scan:secrets` passes; docs contain no raw secret; operator can tell where each key belongs for local and deployment. PlayMCP-in-KC image-baked secret path is marked `HUMAN_APPROVAL_REQUIRED` and cannot be selected by default.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run scan:secrets | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-7-scan-secrets.txt`; PASS if exit code 0.
  - Failure: `New-Item -ItemType Directory -Force .omo/tmp/market-plan | Out-Null; Set-Content .omo/tmp/market-plan/fake-secret.env 'CULTURE_PORTAL_SERVICE_KEY=<redacted-synthetic-secret>'; npm --prefix apps/family-experience-mcp run scan:secrets -- --include .omo/tmp/market-plan/fake-secret.env *> .omo/evidence/family-experience-market-ready-platform/task-7-negative-secret.txt; Remove-Item -Recurse -Force .omo/tmp/market-plan`; PASS if rejected.
  Commit: Y | `docs(security): define launch secret policy`

- [ ] 8. Prove remote MCP lifecycle compatibility
  What to do / Must NOT do: Make local and deployed HTTP MCP support explicit initialize, tools/list, and tools/call verification. Add scripts or docs for `curl -i` JSON-RPC probes against `/mcp`. Must not rely on only `/health`.
  Parallelization: Wave 3 | Blocked by: 4, 5, 7 | Blocks: 13, 14, 19
  References: `apps/family-experience-mcp/src/server.ts`; `apps/family-experience-mcp/src/mcp.ts`; `apps/family-experience-mcp/scripts/smoke-mcp.ts`; MCP architecture docs; MCP Inspector docs
  Acceptance criteria: local command proves initialize/tools/list/tools/call; remote command template is documented and evidence-ready. Add a one-tool drift guard: tools/list must expose exactly `find_family_experiences` unless a future plan explicitly changes the public tool contract.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-8-smoke-mcp.txt`; PASS if tool discovery and call succeed.
  - Failure: `Push-Location apps/family-experience-mcp; $env:HOST='127.0.0.1'; $env:PORT='3349'; $p=Start-Process -FilePath node -ArgumentList '--import','tsx','src/server.ts' -PassThru -WindowStyle Hidden; Start-Sleep 3; curl.exe -i http://127.0.0.1:3349/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "{\"jsonrpc\":\"2.0\",\"id\":\"bad-1\",\"method\":\"tools/call\",\"params\":{\"name\":\"find_family_experiences\",\"arguments\":{\"location\":\"서울\"}}}" *> ../../.omo/evidence/family-experience-market-ready-platform/task-8-invalid-args.txt; Stop-Process -Id $p.Id -Force; Pop-Location`; PASS if structured error is returned without stack trace or secret.
  Commit: Y | `test(mcp): prove lifecycle smoke path`

- [x] 9. Add cache refresh and stale-cache operational behavior
  What to do / Must NOT do: Add or document a scheduled ETL/cache refresh command, cache directory strategy, cache expiration behavior, and safe fallback for stale/missing cache. Must not silently serve stale cache as live.
  Parallelization: Wave 3 | Blocked by: 5 | Blocks: 13, 17
  References: `apps/family-experience-mcp/src/etl/cacheQuery.ts`; `apps/family-experience-mcp/scripts/etl-nationwide.ts`; `apps/family-experience-mcp/docs/RUNBOOK.md`
  Acceptance criteria: runbook defines refresh cadence, TTL, stale behavior, source-specific live rebuild command, recovery command, and evidence path; tests verify stale cache failure or labelled fallback. Public-beta runtime copy must not tell operators to rebuild fixture cache unless fixture mode is explicitly selected.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run verify | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-9-verify.txt`; PASS if cache tests pass.
  - Failure: `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir .omo/tmp/market-plan/does-not-exist *> .omo/evidence/family-experience-market-ready-platform/task-9-missing-cache.txt`; PASS if response is bounded and does not fabricate candidates.
  Commit: Y | `feat(ops): define cache refresh behavior`

- [x] 10. Add API abuse and resource consumption controls
  What to do / Must NOT do: Add runtime limits appropriate for public beta: request body size, timeout, simple per-process rate limit or documented upstream edge rate limit, max candidates, max prompt length, and safe error responses. Must not collect personal identifiers beyond what is required for abuse prevention.
  Parallelization: Wave 3 | Blocked by: none | Blocks: 12, 14
  References: `apps/family-experience-mcp/src/server.ts`; `apps/family-experience-mcp/src/schemas.ts`; OWASP API Security Top 10 2023; `apps/family-experience-mcp/test/httpJson.test.ts`
  Acceptance criteria: tests cover overlong prompt, oversized/invalid JSON, rapid repeated calls or documented edge-rate limitation, and timeout/failure shape.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run verify | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-10-verify.txt`; PASS if tests pass.
  - Failure: `Push-Location apps/family-experience-mcp; $env:HOST='127.0.0.1'; $env:PORT='3349'; $p=Start-Process -FilePath node -ArgumentList '--import','tsx','src/server.ts' -PassThru -WindowStyle Hidden; Start-Sleep 3; $long='x' * 20000; curl.exe -i http://127.0.0.1:3349/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d ('{\"jsonrpc\":\"2.0\",\"id\":\"long-1\",\"method\":\"tools/call\",\"params\":{\"name\":\"find_family_experiences\",\"arguments\":{\"prompt\":\"' + $long + '\"}}}') *> ../../.omo/evidence/family-experience-market-ready-platform/task-10-overlong-prompt.txt; Stop-Process -Id $p.Id -Force; Pop-Location`; PASS if rejected safely.
  Commit: Y | `fix(security): bound public MCP request surface`

- [x] 11. Build parent-facing prompt evaluation for market scenarios
  What to do / Must NOT do: Expand `eval:nationwide-prompts` or create market-specific fixtures for newborn, infant, toddler, preschool, school-age, rainy-day, weekend, indoor, no-result, and unsupported-claim scenarios. Must evaluate prompt text path, not only structured request objects.
  Parallelization: Wave 4 | Blocked by: 6 | Blocks: 17, 18
  References: `apps/family-experience-mcp/scripts/eval-prompts.ts`; `apps/family-experience-mcp/scripts/eval-prompt-coverage.ts`; `apps/family-experience-mcp/test/fixtures/eval-nationwide`; memory caution on prompt text path
  Acceptance criteria: at least 42 existing nationwide prompts still pass and at least 10 market scenarios are added or documented as covered; unsupported claims are checked in output text.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run eval:nationwide-prompts | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-11-eval-prompts.txt`; PASS if expected prompt count and coverage pass.
  - Failure: `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache --prompt "2099년 남극에서 1살 아이와 갈 수 있는 행사" *> .omo/evidence/family-experience-market-ready-platform/task-11-no-result.txt`; PASS if response avoids fabrication and gives next action.
  Commit: Y | `test(eval): cover parent market scenarios`

- [x] 12. Add structured operational logs and launch metrics
  What to do / Must NOT do: Add or document structured logs and metrics for request count, tool success/failure, latency, cache age, source failures, invalid input, no-result rate, deployed version, source-health state, and redaction verification. Must not log raw prompts if they can contain child personal data; either avoid prompt logging or hash/redact it.
  Parallelization: Wave 3 | Blocked by: 7, 10 | Blocks: 14, 19
  References: `apps/family-experience-mcp/src/health.ts`; `apps/family-experience-mcp/src/server.ts`; OpenTelemetry docs; Twelve-Factor logs guidance
  Acceptance criteria: `/health` or a documented diagnostics path exposes non-sensitive operational state, including cache freshness and source-health summary. Logs are structured and scan:secrets passes on captured logs.
  QA scenarios:
  - Happy: `Push-Location apps/family-experience-mcp; $env:HOST='127.0.0.1'; $env:PORT='3349'; $p=Start-Process -FilePath node -ArgumentList '--import','tsx','src/server.ts' -PassThru -WindowStyle Hidden; Start-Sleep 3; curl.exe -i http://127.0.0.1:3349/health *> ../../.omo/evidence/family-experience-market-ready-platform/task-12-health.txt; Stop-Process -Id $p.Id -Force; Pop-Location`; PASS if no secrets and status includes cache/config safety indicators.
  - Failure: `$env:FAMILY_EXPERIENCE_ETL_CACHE_DIR='.omo/tmp/market-plan/missing-cache'; Push-Location apps/family-experience-mcp; node --import tsx scripts/smoke-mcp.ts *> ../../.omo/evidence/family-experience-market-ready-platform/task-12-redacted-failure-log.txt; Pop-Location; Remove-Item Env:FAMILY_EXPERIENCE_ETL_CACHE_DIR`; PASS if no raw secret or stack trace is exposed.
  Commit: Y | `feat(ops): add public-beta observability signals`

- [x] 13. Make Docker and runtime packaging production-safe
  What to do / Must NOT do: Harden `Dockerfile` and `.dockerignore` for reproducible production runtime: dependency strategy, data/cache inclusion policy, non-root user if feasible, port/env defaults, healthcheck or documented platform health probe, no raw `.env`, no dev-only assumption unless justified. Must not bake raw keys into public images.
  Parallelization: Wave 3 | Blocked by: 8, 9 | Blocks: 15, 19
  References: `apps/family-experience-mcp/Dockerfile`; `apps/family-experience-mcp/.dockerignore`; `apps/family-experience-mcp/package.json`; KakaoCloud deployment docs
  Acceptance criteria: Docker build command is documented and passes when Docker daemon is available; if Docker unavailable, plan records exact blocker and fallback build path.
  QA scenarios:
  - Happy: `Push-Location apps/family-experience-mcp; docker build --platform linux/amd64 -t family-experience-mcp:market . *> ../../.omo/evidence/family-experience-market-ready-platform/task-13-docker-build.txt; Pop-Location`; PASS if image builds, or blocker is Docker daemon unavailable with exact error.
  - Failure: `Push-Location apps/family-experience-mcp; $p=Start-Process -FilePath docker -ArgumentList 'run','--rm','--env-file','.env','-p','3349:3349','family-experience-mcp:market' -PassThru -WindowStyle Hidden; Start-Sleep 5; curl.exe -i http://127.0.0.1:3349/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "{\"jsonrpc\":\"2.0\",\"id\":\"bad-container\",\"method\":\"tools/call\",\"params\":{\"name\":\"find_family_experiences\",\"arguments\":{\"location\":\"서울\"}}}" *> ../../.omo/evidence/family-experience-market-ready-platform/task-13-container-invalid.txt; Stop-Process -Id $p.Id -Force; Pop-Location`; PASS if safe error and no secret, or records Docker unavailable as blocker.
  Commit: Y | `build(container): harden MCP runtime image`

- [x] 14. Define SLOs, alerts, and incident response
  What to do / Must NOT do: Add `docs/SLO.md` or extend runbook with public-beta SLIs/SLOs: availability, P95 latency, valid tool-call success, cache freshness, source ETL success, no-result anomaly, provider quota/failure, and secret-scan gate. Add alert thresholds and incident steps. Must not promise SLA to users.
  Parallelization: Wave 3 | Blocked by: 8, 10, 12 | Blocks: 15, 19
  References: Google SRE SLO/alerting docs; `apps/family-experience-mcp/docs/RUNBOOK.md`; `apps/family-experience-mcp/src/health.ts`
  Acceptance criteria: docs define measurable SLIs, beta SLOs, alert queries or manual checks, severity levels, rollback command, and owner actions. Default beta targets: 99.0% weekly MCP availability, P95 tool call under 3 seconds from cache, cache age under 24 hours for tier3 copy, at least one successful source ETL proof per launch day, and zero raw-secret leak incidents.
  QA scenarios:
  - Happy: `Select-String -Path apps/family-experience-mcp/docs/SLO.md -Pattern '99.0%|P95|24 hours|source ETL|zero raw-secret' | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-14-slo-check.txt`; PASS if every target is present.
  - Failure: `Set-Content .omo/tmp-stale-source-report.json '{\"cache_age_hours\":999,\"source_failures\":3}'; Select-String -Path apps/family-experience-mcp/docs/SLO.md -Pattern 'stale|source failure|SEV' *> .omo/evidence/family-experience-market-ready-platform/task-14-alert-sim.txt; Remove-Item .omo/tmp-stale-source-report.json`; PASS if runbook/SLO routes stale cache and source failures to severity/action.
  Commit: Y | `docs(ops): define beta SLOs and incidents`

- [x] 15. Produce deploy-to-public-beta runbook
  What to do / Must NOT do: Update `RUNBOOK.md` with exact operator steps from local validation to cache generation, Docker build, deployment, remote `/health`, remote `/mcp`, PlayMCP info load, bad-cache rollback, exposed-key incident, provider outage response, public-copy rollback, key rotation, and post-release monitoring. Must not state that deployment/review/submission is complete unless performed.
  Parallelization: Wave 4 | Blocked by: 13, 14 | Blocks: 16, 20
  References: `apps/family-experience-mcp/docs/RUNBOOK.md`; `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`; KakaoCloud deployment docs; MCP Inspector docs
  Acceptance criteria: a cold operator can run the commands in order; every step has expected output and evidence path.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run verify; npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache *> .omo/evidence/family-experience-market-ready-platform/task-15-runbook-local.txt`; PASS if local gates pass.
  - Failure: `Select-String -Path apps/family-experience-mcp/docs/RUNBOOK.md -Pattern 'rollback|bad cache|exposed key|provider outage|public-copy rollback' *> .omo/evidence/family-experience-market-ready-platform/task-15-rollback-drill.txt`; PASS if every rollback case is documented.
  Commit: Y | `docs(runbook): add public-beta deployment path`

- [ ] 16. Create launch-readiness dashboard/report artifact
  What to do / Must NOT do: Add a generated or maintained launch report summarizing current status for product, data, runtime, security, ops, UX, PlayMCP, representative image rights/acceptance, and public copy. Must not hide blockers behind green summaries.
  Parallelization: Wave 4 | Blocked by: 15 | Blocks: 20
  References: `apps/family-experience-mcp/docs/QA_REPORT.md`; `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md`; `.omo/evidence/family-experience-market-ready-platform/`
  Acceptance criteria: report has explicit statuses: PASS, BLOCKED, DEFERRED, NOT CLAIMED; includes dates and command evidence.
  QA scenarios:
  - Happy: `Select-String -Path apps/family-experience-mcp/docs/QA_REPORT.md,apps/family-experience-mcp/docs/GOLDEN_RESULTS.md -Pattern 'PASS|BLOCKED|DEFERRED|NOT CLAIMED|find_family_experiences' *> .omo/evidence/family-experience-market-ready-platform/task-16-launch-report.txt`; PASS if report lists all components.
  - Failure: `Set-Content .omo/tmp-market-launch-report.md 'KakaoCloud deployment: BLOCKED'; Select-String -Path .omo/tmp-market-launch-report.md -Pattern 'BLOCKED' *> .omo/evidence/family-experience-market-ready-platform/task-16-blocked-gate.txt; Remove-Item .omo/tmp-market-launch-report.md`; PASS if BLOCKED state is detected and not converted to ready.
  Commit: Y | `docs(launch): add readiness report`

- [ ] 17. Validate PlayMCP and Kakao Tools readiness without overfitting to Kakao
  What to do / Must NOT do: Update `KAKAO_TOOLS_READINESS.md`, PlayMCP registration docs, and demo pack to separate PlayMCP preliminary readiness from market readiness and future Kakao Tools widget readiness. Align tool title/description/metadata with coverage-tier language. Must not claim final review, public switch, or contest submission unless performed.
  Parallelization: Wave 4 | Blocked by: 2, 6, 9, 11 | Blocks: 18, 20
  References: `apps/family-experience-mcp/docs/KAKAO_TOOLS_READINESS.md`; `apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md`; Kakao official contest page
  Acceptance criteria: docs include exact field values, endpoint placeholder, private/temporary vs review vs public status, and future widget/data-card requirements.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run scan:claims; npm --prefix apps/family-experience-mcp run scan:sources *> .omo/evidence/family-experience-market-ready-platform/task-17-kakao-doc-scans.txt`; PASS if both pass.
  - Failure: `New-Item -ItemType Directory -Force .omo/tmp/market-plan | Out-Null; Set-Content .omo/tmp/market-plan/false-submission.md 'PlayMCP final review and contest submission completed'; npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan/false-submission.md *> .omo/evidence/family-experience-market-ready-platform/task-17-false-submission-claim.txt; Remove-Item -Recurse -Force .omo/tmp/market-plan`; PASS if rejected after Todo 2 extends claim scanning for false status claims.
  Commit: Y | `docs(kakao): separate PlayMCP and market readiness`

- [ ] 18. Add parent-value acceptance tests for "better than search"
  What to do / Must NOT do: Define objective UX acceptance criteria: at most 3 candidates, each with why this fits child age/stage, exact source, caveat, parent next action, and no hallucinated availability. Must not optimize for long answer volume.
  Parallelization: Wave 4 | Blocked by: 2, 6, 17 | Blocks: 20
  References: `apps/family-experience-mcp/scripts/eval-prompts.ts`; `apps/family-experience-mcp/docs/DEMO_PACK.md`; `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md`
  Acceptance criteria: evaluator reports candidate count, trust-field completeness, unsupported-claim absence, and no-result behavior for market scenarios.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run eval:nationwide-prompts | Tee-Object .omo/evidence/family-experience-market-ready-platform/task-18-market-ux-eval.txt`; PASS if output meets thresholds.
  - Failure: `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache --prompt "2099년 화성에서 초등학생이 참여할 수 있는 체험행사 3개" *> .omo/evidence/family-experience-market-ready-platform/task-18-no-fabrication.txt`; PASS if response says no verified result and suggests next safe action.
  Commit: Y | `test(ux): measure parent decision value`

- [ ] 19. Perform security and privacy launch review
  What to do / Must NOT do: Add a launch security checklist and fix any gaps found in secrets, logs, dependencies, request limits, CORS/headers if applicable, SSRF-like provider URL handling, raw cache contents, child data handling, and evidence artifacts. Must not store child names, exact home locations, or personal schedules.
  Parallelization: Wave 4 | Blocked by: 8, 12, 13, 14 | Blocks: 20
  References: OWASP API Security Top 10 2023; `apps/family-experience-mcp/scripts/scan-secrets.ts`; `apps/family-experience-mcp/docs/RUNBOOK.md`; `apps/family-experience-mcp/src/server.ts`
  Acceptance criteria: `npm --prefix apps/family-experience-mcp run scan:secrets`, `npm --prefix apps/family-experience-mcp audit --audit-level=high`, and launch checklist pass or document non-blocking exceptions with rationale.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run scan:secrets; npm --prefix apps/family-experience-mcp audit --audit-level=high *> .omo/evidence/family-experience-market-ready-platform/task-19-security.txt`; PASS if no high vulnerabilities or documented acceptable exception.
  - Failure: `Push-Location apps/family-experience-mcp; $env:HOST='127.0.0.1'; $env:PORT='3349'; $p=Start-Process -FilePath node -ArgumentList '--import','tsx','src/server.ts' -PassThru -WindowStyle Hidden; Start-Sleep 3; curl.exe -i http://127.0.0.1:3349/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{bad json' *> ../../.omo/evidence/family-experience-market-ready-platform/task-19-error-safety.txt; Stop-Process -Id $p.Id -Force; Pop-Location`; PASS if no stack trace, key, or raw user-sensitive prompt is leaked.
  Commit: Y | `chore(security): add launch security review`

- [ ] 20. Run public-beta launch gate and freeze release candidate
  What to do / Must NOT do: Run all local, data, runtime, security, docs, UX, and deploy evidence gates; update launch report; tag or prepare release candidate only if all blocking gates pass. Must not declare market-ready if any gate is BLOCKED.
  Parallelization: Wave 4 final | Blocked by: 16, 17, 18, 19 | Blocks: final verification
  References: all previous todo evidence; `apps/family-experience-mcp/docs/QA_REPORT.md`; `apps/family-experience-mcp/docs/RUNBOOK.md`; `.omo/evidence/family-experience-market-ready-platform/`
  Acceptance criteria: launch report states either `PUBLIC_BETA_READY` or `BLOCKED` with exact blockers; no ambiguous "almost ready" state. If the secret strategy requires human approval, final status must remain `BLOCKED_PENDING_HUMAN_SECRET_DECISION` until that approval evidence exists.
  QA scenarios:
  - Happy: `npm --prefix apps/family-experience-mcp run verify; npm --prefix apps/family-experience-mcp run scan:secrets; npm --prefix apps/family-experience-mcp run scan:sources; npm --prefix apps/family-experience-mcp run scan:claims; npm --prefix apps/family-experience-mcp run eval:nationwide-prompts *> .omo/evidence/family-experience-market-ready-platform/task-20-final-local-gates.txt`; PASS if all pass.
  - Failure: if Docker or remote endpoint unavailable, record blocker in `.omo/evidence/family-experience-market-ready-platform/task-20-external-blockers.txt`; PASS only if final status is `BLOCKED`, not ready.
  Commit: Y | `chore(release): freeze public beta readiness gate`

## Final verification wave

> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.

- [ ] F1. Plan compliance audit
  Command: `powershell -NoProfile -Command "$p='.omo/plans/family-experience-market-ready-platform.md';$t=Get-Content -Raw $p;$todos=([regex]::Matches($t,'(?m)^- \\[ \\] \\d+\\. ')).Count;$refs=([regex]::Matches($t,'References:')).Count;$qa=([regex]::Matches($t,'QA scenarios:')).Count;$ev=([regex]::Matches($t,'\\.omo/evidence/family-experience-market-ready-platform')).Count;@(\"todos=$todos\",\"refs=$refs\",\"qa=$qa\",\"evidence=$ev\") | Set-Content .omo/evidence/family-experience-market-ready-platform/final-F1-plan-compliance.md; if($todos -lt 20 -or $refs -lt 20 -or $qa -lt 20 -or $ev -lt 20){exit 1}"`
  Expected result: exits 0 and writes counts proving every todo has references, QA, and evidence. Evidence: `.omo/evidence/family-experience-market-ready-platform/final-F1-plan-compliance.md`.

- [ ] F2. Code quality review
  Command: `git diff -- apps/family-experience-mcp | Tee-Object .omo/evidence/family-experience-market-ready-platform/final-F2-diff.patch; npm --prefix apps/family-experience-mcp run verify *> .omo/evidence/family-experience-market-ready-platform/final-F2-verify.txt`
  Expected result: diff stays within scoped app/docs/scripts/tests, verify exits 0, no broad rewrite or scan weakening. Reviewer records verdict in `.omo/evidence/family-experience-market-ready-platform/final-F2-code-quality.md`.

- [ ] F3. Real manual QA
  Local command: `Push-Location apps/family-experience-mcp; $env:HOST='127.0.0.1'; $env:PORT='3349'; $env:FAMILY_EXPERIENCE_ETL_CACHE_DIR='data/family-experience-cache'; $p=Start-Process -FilePath node -ArgumentList '--import','tsx','src/server.ts' -PassThru -WindowStyle Hidden; Start-Sleep 3; curl.exe -i http://127.0.0.1:3349/health *> ../../.omo/evidence/family-experience-market-ready-platform/final-F3-health.http; npm --prefix . run smoke:mcp -- --cache-dir=data/family-experience-cache *> ../../.omo/evidence/family-experience-market-ready-platform/final-F3-smoke-mcp.txt; Stop-Process -Id $p.Id -Force; Pop-Location`
  Remote command after deployment: `curl.exe -i https://<DEPLOYED_ENDPOINT_HOST>/health *> .omo/evidence/family-experience-market-ready-platform/final-F3-remote-health.http; curl.exe -i https://<DEPLOYED_ENDPOINT_HOST>/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "{\"jsonrpc\":\"2.0\",\"id\":\"init-1\",\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-06-18\",\"capabilities\":{},\"clientInfo\":{\"name\":\"market-qa\",\"version\":\"1.0.0\"}}}" *> .omo/evidence/family-experience-market-ready-platform/final-F3-remote-mcp-init.http; curl.exe -i https://<DEPLOYED_ENDPOINT_HOST>/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "{\"jsonrpc\":\"2.0\",\"id\":\"tools-1\",\"method\":\"tools/list\",\"params\":{}}" *> .omo/evidence/family-experience-market-ready-platform/final-F3-remote-tools-list.http; curl.exe -i https://<DEPLOYED_ENDPOINT_HOST>/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "{\"jsonrpc\":\"2.0\",\"id\":\"call-1\",\"method\":\"tools/call\",\"params\":{\"name\":\"find_family_experiences\",\"arguments\":{\"prompt\":\"이번 주말 서울에서 4살 아이와 갈 실내 체험\"}}}" *> .omo/evidence/family-experience-market-ready-platform/final-F3-remote-tools-call.http`
  Expected result: local health and smoke pass; remote proof is PASS when deployed or explicitly BLOCKED with endpoint absence. Evidence summary: `.omo/evidence/family-experience-market-ready-platform/final-F3-real-manual-qa.md`.

- [ ] F4. Scope fidelity
  Command: `$patterns=@('payment','booking','reservation confirmed','전국 완전','실시간','open-now','safety certification','child profile','home address'); foreach($pat in $patterns){ Select-String -Path apps/family-experience-mcp/**/* -Pattern $pat -SimpleMatch } *> .omo/evidence/family-experience-market-ready-platform/final-F4-scope-fidelity.md; npm --prefix apps/family-experience-mcp run scan:claims *> .omo/evidence/family-experience-market-ready-platform/final-F4-scan-claims.txt`
  Expected result: any hits are either forbidden and fixed, or explicitly allowed negative fixtures; claim scan exits 0. Evidence: `.omo/evidence/family-experience-market-ready-platform/final-F4-scope-fidelity.md`.

## Commit strategy

- Use small conventional commits.
- Suggested order:
  1. `docs(product): bound family experience market promise`
  2. `test(claims): gate market launch copy`
  3. `docs(data): define source coverage tiers`
  4. `feat(etl): strengthen cache provenance metadata`
  5. `feat(etl): emit redacted source health proof`
  6. `feat(output): expose source-grounded parent checks`
  7. `docs(security): define launch secret policy`
  8. `test(mcp): prove lifecycle smoke path`
  9. `feat(ops): define cache refresh behavior`
  10. `fix(security): bound public MCP request surface`
  11. `test(eval): cover parent market scenarios`
  12. `feat(ops): add public-beta observability signals`
  13. `build(container): harden MCP runtime image`
  14. `docs(ops): define beta SLOs and incidents`
  15. `docs(runbook): add public-beta deployment path`
  16. `docs(launch): add readiness report`
  17. `docs(kakao): separate PlayMCP and market readiness`
  18. `test(ux): measure parent decision value`
  19. `chore(security): add launch security review`
  20. `chore(release): freeze public beta readiness gate`
- Do not commit raw `.env`, generated secrets, provider screenshots with keys, or Docker layers containing keys.
- Final release commit footer: `Plan: .omo/plans/family-experience-market-ready-platform.md`.

## Success criteria

- Product contract is market-safe and does not overclaim.
- Every public output and public doc can explain source, freshness, confidence, parent check, and unsupported claims.
- Data pipeline can regenerate a verified cache from official or documented fallback sources with redacted evidence.
- Runtime supports health, initialize, tools/list, tools/call, invalid-input handling, stale-cache handling, and no-result handling.
- Security gates pass: secret scan, claim scan, source scan, dependency audit or documented exception, request bound tests, redacted failure logs.
- Operations are reproducible: deploy, smoke, monitor, refresh cache, rotate keys, rollback, and incident response.
- UX evaluation demonstrates parent decision value across at least 10 market scenarios and existing nationwide prompt fixtures.
- Launch report ends in one of two states only: `PUBLIC_BETA_READY` or `BLOCKED`.
