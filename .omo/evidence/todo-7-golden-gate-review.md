# Todo 7 Golden Gate Review

## recommendation

REJECT

## originalIntent

Todo 7 of `.omo/plans/family-experience-mcp-first-build.md` is meant to add a golden prompt smoke runner and generated evidence for four parent-facing behaviors through the local MCP HTTP surface, without live network or a real Seoul API key. The happy response should be materially useful as a short Korean action card: Top 3, why these fit, source/freshness, parent check, and next action. Error/failure scenarios must be safe, Korean, non-fabricating, and reproducible.

## desiredOutcome

- `npm run typecheck`, focused MCP/pipeline tests, and `npm run verify` pass.
- The plan-style local server smoke starts on `127.0.0.1:3345`, returns exact `/health` HTTP 200, runs `smoke:golden`, writes four non-empty parseable JSON artifacts, and leaves no listener on `3345` or auxiliary `3346`.
- Golden JSON is user-useful and safe:
  - happy: fixture mode, exactly three candidates, and each candidate/action card exposes source, freshness, age fit, parent check, and next action without unsupported live/current/reservation claims.
  - missing-age: Korean parent-facing clarification before ranking, no fabricated candidates.
  - no-result: no fabricated candidates and suggests relaxing one constraint.
  - source-failure: `isError: true`, no candidates, safe Korean message, no raw secret/keyed URL.
- Todo 7 support artifacts include manual QA plus implementation/code-review coverage that explicitly applies `programming` and `remove-ai-slops` criteria.

## userOutcomeReview

The reproducibility surface is mostly working, but the shipped golden outputs are not materially useful enough for the parent-facing outcome. The happy artifact returns three candidates but only a terse title list in text and structured candidates that omit the requested action-card fields. The missing-age artifact is an English MCP SDK validation string, not concise Korean guidance for a parent. The no-result artifact avoids fabrication but does not suggest relaxing a specific constraint. These are product-facing blockers, not formatting issues.

## blockers

1. Happy golden output is missing required user-facing/action-card fields.
   - Evidence: `.omo/evidence/golden-family-experience-happy.json` has `mode: "fixture"` and three candidates, but each candidate lacks `freshness`, `age_fit`, `parent_check`, and `next_action`.
   - Direct semantic probe result: `FAIL happy_candidate_1_action_card_fields: missing=freshness,age_fit,parent_check,next_action` repeated for all three candidates.
   - Source cause observed: `apps/family-experience-mcp/src/pipeline/render.ts` creates `age_fit_label`, `age_fit_reason`, and related fields, but `apps/family-experience-mcp/src/mcp.ts` maps candidates into a narrower schema that drops them; `apps/family-experience-mcp/src/schemas.ts` does not model the required action-card fields.

2. Missing-age golden output is not acceptable Korean parent-facing guidance.
   - Evidence: `.omo/evidence/golden-family-experience-missing-age.json` text is `Input validation error: Invalid arguments for tool find_family_experiences: child_age: Provide exactly one of child_age or child_stage.`
   - This is an SDK validation message, not the Korean renderer or a concise Korean clarification.
   - Direct semantic probe result: `FAIL missing_age_korean_parent_actionable`.

3. No-result golden output does not suggest relaxing one constraint.
   - Evidence: `.omo/evidence/golden-family-experience-no-result.json` text says only that no grounded candidate was found and candidates were not fabricated.
   - Direct semantic probe result: `FAIL no_result_relax_one_constraint`.

4. Todo 7 implementation support artifacts are missing.
   - `find .omo/evidence ... '*task-7*review*' '*task-7*notepad*' '*task-7*diff*'` found no Task 7 implementation review, notepad, or diff summary artifact.
   - `rg` over Task 7/golden evidence found no `programming` or `remove-ai-slops` review coverage, no overfit/slop criterion coverage, and no executor-side support report.
   - This fails the final-gate requirement that report coverage explicitly shows the same skill-perspective check; my direct pass cannot substitute for absent executor coverage.

5. Planned Todo 7 artifacts are absent.
   - `apps/family-experience-mcp/test/golden.test.ts`: missing.
   - `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md`: missing.
   - The current `npm run verify` therefore does not lock golden behavior in the test suite; the only golden check is the smoke script.

6. `smoke-golden.ts` is overfit/too weak for the user-visible contract.
   - Missing-age check accepts `/child_age|child_stage|아이 나이|발달 단계|나이/`, so the English SDK error passes.
   - No-result check accepts the broad token `조건`, so it passes without an actual "relax one constraint" suggestion.
   - Happy check validates fixture mode, count, source URL, and forbidden claims, but not why-fit, age-fit, parent check, or next action.

## warnings

- `apps/family-experience-mcp/scripts/smoke-golden.ts` is 247 pure LOC. This is under the 250 hard cap but in the warning band; it is still a single-purpose golden smoke runner.
- The repository/app tree is broadly untracked, so git diff provenance is unavailable. I used direct file and artifact inspection instead.
- Historical worker evidence includes a transient listener cleanup artifact (`task-7-cleanup-listening-before-taskkill.txt`), but my independent rerun left no listeners on `3345` or `3346`.

