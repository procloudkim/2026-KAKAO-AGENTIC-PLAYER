# DoneClaim: Todo 9 cache refresh and stale-cache operational behavior

Status: ready_for_reverify_but_blocked_until_todo5_confirmed
Date: 2026-07-08
Scope: independent Todo 9 cache refresh/stale behavior; did not consume Todo 5 ETL proof artifacts; does not mark Todo 9 complete.

## Dependency status

- Todo 9 remains blocked by Todo 5 per `.omo/plans/family-experience-market-ready-platform.md`.
- The plan still shows Todo 5 unchecked.
- A fresh Todo 5 DoneClaim exists in this workspace, but the latest Todo 5 gate review available during this run is still `REJECT`.
- Therefore Todo 9 is re-gate-ready only, not complete.

## Changed files

- `apps/family-experience-mcp/src/etl/cacheOperations.ts`: shared live-vs-fixture cache refresh command builder.
- `apps/family-experience-mcp/src/etl/cacheStatus.ts`: cache operational status for health, including stale/missing/refreshing/invalid/fresh and source health.
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`: stale/missing/invalid cache failures now use source-specific live refresh guidance unless fixture mode is explicitly enabled.
- `apps/family-experience-mcp/src/mcpSourceRecords.ts`: passes runtime fixture/source-set context into cache reader.
- `apps/family-experience-mcp/src/health.ts`: `/health` includes cache status, refresh command, cache metrics, and operations while preserving observability contract.
- `apps/family-experience-mcp/src/mcp.ts`: cache missing-configuration copy avoids fixture guidance for cache failures.
- `apps/family-experience-mcp/test/etlNationwide.test.ts`: focused stale-cache live refresh guidance regression.
- `apps/family-experience-mcp/test/mcpCache.test.ts`: MCP stale-cache structured failure guidance regression.
- `apps/family-experience-mcp/test/health.test.ts`: health stale-cache status regression.
- `apps/family-experience-mcp/docs/RUNBOOK.md`: refresh cadence, TTL, stale/missing behavior, live source rebuild commands, recovery path, and evidence paths.
- `.omo/evidence/family-experience-market-ready-platform/task-9-code-quality-review.md`: explicit `omo:programming` and `omo:remove-ai-slops` criteria coverage.
- `.omo/evidence/family-experience-market-ready-platform/task-9-manual-qa-matrix.md`: exact CLI/HTTP manual QA matrix and binary observables.
- `.omo/evidence/family-experience-market-ready-platform/task-9-notepad.md`: dependency and adversarial-class notes.
- `.omo/evidence/family-experience-market-ready-platform/task-9-changed-files.txt`: scoped changed/untracked status for review.

## Success criteria evidence

1. Scenario: focused stale-cache and refresh behavior tests.
   Invocation: `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts test/mcpCache.test.ts test/health.test.ts`
   Binary observable: exit code 0; 3 test files passed; 28 tests passed.
   Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-cache-focused-tests.txt`

2. Scenario: full package verification.
   Invocation: `npm --prefix apps/family-experience-mcp run verify`
   Binary observable: exit code 0; typecheck passed; 21 Vitest test files and 150 tests passed.
   Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-cache-verify.txt`

3. Scenario: manual stale-cache bounded failure/no fabricated candidates.
   Invocation: `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=../../.omo/tmp/task-9-cache-stale --skip-seed --expect-error`
   Binary observable: exit code 0; `result_ok=false`; `candidate_count=0`; `failure_code=missing_configuration`; text contains `--live --write-cache` and `--source culture_portal`.
   Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-cache-stale-smoke.txt`

