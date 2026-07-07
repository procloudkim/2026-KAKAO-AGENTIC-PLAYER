# Todo 2 Regression Gate Review

## recommendation

APPROVE

## blockers

- None for the current workspace behavior.

## originalIntent

Verify the post-integration `scanClaims` regression fix for Todo 2. The user-visible intent is that explicit `--include` scan surfaces remain strict for public, launch, QA, fixture, prompt, and generated-evidence files, while default repo-scan allowances continue to exist only for the repo-owned default scan surface.

## desiredOutcome

- `apps/family-experience-mcp/scripts/scan-claims.ts` separates default repo scan allowances from explicit include scanning.
- Explicit `--include` files do not inherit default allowances for `.test.ts`, `test/fixtures/eval`, regex literals, negative-test wording, or `.omo/evidence` review vocabulary.
- Prior path-boundary bypasses and caveat-smuggle cases reject forbidden claims.
- Direct caveat-only text remains accepted.
- Focused `scanClaims`, full package `verify`, and default `scan:claims` pass on the current workspace.

## userOutcomeReview

The current artifact satisfies the requested user-visible behavior. In `scan-claims.ts`, `scanText` accepts a `ScanSurface` and the default internal allowlist is gated behind `surface === "default"` at lines 115-130. The CLI builds `defaultFindings` with `scanText(..., "default")` and `includeFindings` with `scanText(..., "include")` at lines 240-245, so explicit includes do not inherit default repo allowances.

The occurrence-level caveat logic scans every forbidden claim occurrence on a line at lines 133-145 and permits only locally scoped caveats at lines 171-188. Current CLI probes confirm this rejects the known path-boundary bypasses, English/Korean caveat smuggles, and `.test.ts` include allowance attempts while still allowing direct caveat-only copy.

## checked artifact paths

- `apps/family-experience-mcp/scripts/scan-claims.ts`
- `apps/family-experience-mcp/test/scanClaims.test.ts`
- `.omo/evidence/family-experience-market-ready-platform/task-2-regression-red.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-regression-focused-green.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-regression-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-regression-probes.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-regression-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform-todo-2-fix4-gate-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-2-diff.patch`

## source review

- Include-surface split: PASS. Default scan allowances use `defaultRepoScan` and are unavailable when `surface === "include"`.
- Default repo scan compatibility: PASS. Default scan still sends app/evidence files through `"default"`.
- Explicit include strictness: PASS. Included files are separately collected and scanned through `"include"`.
- Rule weakening: PASS. The forbidden claim list remains present and the reviewed change narrows allowances instead of removing claim terms.
- Overfit/slop direct pass: PASS. No exact-string-only production bypass was found; the production rule is surface-based plus occurrence-based, not path-name hardcoding for one fixture.
- TypeScript programming criteria: PASS for this review scope. No `as any`, `@ts-ignore`, `@ts-expect-error`, explicit `: any`, or non-null assertion matches were found in the scanner or focused test file. Pure LOC is `scan-claims.ts=239`, `scanClaims.test.ts=226`, below the 250 pure-LOC defect threshold but in the warning band.
- Test quality pass: PASS. Focused tests drive both pure scanner behavior and the real CLI include surface. They are not deletion-only tests and do not only assert that code was removed.

## code review report coverage

`task-2-code-quality-review.md` explicitly includes overfit/slop coverage: overfit to file names, rule weakening, test-only behavior, default repo scan compatibility, escape hatches, scope control, exact-string overfit, and file-size smell. `family-experience-market-ready-platform-todo-2-fix4-gate-review.md` also records a slop/overfit direct pass with no tautological tests, no implementation-mirroring-only coverage, no rule weakening, and no new escape hatches. I treated those reports as untrusted and repeated the direct pass above.

## command evidence

- `npm --prefix apps/family-experience-mcp test -- --run test/scanClaims.test.ts`: PASS, 1 file / 18 tests.
- `npm --prefix apps/family-experience-mcp run verify`: PASS, `tsc --noEmit` plus 18 test files / 134 tests.
- `npm --prefix apps/family-experience-mcp run scan:claims`: PASS, status `PASS`, `scanned_files: 129`.
- Fresh temporary-file adversarial probes: PASS, `PROBE_FAILURES: 0`, cleanup path absent.

## supplied evidence review

- `task-2-regression-red.txt`: supports a real red state before the regression fix, with 2 failing tests and exit code 1.
- `task-2-regression-focused-green.txt`: supports the focused green state, 18 tests passed.
- `task-2-regression-verify.txt`: supports full verify green at the time of the done claim, 18 files / 134 tests.
- `task-2-regression-probes.txt`: supports six preserved-case probes, including path-boundary rejects and direct caveat pass, with `PROBE_FAILURES: 0`.
- `task-2-regression-cleanup.txt`: supports temp probe cleanup and records the changed files/evidence set.

## adversarial classes

- stale_success_claim: mitigated by current-session reruns of focused test, full verify, and default claim scan.
- default_allowance_leakage_to_include: mitigated by source inspection and fresh probes for `test/fixtures/eval`, `.omo/evidence`, and `.test.ts` include paths.
- path_boundary_bypass: mitigated by explicit include probes using temporary paths containing the risky path segments.
- caveat_smuggling: mitigated by English and Korean same-line smuggle probes that reject the later affirmative occurrence.
- false_positive_overcorrection: mitigated by a direct caveat-only include probe that exits 0.
- misleading_success_output: mitigated by checking process exit status and finding content, not only PASS strings.
- slop_or_overfit: mitigated by direct source/test review plus existing code review coverage; no unresolved slop found.
- dirty_worktree: present but bounded. Target app and evidence files are untracked in this workspace, so review is against current on-disk artifacts and command results rather than a normal tracked Git diff.

## exact evidence gaps

- No tracked Git diff is available for `apps/family-experience-mcp/scripts/scan-claims.ts`; `git ls-files` returns no tracked target file and `task-2-diff.patch` states the relevant files are untracked. Current source inspection and rerun behavior covered the user-visible outcome, but this is not a tracked-diff review.
- No separate post-integration regression code-review report was found. The available Todo 2 code quality review predates the regression artifacts, but it covers the required overfit/slop criteria and I repeated the direct pass.
- No standalone manual QA matrix or notepad path was provided for this specific regression claim. The supplied regression probes plus fresh current-session CLI probes cover the requested manual/adversarial behavior.
- Fresh rerun outputs were observed in this session but not written to separate evidence files because the user requested read-only verification; this gate-review artifact records the current rerun results.

## final verdict

APPROVE. The scanner change preserves strict explicit include scanning, current tests and full verify are green, default repo scan still passes, adversarial include probes pass, and no unresolved overfit/slop blocker was found.