## positiveEvidence

- `cd apps/family-experience-mcp && npm run typecheck`: PASS.
- `cd apps/family-experience-mcp && npm test -- --run test/mcp.test.ts test/pipeline.test.ts`: PASS, 2 files / 9 tests.
- `cd apps/family-experience-mcp && npm run verify`: PASS, 7 files / 26 tests.
- Plan-style server smoke from repo root:
  - preflight `3345`: `NO_LISTENER:3345`.
  - server PID captured: `949`.
  - `/health`: exact `200`.
  - `EVIDENCE_DIR="$REPO_ROOT/.omo/evidence" FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:golden`: PASS.
  - four JSON artifacts non-empty and parseable.
  - cleanup: `NO_LISTENER:3345` and `NO_LISTENER:3346`.
- Refined forbidden-pattern scan over `apps/family-experience-mcp/src`, `scripts`, `test`, and `package.json`: no `as any`, `@ts-ignore`, `@ts-expect-error`, `.skip(`, or `.only(`.
- Generated golden JSON/evidence scan: no raw secrets/keyed URLs and no unsupported claim hits for `전국 모든 행사`, `전국 전체`, `예약 가능`, `운영 중`, `실시간`, or `아이에게 적합함`.
- Public tool/action scan: one public tool path for `find_family_experiences`; no final PlayMCP review/submission action found in app source/scripts/tests.

## checkedArtifactPaths

- `.omo/evidence/task-7-source-failure-RED.txt`
- `.omo/evidence/task-7-golden-GREEN.txt`
- `.omo/evidence/golden-family-experience-happy.json`
- `.omo/evidence/golden-family-experience-missing-age.json`
- `.omo/evidence/golden-family-experience-no-result.json`
- `.omo/evidence/golden-family-experience-source-failure.json`
- `.omo/evidence/task-7-preflight-listening.txt`
- `.omo/evidence/task-7-cleanup-listening.txt`
- `.omo/evidence/task-7-golden-manual-qa.md`
- `.omo/evidence/task-7-cleanup-listening-before-taskkill.txt`
- `.omo/evidence/task-7-cleanup-taskkill.txt`
- `.omo/evidence/task-7-cleanup-orphan-after.txt`
- `.omo/evidence/task-7-server.log`
- `.omo/evidence/todo-7-gate-dev-http.log`
- `.omo/plans/family-experience-mcp-first-build.md`
- `.omo/start-work/ledger.jsonl`

## checkedSourcePaths

- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/scripts/smoke-golden.ts`
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/src/server.ts`
- `apps/family-experience-mcp/src/schemas.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/src/types.ts`
- `apps/family-experience-mcp/test/mcp.test.ts`
- `apps/family-experience-mcp/test/pipeline.test.ts`

## commands

- `npm run typecheck`
- `npm test -- --run test/mcp.test.ts test/pipeline.test.ts`
- `npm run verify`
- Plan-style Git Bash server smoke with local fixture env, exact `/health` 200, `npm run smoke:golden`, parseability checks, and cleanup assertions for `3345` and `3346`.
- `node --input-type=module` semantic validator over the four golden JSON artifacts.
- `awk '!/^[[:space:]]*$/ && !/^[[:space:]]*\/\//' apps/family-experience-mcp/scripts/smoke-golden.ts | wc -l`
- `rg -n "as any|@ts-ignore|@ts-expect-error|\.skip\(|\.only\(" apps/family-experience-mcp/src apps/family-experience-mcp/scripts apps/family-experience-mcp/test apps/family-experience-mcp/package.json`
- `rg -n "전국 모든 행사|전국 전체|예약 가능|운영 중|실시간|아이에게 적합함|[?&](KEY|key)=|SEOUL_OPEN_DATA_KEY" .omo/evidence/golden-family-experience-*.json .omo/evidence/task-7-golden-GREEN.txt .omo/evidence/task-7-golden-manual-qa.md`
- `find .omo/evidence -maxdepth 1 -type f ... '*task-7*review*' '*task-7*notepad*' '*task-7*diff*'`
- `test -f apps/family-experience-mcp/test/golden.test.ts`; `test -f apps/family-experience-mcp/docs/GOLDEN_RESULTS.md`

## removeAiSlopsAndProgrammingPass

Direct pass result: FAIL. The production and smoke code compile, but the golden smoke checks are under-specified and overfit to weak outputs. The tests do not appear deletion-only or excessive, but they give false confidence because they do not assert the actual user-facing action-card contract through the MCP surface. `programming` TypeScript escape hatches were not found, and the smoke file is under the hard LOC cap. Executor report coverage result: FAIL because no Task 7 implementation/code-review report with `programming` plus `remove-ai-slops` criterion coverage exists.

## residualRisks

- No live Seoul API was used, per constraint; live adapter behavior is out of scope for this gate.
- Because the app and evidence are untracked, I cannot prove changed-file provenance from git alone.
- Golden behavior is currently smoke-script-only; absent `test/golden.test.ts` means future `npm run verify` can stay green while golden UX regresses.
