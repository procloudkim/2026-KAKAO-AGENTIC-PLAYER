recommendation: REJECT

blockers:
- B1 provenance completeness fail-open: a live cache with nonempty source_set/source_ids but `source_provenance: []` is accepted when aggregate counts are zero. Independent probe returned `{"ok":true,"mode":"live","records":[]}` for `empty_source_provenance_with_nonempty_source_set`. This violates the production provenance contract because the cache can claim a source set without source-level provenance for those sources.
- B2 report evidence gap: `task-4-code-quality-review.md` covers required-field missing tests and general provenance totals, but it does not cover source_provenance completeness, empty arrays, duplicates, or source/source_id pair integrity. The report coverage is present but incomplete for the trust-boundary claim.

originalIntent:
- Harden Todo 4 ETL cache metadata and atomic publish behavior into a production provenance contract.
- Ensure malformed, stale, partial, or provenance-incomplete cache states fail closed before user-visible records are returned.

desiredOutcome:
- Current/live cache metadata must require `schema_version`, `publish_id`, `file_digests`, and `source_provenance`.
- Cache reads must fail closed for missing metadata, stale cache, partial publish marker, malformed records, fixture/live mismatch, and provenance inconsistency.
- Atomic publish must leave readers seeing either a complete published generation or a bounded fail-closed in-progress state.
- Evidence must include red proof, green focused tests, full verify, manual/runtime probes, code review, overfit/slop review, status/hash/cleanup artifacts, and LOC risk handling.

userOutcomeReview:
- Required missing-field outcomes passed: `schema_version`, `publish_id`, `file_digests`, and `source_provenance` removal from live metadata all returned `ok:false` with `upstream_invalid_response` in an independent runtime probe.
- Required stale/partial/malformed/fixture-live outcomes passed: stale cache, active publish marker, malformed record JSONL, and fixture records under live metadata all returned bounded failures in an independent runtime probe.
- Focused and full verification passed live in this review session.
- User-visible goal is still not fully satisfied because source-level provenance can be present syntactically while empty semantically. That allows a live zero-record cache to pass without per-source provenance even though `source_set` is nonempty.

checkedArtifactPaths:
- apps/family-experience-mcp/src/etl/cacheContract.ts
- apps/family-experience-mcp/src/etl/cache.ts
- apps/family-experience-mcp/src/etl/cacheQuery.ts
- apps/family-experience-mcp/src/etl/cacheRecordScope.ts
- apps/family-experience-mcp/test/etlNationwide.test.ts
- apps/family-experience-mcp/package.json
- .omo/evidence/family-experience-market-ready-platform/task-4-doneclaim.md
- .omo/evidence/family-experience-market-ready-platform/task-4-code-quality-review.md
- .omo/evidence/family-experience-market-ready-platform/task-4-diff.patch
- .omo/evidence/family-experience-market-ready-platform/task-4-red-metadata-tests.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-focused-tests.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-verify.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-manual-cache-query-probes.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-loc.tsv
- .omo/evidence/family-experience-market-ready-platform/task-4-status.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-file-hashes.tsv
- .omo/evidence/family-experience-market-ready-platform/task-4-escape-hatch-scan.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-evidence-index.tsv
- .omo/evidence/family-experience-market-ready-platform/task-4-notepad.md
- .omo/evidence/family-experience-market-ready-platform/task-4-cleanup.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-stale-cache.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-baseline-partial-cache.txt
- .omo/evidence/family-experience-market-ready-platform/task-4-claim-scan-repro.txt

commands:
- `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts`: PASS, 1 file, 14 tests.
- `npm --prefix apps/family-experience-mcp run verify`: PASS, typecheck plus 18 test files, 139 tests.
- Independent runtime probe from `apps/family-experience-mcp`: PASS for missing schema_version, missing publish_id, missing file_digests, missing source_provenance, stale cache, partial publish marker, malformed record JSONL, and fixture/live mismatch.
- Additional provenance completeness probe from `apps/family-experience-mcp`: FAIL-GATE, empty source_provenance with nonempty source_set returned `ok:true`.
- LOC scan: `cacheContract.ts` 250 pure LOC, `etlNationwide.test.ts` 456 pure LOC with existing SIZE_OK waiver, `cache.ts` 181, `cacheQuery.ts` 203.
- Escape-hatch scan: no matches for `as any`, `as unknown`, ts-ignore/expect-error, debugger, debug markers, empty catch, or swallowed `.catch`.

evidence:
- `cacheMetadataSchema` requires `schema_version: 2`, `publish_id`, `file_digests`, and `source_provenance`.
- `parseCacheMetadata` rejects modern partial metadata unless it matches the narrow old fixture-only shape.
- `queryNationwideCache` fails closed on malformed metadata, stale TTL, malformed records, publish marker, and contract validation failures before returning records.
- `writeCache` writes a publish marker, writes generation-specific temp files, renames normalized/raw/metadata files, then removes the marker; the reader checks the marker before and after file reads.
- `validateSourceContract` checks aggregate totals and rejects provenance entries outside `source_set`/`source_ids`, but it does not require `source_provenance` to cover every source in `source_set` or contain at least one entry.

adversarialClasses:
- missing `schema_version`: confirmed fail-closed.
- missing `publish_id`: confirmed fail-closed.
- missing `file_digests`: confirmed fail-closed.
- missing `source_provenance`: confirmed fail-closed.
- stale cache: confirmed fail-closed.
- partial publish marker: confirmed fail-closed and retryable.
- malformed normalized record JSONL: confirmed fail-closed.
- fixture records under live metadata with repaired digest: confirmed fail-closed.
- mixed-generation metadata count mismatch: covered by focused test.
- empty source_provenance with nonempty source_set and zero counts: fail-open blocker.
- duplicate or mismatched source/source_id pair integrity: not covered by tests or review artifact; related evidence gap.

overfitSlopReview:
- Tests are mostly behavior-surface tests through `queryNationwideCache`, not implementation-mirroring unit tests.
- The red artifact proves the four new missing-field tests failed before the fix by returning `ok:true`.
- Focused tests assert failure classes, not exact prose, which avoids brittle wording overfit.
- No deletion-only or tautological tests found in the Todo 4 additions.
- No unnecessary production extraction found in `cacheContract.ts`; helpers are cohesive validation units.
- 250 LOC risk: exact 250 pure LOC in `cacheContract.ts` is at the ceiling. I accept it as a warning with split-next-risk, not as the decisive blocker, because the next cache-contract behavior change should split schema definitions from validators before adding more logic. The current rejection is due to fail-open provenance completeness.

exactEvidenceGaps:
- No test or manual probe rejects `source_provenance: []` when `source_set` is nonempty.
- No test or manual probe rejects source_provenance missing one of multiple source_set entries when aggregate counts can still match.
- No test or validator proves each `source_provenance[*].source_id` is the canonical ID for its `source`.
- No duplicate source/source_id provenance rejection exists.

rationale:
- The user-requested explicit missing-field and cache-corruption checks are green, and the refreshed evidence artifacts are internally consistent for those cases.
- Approval requires the production provenance contract to fail closed, not merely the four field-removal regressions.
- Because a semantically empty source_provenance array can pass the reader boundary for a live cache, the contract still permits unsupported provenance claims and creates false confidence for zero-result cache generations.
