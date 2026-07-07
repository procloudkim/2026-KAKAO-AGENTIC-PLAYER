# Todo 6 Code-Quality Review

## Scope
- Reviewed changed Todo 6 files: `schemas.ts`, `mcpSourceRecords.ts`, `golden.test.ts`, `mcpCache.test.ts`.
- Did not edit `types.ts`.
- Did not edit Todo 7 secret scanner implementation or Todo 4 ETL cache implementation files.

## Structured Field Language
- `FamilyExperienceCandidateSchema` now checks unsupported availability/safety language across public structured prose fields, including `description` and `age_fit_reason`.
- The check reports the exact offending path instead of only assigning the issue to `warnings`.
- The MCP cache tests cover forbidden language in `description` via `program_text` and in `age_fit_reason` via source-stated `parent_check.age_fit`.

## Source-Failure Language
- Empty cache with no live source now returns `missing_configuration` instead of flowing to render as `no_results`.
- Golden source-failure output now includes Korean configuration guidance and no candidates.

## No Fabrication
- The fix rejects unsupported source text at the public structured-content boundary.
- It does not invent booking status, live status, safety certification, dates, fees, or source details.
- Existing source-grounded caveats and parent checks remain permitted when they do not contain unsupported claims.

## Overfit / Slop Review
- The schema change is field-list based and covers all current user-visible public prose fields, not just the reported string.
- The cache-empty change is limited to the no-live-source branch and preserves cache hits plus configured live fallback.
- No debug statements, `as any`, `@ts-ignore`, or `@ts-expect-error` matches were found in changed files.
- LOC note: `mcpCache.test.ts` is 320 pure LOC after this task and was already oversized before these targeted regressions. I did not refactor it because the user explicitly constrained write scope and asked for Todo 6 blockers only.

## Residual Risk
- `callFindFamilyExperiences` rejects invalid structured output via schema parse. That prevents public unsupported structured output, but the lower-level renderer can still build an intermediate candidate before the boundary rejects it.
- Full verify still fails in `scanClaims.test.ts` caveat allowlist tests outside Todo 6.
