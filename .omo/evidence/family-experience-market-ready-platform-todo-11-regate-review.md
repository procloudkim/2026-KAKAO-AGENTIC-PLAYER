# Todo 11 Re-Gate Review: Parent-Facing Prompt Evaluation

recommendation: APPROVE
finalVerdict: confirmed

## blockers

None blocking.

## originalIntent

Todo 11 was intended to make `find_family_experiences` prompt evaluation market-ready for parent-facing scenarios. The user expected the existing 42 nationwide prompt fixtures to remain passing, at least 10 market scenarios to be covered, prompt text path behavior to be evaluated instead of only structured request objects, unsupported public claims to be checked in output text, and no-result/no-fabrication behavior to be proven through the public prompt path.

## desiredOutcome

- Plan Todo 11 can remain checked only if evidence confirms the task under start-work/Sisyphus rules.
- `eval:nationwide-prompts` has a current receipt with 42/42 passing and `market_scenarios.status=pass`.
- `smoke-mcp.ts` accepts both `--prompt=value` and `--prompt value`.
- An impossible prompt does not fall back to the default prompt and returns `result_ok=false`, `candidate_count=0`.
- Current `verify`, `scan:claims`, `scan:sources`, and `scan:secrets` pass.
- Code review explicitly covers `omo:programming` and `omo:remove-ai-slops` / overfit criteria.
- Manual QA matrix, notepad, stale-evidence supersession, and smoke parser red/green evidence exist and are substantive.

## userOutcomeReview

Confirmed. The shipped artifact now satisfies the user-visible Todo 11 outcome: market prompt evaluation remains deterministic, covers the public loose prompt path, includes unsupported-claim/no-result/prompt-injection scenarios, and the prior `--prompt "..."` parser failure is repaired.

The executor-created completion state can stand after this independent re-gate. The earlier ledger `adversarial-verify` entry for Todo 11 was self-authored by `agent_id=codex-main`, so it was not sufficient by itself. This review independently inspected the plan, ledger, code, tests, receipts, generated summaries, and adversarial classes, and found no blocking evidence gap.

## directVerification

- Plan state: `.omo/plans/family-experience-market-ready-platform.md` line 208 is checked for Todo 11.
- Ledger state: `.omo/start-work/ledger.jsonl` includes Todo 11 `done-claim-received`, `adversarial-verify` with `verdict=confirmed`, and `task-completed` events.
- Fresh rerun in this review: `npm --prefix apps/family-experience-mcp run verify` passed with 21 test files and 150 tests.
- Fresh reruns in this review: `scan:claims`, `scan:sources`, and `scan:secrets` passed with 143, 110, and 162 scanned files.
- Read-safe smoke probes in this review:
  - `--prompt "2099년 남극에서 1살 아이와 갈 수 있는 행사" --expect-error` returned the supplied prompt, `result_ok=false`, `candidate_count=0`.
  - `--prompt="2099년 남극에서 1살 아이와 갈 수 있는 행사" --expect-error` returned the supplied prompt, `result_ok=false`, `candidate_count=0`.
- Existing current eval receipt: `task-11-eval-nationwide-prompts-fix.txt` records `prompt_count=42`, `passed_count=42`, `market_scenarios.status=pass`, `unsupported_claim_failures=0`, and `prompt_path.accepted_count=42`.
- Existing exact no-fabrication receipt: `task-11-no-fabrication-plan-command.txt` records supplied prompt, `result_ok=false`, `candidate_count=0`, `failure_code=missing_configuration`.

## programmingAndSlopReview

Loaded and applied `omo:programming` plus `omo:remove-ai-slops` criteria directly.

