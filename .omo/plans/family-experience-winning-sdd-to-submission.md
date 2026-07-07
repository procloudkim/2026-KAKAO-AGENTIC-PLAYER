# family-experience-winning-sdd-to-submission - Work Plan

## TL;DR (For humans)

**What you'll get:** `아이랑 어디가`를 단순 제출 가능한 MCP에서 대회 우승을 노릴 수 있는 제출 패키지로 끌어올린다. 핵심 산출물은 live 데이터 증거, 20프롬프트 품질 평가, 부모가 바로 행동할 수 있는 답변 카드, public HTTPS/PlayMCP 실증, 대표 이미지/데모/최종 제출 체크까지 닫힌 실행 계획이다.

**Why this approach:** 카카오의 평가축은 창의성, 편의성, 안정성이다. 그래서 새 기능을 많이 붙이는 대신, 아이 나이/날짜/지역/조건을 대충 말해도 출처와 다음 행동까지 정리되는 답변 품질을 증명하고, 배포/보안/심사 흐름을 증거로 닫는다.

**What it will NOT do:** 전국/실시간/예약가능/운영중/아동 적합성 보장을 과장하지 않는다. 휴일약국이나 육아용품안전 MCP를 이 계획에 섞지 않는다. PlayMCP 심사, 전체공개, 예선 제출이 끝났다고 쓰지 않는다.

**Effort:** Large
**Risk:** High - live Seoul data quality, public HTTPS deployment, PlayMCP review latency, and console/auth surfaces are outside pure local control.
**Decisions I made for you:** Family Experience 단일 트랙, Seoul-first, one public tool, SDD evidence gates, source expansion deferred, no HITL for QA except authenticated console gates recorded as blockers if inaccessible, Kakao Tools readiness as post-P0 prep.

Your next move: execute this plan with `$omo:start-work .omo/plans/family-experience-winning-sdd-to-submission.md` or another explicit execution command. Full execution detail follows below.

---

> TL;DR (machine): Large/high-risk plan to finish Family Experience MCP winning readiness through live proof, eval harness, action-card hardening, deployment, PlayMCP submission evidence, and finalist readiness.

## Scope
### Must have
- Keep the implementation centered on `apps/family-experience-mcp`.
- Keep exactly one public MCP tool: `find_family_experiences`.
- Align package/runtime version so local metadata, `/health`, and MCP server version agree.
- Prove live Seoul Open Data behavior with a real configured key or record a blocking evidence item that prevents live proof.
- Add a 20-prompt evaluation harness covering weekend, today, rainy day, indoor, infant, toddler, preschool, school-age, free/low-budget, nearby, ambiguous input, no-result, source failure, and adversarial overclaim prompts.
- Define measurable answer-quality metrics:
  - source shown.
  - retrieved/freshness label shown.
  - child age/stage basis shown.
  - date/time and venue/address shown when available.
  - parent check and next action shown.
  - no unsupported claim.
  - latency captured.
- Harden parent action-card output so every result has title, date/time, place/address, age-fit reason, source URL or source explanation, confidence/freshness, parent check, and next action.
- Support loose Korean prompts enough to extract or clarify age/date/location/condition from prompts like `오늘 비오는데 4살이랑 갈 곳`, `이번 주말 실내`, `초등 저학년 무료`.
- Prepare deployable public HTTPS operation path:
  - container/build artifact or platform deployment config.
  - server binds externally as required by platform while keeping local dev safe.
  - deployment secret mapping for `SEOUL_OPEN_DATA_KEY`.
  - `/health` and `/mcp` real HTTP proof.
- Prepare PlayMCP private/temp registration, private smoke, review-request, public-switch, and one-time preliminary submission evidence gates.
- Prepare rights-cleared representative image or image-generation prompt plus rights ledger.
- Prepare public demo pack:
  - 30-second script.
  - 3 starter prompts.
  - before/after value statement.
  - screenshots/transcripts with no secrets.
- Prepare Kakao Tools finalist-readiness branch plan/schema without blocking preliminary submission.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not add a second public MCP tool before the core tool passes all winning gates.
- Do not modify sibling workspaces `D:\KLab\workspace\2026-휴일약국` or `D:\KLab\workspace\2026-06-07-harness`; because those workspaces may already be dirty, prove this by capturing before/after scoped status and showing this execution introduced no new sibling changes, not by requiring sibling worktrees to be clean.
- Do not claim nationwide coverage unless an official nationwide source is registered, licensed, normalized, evaluated, and proven live.
- Do not claim real-time freshness, reservation availability, current operation, child safety, or child suitability unless the specific cited source field supports that exact claim.
- Do not add unofficial scraping, browser parsers, or unregistered event sources.
- Do not expose `.env`, raw API keys, keyed URLs, bearer tokens, cookies, or private console logs in docs, evidence, screenshots, or PlayMCP fields.
- Do not mark deployment, PlayMCP review, public visibility switch, or contest submission complete until an observed artifact proves it.
- Do not push or commit unless the executor has explicit commit authorization for that execution run.

