# Todo 2 Fix4 Gate Review

## recommendation

APPROVE

## blockers

- None for current workspace behavior.

## originalIntent

Convert forbidden-claim scanning into a market-launch gate and close the Todo 2 Fix4 Korean negation-scope bypass without weakening existing forbidden-claim scanning.

## desiredOutcome

- Explicit include surfaces reject unsupported market claims even under fixture-like or evidence-like paths.
- Korean cross-scope caveat text such as `실시간 운영중입니다 예약 가능하지 않습니다` rejects the affirmative real-time claim.
- Direct Korean caveat-only text such as `실시간 운영중을 보장하지 않습니다` passes.
- Fix3 English/Korean caveat-smuggling regressions remain rejected.
- Focused scanClaims and full package verify pass on the current workspace files.

## userOutcomeReview

The current scanner satisfies the requested user-visible behavior. `scanText` scans every occurrence of every forbidden claim and evaluates a local segment around the occurrence. Default repo-scan allowances are gated by `surface === "default"` and are not inherited by explicit include surfaces. Korean caveat allowance now rejects cases where an affirmative Korean predicate appears between the forbidden occurrence and the later caveat phrase.

## checked artifact paths

- `apps/family-experience-mcp/scripts/scan-claims.ts`
- `apps/family-experience-mcp/test/scanClaims.test.ts`
- `.omo/evidence/family-experience-market-ready-platform/task-2-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-red-korean-cross-scope.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-focused-scanClaims.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-manual-korean-cross-scope-reject.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-manual-korean-direct-caveat-pass.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-manual-english-fix3-smuggle-reject.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-manual-korean-fix3-smuggle-reject.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-loc.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-no-excuse.txt`

## independent commands

- `git status --short`
- `git diff -- apps/family-experience-mcp/scripts/scan-claims.ts apps/family-experience-mcp/test/scanClaims.test.ts .omo/evidence/family-experience-market-ready-platform/task-2-code-quality-review.md`
- `npm --prefix apps/family-experience-mcp test -- --run test/scanClaims.test.ts`
- `npm --prefix apps/family-experience-mcp run verify`
- `node --import tsx --input-type=module --eval "<scanText include-mode adversarial probes>"`
- `npm --prefix apps/family-experience-mcp run scan:claims -- --include`
- `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/definitely-missing-fix4.md`
- `npm --prefix apps/family-experience-mcp run scan:claims`
- `Test-Path .omo/tmp/market-plan-fix4`
- `Test-Path .omo/tmp/market-plan`
- `Test-Path .omo/tmp/market-plan-fix3`
- `Test-Path .omo/tmp/market-plan-fix3-red`

## results

- Focused scanClaims: PASS, 1 file and 18 tests.
- Full verify: PASS, `tsc --noEmit` plus 18 files and 117 tests.
- Direct include probes: PASS for required Korean cross-scope reject, direct Korean caveat pass, English smuggle reject, `test/fixtures/eval` include-path reject, and `.omo/evidence` include-path reject.
- Malformed input: PASS, missing include value and nonexistent include path exit 1.
- Default scan: PASS, 127 files scanned.
- Cleanup: PASS, all checked `.omo/tmp/market-plan*` probe directories absent.
- Slop/overfit direct pass: PASS. No exact-string-only production rule, no deleted/tautological tests, no implementation-mirroring-only coverage, no rule weakening, and no new escape hatches found.

## adversarial classes

- stale_state: mitigated by rerunning focused tests, full verify, default scan, malformed probes, and direct include-mode probes on current files.
- dirty_worktree: present. The workspace has extensive unrelated untracked files, and the Todo 2 Fix4 target files are themselves untracked. This prevents a normal tracked diff review, but direct source inspection and rerun gates validate current behavior.
- misleading_success_output: mitigated by checking exit codes and stderr/stdout findings, not just PASS text.
- malformed_input: mitigated by missing include and nonexistent path probes, both nonzero.
- untrusted_external_text: mitigated by include-mode logic and tests/probes for launch copy, fixture-like paths, and evidence-like paths.

## exact evidence gaps

- `git diff` for the named changed files is empty because the files are untracked, so there is no tracked diff artifact to compare. Review was performed against current file contents instead.
- The OMO bundled TypeScript no-excuse checker did not run to completion because its script could not resolve `typescript`; project-native `tsc --noEmit` and Vitest passed through `npm --prefix apps/family-experience-mcp run verify`.
- File-size warning remains: `scan-claims.ts` has 237 pure LOC and `scanClaims.test.ts` has 226 pure LOC, below the 250 LOC defect threshold but close enough that the next non-trivial expansion should split responsibilities.
