# Task 4 Canonical Source Pair DoneClaim

Status: IMPLEMENTED_AND_VERIFIED

Changed files:
- apps/family-experience-mcp/src/etl/cacheContract.ts
- apps/family-experience-mcp/test/etlNationwide.test.ts
- .omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-*

Implementation:
- `validateSourceContract` now rejects any `source_provenance` entry where `sourceMap[source] !== source_id`.
- Added a focused ETL cache-boundary regression for zero-record live cache metadata with swapped canonical pairs: `culture_portal -> kto-tourapi-events` and `kto_tourapi -> culture-portal-oneview`.
- Preserved existing valid zero-result complete provenance and zero-result failure-status provenance behavior.
- Did not touch Todo 6, Todo 7, or claim scanner files.

Required proof:
1. RED direct proof before fix: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-RED.txt`
   - Invocation: `npm --prefix apps/family-experience-mcp exec tsx -- <temp red probe>`
   - Scenario: zero-record live cache with swapped canonical source/source_id pairs.
   - Observable: `{"result":{"ok":true}}` and `RED_REPRODUCED`.
2. RED focused test before fix: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-test-RED.txt`
   - Invocation: `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts`
   - Observable: 1 failed test, expected `ok:false`, received `ok:true` for swapped provenance.
3. Swapped pair rejection test after fix: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-focused-tests.txt`
   - Invocation: `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts`
   - Observable: 1 test file passed, 19 tests passed.
4. Valid zero-result complete provenance and failure-status provenance preserved:
   - Covered by focused ETL tests in `task-4-canonical-pair-focused-tests.txt`.
   - Also directly probed in `task-4-canonical-pair-manual-probe.txt` with both valid scenarios returning `{"ok":true}`.
5. Full verify: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-verify.txt`
   - Invocation: `npm --prefix apps/family-experience-mcp run verify`
   - Observable: `tsc --noEmit` passed, 18 test files passed, 144 tests passed.
6. Manual swapped-pair reject probe: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-manual-probe.txt`
   - Invocation: `npm --prefix apps/family-experience-mcp exec tsx -- <temp manual probe>`
   - Observable: `swapped_canonical_pairs` returned `{"ok":false,"message":"source-level provenance source/source_id pair does not match source registry"}`.
7. Review/evidence and cleanup:
   - Code review receipt: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-code-quality-review.md`
   - LOC receipt: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-loc.tsv`
   - Escape-hatch scan: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-escape-hatch-scan.txt`
   - Cleanup receipt: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-cleanup.txt`
   - File hashes: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-file-hashes.tsv`
   - Status receipt: `.omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-status.txt`

Cleanup:
- No dev server was started.
- Temp probe scripts were removed; cleanup receipt records both expected temp paths as absent.

Risks:
- The target app files and Todo 4 evidence directory are untracked in the current Git baseline, so status receipts show `??` entries.
- `etlNationwide.test.ts` remains large under its existing SIZE_OK waiver; this task did not broaden into test-suite restructuring.

Primary evidence:
- .omo/evidence/family-experience-market-ready-platform/task-4-canonical-pair-doneclaim.md
