# Todo 2 Code Quality Review

## Scope

- Changed scanner: `apps/family-experience-mcp/scripts/scan-claims.ts`
- Changed tests: `apps/family-experience-mcp/test/scanClaims.test.ts`
- Changed evidence: `.omo/evidence/family-experience-market-ready-platform/task-2-*`
- Todo 3 files, including `apps/family-experience-mcp/scripts/scan-sources.ts` and source types: not touched.

## Include-Surface Bypass Review

| Risk | Verdict | Evidence |
|---|---|---|
| Explicit `--include` path containing `test/fixtures/eval` bypasses forbidden market claims | FIXED. The pre-fix CLI proof exited 0. The post-fix CLI probe exits 1 and reports `live now` plus `nationwide completeness`. | RED: `task-2-fix2-red-include-bypass.txt`; GREEN: `task-2-fix2-manual-eval-include-bypass.txt` |
| Explicit `--include` path containing `.omo/evidence` plus `red` or `finding` wording bypasses false public status claims | FIXED. The pre-fix CLI proof exited 0. The post-fix CLI probe exits 1 and reports `final review and contest submission completed` plus `submission completed`. | RED: `task-2-fix2-red-include-bypass.txt`; GREEN: `task-2-fix2-manual-evidence-include-bypass.txt` |
| Positive public caveats are accidentally blocked | PASS. Explicit include with the Korean unsupported-claim caveat exits 0. | `task-2-fix2-manual-positive-caveat.txt` |
| Malformed include input silently skips scan | PASS. Missing include value exits 1 with usage text. | `task-2-fix2-malformed-include.txt` |

## Why This Is Not A Path-Name Hack

The fix does not add special cases for the two reported paths. It changes the trust boundary:

- `surface === "default"` means the scanner is walking its own repo-owned app files and selected evidence. Only this surface keeps internal allowances for scanner source files, eval fixture paths, and review vocabulary.
- `surface === "include"` means the user explicitly supplied a public, QA, launch, fixture, or generated-evidence surface. This surface no longer inherits default-scan path allowances merely because a path segment says `test/fixtures/eval` or `.omo/evidence`.
- Explicit includes can still pass only through narrow caveat rules such as "does not claim/promise/guarantee" and the existing Korean non-claim phrases.

This is a semantic surface split, not a path blacklist or string patch.

## Overfit And Slop Criteria

| Criterion | Result |
|---|---|
| Overfit to reported file names | PASS. Tests use temporary paths that contain the risky segments but are not repo fixtures. The scanner checks `ScanSurface`, not exact temp filenames. |
| Rule weakening | PASS. Forbidden claims are unchanged. The fix removes include-mode allowances; it does not loosen claim matching. |
| Test-only behavior | PASS. Regression tests drive the real CLI with `npm --prefix apps/family-experience-mcp run scan:claims -- --include ...`, not only `scanText`. |
| Default repo scan compatibility | PASS. `npm --prefix apps/family-experience-mcp run scan:claims` exits 0 after the fix. |
| Type and unit coverage | PASS. Full verify exits 0: 18 test files, 112 tests. Focused scanClaims exits 0: 13 tests. |
| Escape hatches | PASS. No `any`, `@ts-ignore`, `@ts-expect-error`, or non-null assertions added. |
| Scope control | PASS. Todo 3 files were not edited. |

## Evidence Matrix

