# Task 9 Manual QA Matrix: cache refresh and stale-cache behavior

Status: PASS_FOR_REVERIFY_BUT_BLOCKED_UNTIL_TODO5_CONFIRMED
Date: 2026-07-08

Manual QA surface is limited to Todo 9 cache behavior: stale cache smoke, missing cache smoke, `/health` stale cache report, refresh guidance, and secret hygiene. Todo 9 is not marked complete here because Todo 5 remains unconfirmed.

| Scenario | Invocation | Binary observable | Artifact | Result |
| --- | --- | --- | --- | --- |
| Focused stale/missing/health regression tests | `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts test/mcpCache.test.ts test/health.test.ts` | Exit code 0; 3 test files pass; stale and missing cache failures remain bounded | `.omo/evidence/family-experience-market-ready-platform/task-9-cache-focused-tests.txt` | PASS |
| Stale cache CLI smoke | `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=../../.omo/tmp/task-9-cache-stale --skip-seed --expect-error` | Exit code 0; `result_ok=false`; `candidate_count=0`; `failure_code=missing_configuration`; guidance includes `--live --write-cache` and a source-specific `--source` argument | `.omo/evidence/family-experience-market-ready-platform/task-9-cache-stale-smoke.txt` | PASS |
| Missing cache CLI smoke | `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=../../.omo/tmp/task-9-cache-missing --skip-seed --expect-error` | Exit code 0; `result_ok=false`; `candidate_count=0`; `failure_code=missing_configuration`; guidance includes `--live --write-cache` and a source-specific `--source` argument | `.omo/evidence/family-experience-market-ready-platform/task-9-cache-missing-smoke.txt` | PASS |
| HTTP `/health` stale cache report | Start `node --import tsx src/server.ts` with `FAMILY_EXPERIENCE_ETL_CACHE_DIR=../../.omo/tmp/task-9-cache-stale`, then `curl.exe -sS http://127.0.0.1:<port>/health` | Exit code 0; JSON has `ok=true`, `cache.status=stale`, `cache.refreshCommand`, `operations.deployed_version=0.1.0`, and no candidate fabrication | `.omo/evidence/family-experience-market-ready-platform/task-9-cache-health.json` | PASS |
| Refresh guidance | Same stale and missing smoke outputs plus `/health` JSON | Guidance is bounded to cache refresh and official data configuration; public-beta runtime does not direct operators to rebuild fixture cache unless fixture mode is explicitly selected | `task-9-cache-stale-smoke.txt`, `task-9-cache-missing-smoke.txt`, `task-9-cache-health.json` | PASS |
| Claims scan | `npm --prefix apps/family-experience-mcp run scan:claims` | Exit code 0; scanner reports `status=PASS` | `.omo/evidence/family-experience-market-ready-platform/task-9-cache-scan-claims.txt` | PASS |
| Evidence secret scan | `npm --prefix apps/family-experience-mcp run scan:secrets -- --include .omo/evidence/family-experience-market-ready-platform/task-9-cache-doneclaim.md --include .omo/evidence/family-experience-market-ready-platform/task-9-cache-stale-smoke.txt --include .omo/evidence/family-experience-market-ready-platform/task-9-cache-missing-smoke.txt --include .omo/evidence/family-experience-market-ready-platform/task-9-cache-health.json` | Exit code 0; scanner reports `status=PASS`; no raw secret leak in cited Task 9 evidence | `.omo/evidence/family-experience-market-ready-platform/task-9-cache-evidence-secret-scan.txt` | PASS |
| Cleanup | Remove `.omo/tmp/task-9-cache-stale` and `.omo/tmp/task-9-cache-missing`; stop temporary HTTP server | Cleanup receipt exists and no task server is intentionally left running | `.omo/evidence/family-experience-market-ready-platform/task-9-cache-cleanup.txt` | PASS |

## Pass rule

PASS only if stale and missing cache return bounded no-candidate failure/guidance, `/health` reports stale cache state with refresh guidance, and Task 9 evidence scans do not leak secrets.

## Completion boundary

This matrix supports Task 9 re-gate readiness only. It does not override the plan dependency `Todo 9 blocked by Todo 5`.
