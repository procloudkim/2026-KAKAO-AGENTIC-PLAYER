# Task 4 Pipeline Diff Summary

Date: 2026-07-02

## Provenance Note

This repository subtree is broadly untracked. `git status --short apps/family-experience-mcp .omo/evidence` reports:

```text
?? .omo/evidence/
?? apps/family-experience-mcp/
```

`git diff -- apps/family-experience-mcp/src/pipeline/normalize.ts apps/family-experience-mcp/src/pipeline/rank.ts apps/family-experience-mcp/src/pipeline/render.ts apps/family-experience-mcp/test/pipeline.test.ts` produced no output because these files are not tracked in Git.

Therefore this artifact summarizes the observed Todo 4 file set and responsibilities. It does not claim Git can isolate an exact origin-to-current diff.

## Todo 4 Files and Responsibilities

### `apps/family-experience-mcp/src/pipeline/normalize.ts`

Responsibility: parse unknown source records into typed normalized family-experience candidates and assign age-fit labels.

Observed behavior:

- Defines `AGE_FIT_LABELS` as exactly `source-stated`, `inferred`, and `unknown`.
- Defines `AgeFitLabelSchema` with Zod.
- Parses source records with a strict Zod schema.
- Rejects invalid source records as `upstream_invalid_response`.
- Converts `null` reservation/contact values into absent optional fields.
- Produces quoted source evidence for inferred age-fit reasons.

### `apps/family-experience-mcp/src/pipeline/rank.ts`

Responsibility: filter and rank normalized candidates for a family request.

Observed behavior:

- Matches date-range overlap.
- Scores location relevance.
- Requires child age or child stage to match a candidate.
- Ranks by date overlap, location relevance, source-stated/inferred/unknown age-fit priority, indoor/outdoor preference, completeness, start date, and source order.

### `apps/family-experience-mcp/src/pipeline/render.ts`

Responsibility: parse tool input, run normalization/ranking, and render the Todo 4 response shape.

Observed behavior:

- Parses untrusted input through `FindFamilyExperiencesInputSchema.safeParse`.
- Propagates invalid input and invalid source-record failures.
- Returns `no_results` without fabricated candidates when no eligible candidates remain.
- Returns at most three ranked candidates.
- Maps source ids to public source labels exhaustively.
- Omits `reservation_url` and `contact` when source records do not provide them.

### `apps/family-experience-mcp/test/pipeline.test.ts`

Responsibility: acceptance coverage for Todo 4 behavior.

Observed coverage:

- Happy prompt returns exactly three ranked candidates.
- Missing child selector returns an invalid-input clarification/failure state.
- No-result path does not fabricate candidates.
- Inferred age labels include quoted source evidence.
- Missing reservation/contact fields are absent and do not become availability claims.
- `computed` and `stale` are rejected as child suitability age-fit labels.

## Non-Todo-4 Dependencies Observed

Todo 4 depends on earlier source and schema work, including:

- `apps/family-experience-mcp/src/schemas.ts`
- `apps/family-experience-mcp/src/types.ts`
- `apps/family-experience-mcp/src/sources/fixture.ts`
- `apps/family-experience-mcp/src/sources/types.ts`

These are dependencies for the pipeline review, not claimed here as Todo 4 implementation changes.

## Verification Summary

Required acceptance command:

```powershell
cd apps/family-experience-mcp && npm test -- --run test/pipeline.test.ts && npm run typecheck
```

Observed result: PASS, exit code 0, 1 test file passed, 6 tests passed, typecheck passed.

Banned escape grep:

```powershell
rg -n --pcre2 "as\s+any|as\s+unknown|@ts-ignore|@ts-expect-error|\bany\b|\benum\s+[A-Za-z_$]|export\s+default|[A-Za-z0-9_$\)\]]!($|[\.\[,;\)])|\.skip\(|\.only\(" apps/family-experience-mcp/src/pipeline/normalize.ts apps/family-experience-mcp/src/pipeline/rank.ts apps/family-experience-mcp/src/pipeline/render.ts apps/family-experience-mcp/test/pipeline.test.ts
```

Observed result: no matches; `rg` exit code 1 means no match.

Pure LOC:

```text
248	apps/family-experience-mcp/src/pipeline/normalize.ts
144	apps/family-experience-mcp/src/pipeline/rank.ts
146	apps/family-experience-mcp/src/pipeline/render.ts
160	apps/family-experience-mcp/test/pipeline.test.ts
```

## Conclusion

Diff-summary status: PASS as an evidence backfill artifact, with explicit untracked-worktree limitation.
