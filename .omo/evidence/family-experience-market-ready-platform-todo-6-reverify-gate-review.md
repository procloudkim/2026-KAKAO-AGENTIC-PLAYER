# Todo 6 Reverify Gate Review

recommendation: REJECT

originalIntent: Todo 6 was to make public `find_family_experiences` output expose trust, freshness, and parent checks. The expected user-visible result is a parent-facing response that shows source name, source URL when present, retrieved/generated timestamp, age-fit basis, confidence, warnings, `parent_check`, and `next_action`, while rejecting or neutralizing unsupported booking, availability, and safety-certification language.

desiredOutcome: Current public structured output and action cards must keep the trust fields required, must not emit unsupported claims such as `available to book and safe for children`, must keep reservation links framed as source-confirmation actions, and must pass focused golden/cache tests, `smoke:golden`, and full `verify` after the integration verify restoration.

userOutcomeReview: The current code and runtime behavior satisfy the main user-visible Todo 6 outcome in the checked workspace state. `FamilyExperienceCandidateSchema` requires the trust fields, scans public copy including `description` and `age_fit_reason`, and rejects the exact unsupported phrase in both fields. The MCP success boundary reparses rendered candidates through `FindFamilyExperiencesStructuredContentSchema` before returning structured output, and the action-card text includes the same trust fields. Focused tests, golden smoke, and full verify all pass now. Formal gate approval is still withheld because required gate artifacts are incomplete and one touched test file remains an unresolved programming/remove-ai-slops maintenance defect.

checkedArtifactPaths:
- `.omo/evidence/family-experience-market-ready-platform/task-6-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-6-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-6-green-focused-tests-rerun.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-6-green-smoke-golden-rerun.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-6-green-schema-description-age-fit.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-6-full-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-regression-verify.txt`
- `.omo/evidence/golden-family-experience-happy.json`
- `.omo/evidence/golden-family-experience-missing-age.json`
- `.omo/evidence/golden-family-experience-no-result.json`
- `.omo/evidence/golden-family-experience-source-failure.json`
- `.omo/evidence/family-experience-market-ready-platform-todo-6-gate-review.md`
- `apps/family-experience-mcp/src/schemas.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/src/mcpSourceRecords.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/src/sources/types.ts`
- `apps/family-experience-mcp/test/golden.test.ts`
- `apps/family-experience-mcp/test/mcpCache.test.ts`
- `apps/family-experience-mcp/scripts/smoke-golden.ts`
- `apps/family-experience-mcp/package.json`

commands:
- `npm --prefix apps/family-experience-mcp test -- --run test/golden.test.ts test/mcpCache.test.ts`
  - PASS: 2 test files, 13 tests.
- `npm --prefix apps/family-experience-mcp run smoke:golden`
  - PASS: `happy`, `missing-age`, `no-result`, and `source-failure` all passed.
- `npm --prefix apps/family-experience-mcp run verify`
  - PASS: `tsc --noEmit` passed, then 18 Vitest files and 134 tests passed.
- Direct schema probe via `node --import tsx --input-type=module -`
  - PASS as rejection: `description_success=false` with path `description`; `age_fit_reason_success=false` with path `age_fit_reason` for `available to book and safe for children`.
- Golden JSON inspection over four regenerated `.omo/evidence/golden-family-experience-*.json` files
  - PASS: all `passed=true`; happy response has 3 candidates and 3 action cards; required trust fields present on candidates/cards where applicable; no forbidden booking/open/safety phrase matched.
- `Get-NetTCPConnection -LocalPort 3345,3346 -State Listen`
  - PASS cleanup: no listeners after stopping the fixture server.
- Pure LOC measurement
  - `schemas.ts`: 188; `mcpSourceRecords.ts`: 128; `golden.test.ts`: 160; `mcpCache.test.ts`: 320.
- Escape-hatch scan on touched files
  - PASS: no matches for `as any`, `@ts-ignore`, `@ts-expect-error`, debug `console.log`, or empty catch patterns.

codeEvidence:
- `apps/family-experience-mcp/src/schemas.ts:79-81` defines unsupported public claim and source-confirmation patterns.
- `apps/family-experience-mcp/src/schemas.ts:83-100` requires `age_fit_reason`, `source_name`, `source_url`, `retrieved_at`, `confidence`, `warnings`, `source_summary`, `parent_check`, and `next_action`.
- `apps/family-experience-mcp/src/schemas.ts:143-158` scans public structured fields including `age_fit_reason`, `description`, and `contact`.
- `apps/family-experience-mcp/src/schemas.ts:162-180` rejects unsupported public copy and requires confirm-at-source copy when `reservation_url` is present.
- `apps/family-experience-mcp/src/pipeline/render.ts:137-169` maps normalized source records into public candidate fields, including source, freshness, confidence, warnings, parent check, next action, and source URL.
- `apps/family-experience-mcp/src/mcp.ts:88-124` parses success structured content through `FindFamilyExperiencesStructuredContentSchema` before returning it.
- `apps/family-experience-mcp/src/mcp.ts:160-183` renders action cards with the required trust fields.
- `apps/family-experience-mcp/test/golden.test.ts:12-31` locks action-card trust fields.
- `apps/family-experience-mcp/test/golden.test.ts:84-120` rejects a candidate missing `parent_check`.
- `apps/family-experience-mcp/test/golden.test.ts:122-158` rejects unsupported availability/safety language in public candidates.
- `apps/family-experience-mcp/test/mcpCache.test.ts:216-268` rejects the exact unsupported phrase through `description` and `age_fit_reason` cache routes.

