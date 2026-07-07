# Todo 4 Gate Review

recommendation: REJECT
confidence: high

## originalIntent

Independently verify Todo 4 from `.omo/plans/family-experience-market-ready-platform.md`: harden ETL cache metadata and atomic publish into a production provenance contract for `apps/family-experience-mcp`, without editing source files.

## desiredOutcome

The ETL cache should be safe for public-beta runtime use: source-level provenance metadata, freshness/TTL, record counts, failures, input source set, raw snapshot presence, fixture/live distinction, compatibility behavior, and atomic publish should be enforced well enough that `/mcp` cannot read stale, malformed, mixed-generation, or partially published cache data as valid candidates.

## userOutcomeReview

Not satisfied. Focused ETL tests and MCP smoke pass, and the stale-cache failure path is bounded. However, full package `verify` still fails, the claimed diff artifact is empty while the claimed files are untracked, required manual/notepad artifacts are absent, and an adversarial probe shows a fresh live cache can omit the new provenance fields and still return a candidate.

## blockers

1. Full package verify fails on the current checkout.
   - Command: `npm --prefix apps/family-experience-mcp run verify`
   - Result: exit 1.
   - Evidence: `test/scanClaims.test.ts` has 2 failing tests: `allows explicit include with a public unsupported-claim caveat` and `allows explicit include with an English live-now caveat only`.
   - This matches `.omo/evidence/family-experience-market-ready-platform/task-4-verify.txt`; it is not a confirmed pass.

2. The production provenance contract is bypassable.
   - Code evidence:
     - `apps/family-experience-mcp/src/etl/cacheContract.ts:29` makes `publish_id` optional.
     - `apps/family-experience-mcp/src/etl/cacheContract.ts:31` makes `file_digests` optional.
     - `apps/family-experience-mcp/src/etl/cacheContract.ts:37` makes `source_provenance` optional.
     - `apps/family-experience-mcp/src/etl/cacheContract.ts:176` returns ok when `file_digests` is missing.
     - `apps/family-experience-mcp/src/etl/cacheContract.ts:211` returns ok when `source_provenance` is missing.
   - Adversarial probe: I created a temp cache with `writeCache`, removed `schema_version`, `publish_id`, `file_digests`, and `source_provenance` from `metadata.json`, then queried the cache.
   - Result: exit 0 with `accepted_missing_provenance: true`, `mode: live`, `record_count: 1`.
   - Impact: same-count mixed-generation artifacts without digests/provenance can pass the reader contract, so the shipped behavior does not enforce the claimed production provenance contract.

3. Diff evidence is missing.
   - `.omo/evidence/family-experience-market-ready-platform/task-4-diff.patch` is 0 bytes.
   - `git diff -- apps/family-experience-mcp/src/etl/cache.ts apps/family-experience-mcp/src/etl/cacheContract.ts apps/family-experience-mcp/src/etl/cacheQuery.ts apps/family-experience-mcp/src/etl/cacheRecordScope.ts apps/family-experience-mcp/test/etlNationwide.test.ts` produced no patch.
   - `git status --short` and `task-4-status.txt` show the Todo 4 files as untracked (`??`), so there is no inspectable tracked diff for this gate.

4. Required artifact coverage is incomplete.
   - No Todo 4 manual QA matrix artifact found under `.omo/evidence/family-experience-market-ready-platform/` matching `task-4*manual*`.
   - No Todo 4 notepad artifact found under `.omo/evidence/family-experience-market-ready-platform/` matching `task-4*notepad*`.
   - The code-quality review exists but does not explicitly cover the required remove-ai-slops overfit/slop criteria: deletion-only tests, tautological tests, tests merely verifying removal, implementation-mirroring tests, or unnecessary production extraction/parsing/normalization.

5. Direct remove-ai-slops/programming pass found unresolved maintenance risk.
   - Production touched files are below 250 pure LOC: `cache.ts` 181, `cacheContract.ts` 217, `cacheQuery.ts` 203, `cacheRecordScope.ts` 81.
   - `apps/family-experience-mcp/test/etlNationwide.test.ts` is 368 pure LOC and was extended further as an aggregation test file.
   - The combined test `rejects partial publish state and mixed-generation metadata counts` has two independent When/Then paths in one test, reducing diagnostic clarity.
   - Direct escape-hatch scan found no `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`, `console.log`, `TODO`, or `FIXME` matches in touched files.

## confirmedPasses

- Focused ETL tests pass:
  - Command: `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts`
  - Result: exit 0, 1 file passed, 10 tests passed.
- MCP smoke passes:
  - Command: `npm --prefix apps/family-experience-mcp run smoke:mcp`
  - Result: exit 0, in-memory endpoint, `find_family_experiences`, `result_ok: true`, fixture mode, 1 candidate.
- Stale cache fails closed:
  - Probe result: `stale_rejected: true`, failure code `missing_configuration`, `retryable: false`, no candidate records returned.
  - Existing artifact `.omo/evidence/family-experience-market-ready-platform/task-4-stale-cache.txt` also records `pass: true`.
- Temp probe cleanup:
  - Command: `Get-ChildItem $env:TEMP -Directory -Filter 'todo4-*'`
  - Result: no remaining temp probe directories.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/evidence/family-experience-market-ready-platform/task-4-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-4-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-4-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-stale-cache.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-baseline-partial-cache.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-status.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-loc.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-4-escape-hatch-scan.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-4-diff.patch`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/src/etl/cache.ts`
- `apps/family-experience-mcp/src/etl/cacheContract.ts`
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`
- `apps/family-experience-mcp/src/etl/cacheRecordScope.ts`
- `apps/family-experience-mcp/test/etlNationwide.test.ts`

## adversarialClasses

- stale_state: PASS for stale-cache rejection, but package verify still fails.
- generated/cached artifacts: FAIL because missing provenance/digests/publish metadata can be accepted for a fresh live cache.
- malformed_input: PASS for focused tests covering invalid timestamp and malformed normalized JSONL.
- dirty_worktree: BLOCKER for auditability because claimed files are untracked and the diff artifact is empty.
- misleading_success_output: FAIL for approval because DoneClaim frames focused gates as pass while full `verify` remains red.
- hung/long commands: PASS; rerun commands completed within bounded waits.

## exactEvidenceGaps

- Missing tracked diff for Todo 4 changed files.
- Missing Todo 4 manual QA matrix path.
- Missing Todo 4 notepad path.
- Missing explicit code-review coverage for remove-ai-slops overfit/slop criteria.
- Missing negative test or validator enforcement that v2/current cache metadata must include source provenance and file digests.
- Missing full verify pass.

## rationale

APPROVE would require the code, tests, manual QA, evidence, and user-visible outcome review to agree that Todo 4 is complete. They do not. The narrow ETL cache tests are useful, but they do not cover the bypass where a fresh cache omits provenance/digests, and the current full verification command fails. The artifact set also lacks the inspectable diff and required review evidence expected by the final gate.
