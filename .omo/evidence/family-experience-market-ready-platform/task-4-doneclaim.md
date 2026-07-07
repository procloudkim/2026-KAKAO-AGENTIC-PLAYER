# Task 4 DoneClaim

Status: IMPLEMENTED_AND_VERIFIED

Changed files:
- apps/family-experience-mcp/src/etl/cacheContract.ts
- apps/family-experience-mcp/test/etlNationwide.test.ts
- .omo/evidence/family-experience-market-ready-platform/task-4-code-quality-review.md
- .omo/evidence/family-experience-market-ready-platform/task-4-red-metadata-tests.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-focused-tests.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-verify.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-manual-cache-query-probes.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-diff.patch
- .omo/evidence/family-experience-market-ready-platform/task-4-status.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-notepad.md
- .omo/evidence/family-experience-market-ready-platform/task-4-cleanup.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-file-hashes.tsv
- .omo/evidence/family-experience-market-ready-platform/task-4-loc.tsv
- .omo/evidence/family-experience-market-ready-platform/task-4-escape-hatch-scan.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-evidence-index.tsv

Inspected but not modified:
- apps/family-experience-mcp/src/etl/cache.ts
- apps/family-experience-mcp/src/etl/cacheQuery.ts
- apps/family-experience-mcp/src/etl/cacheRecordScope.ts

Implemented:
- Current cache metadata now requires schema_version = 2, publish_id, file_digests, and source_provenance in cacheMetadataSchema.
- The reader fails closed for live/market metadata missing any required provenance or integrity field before returning records.
- The old compatibility path is restricted to minimal fixture-only legacy metadata without modern cache fields.
- Added focused regression tests for missing schema_version, publish_id, file_digests, and source_provenance.

Commands and results:
- RED: npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts -> task-4-red-metadata-tests.txt. Result: FAIL, 4 missing-field tests received ok=true before the fix.
- Focused ETL: npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts -> task-4-focused-tests.txt. Result: PASS, 14 tests.
- Full verify: npm --prefix apps/family-experience-mcp run verify -> task-4-verify.txt. Result: PASS, typecheck clean, 18 test files passed, 139 tests passed.
- Manual cache-query probes: node --import tsx --input-type=module -e <inline cache-query probes> -> task-4-manual-cache-query-probes.txt. Result: missing metadata, stale cache, partial publish marker, and malformed record JSONL all returned ok=false with bounded failure codes.
- Escape-hatch/debug scan: changed-file Select-String scan -> task-4-escape-hatch-scan.txt. Result: PASS, no matches.

Artifacts:
- task-4-red-metadata-tests.txt: red proof for missing metadata acceptance.
- task-4-focused-tests.txt: focused ETL regression test proof.
- task-4-verify.txt: full package verify proof.
- task-4-manual-cache-query-probes.txt: manual reader-surface QA proof.
- task-4-code-quality-review.md: overfit/slop and trust-boundary review.
- task-4-diff.patch: nonempty untracked-aware no-index patch.
- task-4-status.txt: scoped status for allowed paths.
- task-4-file-hashes.tsv: SHA-256 receipt for changed evidence/code files.
- task-4-loc.tsv: post-write pure LOC receipt.
- task-4-notepad.md: manual notepad artifact.
- task-4-cleanup.txt: cleanup receipt.

Cleanup:
- No debugger sessions or background servers were started.
- Manual probe temp cache directories were removed by finally blocks.
- No root .debug-journal.md was created because the user write scope limited evidence to task-4-* paths.
- Unrelated staged/untracked work was preserved.

Risks:
- cacheContract.ts is at 250 pure LOC. The next nontrivial cache-contract change should split schema definitions from contract validation before adding more behavior.
- The app tree is untracked in this repo, so task-4-diff.patch uses git diff --no-index against /dev/null to provide a reviewable patch artifact.