adversarialClasses:
- unsupported booking/availability/safety claims in public structured fields: PASS. Direct probe and focused tests reject `available to book and safe for children` in both `description` and `age_fit_reason`.
- missing trust fields: PASS. Schema and golden tests reject missing `parent_check`; required trust fields are schema-required and present in regenerated happy action cards.
- reservation URL interpreted as booking availability: PASS. Schema requires confirm-at-source public copy, and focused cache tests verify reservation links remain source-confirmation actions.
- source failure/no candidates: PASS. `smoke:golden` source-failure scenario passed and generated zero action cards.
- stale or empty cache: PASS in focused test coverage. `mcpCache.test.ts` covers stale cache and no-match/no-live-source failures.
- evidence hygiene and scope auditability: FAIL. No reliable branch diff exists for the Todo 6 files because the app tree is untracked, and Todo 6 lacks a manual QA matrix/notepad artifact in the scoped evidence directory.
- programming/remove-ai-slops maintainability: FAIL. `mcpCache.test.ts` is 320 pure LOC, exceeding the 250 pure-LOC ceiling; the DoneClaim notes this but leaves it unresolved.

removeAiSlopsAndProgrammingReview:
- Direct remove-ai-slops pass did not find tautological deletion-only tests or tests that merely verify requested removal; the added tests exercise public schema/MCP behavior and would fail if unsupported source text reached structured output.
- Direct overfit pass found the focused tests appropriately include two independent paths: public schema rejection and cache-route runtime rejection. This addresses the previous blocker where `description` and `age_fit_reason` were omitted.
- Direct programming pass found Zod boundary parsing at MCP input/output, readonly type usage in the inspected public types, no `any` escape hatch in touched files, no non-null/ignore escape hatch in touched files, and no debug logging in touched files.
- Unresolved slop remains in `apps/family-experience-mcp/test/mcpCache.test.ts` at 320 pure LOC. Even though this is test code and not a user-visible runtime failure, the loaded programming/remove-ai-slops criteria classify it as a maintenance defect unless explicitly refactored or justified by an accepted size exception.
- The Todo 6 code-quality report includes an `Overfit / Slop Review` section and mentions no debug/escape-hatch matches, but it does not explicitly document the programming skill perspective as a full checklist and it leaves the oversized test file unresolved.

blockers:
1. Missing Todo 6 manual QA matrix/notepad artifacts. I checked `.omo/evidence/family-experience-market-ready-platform` for `manual`/`notepad`; only Todo 2 and Todo 3 manual artifacts were present, not Todo 6.
2. Missing reliable diff artifact. `git diff -- apps/family-experience-mcp/src/schemas.ts apps/family-experience-mcp/src/mcpSourceRecords.ts apps/family-experience-mcp/test/golden.test.ts apps/family-experience-mcp/test/mcpCache.test.ts` is empty because the relevant app files are untracked, so scope review cannot be tied to a branch diff.
3. Unresolved programming/remove-ai-slops defect: `apps/family-experience-mcp/test/mcpCache.test.ts` is 320 pure LOC.
4. Code review report coverage is partial for this final gate. It has overfit/slop notes, but it does not explicitly show full programming-criteria coverage and does not resolve the oversized test file.

exactEvidenceGaps:
- No Todo 6 manual QA matrix artifact found under `.omo/evidence/family-experience-market-ready-platform`.
- No Todo 6 notepad artifact found under `.omo/evidence/family-experience-market-ready-platform`.
- No branch diff artifact for the untracked Todo 6 app files.
- No explicit accepted size exception or refactor plan for `apps/family-experience-mcp/test/mcpCache.test.ts` at 320 pure LOC.
- No code-review artifact explicitly walking the full programming skill checklist; only partial escape-hatch and overfit/slop statements are present.

finalRationale: Functional reverify is green for the user-visible Todo 6 behavior, including the previous unsupported `description` and `age_fit_reason` blocker and full integration verify restoration. Formal approval is rejected because the final gate policy requires complete artifacts, diff support, and unresolved slop handling before approval.
