# Task 4 Pipeline Implementation Review

Date: 2026-07-02

## Scope

Reviewed Todo 4 files:

- `apps/family-experience-mcp/src/pipeline/normalize.ts`
- `apps/family-experience-mcp/src/pipeline/rank.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/test/pipeline.test.ts`

No product code was edited during this backfill.

## Programming Criteria

### Banned Escape Hatches

Command run:

```powershell
rg -n --pcre2 "as\s+any|as\s+unknown|@ts-ignore|@ts-expect-error|\bany\b|\benum\s+[A-Za-z_$]|export\s+default|[A-Za-z0-9_$\)\]]!($|[\.\[,;\)])|\.skip\(|\.only\(" apps/family-experience-mcp/src/pipeline/normalize.ts apps/family-experience-mcp/src/pipeline/rank.ts apps/family-experience-mcp/src/pipeline/render.ts apps/family-experience-mcp/test/pipeline.test.ts
```

Observed result: no matches. `rg` exited 1, which means no match was found.

Covered criteria:

- `any`: none found.
- `as any`: none found.
- `as unknown`: none found.
- `@ts-ignore`: none found.
- `@ts-expect-error`: none found.
- Non-null assertion: none found by postfix assertion pattern.
- TypeScript `enum` declarations: none found.
- Default export: none found.
- Skipped/focused tests: no `.skip(` or `.only(` found.

Note: an initial broader grep matched `z.enum(...)`. That is Zod boundary parsing, not a TypeScript `enum` declaration. The final grep narrowed enum detection to `enum Name` declarations.

### Zod and Typed Boundaries

PASS.

- `render.ts` accepts untrusted `input: unknown` and parses it with `FindFamilyExperiencesInputSchema.safeParse`.
- `normalize.ts` accepts `source_records: readonly unknown[]` and parses each record once with `SourceRecordSchema.safeParse`.
- `SourceRecordSchema` uses Zod object schemas, `.strict()`, literal and enum schemas, URL validation, integer age bounds, and `superRefine` for date and age-range consistency.
- Interior functions receive typed data: `ParsedSourceRecord`, `NormalizedFamilyExperienceCandidate`, `FindFamilyExperiencesInput`, and discriminated success/failure result unions.

### Readonly and Literal Union Patterns

PASS.

- `AGE_FIT_LABELS = ["source-stated", "inferred", "unknown"] as const` defines the allowed child suitability labels.
- `AgeFitLabel` is derived from the literal tuple instead of a loose string.
- Request, result, and candidate types use `readonly` fields and `readonly` arrays.
- Pipeline ranking and rendering use typed source ids, mode values, child stages, and indoor/outdoor literal unions from existing source/domain modules.
- Tagged/literal decisions use `switch` plus `assertNever` for age-fit labels and source ids.

### LOC Measurement

Command run:

```powershell
$files = @('apps/family-experience-mcp/src/pipeline/normalize.ts','apps/family-experience-mcp/src/pipeline/rank.ts','apps/family-experience-mcp/src/pipeline/render.ts','apps/family-experience-mcp/test/pipeline.test.ts'); foreach ($file in $files) { $pureLoc = (Get-Content $file | Where-Object { $_ -notmatch '^\s*$' -and $_ -notmatch '^\s*//' }).Count; "$pureLoc`t$file" }
```

Observed pure LOC:

```text
248	apps/family-experience-mcp/src/pipeline/normalize.ts
144	apps/family-experience-mcp/src/pipeline/rank.ts
146	apps/family-experience-mcp/src/pipeline/render.ts
160	apps/family-experience-mcp/test/pipeline.test.ts
```

`normalize.ts` warning-band justification:

- At 248 pure LOC, `normalize.ts` is below the hard 250 pure-LOC defect threshold but inside the warning band.
- Its current responsibility is still one reviewable noun phrase: source-record normalization and age-fit labeling.
- It should be split before future growth, likely by extracting source-record schema/boundary parsing from normalized candidate construction.

## Remove-AI-Slops Criteria

### No Skipped or Deleted Tests

PASS with provenance caveat.

- No `.skip(` or `.only(` found in `test/pipeline.test.ts`.
- Current file has 1 `describe` block and 6 runnable `it(...)` tests.
- Fresh acceptance command passed 6/6 tests.
- Because `apps/family-experience-mcp/` is broadly untracked, Git cannot prove historical deletion absence from a clean tracked baseline. Within the current Todo 4 evidence set, no skipped/focused tests or deletion-based fake green were observed.

### No Tautological Implementation-Mirroring Test

PASS.

- Tests assert observable pipeline behavior: top-three rendered candidates, invalid input failure, no-result failure without `candidates`, inferred age evidence, optional field omission, and rejection of invalid age-fit labels.
- Exact top-three ordering is treated as a Todo 4 ranking contract from the plan, not a private implementation detail.
- Tests drive exported pipeline functions and rendered results rather than asserting private helper internals.

### No Fake Green

PASS.

- RED evidence shows 6 failing tests before implementation because pipeline modules were missing.
- GREEN evidence shows 6 passing tests plus `tsc --noEmit`.
- Fresh command in this session also exited 0 with 1 test file and 6 tests passing, followed by typecheck.

### No Unnecessary Abstraction Beyond Todo 4 Scope

PASS.

- `normalize.ts`, `rank.ts`, and `render.ts` map directly to the plan-required pipeline stages.
- Private helpers are localized to boundary parsing, optional field omission, ranking comparisons, boolean scoring, and exhaustive checks.
- No new public abstraction, dependency, factory layer, or pass-through wrapper was found beyond Todo 4 responsibilities.

## Conclusion

Implementation review status: PASS for Todo 4 gate criteria, with one warning-band note for `normalize.ts` size and one provenance caveat for the broad untracked worktree.