## Verification strategy
> Zero human intervention - all verification is agent-executed where the surface is locally or programmatically accessible. Authenticated PlayMCP/Kakao Cloud console steps must be driven by browser/Chrome automation when an authenticated profile is available; otherwise record BLOCKED with exact missing-auth evidence instead of pretending completion.

- Test decision: TDD for behavior-bearing code changes; tests-after only for docs/metadata checks; manual QA is always required for HTTP/console surfaces.
- Unit/integration framework: existing TypeScript, Vitest, smoke scripts, and scanners in `apps/family-experience-mcp`.
- Manual QA channels:
  - CLI auxiliary surface for plan/docs/eval reports.
  - HTTP call for local/deployed `/health`, `/mcp`, and tool call surfaces.
  - Browser/Chrome for PlayMCP and Kakao Cloud console flows if authenticated.
- Core command set from repo root:
  - `cd apps/family-experience-mcp && npm run verify`
  - `cd apps/family-experience-mcp && npm run scan:secrets`
  - `cd apps/family-experience-mcp && npm run scan:claims`
  - `cd apps/family-experience-mcp && npm run scan:sources`
  - `cd apps/family-experience-mcp && npm run smoke:mcp -- --assert-tool-count=1`
  - `cd apps/family-experience-mcp && npm run smoke:golden`
- Evidence root: `.omo/evidence/winning-sdd/`.
- Plan-only criteria evidence root: `.omo/evidence/winning-sdd-plan/`.
- Cleanup rule: every server/port/browser/temp-file scenario must include a cleanup receipt in the evidence file before it can count as PASS.
- PowerShell command rule: all `powershell -NoProfile -Command` snippets use the literal form `-Command '& { ... }'` so `$variables` are evaluated by the child PowerShell process, not expanded by the caller before execution.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Implementation + Test = ONE todo.

- Wave 1: metadata alignment, live proof harness, eval harness skeleton, answer contract tests.
- Wave 2: loose prompt parsing, parent-fit ranking/card polish, local eval run, docs/copy guardrails.
- Wave 3: deployment packaging, public HTTPS smoke, PlayMCP private registration pack, representative image/demo pack.
- Wave 4: PlayMCP private smoke, review/public/submission gates, finalist/Kakao Tools readiness.
- Final wave: plan compliance, code quality, real manual QA, scope fidelity, and security/claim/source gates.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 7, 8, final | 2, 3 |
| 2 | none | 5, 7, 8, 10, final | 1, 3, 4 |
| 3 | none | 5, 6, 10, final | 1, 2, 4 |
| 4 | none | 5, 6, final | 1, 2, 3 |
| 5 | 2, 3, 4 | 6, 8, 10, final | none |
| 6 | 3, 4, 5 | 10, final | 7 |
| 7 | 1, 2 | 8, 9, final | 6 |
| 8 | 1, 2, 5, 7 | 9, 10, final | none |
| 9 | 7, 8 | 10, final | none |
| 10 | 3, 5, 6, 8, 9 | final | none |

Critical path: live source proof -> eval/card contract -> deployed HTTPS -> PlayMCP private smoke -> review/public/submission gate.

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

- [x] 1. Align package/runtime metadata and release readiness status.
  What to do / Must NOT do: update `apps/family-experience-mcp/package.json` version to match runtime `0.1.0` or update runtime constants to match the chosen release version; update docs that mention status only if they become stale; do not change tool behavior.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 7, 8, final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/package.json`; `apps/family-experience-mcp/src/mcp.ts`; `apps/family-experience-mcp/src/health.ts`; `.omo/ulw-loop/family-status-20260703/FAMILY_EXPERIENCE_MILESTONE_STATUS.md`; `apps/family-experience-mcp/docs/QA_REPORT.md`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm test -- --run test/config.test.ts test/mcp.test.ts && npm run typecheck` exits 0, and a CLI check proves `package.json` version equals MCP/health reported version.
  QA scenarios (name the exact tool + invocation): happy CLI: `powershell -NoProfile -Command '& { $pkg=(Get-Content apps/family-experience-mcp/package.json -Raw | ConvertFrom-Json).version; $mcp=(Select-String -Path apps/family-experience-mcp/src/mcp.ts -Pattern "version: ""([^""]+)""").Matches[0].Groups[1].Value; if($pkg -ne $mcp){ throw "version mismatch $pkg vs $mcp" }; "version aligned: $pkg" | Set-Content .omo/evidence/winning-sdd/task-1-version-GREEN.txt }'`, Evidence `.omo/evidence/winning-sdd/task-1-version-GREEN.txt`; failure RED: `powershell -NoProfile -Command '& { $pkg=(Get-Content apps/family-experience-mcp/package.json -Raw | ConvertFrom-Json).version; $mcp=(Select-String -Path apps/family-experience-mcp/src/mcp.ts -Pattern "version: ""([^""]+)""").Matches[0].Groups[1].Value; if($pkg -eq $mcp){ throw "expected pre-fix mismatch but versions already match" }; "RED version mismatch: package=$pkg runtime=$mcp" | Set-Content .omo/evidence/winning-sdd/task-1-version-RED.txt }'`; binary pass: file contains `RED version mismatch`. Evidence `.omo/evidence/winning-sdd/task-1-version-RED.txt`.
  Commit: Y | `chore(family-experience): align mcp release metadata`

