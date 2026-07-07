# Todo 4 Semantic Provenance Gate Review

recommendation: REJECT

## originalIntent

Final independent verification for the Todo 4 semantic provenance fix. The user wanted a read-only, evidence-backed verdict that production/live cache validation fails closed when a nonempty `source_set` lacks corresponding `source_provenance`, including zero-result caches; legitimate zero-result caches with complete provenance remain bounded successes; and prior Todo 4 provenance/integrity requirements still reject malformed or incomplete caches.

## desiredOutcome

- Versioned live cache metadata requires `schema_version`, `publish_id`, `file_digests`, and `source_provenance`.
- Runtime cache reads fail closed for missing, partial, stale, malformed, fixture/live-mismatched, and semantically incomplete provenance.
- Zero-record live caches pass only when provenance is complete and bounded.
- Focused ETL and full package verification pass.

## userOutcomeReview

Most requested cases are verified as passing in the current worktree. `queryNationwideCache` calls `validateCacheContract` before returning records, `cacheMetadataSchema` requires the integrity/provenance fields for schema version 2 metadata, and tests cover empty provenance, missing source provenance, complete zero-result provenance, source-failure zero-result provenance, missing required fields, stale cache, partial publish marker, malformed record JSONL, count mismatch, and fixture/live mismatch.

However, the semantic provenance gate is incomplete. The current validator checks `source_set` coverage and `source_ids` coverage independently, but it does not verify that each provenance entry's `source_id` is the canonical ID for its `source`. A zero-record live metadata object with swapped `source`/`source_id` pairs passes with `{ "ok": true }`. That is a false-positive semantic provenance acceptance and blocks approval.

## blockers

1. `source`/`source_id` pair integrity is not validated.
   - Evidence: `apps/family-experience-mcp/src/etl/cacheContract.ts:260` rejects provenance sources outside `source_set`; `apps/family-experience-mcp/src/etl/cacheContract.ts:265` rejects source IDs outside `source_ids`; `apps/family-experience-mcp/src/etl/cacheContract.ts:270` checks that each declared source and source ID appears somewhere. None of these checks prove `sourceMap[provenance.source] === provenance.source_id`.
   - Probe result: an inline current-code probe from `apps/family-experience-mcp` passed a zero-record live cache where `culture_portal` used `kto-tourapi-events` and `kto_tourapi` used `culture-portal-oneview`; `validateCacheContract` returned `{ "ok": true }`.
   - Impact: a malformed live cache can claim complete source-level provenance while pairing sources to the wrong source IDs, which is a semantic provenance integrity failure.

## checked artifact paths

