# Todo 6 Current Reverify Gate Review

recommendation: REJECT

originalIntent: Todo 6 requires public `find_family_experiences` output to expose source trust, freshness, and parent checks. Public success output must include source name, source URL when present, retrieved/generated timestamp, age-fit basis, confidence, warnings, `parent_check`, and `next_action`; it must not fabricate source details; reservation-like fields must be framed as confirm-at-source and must not imply booking, availability, live/open status, or child safety certification.

desiredOutcome: A current artifact-backed verdict showing that schemas, rendering, tests, golden output, and verification support the parent-facing trust contract and unsupported-claim suppression.

userOutcomeReview: The functional Todo 6 output path is mostly green in the current workspace. `FamilyExperienceCandidateSchema` requires the trust fields and rejects `available to book and safe for children` in public structured fields including `description` and `age_fit_reason`. `mcp.ts` reparses success output through the public schema before returning it, and the success text/action-card path includes the trust fields. Focused Todo 6 tests pass, and `smoke:golden` passes all four scenarios when run under the required fixture HTTP server precondition. Formal approval is rejected because full `npm --prefix apps/family-experience-mcp run verify` fails now at TypeScript typecheck in `src/etl/cacheContract.ts`, and evidence completeness/slop gaps remain.

checkedArtifactPaths:
- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/evidence/family-experience-market-ready-platform/task-6-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-6-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-6-green-schema-description-age-fit.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-6-green-focused-tests-rerun.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-6-green-smoke-golden-rerun.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-regression-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform-todo-6-gate-review.md`
- `.omo/evidence/family-experience-market-ready-platform-todo-6-reverify-gate-review.md`
- `.omo/evidence/golden-family-experience-happy.json`
- `.omo/evidence/golden-family-experience-missing-age.json`
- `.omo/evidence/golden-family-experience-no-result.json`
- `.omo/evidence/golden-family-experience-source-failure.json`
- `apps/family-experience-mcp/src/schemas.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/src/mcpSourceRecords.ts`
- `apps/family-experience-mcp/src/etl/cacheContract.ts`
- `apps/family-experience-mcp/test/golden.test.ts`
- `apps/family-experience-mcp/test/mcpCache.test.ts`
- `apps/family-experience-mcp/scripts/smoke-golden.ts`
- `apps/family-experience-mcp/package.json`

commands_run:
- `npm --prefix apps/family-experience-mcp test -- --run test/golden.test.ts test/mcpCache.test.ts` -> PASS, 2 files and 13 tests.
- `npm --prefix apps/family-experience-mcp run smoke:golden` with no server pre-started -> FAIL; happy/missing-age/no-result failed due missing/default endpoint behavior, source-failure passed.
- Fixture server precondition: `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm --prefix apps/family-experience-mcp run dev:http` -> server listened on `127.0.0.1:3345`.
- `npm --prefix apps/family-experience-mcp run smoke:golden` with fixture server listening -> PASS; happy, missing-age, no-result, and source-failure all passed.
- `npm --prefix apps/family-experience-mcp run verify` -> FAIL at `tsc --noEmit`; Vitest did not run.
- Direct schema probe from `apps/family-experience-mcp` using `node --import tsx --input-type=module -e ...` -> PASS as rejection for `available to book and safe for children` in `description`, `age_fit_reason`, `title`, `fee_text`, `warnings`, `source_summary`, `parent_check`, `next_action`, and `contact`.
- Golden JSON inspection over four regenerated `.omo/evidence/golden-family-experience-*.json` files -> PASS; all `passed=true`, happy has 3 candidates and 3 action cards, required trust fields are present, and forbidden phrase scan is false.
- Pure LOC measurement -> `schemas.ts` 188, `mcpSourceRecords.ts` 128, `golden.test.ts` 160, `mcpCache.test.ts` 320.
- Escape-hatch scan over touched files for `as any`, `@ts-ignore`, `@ts-expect-error`, debug `console.log`, empty catch -> PASS, no matches.

codeEvidence:
- `apps/family-experience-mcp/src/schemas.ts:79-80` defines unsupported public-claim pattern including `safe for children` and `available to book`.
- `apps/family-experience-mcp/src/schemas.ts:83-100` requires public trust fields on `FamilyExperienceParentActionCardSchema`.
- `apps/family-experience-mcp/src/schemas.ts:143-158` includes `age_fit_reason`, `description`, and other public prose fields in unsupported-claim scanning.
- `apps/family-experience-mcp/src/schemas.ts:162-180` rejects unsupported public copy and requires confirm-at-source copy for `reservation_url`.
- `apps/family-experience-mcp/src/pipeline/render.ts:137-169` maps normalized records into public candidate trust fields.
- `apps/family-experience-mcp/src/mcp.ts:88-124` parses success structured content through `FindFamilyExperiencesStructuredContentSchema` before return.
- `apps/family-experience-mcp/src/mcp.ts:160-183` renders parent-facing action-card text with source, freshness, confidence, warnings, `parent_check`, and `next_action`.
- `apps/family-experience-mcp/test/golden.test.ts:12-31` locks action-card trust fields.
- `apps/family-experience-mcp/test/golden.test.ts:84-158` rejects missing `parent_check` and unsupported availability/safety language.
- `apps/family-experience-mcp/test/mcpCache.test.ts:216-268` rejects the exact unsupported phrase through cache `description` and age-fit routes.

blockers:
1. Full verify fails in the current workspace. `npm --prefix apps/family-experience-mcp run verify` exits 1 during `tsc --noEmit` with `src/etl/cacheContract.ts(132,3)` legacy metadata assignment incompatibility and `src/etl/cacheContract.ts(175,20)` / `(176,20)` `raw_snapshots_present` access errors on `CacheMetadata`.
2. `smoke:golden` is not self-contained. It fails when run exactly without the fixture HTTP server already listening; it passes only after the fixture server is started as described in the done-claim.
3. No reliable branch diff exists for the Todo 6 files because the app tree is untracked and `git diff -- <claimed paths>` is empty.
4. No Todo 6 manual QA matrix/notepad artifact was found under `.omo/evidence/family-experience-market-ready-platform`; only code-quality and command receipts were present.
5. `apps/family-experience-mcp/test/mcpCache.test.ts` is 320 pure LOC. This violates the loaded programming/remove-ai-slops 250 pure-LOC ceiling and lacks an accepted size exception.
6. The Todo 6 code-quality report has an overfit/slop section, but it does not explicitly walk the full programming criteria and leaves the oversized test file unresolved.

adversarial_classes:
- unsupported booking/availability/safety language in public structured fields: PASS. Direct probe rejects the exact phrase in all checked public prose fields, including `description` and `age_fit_reason`.
- missing trust fields: PASS for checked cases. Schema/action-card tests require trust fields; missing `parent_check` is rejected.
- reservation link interpreted as booking availability: PASS for checked cases. Schema requires confirm-at-source public copy, and cache tests assert reservation links remain confirmation actions without forbidden booking/open claims.
- golden source failure/no candidates: PASS under fixture-server precondition. Source-failure scenario passes with zero candidates/action cards and safe error text.
- current full package verification: FAIL. TypeScript errors in `src/etl/cacheContract.ts` block full verify.
- evidence completeness and scope auditability: FAIL. Missing clean diff, missing Todo 6 manual QA/notepad, and untracked app files.
- remove-ai-slops/programming maintainability: FAIL. Oversized `mcpCache.test.ts` remains unresolved.

exactEvidenceGaps:
- No green current full `verify` receipt; current verify fails before tests.
- No self-contained green `smoke:golden` without pre-started fixture server.
- No branch diff or diff artifact tying Todo 6 scope to the current untracked files.
- No Todo 6 manual QA matrix artifact.
- No Todo 6 notepad path artifact.
- No accepted size exception or refactor for `apps/family-experience-mcp/test/mcpCache.test.ts`.
- No code-review artifact explicitly covering the full programming skill checklist.

rationale: The user-visible Todo 6 behavior that was previously broken is now confirmed for the checked schema, runtime boundary, focused tests, and golden output under the required fixture-server precondition. Approval is still not supportable because the required full verify gate currently fails and the final gate requires complete artifacts, diff support, and unresolved slop handling before approval.
