# Todo 6 Gate Review: Public Trust Output

recommendation: REJECT

originalIntent: Verify Todo 6 from `.omo/plans/family-experience-market-ready-platform.md`: public `find_family_experiences` success output must expose source trust, freshness, age-fit basis, confidence, warnings, `parent_check`, and `next_action`; must not fabricate missing source details; reservation-like fields must be framed as confirm-at-source, not availability or booking.

desiredOutcome: A parent-facing public response that consistently exposes provenance and parent checks, rejects missing trust fields, rejects unsupported availability/safety language across public output, and passes the requested focused, smoke, and full verification gates.

userOutcomeReview: The current artifact partially satisfies the trust-field shape. Types and schemas require source name, source URL, retrieved timestamp, age-fit fields, confidence, warnings, `parent_check`, and `next_action`; the runtime maps source records through normalization/rendering and reparses success output through the public schema. However, unsupported availability/safety language can still pass in public structured fields (`description`, `age_fit_reason`) because the schema only scans selected fields. Full package verification fails, and `smoke:golden` failed in the independently rerun source-failure scenario.

checkedArtifactPaths:
- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/evidence/family-experience-market-ready-platform/task-6-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-6-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-6-focused-tests.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-6-smoke-golden.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-6-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-6-negative-schema.txt`
- `apps/family-experience-mcp/src/types.ts`
- `apps/family-experience-mcp/src/schemas.ts`
- `apps/family-experience-mcp/src/pipeline/sourceRecord.ts`
- `apps/family-experience-mcp/src/pipeline/normalize.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`
- `apps/family-experience-mcp/src/etl/cacheContract.ts`
- `apps/family-experience-mcp/test/golden.test.ts`
- `apps/family-experience-mcp/test/mcpCache.test.ts`
- `.omo/evidence/golden-family-experience-happy.json`
- `.omo/evidence/golden-family-experience-source-failure.json`

commands:
- `git status --short`
  - Result: dirty worktree with many untracked `.omo` artifacts and the `apps/family-experience-mcp` app tree; the claimed changed files are untracked.
- `git diff -- apps/family-experience-mcp/src/types.ts apps/family-experience-mcp/src/schemas.ts apps/family-experience-mcp/test/golden.test.ts apps/family-experience-mcp/test/mcpCache.test.ts`
  - Result: empty because the relevant app files are untracked; no reliable branch diff was available.
- `npm --prefix apps/family-experience-mcp test -- --run test/golden.test.ts test/mcpCache.test.ts`
  - Result: PASS, 2 files / 10 tests.
- `npm --prefix apps/family-experience-mcp run verify`
  - Result: FAIL. Typecheck passed, then Vitest failed in `test/scanClaims.test.ts`: two caveat-allowance tests expected status 0 and received status 1.
- Fixture server on `127.0.0.1:3345` plus `npm --prefix . run smoke:golden`
  - Result: FAIL. `happy`, `missing-age`, and `no-result` passed; `source-failure` failed `safe_korean_message`. The generated source-failure artifact returned `no_results` text instead of the expected source/configuration failure wording.
- Direct reservation schema probe with `reservation_url` and no confirm-at-source wording.
  - Result: PASS as rejection: `success=false`, issue path `reservation_url`.
- Direct malformed source-record runtime probe missing `source.url`.
  - Result: PASS as rejection: render returned `ok=false`, `upstream_invalid_response`; no placeholder source URL was fabricated.
- Direct unsupported public-copy probe with `book now`, `currently open`, and `safe for children` in fields scanned by the schema.
  - Result: PASS as rejection: `success=false`, issue path `warnings`.
- Direct unsupported structured-output probe with `description: "available to book and safe for children"`.
  - Result: FAIL as gate: schema returned `success=true`.
- Direct unsupported structured-output probe with `age_fit_reason: "book now; currently open; safety certified"`.
  - Result: FAIL as gate: schema returned `success=true`.
- Direct runtime render probe with source `program_text: "available to book and safe for children"`.
  - Result: FAIL as gate: render returned `ok=true` and exposed that text as public `description`.

blockers:
1. Unsupported availability/safety language is not rejected across all public structured output. `apps/family-experience-mcp/src/schemas.ts` builds `publicCopy` from only `title`, `fee_text`, `warnings`, `source_summary`, `parent_check`, and `next_action` (lines 143-150). Public `description` and `age_fit_reason` are omitted, and both direct probes parsed successfully with unsupported booking/safety wording.
2. Runtime can return a successful public candidate whose `description` contains unsupported availability/safety language from source `program_text`. The direct render probe returned `ok=true` with `description: "available to book and safe for children"`.
3. Full `npm --prefix apps/family-experience-mcp run verify` is not green. Current failure is 2 failing tests in `test/scanClaims.test.ts`, not the older Todo 4 type error reported in the doneclaim.
4. Independently rerun `smoke:golden` is not green in the default fixture-server setup. The `source-failure` scenario failed `safe_korean_message` because it returned a `no_results` response.
5. No trustworthy diff was available. The relevant app files are untracked, and `git diff -- <claimed paths>` is empty, so scope review cannot be tied to a branch diff.

adversarialClasses:
- untrusted_external_text: PARTIAL/FAIL. The focused cache test proves prompt-injection-like text is treated as data, but unsupported booking/safety wording in `program_text` can still become public `description` on a successful response.
- malformed_input/schema: PASS for checked cases. Missing `parent_check` is rejected, and missing `source.url` returns `upstream_invalid_response` instead of fabricated details.
- misleading_success_output: FAIL. A success response can include unsupported availability/safety language in public structured fields outside the schema scan.
- stale_state: PASS for focused cache test coverage. `mcpCache.test.ts` includes stale-cache failure behavior and the focused test command passed.
- dirty_worktree: FAIL as evidence condition. Worktree has many untracked artifacts/files, including the claimed Todo 6 files; no clean diff exists.

removeAiSlopsAndProgrammingReview:
- Direct slop/overfit pass found narrow, implementation-mirroring coverage: the negative unsupported-claim test puts claims in the same selected fields the implementation scans, while public structured fields not in that list remain uncovered.
- The prior code-quality report includes an overfit/slop section and adversarial-class section, but it is unsupported by the direct probes above because it does not cover public `description` or `age_fit_reason`.
- No oversized production file was found in Todo 6 files. `mcpCache.test.ts` remains in the warning band at 246 pure LOC.

exactEvidenceGaps:
- Missing code review support for the full public structured-output surface, especially `description` and `age_fit_reason`.
- Missing test proving unsupported availability/safety language is rejected from every user-visible or client-visible success-output field.
- Missing clean branch diff for the claimed changed files because the app tree is untracked.
- Missing green full verification.
- Missing green independently rerun golden smoke under the documented command shape.

rationale: Rejecting is required because the user-visible goal is not merely adding required fields. The shipped schema/tests allow unsupported booking/safety wording to survive in successful structured output, and two requested verification gates currently fail.