- `apps/family-experience-mcp/src/etl/cacheContract.ts`
- `apps/family-experience-mcp/src/etl/cache.ts`
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`
- `apps/family-experience-mcp/test/etlNationwide.test.ts`
- `.omo/evidence/family-experience-market-ready-platform/task-4-semantic-provenance-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-4-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-4-semantic-provenance-RED.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-semantic-provenance-focused-tests.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-semantic-provenance-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-semantic-provenance-manual-probe.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-semantic-provenance-loc.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-4-semantic-provenance-escape-hatch-scan.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-semantic-provenance-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-manual-cache-query-probes.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-red-metadata-tests.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-baseline-partial-cache.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-stale-cache.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-4-notepad.md`
- `.omo/evidence/family-experience-market-ready-platform/task-4-diff.patch`

## commands_run

- `Test-Path .codegraph` -> `True`
- `codegraph explore "Todo 4 semantic provenance cacheContract etlNationwide source_set source_provenance"`
- `codegraph explore "apps/family-experience-mcp/test/etlNationwide.test.ts semantic provenance tests missing source_provenance source_set zero result"`
- `codegraph explore "queryNationwideCache read cache metadata validateCacheContract production cache boundary"`
- `codegraph explore "buildMetadata sourceProvenance writeCache sourceSummaries source_set source_ids file_digests publish_id"`
- `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts` -> PASS, 1 file / 18 tests
- `npm --prefix apps/family-experience-mcp run verify` -> PASS, typecheck plus 18 files / 143 tests
- `git diff -- apps/family-experience-mcp/src/etl/cacheContract.ts apps/family-experience-mcp/test/etlNationwide.test.ts` -> empty because the app files are untracked
- `git ls-files --error-unmatch apps/family-experience-mcp/src/etl/cacheContract.ts apps/family-experience-mcp/test/etlNationwide.test.ts` -> `UNTRACKED_BY_GIT_INDEX`
- `Select-String` escape-hatch/slop scan over changed files -> no `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`, `debugger`, or `console.log` matches; found only the existing `SIZE_OK` test waiver and provenance strings
- Inline current-code pair-mismatch probe from `apps/family-experience-mcp` -> `{ "ok": true }` for swapped `source`/`source_id` pairs

## adversarial_classes

- Empty `source_provenance` with nonempty `source_set`, zero records: PASS. Covered by `test/etlNationwide.test.ts:340` and manual probe.
- Missing provenance entry for a declared `source_set` source: PASS. Covered by `test/etlNationwide.test.ts:367` and manual probe.
- Legitimate zero-result cache with complete provenance: PASS. Covered by `test/etlNationwide.test.ts:406`.
- Legitimate zero-result cache with source failure provenance and matching `counts.failures`: PASS. Covered by `test/etlNationwide.test.ts:431`.
- Missing `schema_version`: PASS. Covered by `test/etlNationwide.test.ts:224` and red/green receipts.
- Missing `publish_id`: PASS. Covered by `test/etlNationwide.test.ts:253` and red/green receipts.
- Missing `file_digests`: PASS. Covered by `test/etlNationwide.test.ts:282` and red/green receipts.
- Missing `source_provenance`: PASS. Covered by `test/etlNationwide.test.ts:311` and red/green receipts.
- Stale cache: PASS. Covered by `test/etlNationwide.test.ts:476` and manual probe.
- Partial publish marker: PASS. Covered by `test/etlNationwide.test.ts:582` and manual probe.
- Malformed normalized JSONL: PASS. Covered by `test/etlNationwide.test.ts:557` and manual probe.
- Fixture records under live metadata: PASS. Covered by `test/etlNationwide.test.ts:504`.
- Source/source_id swapped-pair provenance: FAIL. Current validator accepts this malformed semantic provenance.

## slop_overfit_review

Direct `remove-ai-slops` pass:
- No deletion-only, tautological, or implementation-mirroring tests found in the requested semantic-provenance additions. The tests exercise the runtime reader surface and assert bounded outcomes rather than exact error prose.
- No unnecessary production extraction or speculative abstraction was introduced in the inspected production code.
- `test/etlNationwide.test.ts` is oversized but has an existing `SIZE_OK` waiver; no approval is granted because the semantic blocker is independent of test size.

Direct `programming` pass:
- Boundary parsing uses Zod and versioned metadata; the contract validator is the correct shared seam.
- No TypeScript escape hatches were found in the changed files.
- The missing source/source_id pair invariant is a type/contract modeling gap at the boundary.

Report coverage check:
- `.omo/evidence/family-experience-market-ready-platform/task-4-code-quality-review.md` explicitly includes overfit, slop, and escape-hatch coverage.
- The report does not cover the swapped source/source_id pair adversarial class, so its PASS conclusion is unsupported for final semantic provenance approval.

## exact evidence gaps

- No normal git diff is available for the changed app files because they are untracked in the repository index.
- The latest semantic provenance DoneClaim does not include a semantic-specific diff patch or notepad artifact; the available `task-4-diff.patch` and `task-4-notepad.md` are from the earlier Todo 4 provenance-field fix and predate the semantic-pair coverage checks.
- Existing manual probe covers empty/missing/complete/failure zero-result provenance but not source/source_id pair mismatch.

