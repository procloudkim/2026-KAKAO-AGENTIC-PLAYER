# Todo 11 Gate Review: Family Experience MCP Market Prompt Evaluation

recommendation: REJECT

user_requested_verdict_mapping: needs-fix

## originalIntent

Todo 11 was intended to make the parent-facing prompt evaluation market-ready for the Family Experience MCP. The expected outcome was a deterministic evaluator that drives the public prompt text path, preserves the existing nationwide prompt count, covers at least 10 parent market scenarios, checks unsupported public claims in output text, proves no-result/no-fabrication behavior, and leaves clean Sisyphus evidence so the todo can be marked complete.

## desiredOutcome

- `eval:nationwide-prompts` proves exactly 42 prompt fixtures pass.
- Market scenario metrics pass for bounded candidate count, parent decision value, trust-field completeness, unsupported-claim absence, no-result behavior, and no answer-volume scoring.
- The failure/no-fabrication path is verified with a prompt text request.
- Current package `verify`, `scan:claims`, `scan:sources`, and `scan:secrets` are green.
- Plan, ledger, DoneClaim, code review, manual QA, adversarial probes, cleanup, and evidence hygiene all support completion.

## userOutcomeReview

The shipped evaluator behavior is mostly present: the generated `summary.json` records 42 prompts, 42 passes, `market_scenarios.status=pass`, 12/12 no-result surfaces passing, and zero unsupported-claim failures. Current package verification and all relevant scanners pass.

The user-visible completion outcome is not yet satisfied under start-work/Sisyphus rules. The plan checkbox remains unchecked, the ledger contains Todo 11 dispatch/gate-spawn entries but no Todo 11 `done-claim-received`, `adversarial-verify`, or `task-completed` completion record, and the task lacks a code-review/manual-QA artifact with the required `remove-ai-slops` plus `programming` coverage. The exact plan failure command using `smoke:mcp -- --prompt "..."` is also misleading: it ignores the space-separated prompt and runs the default prompt instead.

## blockers

1. Missing Sisyphus completion state.
   - `.omo/plans/family-experience-market-ready-platform.md` line 208 still has `- [ ] 11. Build parent-facing prompt evaluation for market scenarios`.
   - `.omo/start-work/ledger.jsonl` has Todo 11 dispatch and independent-gate spawn entries only. I found no Todo 11 `done-claim-received`, no Todo 11 `adversarial-verify` result, and no `task-completed` event.

2. Missing required review/QA artifacts.
   - No task-11 code-quality or implementation review artifact found.
   - No task-11 manual QA matrix/notepad artifact found.
   - Search over task-11 artifacts found no `remove-ai-slops`, `overfit`, `tautological`, `implementation-mirroring`, or `programming` coverage beyond a DoneClaim line about size/escape-hatch scanning.
   - This fails the gate requirement that the code review report explicitly show the same skill-perspective check and overfit/slop criterion coverage. Direct green command output cannot replace this artifact.

3. Exact plan failure command is not trustworthy.
   - Current plan says to run `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache --prompt "<impossible prompt>"`.
   - I ran the same space-separated form. Output showed `prompt: "Busan this weekend 4-year-old indoor"` and returned a fixture success, meaning the impossible prompt was ignored.
   - The underlying behavior does work with `--prompt=<value> --expect-error`, which returned `result_ok=false`, `candidate_count=0`, and `failure_code=missing_configuration`. The blocker is the exact plan QA command/evidence shape, not the core no-fabrication behavior.

4. Evidence hygiene is incomplete.
   - `task-11-full-verify.txt`, `task-11-market-eval-final.txt`, `task-11-negative-no-fabrication-final2.txt`, and earlier typecheck artifacts contain stale failures. Later artifacts supersede them, but the DoneClaim does not provide a consolidated stale-evidence ledger.
   - `task-11-current-runtime-blocker.txt` records a runtime import blocker that was later resolved, but the ledger never records the Todo 11 resolution/completion transition.
   - All changed Todo 11 product files are untracked in git, so `git diff` cannot provide a normal scoped patch review. I inspected current files directly, but this remains a reviewability gap.

## verifiedPositiveEvidence