Direct pass result:
- No deletion-only test, tautological test, or implementation-mirroring test found.
- The added `test/smokeMcp.test.ts` drives the real CLI as a child process and asserts observable stdout fields, not internal parser implementation.
- No `any`, `@ts-ignore`, `@ts-expect-error`, non-null assertion, `as any`, or `as unknown` matched in the reviewed Task 11 files.
- Boundary parsing is present: smoke CLI arguments parse through `ArgumentsSchema`; evaluator fixture inputs parse through Zod schemas; MCP outputs parse through `FindFamilyExperiencesStructuredContentSchema`.
- LOC is below the 250 pure-LOC hard ceiling. Warning-band files remain: `eval-prompts.ts` 245, `eval-prompt-checks.ts` 223, `eval-market-metrics.ts` 226. The smoke split leaves `smoke-mcp.ts` at 179 and `smoke-mcp-fixtures.ts` at 87.
- The code-quality report explicitly covers both skill perspectives and overfit/slop criteria, satisfying the required report-coverage gate.

## adversarialClasses

- stale_state: PASS. Prior reject and stale failed artifacts are superseded by `task-11-stale-evidence-supersession.md` and current `task-11-*-fix.txt` receipts.
- dirty_worktree: PASS_WITH_CAUTION. Relevant files are untracked in this workspace, but direct file inspection, fresh command reruns, and scoped artifact checks support the outcome.
- misleading_success_output: PASS. Parser red/green evidence and read-safe smoke probes show the supplied prompt is used instead of the default prompt.
- untrusted external text / prompt injection: PASS. Fixtures include prompt-injection and unsupported-claim prompts; result rows show no failed checks and no `ADMIN_OK` collapse.
- flaky_tests: PASS. Current full verify passed; focused smoke parser green receipt exists.
- generated/cached artifacts: PASS_WITH_CAUTION. Eval summary/results are generated artifacts, but current receipt, summary counts, and selected result rows agree. The exact smoke evidence command writes/seeds `apps/family-experience-mcp/data/family-experience-cache`; this is consistent with the current plan smoke surface but should not be mistaken for live provider coverage.
- cleanup: PASS. No `.omo/tmp/market-plan` directory remains and read-safe smoke temp directories were removed. No long-lived server was started by this review.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/start-work/ledger.jsonl`
- `.omo/evidence/family-experience-market-ready-platform-todo-11-gate-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-manual-qa-matrix.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-notepad.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-stale-evidence-supersession.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-smoke-parser-RED.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-11-smoke-parser-GREEN.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-11-eval-nationwide-prompts-fix.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-11-market-prompt-eval/summary.json`
- `.omo/evidence/family-experience-market-ready-platform/task-11-market-prompt-eval/results.json`
- `.omo/evidence/family-experience-market-ready-platform/task-11-no-fabrication-plan-command.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-11-verify-fix.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-11-scan-claims-fix.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-11-scan-sources-fix.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-11-scan-secrets-fix.txt`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/tsconfig.json`
- `apps/family-experience-mcp/scripts/eval-prompts.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-checks.ts`
- `apps/family-experience-mcp/scripts/eval-market-metrics.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-cli.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-coverage.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-no-result.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-request-checks.ts`
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`
- `apps/family-experience-mcp/scripts/smoke-mcp-fixtures.ts`
- `apps/family-experience-mcp/test/smokeMcp.test.ts`
- `apps/family-experience-mcp/test/fixtures/eval-nationwide/prompts.json`
- `apps/family-experience-mcp/data/family-experience-cache/metadata.json`

## exactEvidenceGaps

No blocking gaps.

Non-blocking caveats:
- The plan's failure QA line still omits `--expect-error`. Without that flag, `smoke:mcp` correctly exits nonzero on the impossible prompt and does not emit the JSON report. The repaired evidence command includes `--expect-error`, which is the correct way to capture `result_ok=false` and `candidate_count=0` for a negative smoke. This should be cleaned in a future plan hygiene pass, but it does not invalidate the repaired behavior.
- The manual QA matrix scanner counts are one lower than the newest receipts for scans, but the cited receipt files and fresh reruns confirm the current counts: claims 143, sources 110, secrets 162.
- The executor's Todo 11 ledger confirmation was self-authored before this independent review. This artifact is the independent confirmation that lets the checked state stand.

## finalDecision

confirmed
