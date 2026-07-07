# Re-gate Review: family-experience-market-ready-platform Todo 9

recommendation: APPROVE
finalVerdict: confirmed
reviewScope: Todo 9 `Add cache refresh and stale-cache operational behavior`
reviewDate: 2026-07-08

## originalIntent

Todo 9 was intended to add cache refresh and stale-cache operational behavior for `apps/family-experience-mcp`: refresh cadence and TTL documentation, cache directory strategy, stale/missing/invalid cache behavior, source-specific live rebuild and recovery guidance, evidence paths, and runtime behavior that fails closed rather than silently serving stale cache as live.

## desiredOutcome

Confirm Todo 9 only if the Todo 5 prerequisite is complete, the repaired Todo 9 evidence package exists, current or fresh verification passes, stale/missing cache behavior is bounded, `/health` exposes stale cache operations, cleanup is complete, evidence hygiene is clean, and the direct `omo:remove-ai-slops` plus `omo:programming` pass finds no blocking slop or maintenance burden.

## userOutcomeReview

Todo 9 is confirmed on current evidence.

- Todo 5 prerequisite is now satisfied: `.omo/plans/family-experience-market-ready-platform.md` marks Todo 5 checked; `.omo/evidence/family-experience-market-ready-platform-todo-5-regate-review.md` records `recommendation: APPROVE` and `finalVerdict: confirmed`; `.omo/start-work/ledger.jsonl` records Todo 5 `adversarial-verify` confirmed and `task-completed`.
- Todo 9 remains unchecked in the plan, which is expected before this re-gate result is applied. This review is the confirmation artifact, not a plan edit.
- The repaired Todo 9 package now includes code-quality/slop/programming review, manual QA matrix, notepad, changed-files/status artifact, focused/full verify receipts, stale and missing cache smoke, `/health` stale cache report, claim scan, evidence secret scan, LOC artifact, refresh seed, and cleanup receipt.
- Fresh focused verification passed: `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts test/mcpCache.test.ts test/health.test.ts` exited 0 with 3 files and 28 tests passed.
- Fresh full verification passed: `npm --prefix apps/family-experience-mcp run verify` exited 0 with `tsc --noEmit` passing and 21 test files / 150 tests passed.
- Fresh claim scan passed: `npm --prefix apps/family-experience-mcp run scan:claims` exited 0 with `status=PASS`, `scanned_files=143`.
- Fresh scoped evidence secret scan passed over Todo 9 doneclaim, smoke, health, code-quality, manual QA, and notepad artifacts with `status=PASS`, `scanned_files=169`.
- Stale cache smoke evidence returns `result_ok=false`, `candidate_count=0`, `failure_code=missing_configuration`, and live refresh guidance with `--live --write-cache --source culture_portal`.
- Missing cache smoke evidence returns `result_ok=false`, `candidate_count=0`, `failure_code=missing_configuration`, and live refresh guidance with `--live --write-cache --source culture_portal`.
- `/health` stale cache evidence includes `cache.status=stale`, `cache.refreshCommand`, `cache_metrics.status=stale`, and operational counters. The command is live refresh guidance, not fixture rebuild guidance.
- Cleanup checks passed: the cleanup receipt says the temp cache dirs were removed and the temporary health server was stopped; fresh listener scan found no listeners on checked task ports; fresh process scan found only the current inspection shell, not a lingering app server or smoke/ETL process.
- Evidence hygiene passed: fresh scoped scan found no raw secret patterns; direct raw-pattern search over family-experience evidence found no fake key, raw `CULTURE_PORTAL_SERVICE_KEY=`, or fake serviceKey query leak.
- The mutable `etl-proof-latest.json` is not used as Todo 9 completion proof. Todo 5 confirmation explicitly relies on the stable timestamped Culture Portal proof, while Todo 9 relies on stale/missing cache behavior and health/smoke evidence.

## blockers

None.

## directSlopAndProgrammingReview

I loaded and applied `omo:remove-ai-slops` and `omo:programming` criteria directly over the Todo 9 production code, tests, and evidence package.

- Production code: no `any`, `@ts-ignore`, `@ts-expect-error`, non-null assertion escape hatch, raw secret handling, needless live-data claim, or broad rewrite was found in the Todo 9 runtime surface inspected.
- Runtime size: `task-9-cache-loc.tsv` records runtime files below the 250 pure-LOC hard ceiling: `cacheOperations.ts` 21, `cacheStatus.ts` 122, `cacheQuery.ts` 223, `mcpSourceRecords.ts` 130, `health.ts` 100, `mcp.ts` 225. `cacheQuery.ts` and `mcp.ts` are warning-band only.
- Tests: the stale/missing/health tests assert observable behavior: `missing_configuration`, zero-candidate/error behavior, stale status, and live refresh guidance. They are not deletion-only, removal-only, tautological, or private implementation-call-order tests.
- Oversized tests: `etlNationwide.test.ts` and `mcpCache.test.ts` are large integration-contract suites with explicit SIZE_OK context already present. This is a non-blocking legacy/test-suite caveat, not unresolved Todo 9 slop.
- Abstraction: `cacheOperations.ts` is a small shared command builder used by cache query and health status. It removes duplicated guidance text rather than adding speculative indirection.
- Boundary behavior: cache JSON is parsed at file/schema boundaries; stale/missing/invalid/refreshing cache states produce bounded typed failures and do not serve stale records as live.
- Report coverage: `task-9-code-quality-review.md` explicitly covers `omo:programming` and `omo:remove-ai-slops`, including escape hatches, boundary parsing, error shape, LOC, deletion-only tests, tautological/implementation-mirroring tests, excessive/useless tests, unnecessary parsing/extraction/normalization, and all listed slop classes. My direct pass supports the report.