- Current `npm --prefix apps/family-experience-mcp run verify`: PASS, 20 test files and 149 tests.
- Current `npm --prefix apps/family-experience-mcp run scan:claims`: PASS, `scanned_files=141`.
- Current `npm --prefix apps/family-experience-mcp run scan:sources`: PASS, `scanned_files=108`.
- Current `npm --prefix apps/family-experience-mcp run scan:secrets`: PASS, `scanned_files=160`.
- Existing eval summary at `.omo/evidence/family-experience-market-ready-platform/task-11-market-prompt-eval/summary.json`: `prompt_count=42`, `passed_count=42`, `market_scenarios.status=pass`, `unsupported_claim_failures=0`, `no_result_behavior.passed_surface_count=12`.
- Existing results at `.omo/evidence/family-experience-market-ready-platform/task-11-market-prompt-eval/results.json`: 42 rows, 0 failed rows, 0 prompt-path failures, 6 no-result rows.
- Focused no-fabrication probe with corrected equals-form `--prompt=<value> --expect-error`: PASS behavior, no candidates, safe missing-configuration failure.
- Listener cleanup check: `NO_LISTENERS_ON_3345_3346_3349`.

## adversarialClasses

- stale_state: needs-fix. Current commands are green, but stale failed artifacts remain without a consolidated supersession ledger and no Todo 11 completion event exists.
- dirty_worktree: needs-fix. Todo 11 files are untracked; direct inspection was possible, but diff-based scoped review is not available.
- misleading_success_output: needs-fix. Space-separated `smoke:mcp --prompt "..."` ignores the supplied prompt and returns a default prompt success.
- untrusted external text / prompt injection: pass for evaluator evidence. Fixtures include prompt-injection rows and output did not collapse to `ADMIN_OK`.
- flaky_tests: pass on current evidence. Full `verify` passed in this gate run; no retry required.
- generated/cached artifacts: caution. The eval summary/results are generated cached artifacts; I inspected counts and selected adversarial rows. I did not rerun `eval:nationwide-prompts` because the package script writes to the evidence directory and this review is write-limited to the gate report.
- cleanup/no leftover server: pass. No listeners on 3345, 3346, or 3349 after probes.

## removeAiSlopsAndProgrammingPass

Loaded and applied `omo:remove-ai-slops` and `omo:programming` criteria directly.

Direct pass result:
- No obvious deletion-only test, tautological test, or implementation-mirroring production extraction was proven from the current evaluator artifacts.
- The evaluator does assert observable market outcomes: prompt-path result validity, no-result no-fabrication, unsupported-claim absence, max 3 candidates, parent decision fields, trust fields, and source/location/date/child matching.
- Changed evaluator modules are below the 250 pure LOC ceiling: `eval-prompts.ts` 245, `eval-prompt-checks.ts` 223, `eval-market-metrics.ts` 226, `eval-prompt-cli.ts` 28, `eval-prompt-no-result.ts` 9, `eval-prompt-request-checks.ts` 75.
- `unknown` use appears at parsing/trust boundaries and is parsed with Zod before use; no `any`, `@ts-ignore`, `@ts-expect-error`, or non-null escape hatch was found in the task-11 scan artifact.

Gate result:
- REJECT because the required review artifact coverage is absent. The gate instruction explicitly rejects absent or unsupported report coverage even when the direct pass does not find unresolved code slop.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/start-work/ledger.jsonl`
- `.omo/evidence/family-experience-market-ready-platform/task-11-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-*`
- `.omo/evidence/family-experience-market-ready-platform/task-11-market-prompt-eval/summary.json`
- `.omo/evidence/family-experience-market-ready-platform/task-11-market-prompt-eval/results.json`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/scripts/eval-prompts.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-checks.ts`
- `apps/family-experience-mcp/scripts/eval-market-metrics.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-cli.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-no-result.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-request-checks.ts`
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/test/fixtures/eval-nationwide/prompts.json`
- `apps/family-experience-mcp/test/fixtures/eval-nationwide/cache/metadata.json`
- `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md`
- `apps/family-experience-mcp/docs/DEMO_PACK.md`

## exactEvidenceGaps

- Add or update ledger entries for Todo 11: `done-claim-received`, evidence-backed `adversarial-verify`, and `task-completed` only after blockers are fixed.
- Update the plan checkbox for Todo 11 only after the gate passes.
- Add a task-11 code-quality/implementation review artifact that explicitly covers `remove-ai-slops` overfit/slop criteria and `programming` criteria.
- Add a task-11 manual QA matrix/notepad artifact, or explicitly document why manual QA is not applicable under this todo and where equivalent agent-run QA lives.
- Fix the documented smoke no-fabrication command or `smoke-mcp.ts` argument parser so the exact plan command with `--prompt "..."` actually uses the supplied prompt, then rerun the failure scenario.
- Consolidate stale failed task-11 artifacts with a supersession note so future reviewers do not have to infer which failures are obsolete.