- [x] 2. Prove live Seoul Open Data with redaction-safe evidence.
  What to do / Must NOT do: add or extend a live-smoke script that uses `.env`/deployment env without printing raw `SEOUL_OPEN_DATA_KEY`; call the real Seoul Open Data endpoint through the existing adapter; capture happy, no-result, permission/key failure, and upstream/malformed failure behavior. If no key is available, record a BLOCKED criterion with key-missing diagnostics and do not fake live proof.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 5, 7, 8, 10, final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/src/sources/seoulCulture.ts`; `apps/family-experience-mcp/src/config.ts`; `apps/family-experience-mcp/docs/RUNBOOK.md`; `apps/family-experience-mcp/docs/QA_REPORT.md`; `.omo/ulw-research/20260703-151334-family-experience-winning-beyond-submission/SYNTHESIS.md`
  Acceptance criteria (agent-executable): with `SEOUL_OPEN_DATA_KEY` configured, `cd apps/family-experience-mcp && npm run smoke:live` exits 0, writes redacted JSON evidence, and `npm run scan:secrets` still exits 0. Without a key, the criterion is BLOCKED with redacted `missing` diagnostics only.
  QA scenarios (name the exact tool + invocation): happy HTTP/API: `powershell -NoProfile -Command '& { cd apps/family-experience-mcp; npm run smoke:live *> ../../.omo/evidence/winning-sdd/task-2-live-GREEN.txt; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }; npm run scan:secrets *> ../../.omo/evidence/winning-sdd/task-2-secret-scan.txt; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }; "cleanup=no runtime resources spawned" | Add-Content ../../.omo/evidence/winning-sdd/task-2-live-GREEN.txt }'`, Evidence `.omo/evidence/winning-sdd/task-2-live-GREEN.txt`; failure/key edge: `powershell -NoProfile -Command '& { $ErrorActionPreference="Stop"; cd apps/family-experience-mcp; Remove-Item Env:SEOUL_OPEN_DATA_KEY -ErrorAction SilentlyContinue; npm run smoke:live -- --expect-missing-key *> ../../.omo/evidence/winning-sdd/task-2-live-missing-key.txt; if($LASTEXITCODE -ne 0){ throw "smoke:live missing-key expectation failed" }; $txt=Get-Content ../../.omo/evidence/winning-sdd/task-2-live-missing-key.txt -Raw; if($txt -notmatch "missing_key|missing configuration|SEOUL_OPEN_DATA_KEY.*missing"){ throw "missing-key smoke did not prove missing-key path" }; if($txt -match "openapi.seoul.go.kr:8088/.+/.+/"){ throw "keyed URL leaked" }; "cleanup=no runtime resources spawned" | Add-Content ../../.omo/evidence/winning-sdd/task-2-live-missing-key.txt }'`, Evidence `.omo/evidence/winning-sdd/task-2-live-missing-key.txt`.
  Commit: Y | `test(family-experience): add live seoul smoke proof`

- [x] 3. Add a 20-prompt answer-quality evaluation harness.
  What to do / Must NOT do: add prompt fixtures and an eval script that calls the MCP surface or the closest existing smoke seam; score each prompt on source, freshness, age-fit basis, date/place, parent check, next action, no unsupported claim, and latency. Do not score by subjective vibe; do not rely on LLM self-judgment.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 5, 6, 10, final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/scripts/smoke-golden.ts`; `apps/family-experience-mcp/test/golden.test.ts`; `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md`; `.omo/ulw-research/20260703-151334-family-experience-winning-beyond-submission/SYNTHESIS.md`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm run eval:prompts -- --evidence-dir ../../.omo/evidence/winning-sdd/eval` exits 0; at least 20 prompts are evaluated; overall pass rate is at least 90%; zero unsupported-claim failures.
  QA scenarios (name the exact tool + invocation): happy CLI: `powershell -NoProfile -Command '& { cd apps/family-experience-mcp; npm run eval:prompts -- --evidence-dir ../../.omo/evidence/winning-sdd/eval *> ../../.omo/evidence/winning-sdd/task-3-eval-GREEN.txt; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }; "cleanup=no runtime resources spawned" | Add-Content ../../.omo/evidence/winning-sdd/task-3-eval-GREEN.txt }'`, Evidence `.omo/evidence/winning-sdd/task-3-eval-GREEN.txt`; failure CLI: `powershell -NoProfile -Command '& { $ErrorActionPreference="Stop"; $root=(Get-Location).Path; $tmp=Join-Path $root "apps/family-experience-mcp/test/fixtures/eval/adversarial-reservation-guarantee.tmp.json"; New-Item -ItemType Directory -Force -Path (Split-Path $tmp) | Out-Null; [ordered]@{ id="tmp-reservation-guarantee"; prompt="이번 주말 4살 예약 가능한 곳 보장해줘"; expectUnsupportedClaimFailure=$true } | ConvertTo-Json -Compress | Set-Content -LiteralPath $tmp -Encoding UTF8; Push-Location apps/family-experience-mcp; npm run eval:prompts -- --group adversarial *> ../../.omo/evidence/winning-sdd/task-3-eval-unsupported-claim-RED.txt; $code=$LASTEXITCODE; Pop-Location; Remove-Item -LiteralPath $tmp -Force; "cleanup: removed $tmp" | Set-Content .omo/evidence/winning-sdd/task-3-eval-unsupported-claim-cleanup.txt; if($code -eq 0){ throw "expected adversarial eval to fail before guard fix" } }'`, Evidence `.omo/evidence/winning-sdd/task-3-eval-unsupported-claim-RED.txt` and `.omo/evidence/winning-sdd/task-3-eval-unsupported-claim-cleanup.txt`.
  Commit: Y | `test(family-experience): add prompt quality evaluation`

- [x] 4. Lock the parent action-card response contract.
  What to do / Must NOT do: strengthen renderer/schema/tests so every returned candidate exposes or explicitly explains title, date/time, venue/address, source, retrieved/freshness, confidence, age-fit reason, parent check, and next action. Do not fabricate missing source fields; show `unknown`, `inferred`, or `confirmation_needed` where appropriate.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 5, 6, final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/src/pipeline/render.ts`; `apps/family-experience-mcp/src/schemas.ts`; `apps/family-experience-mcp/src/types.ts`; `apps/family-experience-mcp/test/pipeline.test.ts`; `apps/family-experience-mcp/docs/DECISIONS.md`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm test -- --run test/pipeline.test.ts test/golden.test.ts && npm run typecheck` exits 0; tests fail if a candidate lacks parent action fields or claims reservation/operation/child suitability without source support.
  QA scenarios (name the exact tool + invocation): happy CLI: `powershell -NoProfile -Command '& { cd apps/family-experience-mcp; npm test -- --run test/pipeline.test.ts test/golden.test.ts *> ../../.omo/evidence/winning-sdd/task-4-card-GREEN.txt; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }; "cleanup=no runtime resources spawned" | Add-Content ../../.omo/evidence/winning-sdd/task-4-card-GREEN.txt }'`, Evidence `.omo/evidence/winning-sdd/task-4-card-GREEN.txt`; failure RED after adding the characterization test but before implementation: `powershell -NoProfile -Command '& { cd apps/family-experience-mcp; npm test -- --run test/pipeline.test.ts -t "requires parent action fields and rejects unsupported reservation claim" *> ../../.omo/evidence/winning-sdd/task-4-card-RED.txt; if($LASTEXITCODE -eq 0){ throw "expected parent action-card contract test to fail before implementation" }; Select-String -Path ../../.omo/evidence/winning-sdd/task-4-card-RED.txt -Pattern "parent action fields|reservation" | Out-Null; "cleanup=no runtime resources spawned" | Add-Content ../../.omo/evidence/winning-sdd/task-4-card-RED.txt }'`, Evidence `.omo/evidence/winning-sdd/task-4-card-RED.txt`.
  Commit: Y | `feat(family-experience): harden parent action cards`

- [x] 5. Add loose Korean prompt parsing and clarification behavior.
  What to do / Must NOT do: support compact Korean prompts for age/date/location/condition extraction before structured tool input when the MCP/client surface allows it, or add a deterministic pre-parser used by smoke/eval scripts. If required fields remain missing, return one concise clarification question instead of fabricated candidates. Do not add an LLM dependency.
  Parallelization: Wave 2 | Blocked by: 2, 3, 4 | Blocks: 6, 8, 10, final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/src/mcp.ts`; `apps/family-experience-mcp/src/schemas.ts`; `apps/family-experience-mcp/scripts/smoke-golden.ts`; `apps/family-experience-mcp/test/mcp.test.ts`; `.omo/ulw-research/20260703-151334-family-experience-winning-beyond-submission/SYNTHESIS.md`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm test -- --run test/mcp.test.ts test/golden.test.ts && npm run eval:prompts -- --group loose-korean` exits 0; prompts for `4살`, `초등 저학년`, `이번 주말`, `오늘`, `비오는 날`, `무료`, `실내` are parsed or clarified deterministically.
  QA scenarios (name the exact tool + invocation): happy CLI/MCP: `powershell -NoProfile -Command '& { cd apps/family-experience-mcp; npm run eval:prompts -- --group loose-korean --evidence-dir ../../.omo/evidence/winning-sdd/eval-loose *> ../../.omo/evidence/winning-sdd/task-5-loose-GREEN.txt; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }; "cleanup=no runtime resources spawned" | Add-Content ../../.omo/evidence/winning-sdd/task-5-loose-GREEN.txt }'`, Evidence `.omo/evidence/winning-sdd/task-5-loose-GREEN.txt`; failure/clarification CLI: `powershell -NoProfile -Command '& { cd apps/family-experience-mcp; npm run eval:prompts -- --prompt "이번 주말 아이랑 갈 곳" --expect-clarification --evidence-dir ../../.omo/evidence/winning-sdd/eval-clarification *> ../../.omo/evidence/winning-sdd/task-5-clarification-GREEN.txt; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }; Select-String -Path ../../.omo/evidence/winning-sdd/task-5-clarification-GREEN.txt -Pattern "clarification|아이 나이|child_age|child_stage" | Out-Null; "cleanup=no runtime resources spawned" | Add-Content ../../.omo/evidence/winning-sdd/task-5-clarification-GREEN.txt }'`, Evidence `.omo/evidence/winning-sdd/task-5-clarification-GREEN.txt`.
  Commit: Y | `feat(family-experience): parse loose korean family prompts`

- [x] 6. Improve parent-practicality ranking without safety overclaim.
  What to do / Must NOT do: rank by date overlap, location relevance, age-stage fit, indoor/outdoor or rainy-day condition, fee, reservation/contact presence, source confidence, and parent practicality. Name it `fit_reason` or `parent_practicality`, never `safety score`.
  Parallelization: Wave 2 | Blocked by: 3, 4, 5 | Blocks: 10, final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/src/pipeline/rank.ts`; `apps/family-experience-mcp/src/pipeline/render.ts`; `apps/family-experience-mcp/test/pipeline.test.ts`; `apps/family-experience-mcp/docs/DECISIONS.md`
  Acceptance criteria (agent-executable): `cd apps/family-experience-mcp && npm test -- --run test/pipeline.test.ts && npm run eval:prompts -- --group ranking` exits 0; rainy-day/indoor/free/age-stage cases rank expected candidates first; no output contains `안전 점수`, `보장`, or equivalent guarantee language.
  QA scenarios (name the exact tool + invocation): happy CLI: `powershell -NoProfile -Command '& { cd apps/family-experience-mcp; npm test -- --run test/pipeline.test.ts *> ../../.omo/evidence/winning-sdd/task-6-ranking-GREEN.txt; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }; npm run scan:claims *> ../../.omo/evidence/winning-sdd/task-6-claims-scan.txt; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }; "cleanup=no runtime resources spawned" | Add-Content ../../.omo/evidence/winning-sdd/task-6-ranking-GREEN.txt }'`, Evidence `.omo/evidence/winning-sdd/task-6-ranking-GREEN.txt`; failure RED after adding adversarial ranking fixture/test but before implementation: `powershell -NoProfile -Command '& { cd apps/family-experience-mcp; npm test -- --run test/pipeline.test.ts -t "does not outrank dated candidate with undated age-fit-only candidate" *> ../../.omo/evidence/winning-sdd/task-6-ranking-RED.txt; if($LASTEXITCODE -eq 0){ throw "expected adversarial ranking test to fail before implementation" }; Select-String -Path ../../.omo/evidence/winning-sdd/task-6-ranking-RED.txt -Pattern "dated candidate|undated|ranking" | Out-Null; "cleanup=no runtime resources spawned" | Add-Content ../../.omo/evidence/winning-sdd/task-6-ranking-RED.txt }'`, Evidence `.omo/evidence/winning-sdd/task-6-ranking-RED.txt`.
  Commit: Y | `feat(family-experience): rank by parent practicality`