## adversarialClasses

- stale_state: PASS. Todo 5 is now confirmed, fresh tests pass, stale/missing smoke evidence is current for 2026-07-08, and `etl-proof-latest.json` is not used as Todo 9 proof.
- dirty_worktree: PASS_WITH_CAUTION. The workspace is heavily dirty/untracked, but Todo 9 changed-files/status is captured and current behavior was inspected directly. No unrelated changes were reverted.
- misleading_success_output: PASS. I checked command exits, test counts, scanner JSON, smoke fields, health JSON, and cleanup state rather than relying on prose claims.
- generated_cached_artifacts: PASS_WITH_CAUTION. Task 9 used a generated fixture stale-cache seed only to create stale-cache state. Completion proof is the bounded failure/health behavior, not a live ETL proof or mutable latest alias.
- hung_long_external_command: PASS. No listener remains on checked ports `3345`, `3346`, `3349`, `45932`, `48160`, or `49351`; no lingering app server/smoke/ETL process was found.
- malformed_input: PASS. Existing focused tests cover invalid timestamps, malformed metadata/records, partial publish state, invalid source IDs, malformed bounded args, and fixture/live mismatch.
- cleanup: PASS. Cleanup receipt exists and fresh process/listener checks found no live Todo 9 server.
- overfit/slop: PASS. Direct review and `task-9-code-quality-review.md` found no blocking excessive/useless tests, deletion-only tests, requested-removal-only tests, tautological tests, implementation-mirroring tests, or unnecessary production extraction/parsing/normalization.
- untrusted_external_text: NOT_APPLICABLE for Todo 9 cache refresh completion except through existing cache prompt-injection tests in `mcpCache.test.ts`.
- external_network_freshness: NOT_APPLICABLE for Todo 9 confirmation. Live ETL proof belongs to Todo 5 and is already confirmed separately.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/start-work/ledger.jsonl`
- `.omo/evidence/family-experience-market-ready-platform-todo-9-gate-review.md`
- `.omo/evidence/family-experience-market-ready-platform-todo-5-regate-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-9-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-9-manual-qa-matrix.md`
- `.omo/evidence/family-experience-market-ready-platform/task-9-notepad.md`
- `.omo/evidence/family-experience-market-ready-platform/task-9-changed-files.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-focused-tests.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-stale-smoke.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-missing-smoke.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-health.json`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-scan-claims.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-evidence-secret-scan.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-loc.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-9-cache-refresh-seed.txt`
- `apps/family-experience-mcp/src/etl/cacheOperations.ts`
- `apps/family-experience-mcp/src/etl/cacheStatus.ts`
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`
- `apps/family-experience-mcp/src/mcpSourceRecords.ts`
- `apps/family-experience-mcp/src/health.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/test/etlNationwide.test.ts`
- `apps/family-experience-mcp/test/mcpCache.test.ts`
- `apps/family-experience-mcp/test/health.test.ts`
- `apps/family-experience-mcp/docs/RUNBOOK.md`

## commandsRun

- Loaded `omo:remove-ai-slops` and `omo:programming`.
- `codegraph_explore` for Todo 9 cache refresh/stale health flow and blast radius.
- `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts test/mcpCache.test.ts test/health.test.ts`
- `npm --prefix apps/family-experience-mcp run verify`
- `npm --prefix apps/family-experience-mcp run scan:claims`
- `npm --prefix apps/family-experience-mcp run scan:secrets -- --include <Todo 9 evidence paths>`
- Direct smoke/health/cleanup artifact inspection.
- Direct raw-pattern secret search over `.omo/evidence/family-experience-market-ready-platform/**/*`.
- Process/listener cleanup checks for Todo 9 ports and relevant Node command lines.

## exactEvidenceGaps

No blocking evidence gaps.

Non-blocking caveats:

- Todo 9 is still unchecked in the plan because this artifact is the independent confirmation that should allow the checkbox to be marked complete.
- The changed-files/status artifact is not a clean full patch because much of `apps/family-experience-mcp` is untracked in this workspace. I mitigated this by inspecting current files directly and rerunning executable gates.
- `task-9-cache-refresh-seed.txt` used fixture mode to manufacture stale-cache state. That is acceptable for stale behavior testing, but it is not live ETL proof and must not be cited as live freshness evidence.
- `/health` stale-cache sample reports the stale metadata's `cache.mode=fixture` because the seed cache was fixture-generated; the same health payload still has `config.toolMode=live`, `allowFixture=false`, `cache.status=stale`, and a live refresh command. Completion relies on stale-state reporting and live recovery guidance, not on fixture cache eligibility.
- Existing large integration test files should eventually be split, but they carry explicit SIZE_OK context and are not a Todo 9 blocker.

## final

confirmed
