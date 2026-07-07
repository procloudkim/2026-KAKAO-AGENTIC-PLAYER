# DoneClaim: Todo 2 Fix3 Include-Mode Caveat Smuggling

## Result

Todo 2 include-mode caveat smuggling is fixed for `.omo/plans/family-experience-market-ready-platform.md`.

Explicit `--include` mode now allows clean caveat-only text, but rejects a forbidden affirmative claim when it appears in another sentence or clause on the same line/document.

## Changed Files

- `apps/family-experience-mcp/scripts/scan-claims.ts`
- `apps/family-experience-mcp/test/scanClaims.test.ts`
- `.omo/evidence/family-experience-market-ready-platform/task-2-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-*`

No Todo 3 or Todo 10 files were edited.

## Behavior Change

- Before fix: include-mode caveat wording short-circuited the whole line, so these exited 0:
  - `Public copy does not claim live now; live now status is ready.`
  - `이 서비스는 실시간 운영중을 보장하지 않습니다. 실시간 운영중입니다.`
- After fix: claim scanning is occurrence-aware. Each forbidden occurrence is checked in its local sentence/clause segment with direction-aware caveat scope.
- Clean caveats still pass:
  - `Public copy does not claim live now.`
  - `이 서비스는 실시간 운영중을 보장하지 않습니다.`

## Commands And Results

| Scenario | Invocation | Result | Artifact |
|---|---|---|---|
| RED proof before fix | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix3-red/english-smuggle.md`; `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix3-red/korean-smuggle.md` | Both incorrectly exited `0` with `status: PASS` | `task-2-fix3-red-caveat-smuggle.txt` |
| Focused tests | `npm --prefix apps/family-experience-mcp test -- --run test/scanClaims.test.ts` | `EXIT_CODE=0`; 1 file, 16 tests passed | `task-2-fix3-focused-scanClaims.txt` |
| Full verify | `npm --prefix apps/family-experience-mcp run verify` | `EXIT_CODE=0`; typecheck passed; 18 test files, 115 tests passed | `task-2-fix3-verify.txt` |
| Manual English smuggle | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix3/english-smuggle.md` | `EXIT_CODE=1`; finding reports `live now` | `task-2-fix3-manual-english-smuggle.txt` |
| Manual Korean smuggle | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix3/korean-smuggle.md` | `EXIT_CODE=1`; finding reports `실시간` | `task-2-fix3-manual-korean-smuggle.txt` |
| Manual positive caveat | `npm --prefix apps/family-experience-mcp run scan:claims -- --include .omo/tmp/market-plan-fix3/positive-caveats.md` | `EXIT_CODE=0`; `status: PASS` | `task-2-fix3-manual-positive-caveat.txt` |
| Cleanup | PowerShell `Remove-Item` and `Test-Path` checks | `.omo/tmp/market-plan-fix3` and `.omo/tmp/market-plan-fix3-red` absent | `task-2-fix3-cleanup.txt` |

## Quality Review

- Forbidden claim rules were not weakened.
- The implementation is not an exact-string workaround; it evaluates claim occurrences inside local sentence/clause segments.
- Include-mode remains untrusted and does not inherit default-scan path allowances.
- Tests drive the real CLI include surface, not only internal functions.
- Post-write pure LOC: `scan-claims.ts` 219, `scanClaims.test.ts` 214.
- TypeScript typecheck and full verify pass.

## Residual Risks

- Default repo scan still has broader internal allowances for scanner source, eval fixtures, and review/evidence vocabulary by design.
- The worktree contains many unrelated untracked files from other active tasks; this DoneClaim covers only the allowed Todo 2 scope.
