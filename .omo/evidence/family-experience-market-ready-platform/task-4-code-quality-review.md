# Task 4 Code-Quality Review

Verdict: PASS

Scope reviewed:
- apps/family-experience-mcp/src/etl/cache.ts
- apps/family-experience-mcp/src/etl/cacheContract.ts
- apps/family-experience-mcp/src/etl/cacheQuery.ts
- apps/family-experience-mcp/src/etl/cacheRecordScope.ts
- apps/family-experience-mcp/test/etlNationwide.test.ts

Metadata and provenance trust boundary:
- PASS. Current cache metadata now requires schema_version = 2, publish_id, file_digests, and source_provenance at the Zod parse boundary.
- PASS. Live/market cache metadata missing any required provenance or integrity field fails closed through queryNationwideCache with upstream_invalid_response.
- PASS. File digests remain verified against normalized-records.jsonl and raw-snapshots.jsonl before records are returned.
- PASS. Source provenance totals are still checked against aggregate counts, source_set, source_ids, and raw snapshot presence.
- PASS. The only compatibility path retained is the old minimal fixture-only metadata shape; modern partial metadata with mode/source_set/counts/files is not accepted as legacy.

Overfit coverage:
- PASS. Regression tests remove each required field independently: schema_version, publish_id, file_digests, source_provenance.
- PASS. Manual probes cover four distinct bad states through the reader surface: missing metadata, stale cache, partial publish marker, malformed record JSONL.
- PASS. Tests assert failure classes, not exact prose, so they are not overfit to wording while still proving fail-closed behavior.
- PASS. The red artifact shows the old behavior returned ok=true records for all four missing-field cases; green artifacts show the same scenarios now reject.

Slop and escape-hatch coverage:
- PASS. No as any/as unknown/@ts-ignore/@ts-expect-error/debugger/DEBUG marker matches in changed files.
- PASS. No broad catch-and-swallow was introduced; existing cache reader catch blocks narrow SyntaxError or rethrow unknown errors.
- PASS. No Todo 6 output, Todo 7 secret scanner, or claim scanner files were touched.
- NOTE. cacheContract.ts is 250 pure LOC, inside the warning band. This task changed one boundary and did not add a new responsibility, so no scope-broadening split was made.
- NOTE. test/etlNationwide.test.ts remains above 250 pure LOC under its existing SIZE_OK waiver as an integration contract suite.

Verification:
- PASS: npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts
- PASS: npm --prefix apps/family-experience-mcp run verify
- PASS: manual cache-query probes in task-4-manual-cache-query-probes.txt

## Semantic Provenance Completeness Addendum

Verdict: PASS

Scope reviewed:
- apps/family-experience-mcp/src/etl/cacheContract.ts
- apps/family-experience-mcp/test/etlNationwide.test.ts

Gap closed:
- PASS. A live cache with nonempty source_set and source_provenance: [] now fails closed even when normalized_records and raw_snapshots are both zero.
- PASS. A live cache whose source_set/source_ids contain a source not represented in source_provenance now fails closed.
- PASS. A legitimate zero-record live cache still passes when source provenance is complete.
- PASS. A legitimate zero-record live cache with source failure status still passes when counts.failures and source_provenance failure entries agree.

Verification:
- RED: task-4-semantic-provenance-RED.txt shows the pre-fix zero-record empty-provenance case returned ok:true.
- GREEN focused: task-4-semantic-provenance-focused-tests.txt shows etlNationwide.test.ts passed, 18 tests.
- GREEN full: task-4-semantic-provenance-verify.txt shows typecheck plus all Vitest files passed, 143 tests.
- Manual probe: task-4-semantic-provenance-manual-probe.txt shows empty/missing provenance rejects and complete zero-result provenance accepts.
- Quality receipts: task-4-semantic-provenance-loc.tsv and task-4-semantic-provenance-escape-hatch-scan.txt.
