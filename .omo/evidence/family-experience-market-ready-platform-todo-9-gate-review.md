# Todo 9 Gate Review: Cache Refresh and Stale-Cache Operational Behavior

## recommendation

REJECT

## finalVerdict

needs-fix

## originalIntent

Todo 9 was intended to add cache refresh and stale-cache operational behavior for the Family Experience MCP market-ready plan: scheduled or documented ETL/cache refresh, cache directory strategy, TTL/stale behavior, source-specific live rebuild and recovery commands, evidence paths, and runtime behavior that fails closed for stale or missing cache instead of silently serving stale cache as live.

## desiredOutcome

Todo 9 can be marked complete only if plan dependency rules, DoneClaim evidence, current code/tests, manual QA, cleanup, adversarial probes, and evidence hygiene all support completion under start-work Sisyphus rules.

## userOutcomeReview

From the runtime/user perspective, the current implementation behavior is strong: focused cache tests pass, full package verify passes, stale and missing cache smoke behavior fails closed with zero candidates, and `/health` reports stale cache state with live refresh guidance.

However, the shipped evidence does not satisfy the completion process. The plan explicitly marks Todo 9 as blocked by Todo 5, while Todo 5 is still unchecked and only pending in the ledger. The ledger dispatched Todo 9 without Todo 5 in `dependencies_satisfied`. The task-9 artifact set also lacks a task-specific code review report, explicit remove-ai-slops/programming overfit coverage, manual QA matrix, and notepad artifact. Under the requested gate criteria, Todo 9 should not be marked complete yet.

## blockers

1. Plan dependency violation: `.omo/plans/family-experience-market-ready-platform.md:188-196` says Todo 9 is `Blocked by: 5`, and `.omo/plans/family-experience-market-ready-platform.md:148-156` still shows Todo 5 unchecked.
2. Ledger support is incomplete: `.omo/start-work/ledger.jsonl` dispatches Todo 9 with `dependencies_satisfied=["1","2","3","4","6","7","10"]`, omitting Todo 5, and no `task-completed` or `done-claim-received` ledger entry for Todo 9 was found.
3. Required review coverage artifact is absent: no task-9 code review/slop report was present in `.omo/evidence/family-experience-market-ready-platform/task-9-*`, and a search of those files found no `remove-ai-slops`, `programming`, overfit/slop, code-review, manual-QA, adversarial, or notepad coverage.
4. Manual QA matrix/notepad evidence gap: task-9 has smoke outputs and cleanup receipt, but no explicit manual QA matrix or notepad path artifact.
5. Evidence hygiene/stale-state risk: the shared ETL proof directory is still associated with pending Todo 5 work; `etl-proof-latest.json` is mutable, and Todo 5 remains pending. Todo 9 cannot be isolated from the declared prerequisite.

## positiveEvidence

- Focused tests rerun: `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts test/mcpCache.test.ts test/health.test.ts` exited 0; 3 files and 28 tests passed.
- Full verify rerun: `npm --prefix apps/family-experience-mcp run verify` exited 0; typecheck passed; 20 files and 149 tests passed.
- Claim scan rerun: `npm --prefix apps/family-experience-mcp run scan:claims` exited 0; status PASS; 141 files scanned.
- Evidence secret scan rerun across task-9 artifacts exited 0; status PASS; 171 files scanned.
- Independent manual smoke rerun using OS temp live stale cache: stale and missing cache both returned `missing_configuration`, zero candidates, and `--live --write-cache --source culture_portal` guidance.
- Independent HTTP health rerun against live stale cache: `/health` returned `cache.status=stale`, `cache.mode=live`, and live source-specific refresh guidance.
- Cleanup check: no listening sockets remained on checked task ports `3345`, `3346`, `3349`, `45932`, `48160`, or `49351`; process scan found no lingering `src/server.ts`, `smoke-mcp`, or `etl-nationwide` task process beyond the current shell command.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/start-work/ledger.jsonl`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-focused-tests.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-stale-smoke.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-missing-smoke.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-health.json`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-health-server.out.log`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-health-server.err.log`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-evidence-secret-scan.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-scan-claims.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-loc.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-refresh-seed.txt`
- `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-latest.json`

## relevantCodeInspected

- `apps/family-experience-mcp/src/etl/cacheOperations.ts`
- `apps/family-experience-mcp/src/etl/cacheStatus.ts`
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`
- `apps/family-experience-mcp/src/health.ts`
- `apps/family-experience-mcp/test/etlNationwide.test.ts`
- `apps/family-experience-mcp/test/mcpCache.test.ts`
- `apps/family-experience-mcp/test/health.test.ts`
- `apps/family-experience-mcp/docs/RUNBOOK.md`

## adversarialClasses

- stale_state: needs-fix. Current tests and manual probes are green, but Todo 5 dependency is unresolved and shared ETL proof evidence is mutable/pending.
- dirty_worktree: needs-human-awareness. Worktree has substantial unrelated tracked/untracked state; current product behavior was inspected directly, but git diff cannot prove Todo 9 scope.
- misleading_success_output: pass for commands rerun in this review; exit codes and counts were checked. Process-level success remains blocked by missing start-work artifacts.
- generated_cached_artifacts: needs-fix. Task-9 seed evidence shows ETL proof generation under the shared `etl/` evidence area, while Todo 5 remains pending.
- hung_long_external_command: pass. No leftover listener or relevant server/process was found after manual QA.
- malformed_input: pass for current code/tests. Focused tests cover invalid timestamps, partial publish, malformed JSONL, invalid source IDs, malformed bounded args, and fixture/live mismatch.
- overfit_or_slop: needs-fix. Direct pass did not find an obvious behavior-breaking test overfit in the cache tests, but the required task-specific code review report with explicit remove-ai-slops/programming coverage is absent.
- untrusted_external_text: not applicable to Todo 9 completion except through existing cache prompt-injection tests in `mcpCache.test.ts`; not a direct cache refresh acceptance criterion.
- external_network_freshness: not applicable for Todo 9; cache refresh behavior was validated with local cache state. Live ETL proof belongs to Todo 5, which is still pending.

## exactEvidenceGaps

- Missing task-9 code review report proving programming criteria and remove-ai-slops overfit/slop coverage.
- Missing task-9 manual QA matrix artifact.
- Missing task-9 notepad path/artifact.
- Missing ledger DoneClaim entry for Todo 9.
- Missing ledger `task-completed` entry for Todo 9.
- Missing completed Todo 5 prerequisite before Todo 9 completion.
- Missing stable evidence boundary for shared ETL proof artifacts while Todo 5 remains in progress.

## conclusion

Do not mark Todo 9 complete yet. The implementation appears behaviorally ready, but the start-work/Sisyphus completion gate is not satisfied until Todo 5 is completed or the dependency is formally revised, and task-9 review/manual-QA/slop evidence is added.
