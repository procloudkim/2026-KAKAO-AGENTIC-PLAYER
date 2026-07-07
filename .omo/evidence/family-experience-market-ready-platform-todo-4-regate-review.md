# Todo 4 Re-Gate Review

recommendation: REJECT

## originalIntent

Reverify Todo 4 after integration verify was restored: harden ETL cache metadata and atomic publish into a production provenance contract for `apps/family-experience-mcp`, using direct source, evidence, and command inspection.

## desiredOutcome

The ETL cache should be safe for public-beta runtime use: cache writes publish atomically, `/mcp` does not read stale/malformed/mixed-generation/partially published cache artifacts as candidates, and cache metadata acts as an enforceable provenance contract with source-level freshness, counts, failures, raw snapshot presence, fixture/live distinction, publish identity, and file integrity.

## userOutcomeReview

Not satisfied. The restored full verify is now green, and the requested stale-cache, partial-publish, malformed-record, and fixture/live mismatch classes are confirmed. However, direct adversarial verification still shows a fresh live cache with missing `publish_id`, `file_digests`, and `source_provenance` is accepted and returns a live candidate. That bypass leaves the "production provenance contract" unenforced for same-count mixed-generation or stripped-metadata cache artifacts.

## blockers

1. Production provenance contract remains bypassable.
   - Code evidence:
     - `apps/family-experience-mcp/src/etl/cacheContract.ts:29` makes `publish_id` optional.
     - `apps/family-experience-mcp/src/etl/cacheContract.ts:31` makes `file_digests` optional.
     - `apps/family-experience-mcp/src/etl/cacheContract.ts:37` makes `source_provenance` optional.
     - `apps/family-experience-mcp/src/etl/cacheContract.ts:176` returns ok when `file_digests` is missing.
     - `apps/family-experience-mcp/src/etl/cacheContract.ts:211` returns ok when `source_provenance` is missing.
   - Fresh probe: wrote a valid cache with `writeCache`, removed `schema_version`, `publish_id`, `file_digests`, and `source_provenance` from `metadata.json`, then queried through `queryNationwideCache`.
   - Result: `missingProvenanceAccepted: true`; returned `{ ok: true, mode: "live", records: [...] }`.
   - Impact: restored test coverage does not prove that current/near-current cache metadata must carry the new provenance/integrity fields.

2. Required code review coverage is incomplete under the final-gate slop criteria.
   - Existing artifact `.omo/evidence/family-experience-market-ready-platform/task-4-code-quality-review.md` covers some TypeScript escape hatches and LOC, but does not explicitly cover deletion-only tests, tests that merely verify requested removal, tautological tests, implementation-mirroring tests, or unnecessary production extraction/parsing/normalization.
   - Direct pass did not find deletion-only or tautological tests, but did find a missing negative test for the accepted missing-provenance case.

3. Auditability remains weak, though no longer the primary blocker.
   - Scoped Todo 4 source and evidence paths are still untracked.
   - `.omo/evidence/family-experience-market-ready-platform/task-4-diff.patch` is 0 bytes.
   - `git diff -- <scoped Todo 4 files>` is empty because the files are untracked, not because there is an inspectable tracked diff.
   - I would not reject solely on this under dirty start-work if direct behavior passed, but direct behavior does not pass.

4. Required package artifacts remain incomplete/stale.
   - `.omo/evidence/family-experience-market-ready-platform/task-4-verify.txt` still records the earlier failing verify: 17/18 files, 126/128 tests.
   - No `task-4*manual*`, `task-4*qa*`, or `task-4*notepad*` artifact exists under `.omo/evidence/family-experience-market-ready-platform/`.
   - Fresh reverify output below supersedes the stale verify artifact for command truth, but the package itself was not backfilled.

## confirmedPasses

- Focused ETL tests:
  - Command: `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts`
  - Result: exit 0, 1 test file passed, 10 tests passed.
- Full integration verify:
  - Command: `npm --prefix apps/family-experience-mcp run verify`
  - Result: exit 0, typecheck passed, 18 test files passed, 134 tests passed.