- [x] 7. Package public HTTPS deployment with secret-safe operations.
  What to do / Must NOT do: add deployment files or runbook updates required for Kakao Cloud or accepted fallback: Dockerfile/build command, external bind behavior, health probes, env/secret mapping, rollback notes. Keep secrets out of files and logs. Do not actually claim Kakao Cloud deployment unless URL proof exists.
  Parallelization: Wave 3 | Blocked by: 1, 2 | Blocks: 8, 9, final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/src/server.ts`; `apps/family-experience-mcp/docs/RUNBOOK.md`; `apps/family-experience-mcp/.env.example`; KakaoCloud MCP tutorial `https://docs.kakaocloud.com/en/tutorial/container/k8s-engine-mcp`
  Acceptance criteria (agent-executable): container/build config exists and `cd apps/family-experience-mcp && npm run verify && npm run scan:secrets` exits 0; local container or hosted process responds on `/health` and `/mcp`; deployment docs name secret-manager mapping.
  QA scenarios (name the exact tool + invocation): happy HTTP: `powershell -NoProfile -Command '& { $ErrorActionPreference="Stop"; cd apps/family-experience-mcp; $env:FAMILY_EXPERIENCE_ALLOW_FIXTURE="true"; $env:PORT="3349"; $p=Start-Process -FilePath node -ArgumentList "--env-file-if-exists=.env --import tsx src/server.ts" -WindowStyle Hidden -PassThru; $p.Id | Set-Content ../../.omo/evidence/winning-sdd/task-7-server-pid.txt; try { Start-Sleep 3; $status=curl.exe -sS -o ../../.omo/evidence/winning-sdd/task-7-health.json -D ../../.omo/evidence/winning-sdd/task-7-health.headers -w "%{http_code}" http://127.0.0.1:3349/health; if($status -ne "200"){ throw "health status $status" }; Select-String -Path ../../.omo/evidence/winning-sdd/task-7-health.json -Pattern "family-experience-mcp" | Out-Null; npm run smoke:mcp -- --base-url http://127.0.0.1:3349 --assert-tool-count=1 *> ../../.omo/evidence/winning-sdd/task-7-mcp-smoke.txt; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE } } finally { Stop-Process -Id $p.Id -ErrorAction SilentlyContinue; Start-Sleep 1; Get-NetTCPConnection -LocalPort 3349 -State Listen -ErrorAction SilentlyContinue | Out-File ../../.omo/evidence/winning-sdd/task-7-listener-after-cleanup.txt; "cleanup: stopped pid=$($p.Id); port3349_listeners_recorded" | Add-Content ../../.omo/evidence/winning-sdd/task-7-mcp-smoke.txt } }'`, Evidence `.omo/evidence/winning-sdd/task-7-health.json` and `.omo/evidence/winning-sdd/task-7-mcp-smoke.txt`; failure HTTP: `powershell -NoProfile -Command '& { $ErrorActionPreference="Stop"; cd apps/family-experience-mcp; $env:FAMILY_EXPERIENCE_ALLOW_FIXTURE="false"; Remove-Item Env:SEOUL_OPEN_DATA_KEY -ErrorAction SilentlyContinue; $env:PORT="3350"; $p=Start-Process -FilePath node -ArgumentList "--env-file-if-exists=.env --import tsx src/server.ts" -WindowStyle Hidden -PassThru; try { Start-Sleep 3; npm run smoke:mcp -- --base-url http://127.0.0.1:3350 --expect-error *> ../../.omo/evidence/winning-sdd/task-7-live-missing-key.http; $txt=Get-Content ../../.omo/evidence/winning-sdd/task-7-live-missing-key.http -Raw; if($txt -notmatch "missing_configuration|missing key|fixture mode"){ throw "missing-key safe failure not proven" }; if($txt -match "openapi.seoul.go.kr:8088/.+/.+/"){ throw "keyed URL leaked" } } finally { Stop-Process -Id $p.Id -ErrorAction SilentlyContinue; Start-Sleep 1; Get-NetTCPConnection -LocalPort 3350 -State Listen -ErrorAction SilentlyContinue | Out-File ../../.omo/evidence/winning-sdd/task-7-missing-key-listener-after-cleanup.txt; "cleanup: stopped pid=$($p.Id); port3350_listeners_recorded" | Add-Content ../../.omo/evidence/winning-sdd/task-7-live-missing-key.http } }'`, Evidence `.omo/evidence/winning-sdd/task-7-live-missing-key.http` and `.omo/evidence/winning-sdd/task-7-missing-key-listener-after-cleanup.txt`.
  Commit: Y | `build(family-experience): prepare secret-safe deployment`

