# DoneClaim: Todo 2 Include-Surface Bypass Fix

## Changed Files

- `apps/family-experience-mcp/scripts/scan-claims.ts`
- `apps/family-experience-mcp/test/scanClaims.test.ts`
- `.omo/evidence/family-experience-market-ready-platform/task-2-code-quality-review.md`
- New Todo 2 evidence files under `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-*`

## Implementation

- Moved scanner-owned path allowances behind `surface === "default"`.
- Explicit `--include` files now run as untrusted include surfaces and do not inherit broad `test/fixtures/eval` or `.omo/evidence` path allowances.
- Preserved narrow caveat allowances for explicit non-claim wording.
- Added CLI-level regression tests for:
  - include path containing `test/fixtures/eval`
  - include path containing `.omo/evidence` with review wording
  - positive unsupported-claim caveat include
  - malformed include failure

## Verification

| Scenario | Invocation | Binary observable | Artifact |
|---|---|---|---|
| RED bypass proof before fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include <temp risky path>` | Both bypass probes exited `0` before fix | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-red-include-bypass.txt` |
| Focused scanClaims tests | `npm --prefix apps/family-experience-mcp test -- --run test/scanClaims.test.ts` | `EXIT_CODE=0`; 1 file, 13 tests passed | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-focused-scanClaims.txt` |
| Full package verify | `npm --prefix apps/family-experience-mcp run verify` | `EXIT_CODE=0`; typecheck passed; 18 files, 112 tests passed | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-final-verify.txt` |
| Default claim scan | `npm --prefix apps/family-experience-mcp run scan:claims` | `EXIT_CODE=0`; status PASS; 127 files scanned | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-scan-claims.txt` |
| Manual eval include probe | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan/test/fixtures/eval/bad-public-copy.md` | `EXIT_CODE=1`; findings include `live now` and `nationwide completeness` | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-manual-eval-include-bypass.txt` |
| Manual evidence include probe | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan/.omo/evidence/bad-evidence-copy.md` | `EXIT_CODE=1`; findings include false final-review/submission claims | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-manual-evidence-include-bypass.txt` |
| Manual positive caveat include | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan/positive-caveat.md` | `EXIT_CODE=0`; status PASS | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-manual-positive-caveat.txt` |
| Malformed include | `npm --prefix apps/family-experience-mcp run scan:claims -- --include` | `EXIT_CODE=1`; missing path usage | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-malformed-include.txt` |
| LOC and escape-hatch hygiene | PowerShell LOC count plus escape-hatch search | `scan-claims.ts=185`, `scanClaims.test.ts=170`, no escape hatches found | `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-loc.tsv`; `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-escape-hatches.txt` |

## Cleanup

- `.omo/tmp/market-plan` absent after probes.
- `.omo/evidence/family-experience-market-ready-platform/tmp-red-include-bypass` absent after RED capture.
- Receipt: `.omo/evidence/family-experience-market-ready-platform/task-2-fix2-cleanup.txt`

## Risks

- Default repo scans still keep internal review/fixture allowances by design, but those allowances are now restricted to the default scan surface.
- The shared worktree remains dirty with many unrelated untracked files; this task touched only the allowed Todo 2 scanner, tests, and evidence files.