- Direct adversarial cache probe:
  - Command shape: `node --import tsx --input-type=module` temp-directory probe from `apps/family-experience-mcp`.
  - Confirmed passes:
    - `staleRejected: true`
    - `partialPublishRejected: true`
    - `malformedRecordRejected: true`
    - `fixtureLiveMismatchRejected: true`
  - Confirmed failure:
    - `missingProvenanceAccepted: true`
- Atomic publish source inspection:
  - `apps/family-experience-mcp/src/etl/cache.ts:124-139` writes `.publish-in-progress`, writes temp files, renames normalized/raw before metadata, then removes the marker.
  - `apps/family-experience-mcp/src/etl/cacheQuery.ts:31-35` and `:66-70` block reads if the publish marker exists before or after file reads.
- TypeScript/slop direct scan:
  - `rg -n "as any|as unknown|@ts-ignore|@ts-expect-error|\\.skip\\(|\\.only\\(|\\bany\\b|enum |console\\.log|TODO|FIXME" <scoped files>` returned only a benign comment hit for the word `any`.
  - Pure LOC: `cache.ts` 181, `cacheContract.ts` 217, `cacheQuery.ts` 203, `cacheRecordScope.ts` 81, `etlNationwide.test.ts` 368.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/evidence/family-experience-market-ready-platform/task-4-baseline-partial-cache.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-claim-scan-repro.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-4-diff.patch`
- `.omo/evidence/family-experience-market-ready-platform/task-4-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-4-escape-hatch-scan.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-evidence-index.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-4-file-hashes.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-4-loc.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-4-stale-cache.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-status.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform-todo-4-gate-review.md`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/src/etl/cache.ts`
- `apps/family-experience-mcp/src/etl/cacheContract.ts`
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`
- `apps/family-experience-mcp/src/etl/cacheRecordScope.ts`
- `apps/family-experience-mcp/test/etlNationwide.test.ts`

## adversarialClasses

- stale_state: PASS. Focused test and direct probe reject expired `generated_at + ttl_hours` as `missing_configuration`, `retryable: false`.
- partial_publish: PASS. Focused test and direct probe reject active `.publish-in-progress` as `missing_configuration`, `retryable: true`.
- malformed_records: PASS. Focused test and direct probe reject malformed normalized JSONL as `upstream_invalid_response`.
- fixture_live_mismatch: PASS. Focused test and direct probe reject fixture records under live metadata as `upstream_invalid_response`.
- generated_cached_artifacts: FAIL. Missing provenance/digests/publish metadata can still be accepted as a fresh live cache.
- dirty_worktree: AMBER/BLOCKER-IN-CONTEXT. Dirty/untracked state is survivable under dirty start-work only if behavior and artifacts are otherwise complete. They are not.
- misleading_success_output: PASS for the later claim that full `verify` is restored, but FAIL for overall completion because the stale `task-4-verify.txt` and DoneClaim still record the old blocker.
- hung_long_commands: PASS. Focused and full verify completed in bounded time.
- overfit_slop: FAIL on coverage completeness. Existing review report lacks explicit final-gate overfit/slop criterion coverage; direct pass found a missing adversarial test for the provenance bypass.

## exactEvidenceGaps

- No test or validator enforcement that current production cache metadata must include `publish_id`, `file_digests`, and `source_provenance`.
- No updated `task-4-verify.txt` artifact showing the restored 18-file / 134-test pass.
- Empty `task-4-diff.patch`.
- Scoped Todo 4 source/evidence files are untracked, and `git diff`/`git ls-files` cannot provide an auditable patch.
- No Todo 4 manual QA matrix artifact under `.omo/evidence/family-experience-market-ready-platform/`.
- No Todo 4 notepad artifact under `.omo/evidence/family-experience-market-ready-platform/`.
- Existing code-quality review does not explicitly cover the full remove-ai-slops overfit/slop checklist required by this gate.

## conclusion

Full verify restoration is confirmed, but Todo 4 is not complete as a production provenance contract. The reader still accepts a cache stripped of the new provenance/integrity fields and returns a live candidate. Recommendation remains REJECT.