4. Scenario: manual missing-cache bounded failure/no fabricated candidates.
   Invocation: `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=../../.omo/tmp/task-9-cache-missing --skip-seed --expect-error`
   Binary observable: exit code 0; `result_ok=false`; `candidate_count=0`; `failure_code=missing_configuration`; text contains `--live --write-cache` and `--source culture_portal`.
   Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-cache-missing-smoke.txt`

5. Scenario: HTTP health reports stale cache operational state.
   Invocation: start `node --import tsx src/server.ts` with `FAMILY_EXPERIENCE_ETL_CACHE_DIR=../../.omo/tmp/task-9-cache-stale`, then `curl.exe -sS http://127.0.0.1:<port>/health`.
   Binary observable: exit code 0; JSON has `cache.status=stale`, `cache.refreshCommand` with `--live --write-cache`, `operations.deployed_version=0.1.0`; server stopped after capture.
   Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-cache-health.json`

6. Scenario: evidence secret scan.
   Invocation: `npm --prefix apps/family-experience-mcp run scan:secrets -- --include <task-9 evidence files>`
   Binary observable: exit code 0; scanner reported `status=PASS`.
   Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-cache-evidence-secret-scan.txt`

7. Scenario: claim scan after runbook update.
   Invocation: `npm --prefix apps/family-experience-mcp run scan:claims`
   Binary observable: exit code 0; scanner reported `status=PASS`; 142 files scanned.
   Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-cache-scan-claims.txt`

8. Scenario: cleanup receipt.
   Invocation: remove `.omo/tmp/task-9-cache-stale` and `.omo/tmp/task-9-cache-missing`; record server stop.
   Binary observable: cleanup receipt exists and is non-empty.
   Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-cache-cleanup.txt`

9. Scenario: post-write size check.
   Invocation: PowerShell pure-LOC count over touched TS files.
   Binary observable: runtime files below 250 pure LOC; `cacheQuery.ts` 223 and `mcp.ts` 225 are warning-band only; large touched test suites have existing SIZE_OK context.
   Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-cache-loc.tsv`

10. Scenario: task-specific code quality/slop review.
    Invocation: scoped review against `omo:programming` and `omo:remove-ai-slops` criteria, including escape-hatch scan and test-shape review.
    Binary observable: review artifact records PASS for no `any`/suppression/non-null escape hatch, no deletion-only/tautological tests, no excessive/useless tests, no unnecessary extraction/parsing/normalization, and LOC/complexity status.
    Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-code-quality-review.md`

11. Scenario: manual QA matrix and notepad evidence.
    Invocation: direct evidence review over stale cache smoke, missing cache smoke, `/health` stale report, refresh guidance, and cleanup.
    Binary observable: matrix and notepad artifacts exist, are non-empty, and list exact CLI/HTTP surfaces plus adversarial classes.
    Artifacts: `.omo/evidence/family-experience-market-ready-platform/task-9-manual-qa-matrix.md`; `.omo/evidence/family-experience-market-ready-platform/task-9-notepad.md`

12. Scenario: scope review.
    Invocation: `git status --short -- <task-9 scoped paths>` plus scoped artifact listing.
    Binary observable: changed/untracked scope captured for reviewer; unrelated worktree dirtiness recorded but not reverted.
    Artifact: `.omo/evidence/family-experience-market-ready-platform/task-9-changed-files.txt`

## Cleanup

- Removed temporary cache directories `.omo/tmp/task-9-cache-stale` and `.omo/tmp/task-9-cache-missing`.
- Stopped the temporary HTTP server used for `/health` capture.
- Did not revert or modify unrelated worktree changes.

## Risks and notes

- Todo 5 is not confirmed complete in this run; this implementation does not claim redacted ETL proof reports or source-health proof artifacts from Todo 5.
- `/health` refresh command uses the configured/default source set. If operators want a different first live source, set `FAMILY_EXPERIENCE_SOURCE_SET` before runtime.
- Existing runtime files `cacheQuery.ts` and `mcp.ts` are in the 200-250 pure LOC warning band; no hard size violation introduced.

## Final status

Todo 9 is ready for reverify, but blocked until Todo 5 is independently confirmed. Do not mark the Todo 9 checkbox complete from this DoneClaim alone.
