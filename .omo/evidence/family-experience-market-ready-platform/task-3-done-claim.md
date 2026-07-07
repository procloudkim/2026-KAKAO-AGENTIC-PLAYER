# Task 3 DoneClaim

Date: 2026-07-07

## Changed files

- `apps/family-experience-mcp/docs/SOURCE_LEDGER.md`
- `apps/family-experience-mcp/docs/DECISIONS.md`
- `apps/family-experience-mcp/src/sources/types.ts`
- `apps/family-experience-mcp/src/sources/registry.ts`
- `apps/family-experience-mcp/scripts/scan-sources.ts`
- `apps/family-experience-mcp/test/sources.test.ts`
- `apps/family-experience-mcp/test/scanSources.test.ts`

## Scenarios and evidence

| Scenario | Invocation | Binary observable | Artifact |
| --- | --- | --- | --- |
| Happy source scan | `npm --prefix apps/family-experience-mcp run scan:sources \| Tee-Object .omo/evidence/family-experience-market-ready-platform/task-3-scan-sources.txt` | Exit 0; JSON `status` is `PASS`; `scanned_files` is 94. | `.omo/evidence/family-experience-market-ready-platform/task-3-scan-sources.txt` |
| Negative include QA | `New-Item -ItemType Directory -Force .omo/tmp/market-plan \| Out-Null; Set-Content .omo/tmp/market-plan/bad-source.md '\| source \| url \|\n\| bad \| \|'; npm --prefix apps/family-experience-mcp run scan:sources -- --include .omo/tmp/market-plan/bad-source.md *> .omo/evidence/family-experience-market-ready-platform/task-3-negative-source.txt; $scanExit=$LASTEXITCODE; Remove-Item -Recurse -Force .omo/tmp/market-plan; exit $scanExit` | Exit 1; JSON `status` is `FAIL`; finding rule is `source-ledger-missing-url` for `bad-source.md`. | `.omo/evidence/family-experience-market-ready-platform/task-3-negative-source.txt` |
| Full verification | `npm --prefix apps/family-experience-mcp run verify *> .omo/evidence/family-experience-market-ready-platform/task-3-verify.txt` | Exit 0; 18 test files passed; 112 tests passed. | `.omo/evidence/family-experience-market-ready-platform/task-3-verify.txt` |
| Targeted source tests | `npm --prefix apps/family-experience-mcp test -- --run test/scanSources.test.ts test/sources.test.ts *> .omo/evidence/family-experience-market-ready-platform/task-3-targeted-tests.txt` | Exit 0; 2 test files passed; 12 tests passed. | `.omo/evidence/family-experience-market-ready-platform/task-3-targeted-tests.txt` |
| Typecheck | `npm --prefix apps/family-experience-mcp run typecheck *> .omo/evidence/family-experience-market-ready-platform/task-3-typecheck.txt` | Exit 0. | `.omo/evidence/family-experience-market-ready-platform/task-3-typecheck.txt` |
| Claim guardrail | `npm --prefix apps/family-experience-mcp run scan:claims *> .omo/evidence/family-experience-market-ready-platform/task-3-scan-claims-final.txt` | Exit 0; JSON `status` is `PASS`; `scanned_files` is 127. | `.omo/evidence/family-experience-market-ready-platform/task-3-scan-claims-final.txt` |
| Secret guardrail | `npm --prefix apps/family-experience-mcp run scan:secrets *> .omo/evidence/family-experience-market-ready-platform/task-3-scan-secrets-final.txt` | Exit 0; JSON `status` is `PASS`; `scanned_files` is 146. | `.omo/evidence/family-experience-market-ready-platform/task-3-scan-secrets-final.txt` |
| Cleanup receipt | `Test-Path .omo/tmp/market-plan` after the negative QA cleanup | Receipt says `market-plan cleanup: REMOVED`. | `.omo/evidence/family-experience-market-ready-platform/task-3-cleanup-receipt.txt` |
| Size check | Pure LOC count on changed TypeScript files | `scan-sources.ts` is 233 pure LOC; all changed TypeScript files are under 250. | `.omo/evidence/family-experience-market-ready-platform/task-3-loc.txt` |

## Acceptance mapping

- Source ledger lists source id, institution, auth, freshness, license/terms pointer, allowed claims, unsupported claims, cache TTL, proof command, and launch tier in `apps/family-experience-mcp/docs/SOURCE_LEDGER.md`.
- Required tiers are defined in both `SOURCE_LEDGER.md` and `LAUNCH_COVERAGE_TIERS`: `tier0-fixture-only`, `tier1-source-proven-single-source`, `tier2-multi-source-cross-region`, and `tier3-market-claim-eligible`.
- No current source is registered as `tier3-market-claim-eligible`; broad public copy remains blocked from non-proven coverage claims.
- `scan-sources.ts` documents and implements `--include <path>`.
- Negative include QA is rejected, including the PowerShell literal `\n` form in the provided command.
- Claim and secret scans passed after the ledger update.

## Adversarial classes

- `malformed_input`: covered by missing include value, nonexistent include path, malformed source ledger row, and literal newline-escape tests.
- `untrusted_external_text`: included docs/fixtures are read from disk and scanned through `--include`.
- `stale_state`: `DECISIONS.md` now points to `SOURCE_LEDGER.md` as canonical for source inventory and coverage tiers.
- `dirty_worktree`: scoped edits only; avoided the Todo 2 claim-scanner and Todo 10 runtime/test files named by the task.
- `misleading_success_output`: explicit negative include exits 1 and records the bad file finding, proving include is not ignored.
- `hung/long commands`: not observed; longest command was `verify`, which completed successfully in 22.62 seconds.
- `flaky_tests`: one parallel test fixture collision was found and fixed by isolating the new source-scanner test temp directory from existing claim-scanner tests.

## Residual risks

- The source ledger is policy/provenance documentation plus registry metadata. It does not prove live provider coverage, current ETL freshness, or broad market eligibility.
- The plugin no-excuse helper could not run because it could not resolve its own `typescript` dependency from the plugin path; direct typecheck, full verify, source/claim/secret scans, and pure LOC checks passed.