- [x] 8. Run deployed HTTPS smoke and reliability envelope.
  What to do / Must NOT do: once a public HTTPS URL exists, run health, initialize/list tools, tool call, timeout/upstream failure, and restart/readiness smoke. If no URL exists, record BLOCKED with the exact missing endpoint and stop before PlayMCP review. Do not use local-only proof as deployed proof.
  Parallelization: Wave 3 | Blocked by: 1, 2, 5, 7 | Blocks: 9, 10, final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/docs/RUNBOOK.md`; `apps/family-experience-mcp/scripts/smoke-mcp.ts`; `.omo/ulw-loop/family-status-20260703/FAMILY_EXPERIENCE_MILESTONE_STATUS.md`; Kakao official contest page `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10`
  Acceptance criteria (agent-executable): `FAMILY_EXPERIENCE_PUBLIC_BASE_URL` is set to an HTTPS URL; `curl -i $URL/health` returns 200; MCP initialize/tools/call smoke returns exactly one public tool; evidence contains no secrets; restart/readiness or second-run proof passes.
  QA scenarios (name the exact tool + invocation): happy HTTP: `powershell -NoProfile -Command '& { $ErrorActionPreference="Stop"; $base=$env:FAMILY_EXPERIENCE_PUBLIC_BASE_URL; if(-not $base -or -not $base.StartsWith("https://")){ throw "missing https FAMILY_EXPERIENCE_PUBLIC_BASE_URL" }; $status=curl.exe -sS -o .omo/evidence/winning-sdd/task-8-deployed-health.json -D .omo/evidence/winning-sdd/task-8-deployed-health.headers -w "%{http_code}" "$base/health"; if($status -ne "200"){ throw "deployed health status $status" }; Select-String -Path .omo/evidence/winning-sdd/task-8-deployed-health.json -Pattern "family-experience-mcp" | Out-Null; cd apps/family-experience-mcp; npm run smoke:mcp -- --base-url $base --assert-tool-count=1 *> ../../.omo/evidence/winning-sdd/task-8-deployed-mcp.txt; if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }; "cleanup=no runtime resources spawned" | Add-Content ../../.omo/evidence/winning-sdd/task-8-deployed-mcp.txt }'`, Evidence `.omo/evidence/winning-sdd/task-8-deployed-health.json` and `.omo/evidence/winning-sdd/task-8-deployed-mcp.txt`; failure: `powershell -NoProfile -Command '& { Remove-Item Env:FAMILY_EXPERIENCE_PUBLIC_BASE_URL -ErrorAction SilentlyContinue; if($env:FAMILY_EXPERIENCE_PUBLIC_BASE_URL){ throw "env unexpectedly set" }; "BLOCKED: missing https FAMILY_EXPERIENCE_PUBLIC_BASE_URL; cleanup=no runtime resources spawned" | Set-Content .omo/evidence/winning-sdd/task-8-missing-public-url.txt }'`, Evidence `.omo/evidence/winning-sdd/task-8-missing-public-url.txt`.
  Commit: N | deployment evidence may be environment-specific; commit only deploy config/docs, not endpoint secrets.

- [x] 9. Prepare and smoke PlayMCP private registration before review.
  What to do / Must NOT do: update PlayMCP temp/private registration docs and copy, then use authenticated browser/Chrome automation to register the deployed `/mcp` endpoint as temporary/private, run tool discovery and starter prompt smoke. If authentication is unavailable, record BLOCKED; do not instruct a human to click and then claim pass.
  Parallelization: Wave 4 | Blocked by: 7, 8 | Blocks: 10, final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md`; `apps/family-experience-mcp/docs/SUBMISSION_COPY_DRAFT.md`; Kakao official contest page `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10`; PlayMCP console `https://playmcp.kakao.com/?page=0`
  Acceptance criteria (agent-executable): PlayMCP private/temp entry exists for `아이랑 어디가`, endpoint ends `/mcp`, tool discovery finds exactly `find_family_experiences`, three starter prompts work or safe-fail, screenshots/transcripts are captured, and no final review/public switch/submission is claimed before evidence.
  QA scenarios (name the exact tool + invocation): preflight CLI: `powershell -NoProfile -Command '& { $base=$env:FAMILY_EXPERIENCE_PUBLIC_BASE_URL; if(-not $base -or -not $base.StartsWith("https://")){ "BLOCKED: missing https FAMILY_EXPERIENCE_PUBLIC_BASE_URL; cleanup=no runtime resources spawned" | Set-Content .omo/evidence/winning-sdd/task-9-playmcp-auth-blocked.txt; exit 2 } }'`; browser/Chrome tool invocation after preflight passes: use `browser:control-in-app-browser` or `chrome:control-chrome` with this exact action script: open `https://playmcp.kakao.com/?page=0`; if selectors matching `text=/로그인|login/i` or URL containing `login` appear, screenshot `.omo/evidence/winning-sdd/task-9-playmcp-auth-blocked.png`, write `BLOCKED: unauthenticated PlayMCP console; screenshot=.omo/evidence/winning-sdd/task-9-playmcp-auth-blocked.png; cleanup=browser_context_closed` to `.omo/evidence/winning-sdd/task-9-playmcp-auth-blocked.txt`, close the browser context, and stop; otherwise click first visible button/link matching `role=button|link` and name `/등록|추가|새 MCP|서버 추가|Create|Register/i`; fill fields matching label/name `/이름|Name/i` with `아이랑 어디가`, `/식별자|ID|Slug/i` with `familyexp`, and `/Endpoint|URL|MCP/i` with `$FAMILY_EXPERIENCE_PUBLIC_BASE_URL/mcp`; save using button `/저장|Save|등록|Register/i`; open the private test/chat surface; send `이번 주말 4살 실내 체험 찾아줘`; capture screenshot/action log to `.omo/evidence/winning-sdd/task-9-playmcp-private-smoke/`; close the browser context. Binary pass: metadata explicitly records `mode=private_or_temporary`, `endpoint_ends_with_mcp=true`, `tool_count=1`, `starter_prompt_result=tool_response_or_safe_failure`, `secret_leak=false`, `cleanup=browser_context_closed`. Evidence `.omo/evidence/winning-sdd/task-9-playmcp-private-smoke/metadata.md`; failure/auth Evidence `.omo/evidence/winning-sdd/task-9-playmcp-auth-blocked.txt`.
  Commit: Y | `docs(family-experience): finalize playmcp private registration pack`