| Scenario | Invocation | Binary observable | Artifact |
|---|---|---|---|
| RED eval-fixture include bypass before fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include <temp>/test/fixtures/eval/bad-public-copy.md` | `EXIT_CODE=0`, incorrect PASS | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-red-include-bypass.txt` |
| RED evidence include bypass before fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include <temp>/.omo/evidence/bad-evidence-copy.md` | `EXIT_CODE=0`, incorrect PASS | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-red-include-bypass.txt` |
| Focused scanClaims regression suite | `npm --prefix apps/family-experience-mcp test -- --run test/scanClaims.test.ts` | `EXIT_CODE=0`, 1 file and 13 tests passed | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-focused-scanClaims.txt` |
| Full package verify | `npm --prefix apps/family-experience-mcp run verify` | `EXIT_CODE=0`, typecheck passed, 18 files and 112 tests passed | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-verify.txt` |
| Default claim scan | `npm --prefix apps/family-experience-mcp run scan:claims` | `EXIT_CODE=0`, status PASS, 127 files scanned | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-scan-claims.txt` |
| Manual eval-fixture include probe after fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan/test/fixtures/eval/bad-public-copy.md` | `EXIT_CODE=1`, findings include `live now` and `nationwide completeness` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-manual-eval-include-bypass.txt` |
| Manual evidence include probe after fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan/.omo/evidence/bad-evidence-copy.md` | `EXIT_CODE=1`, findings include false final-review/submission claims | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-manual-evidence-include-bypass.txt` |
| Manual positive caveat include after fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan/positive-caveat.md` | `EXIT_CODE=0`, status PASS | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-manual-positive-caveat.txt` |
| Malformed include | `npm --prefix apps/family-experience-mcp run scan:claims -- --include` | `EXIT_CODE=1`, usage reports missing path | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-malformed-include.txt` |
| Cleanup receipt | PowerShell `Test-Path` checks after probe cleanup | `.omo/tmp/market-plan` absent and RED temp dir absent | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-cleanup.txt` |

## Residual Risks

- Default repo scan still allows internal review vocabulary and fixture contexts by design. The risk is bounded to `surface === "default"` and is covered by include-mode regression tests.
- The worktree contains many unrelated untracked files from other active tasks. This review covers only the allowed Todo 2 scanner, tests, and evidence artifacts.

## Fix4 Korean Negation-Scope Review

### Finding

Include-mode still had a Korean cross-scope caveat bypass. A line such as `이 서비스는 실시간 운영중입니다 예약 가능하지 않습니다.` asserted `실시간 운영중입니다`, then later used a direct negation for a different reservation claim. The occurrence scanner incorrectly accepted the earlier `실시간` occurrence because any later `하지 않습니다` or `않습니다` in the same segment counted as a caveat.

### Fix

`scanText` still evaluates every forbidden occurrence independently. The Korean suffix caveat rule now requires the caveat phrase to be scoped to the current occurrence: if an affirmative Korean predicate such as `입니다`, `합니다`, or `운영중입니다` appears between the occurrence and the caveat phrase, the caveat no longer suppresses that occurrence.

This preserves direct caveats such as `실시간 운영중을 보장하지 않습니다` and list-style caveats such as the public unsupported-claim caveat, while rejecting affirmative copy followed by unrelated negation. The change is not an exact-string patch: it adds reusable occurrence-suffix scope logic and leaves the forbidden claim list unchanged.

### Required Risk Coverage

| Risk | Verdict | Evidence |
|---|---|---|
| Korean cross-scope caveat bypass | FIXED. Pre-fix `scanText` returned zero findings; post-fix CLI include rejects with exit 1 and reports `실시간`. | `task-2-fix4-red-korean-cross-scope.txt`; `task-2-fix4-manual-korean-cross-scope-reject.txt` |
| Direct Korean caveat-only copy blocked by overcorrection | PASS. Include file with `실시간 운영중을 보장하지 않습니다` exits 0. | `task-2-fix4-manual-korean-direct-caveat-pass.txt` |
| Fix3 English caveat smuggle regression | PASS. `Public copy does not claim live now; live now status is ready.` exits 1 and reports `live now`. | `task-2-fix4-manual-english-fix3-smuggle-reject.txt` |
| Fix3 Korean caveat smuggle regression | PASS. `이 서비스는 실시간 운영중을 보장하지 않습니다. 실시간 운영중입니다.` exits 1 and reports `실시간`. | `task-2-fix4-manual-korean-fix3-smuggle-reject.txt` |
| Path-boundary include bypass regression | PASS. Existing focused tests still reject explicit include files under `test/fixtures/eval` and `.omo/evidence` paths. | `task-2-fix4-focused-scanClaims.txt` |
| Exact-string overfit | PASS. Tests use constants and production logic evaluates scoped occurrence suffixes, not the full reported sentence. | `scanClaims.test.ts`; `scan-claims.ts` |
| Rule weakening | PASS. No forbidden claims were removed or narrowed. Include-mode allowances remain stricter than default scan allowances. | `scan-claims.ts`; `task-2-fix4-verify.txt` |
| Slop / escape hatches | PASS. No `any`, `@ts-ignore`, `@ts-expect-error`, or non-null assertions were added. `tsc --noEmit` passes through `npm --prefix apps/family-experience-mcp run verify`. | `task-2-fix4-verify.txt` |
| File-size smell | PASS with warning band. Pure LOC: `scan-claims.ts` 237, `scanClaims.test.ts` 226; both are below the 250-line defect threshold but should be split before the next meaningful expansion. | `task-2-fix4-loc.tsv` |

### Fix4 Evidence Matrix

| Scenario | Invocation | Binary observable | Artifact |
|---|---|---|---|
| RED Korean cross-scope bypass before fix | `scanText("manual/include.md", "이 서비스는 실시간 운영중입니다 예약 가능하지 않습니다.", "include")` | `findings: []`, `count: 0` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-red-korean-cross-scope.txt` |
| Focused scanClaims regression suite | `npm --prefix apps/family-experience-mcp test -- --run test/scanClaims.test.ts` | `EXIT_CODE=0`, 1 file and 18 tests passed | `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-focused-scanClaims.txt` |
| Full package verify | `npm --prefix apps/family-experience-mcp run verify` | `EXIT_CODE=0`, typecheck passed, 18 files and 117 tests passed | `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-verify.txt` |
| Manual Korean cross-scope include after fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix4/korean-cross-scope.md` | `EXIT_CODE=1`, finding includes `실시간` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-manual-korean-cross-scope-reject.txt` |
| Manual direct Korean caveat include after fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix4/korean-direct-caveat.md` | `EXIT_CODE=0`, `status: PASS` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-manual-korean-direct-caveat-pass.txt` |
| Manual English fix3 smuggle after fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix4/english-fix3-smuggle.md` | `EXIT_CODE=1`, finding includes `live now` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-manual-english-fix3-smuggle-reject.txt` |
| Manual Korean fix3 smuggle after fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix4/korean-fix3-smuggle.md` | `EXIT_CODE=1`, finding includes `실시간` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-manual-korean-fix3-smuggle-reject.txt` |
| Cleanup receipt | PowerShell `Remove-Item` plus `Test-Path` check | `.omo/tmp/market-plan-fix4` absent; expected probe exit codes recorded | `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-cleanup.txt` |
| Post-write LOC check | PowerShell pure LOC count for touched TS files | `scan-claims.ts=237`, `scanClaims.test.ts=226` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix4-loc.tsv` |

### Fix4 Residual Risks

- Korean grammar is broad. This fix targets the observed negation-scope class by rejecting caveats when an affirmative predicate intervenes before the caveat phrase; future Korean constructions may need a parser-grade rule if the scanner keeps expanding.
- The touched TypeScript files are in the 200-250 pure-LOC warning band. The next non-trivial scanner expansion should split claim vocabulary, caveat parsing, or CLI plumbing before adding more cases.
- The bundled no-excuse checker could not be run to completion because its external skill script could not resolve `typescript` from this workspace layout; artifact recorded at `task-2-fix4-no-excuse.txt`. Project-native `tsc --noEmit` and the full Vitest suite pass via `npm --prefix apps/family-experience-mcp run verify`.

## Fix3 Caveat-Smuggling Review

### Finding

Explicit `--include` mode previously treated caveat wording as a whole-line allowance. That let untrusted launch/QA/public-copy text pass when the same line first said it did not claim a forbidden capability and then asserted the same capability.

### Fix

`scanText` now keeps default-scan internal allowances separate from include-surface caveat handling. For each forbidden claim, it finds every occurrence on a line and evaluates only the local sentence/clause around that occurrence. English caveats must directly scope the following claim, and Korean caveats must appear after the claim in the local clause. Clean caveat-only occurrences pass, but an affirmative occurrence in another clause or sentence is still reported.

This preserves the forbidden claim list and does not weaken detection for unsupported claims. The fix is not an exact-string workaround: it does not special-case the two reported sentences. It uses reusable clause boundaries for punctuation and contrastive connectors, then applies direction-aware caveat vocabulary to the local segment around each occurrence.

### Required Risk Coverage

| Risk | Verdict | Evidence |
|---|---|---|
| Caveat-smuggling in include mode | FIXED. English and Korean smuggle probes now exit 1 and report `live now` / `실시간`. | `task-2-fix3-manual-english-smuggle.txt`; `task-2-fix3-manual-korean-smuggle.txt` |
| Positive caveat-only copy blocked by overcorrection | PASS. Include file with English and Korean caveat-only lines exits 0. | `task-2-fix3-manual-positive-caveat.txt` |
| Path-boundary bypass regression | PASS. Previous fix2 include-surface split remains intact; fix3 changes occurrence handling only and does not reintroduce include path allowances for `test/fixtures/eval` or `.omo/evidence`. | `scanClaims.test.ts` include-path tests; `task-2-fix3-focused-scanClaims.txt` |
| Misleading success output | PASS. The pre-fix RED artifact captures the incorrect `status: PASS` / exit 0. Post-fix manual probes reject the same inputs with `status: FAIL` / exit 1. | `task-2-fix3-red-caveat-smuggle.txt`; fix3 manual smuggle artifacts |
| Untrusted external text | PASS. Tests and manual probes drive the real CLI `--include` surface using temp files, matching launch copy, prompts, docs, fixtures, and generated evidence outside the default scan set. | `task-2-fix3-focused-scanClaims.txt`; fix3 manual artifacts |
| Exact-string overfit | PASS. Tests construct the forbidden substrings from reusable constants, and production logic checks occurrence segments rather than the exact reported full sentences. | `scanClaims.test.ts`; `scan-claims.ts` |
| Slop / escape hatches | PASS. No `any`, `@ts-ignore`, `@ts-expect-error`, non-null assertion, scanner rule weakening, or broad rewrite added. | `task-2-fix3-typecheck.txt`; `task-2-fix3-verify.txt` |
| File-size smell | PASS. Post-write pure LOC: `scan-claims.ts` 219, `scanClaims.test.ts` 214; both remain below 250. | Local post-write LOC check |

### Fix3 Evidence Matrix

| Scenario | Invocation | Binary observable | Artifact |
|---|---|---|---|
| RED English and Korean caveat smuggle before fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix3-red/*.md` | `EXIT_CODE=0`, incorrect `status: PASS` for both inputs | `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-red-caveat-smuggle.txt` |
| Focused scanClaims regression suite | `npm --prefix apps/family-experience-mcp test -- --run test/scanClaims.test.ts` | `EXIT_CODE=0`, 1 file and 16 tests passed | `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-focused-scanClaims.txt` |
| Full package verify | `npm --prefix apps/family-experience-mcp run verify` | `EXIT_CODE=0`, typecheck passed, 18 files and 115 tests passed | `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-verify.txt` |
| Manual English smuggle probe after fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix3/english-smuggle.md` | `EXIT_CODE=1`, finding includes `live now` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-manual-english-smuggle.txt` |
| Manual Korean smuggle probe after fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix3/korean-smuggle.md` | `EXIT_CODE=1`, finding includes `실시간` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-manual-korean-smuggle.txt` |
| Manual positive caveat include after fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix3/positive-caveats.md` | `EXIT_CODE=0`, `status: PASS` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-manual-positive-caveat.txt` |
| Cleanup receipt | PowerShell `Remove-Item` plus `Test-Path` checks | `.omo/tmp/market-plan-fix3` and `.omo/tmp/market-plan-fix3-red` absent | `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-cleanup.txt` |
