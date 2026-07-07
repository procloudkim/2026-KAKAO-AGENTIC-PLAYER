# DoneClaim: Task 11 parent-facing prompt evaluation

Status: PASS for task-11 scoped implementation, QA, and gate-blocker repair.

## Changed Files

Code/test:
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`
- `apps/family-experience-mcp/scripts/smoke-mcp-fixtures.ts`
- `apps/family-experience-mcp/test/smokeMcp.test.ts`

Task 11 evidence:
- `.omo/evidence/family-experience-market-ready-platform/task-11-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-manual-qa-matrix.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-notepad.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-stale-evidence-supersession.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-11-*-fix.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-11-smoke-parser-RED.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-11-smoke-parser-GREEN.txt`

Prior Task 11 implementation files still in scope from the original DoneClaim:
- `apps/family-experience-mcp/scripts/eval-prompts.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-checks.ts`
- `apps/family-experience-mcp/scripts/eval-market-metrics.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-cli.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-no-result.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-request-checks.ts`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md`
- `apps/family-experience-mcp/docs/DEMO_PACK.md`
- `apps/family-experience-mcp/test/fixtures/eval-nationwide/cache/metadata.json`

## Implementation Summary

- Fixed `scripts/smoke-mcp.ts` argument parsing so value options support both `--name=value` and `--name value`.
- Split smoke fixture records into `scripts/smoke-mcp-fixtures.ts` so the touched smoke CLI module stays below the hard LOC ceiling.
- Added a focused CLI regression proving the documented `--prompt "..."` form reaches the MCP call.
- Preserved the existing evaluator behavior and prompt fixture count.
- Added required code-quality, manual QA, notepad, and stale-evidence supersession artifacts.

## Commands and Results

- Scenario: parser regression red.
  Invocation: `npm --prefix apps/family-experience-mcp test -- --run test/smokeMcp.test.ts`
  Observable: failed before parser fix because stdout `prompt` was the default 부산 prompt.
  Artifact: `.omo/evidence/family-experience-market-ready-platform/task-11-smoke-parser-RED.txt`
- Scenario: parser regression green.
  Invocation: `npm --prefix apps/family-experience-mcp test -- --run test/smokeMcp.test.ts`
  Observable: PASS, 1 test passed.
  Artifact: `.omo/evidence/family-experience-market-ready-platform/task-11-smoke-parser-GREEN.txt`
- Scenario: 42 nationwide market prompt fixtures through structured and public loose prompt paths.
  Invocation: `npm --prefix apps/family-experience-mcp run eval:nationwide-prompts`
  Observable: `prompt_count=42`, `passed_count=42`, `market_scenarios.status=pass`, `unsupported_claim_failures=0`, `no_result_behavior.passed_surface_count=12`.
  Artifact: `.omo/evidence/family-experience-market-ready-platform/task-11-eval-nationwide-prompts-fix.txt`
  Machine outputs: `.omo/evidence/family-experience-market-ready-platform/task-11-market-prompt-eval/summary.json` and `results.json`
- Scenario: exact plan-form no-fabrication smoke command.
  Invocation: `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache --prompt "2099년 화성에서 초등학생이 참여할 수 있는 체험행사 3개" --expect-error`
  Observable: exit 0; stdout `prompt` equals supplied prompt; `result_ok=false`; `candidate_count=0`; `failure_code=missing_configuration`.
  Artifact: `.omo/evidence/family-experience-market-ready-platform/task-11-no-fabrication-plan-command.txt`
- Scenario: full package verify.
  Invocation: `npm --prefix apps/family-experience-mcp run verify`
  Observable: typecheck pass; Vitest 21 files passed, 150 tests passed.
  Artifact: `.omo/evidence/family-experience-market-ready-platform/task-11-verify-fix.txt`
- Scenario: claim scan.
  Invocation: `npm --prefix apps/family-experience-mcp run scan:claims`
  Observable: PASS, `scanned_files=143`.
  Artifact: `.omo/evidence/family-experience-market-ready-platform/task-11-scan-claims-fix.txt`
- Scenario: source scan.
  Invocation: `npm --prefix apps/family-experience-mcp run scan:sources`
  Observable: PASS, `scanned_files=110`.
  Artifact: `.omo/evidence/family-experience-market-ready-platform/task-11-scan-sources-fix.txt`
- Scenario: secret scan.
  Invocation: `npm --prefix apps/family-experience-mcp run scan:secrets`
  Observable: PASS, `scanned_files=162`.
  Artifact: `.omo/evidence/family-experience-market-ready-platform/task-11-scan-secrets-fix.txt`

## Manual QA

Manual QA surface is CLI/manual evidence review, not browser UI.

- Matrix: `.omo/evidence/family-experience-market-ready-platform/task-11-manual-qa-matrix.md`
- Actual surfaces: `eval:nationwide-prompts`, `smoke:mcp`, `verify`, `scan:claims`, `scan:sources`, `scan:secrets`
- Binary observables: exit code 0, stdout JSON fields, Vitest pass counts, scanner `status=PASS`, generated `summary.json` metrics.

## Adversarial Classes

- stale_state: PASS. Stale failed artifacts are superseded in `task-11-stale-evidence-supersession.md`.
- dirty_worktree: PASS with caution. The worktree contains unrelated untracked/added files; this fix did not revert them and stayed scoped to Todo 11.
- misleading_success_output: PASS. Parser red/green receipts prove the exact command no longer uses the default prompt silently.
- untrusted external text/prompt injection: PASS. Current evaluator summary records prompt-injection coverage and no unsupported-claim failures.
- flaky_tests: PASS. Focused parser test, full verify, evaluator, and scanners passed in fresh runs without retry.
- generated/cached artifacts: PASS with caution. Generated evaluator outputs are paired with fresh command receipts and current summary.
- cleanup: PASS. No long-lived server was started; in-memory smoke closes its resources.

## Cleanup

- No background server/process was started by this fix.
- No unrelated files were reverted.
- Stale Task 11 evidence is documented, not deleted.

## Risks

- The worktree is shared and contains many unrelated untracked/added files.
- `eval-prompts.ts` is in the 200-250 LOC warning band at 245 pure LOC; no new lines were added there in this fix, but the next substantive evaluator edit should split responsibilities first.
- No live provider completeness is claimed; this is deterministic fixture/cache market prompt evaluation.