- [x] 10. Final submission, public demo, and Kakao Tools readiness package.
  What to do / Must NOT do: after private smoke passes, prepare representative image with rights ledger, final review request checklist, public visibility switch checklist, one-time preliminary submission receipt checklist, public demo pack, and Kakao Tools/widget-readiness schema notes. Do not submit twice. Do not claim finalist-only widget completion before spec access.
  Parallelization: Wave 4 | Blocked by: 3, 5, 6, 8, 9 | Blocks: final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/docs/SUBMISSION_COPY_DRAFT.md`; `apps/family-experience-mcp/docs/RUNBOOK.md`; `.omo/ulw-research/20260703-151334-family-experience-winning-beyond-submission/SYNTHESIS.md`; Kakao official contest page `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10`
  Acceptance criteria (agent-executable): rights-cleared image artifact exists; demo script and screenshots/transcripts exist; review request evidence exists or BLOCKED; public switch evidence exists or BLOCKED; one-time submission receipt exists or BLOCKED; Kakao Tools readiness doc maps current card fields to future widget fields.
  QA scenarios (name the exact tool + invocation): precondition CLI: `powershell -NoProfile -Command '& { $m=".omo/evidence/winning-sdd/task-9-playmcp-private-smoke/metadata.md"; if(-not (Test-Path $m)){ "BLOCKED: private smoke evidence missing; cleanup=no runtime resources spawned" | Set-Content .omo/evidence/winning-sdd/task-10-submission-gate.md; exit 2 }; $txt=Get-Content $m -Raw; if($txt -notmatch "tool_count=1" -or $txt -notmatch "secret_leak=false" -or $txt -notmatch "cleanup=browser_context_closed"){ "BLOCKED: private smoke metadata incomplete; cleanup=no runtime resources spawned" | Set-Content .omo/evidence/winning-sdd/task-10-submission-gate.md; exit 2 } }'`; browser/Chrome final gate invocation after precondition passes: use `browser:control-in-app-browser` or `chrome:control-chrome` with this exact action script: open the PlayMCP entry URL recorded in `.omo/evidence/winning-sdd/task-9-playmcp-private-smoke/metadata.md`; click first visible button matching `/심사 요청|Review request|Submit for review/i` at most once and capture screenshot/action log under `.omo/evidence/winning-sdd/task-10-review-request/`; if status text does not match `/승인|Approved/i`, capture `.omo/evidence/winning-sdd/task-10-review-not-approved.png`, write `BLOCKED: review not approved yet; screenshot=.omo/evidence/winning-sdd/task-10-review-not-approved.png; cleanup=browser_context_closed` to `.omo/evidence/winning-sdd/task-10-submission-gate.md`, close the browser context, and stop. Only after approved status is observed, switch visibility using control matching `/전체 공개|Public/i`, capture `.omo/evidence/winning-sdd/task-10-public-switch/`, open the AGENTIC PLAYER 10 preliminary submission URL from `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10`, submit once, capture `.omo/evidence/winning-sdd/task-10-prelim-submission/`, close the browser context, and write `review_status=approved`, `visibility=전체 공개`, `submission_receipt=present`, `secret_leak=false`, `cleanup=browser_context_closed` to `.omo/evidence/winning-sdd/task-10-submission-gate.md`. Evidence `.omo/evidence/winning-sdd/task-10-submission-gate.md`.
  Commit: Y | `docs(family-experience): prepare final submission and tools readiness`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.

- [x] F1. Plan compliance audit: verify every todo has references, acceptance criteria, happy/failure QA scenario, evidence path, commit line, and named blockers.
- [x] F2. Code quality review: run `cd apps/family-experience-mcp && npm run verify && npm run scan:secrets && npm run scan:claims && npm run scan:sources`; review changed files for no `as any`, no skipped tests, no unsupported source expansion, no secret leakage.
- [x] F3. Real manual QA: run local HTTP smoke, deployed HTTPS smoke if URL exists, PlayMCP private smoke if authenticated; every artifact must exist and include cleanup receipts.
- [x] F4. Scope fidelity: prove this execution introduced no new sibling-workspace changes by comparing before/after scoped status for `D:\KLab\workspace\2026-휴일약국` and `D:\KLab\workspace\2026-06-07-harness`; separately prove no extra public tools added, no nationwide/live/reservation/operation/child-suitability overclaim, and no public submission claim without evidence.

## Commit strategy
- Do not commit merely because this plan exists unless the user explicitly asks for commits in the execution run.
- During execution, commit each verified work unit atomically after its tests and manual QA pass.
- Use Conventional Commit style observed in repo or default to:
  - `chore(family-experience): align mcp release metadata`
  - `test(family-experience): add live seoul smoke proof`
  - `test(family-experience): add prompt quality evaluation`
  - `feat(family-experience): harden parent action cards`
  - `feat(family-experience): parse loose korean family prompts`
  - `feat(family-experience): rank by parent practicality`
  - `build(family-experience): prepare secret-safe deployment`
  - `docs(family-experience): finalize playmcp private registration pack`
  - `docs(family-experience): prepare final submission and tools readiness`
- Never stage unrelated dirty-worktree files.
- Do not push unless the user explicitly asks.

## Success criteria
- The core MCP remains one-tool and stable.
- Runtime/package metadata are aligned.
- Live Seoul Open Data is either proven with redacted evidence or explicitly blocked without fake success.
- 20-prompt eval passes threshold with zero unsupported claims.
- Parent action-card contract is enforced by tests and smoke output.
- Deployment path has public HTTPS proof or a recorded blocker.
- PlayMCP private smoke, review/public/submission gates are evidence-backed and never inferred.
- Representative image/demo/finalist readiness are prepared without rights or false-information risk.
- Final verification wave approves plan compliance, code quality, manual QA, and scope fidelity.
