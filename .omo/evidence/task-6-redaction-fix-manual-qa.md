# Todo 6 Redaction Fix Manual QA

## Scope

Backfill-only manual QA artifact for the Todo 6 Seoul adapter redaction fix. No product code, tests, plan, Boulder, ledger, Todo 4 files, or sibling workspaces were edited.

## Required Command

Exact command run:

```bash
cd apps/family-experience-mcp && npm test -- --run test/seoulCulture.test.ts test/sources.test.ts && npm run typecheck
```

Observed result:

- Binary result: PASS, exit 0.
- Vitest result: 2 test files passed, 9 tests passed.
- Typecheck result: `tsc --noEmit` passed, exit 0.
- Timestamp from test runner: start 10:38:49.

## Redaction Probe Summary From Gate Review

`.omo/evidence/todo-6-seoul-adapter-redaction-fix-gate-review.md` confirms the fix by source inspection, rerun tests, and injected-loader probes:

- The prior request-loader diagnostics leak is closed.
- `redactRequestDetail` replaces the full keyed URL, the encoded key, and the raw key before diagnostics are returned.
- Probe with a loader throwing text containing the operational URL, raw-key field, and encoded-key field returned `ok: false`, typed code `source_failure`, and no raw key, encoded key, or full keyed URL in diagnostics.
- Additional encoded-key probe with special characters also returned no raw key, encoded key, or full keyed URL.
- Diagnostics still include `<redacted>` and safe `redacted_url` fields.

## Adversarial Class Matrix

| Class | Result | Evidence / note |
| --- | --- | --- |
| malformed input | PASS | `test/seoulCulture.test.ts` includes malformed Seoul payload coverage; gate review confirms malformed payload returns `malformed_source` through the Zod parse boundary. |
| prompt injection | N/A | Todo 6 redaction fix has no prompt surface; adapter returns source records and typed failures only. |
| stale/sample | PASS with caveat | Current acceptance command passed in this run; gate review also inspected prior RED/GREEN evidence and direct source. Fixture/sample paths remain deterministic. |
| dirty worktree | WARN | `git status --short` shows broad untracked `.omo/`, `apps/`, `research/`, `schema/`, and related paths. Git-isolated diff proof is not available. |
| hung commands | PASS | Required tests/typecheck completed promptly and exited 0. No timeout or manual kill was needed. |
| flaky tests | PASS with caveat | `vitest --run` passed once in this run; no retry loop was used or needed. |
| misleading output | PASS | Gate review did not trust GREEN text alone; it independently probed raw-key, encoded-key, and full-keyed-URL absence in returned diagnostics. |

## Additional Commands Recorded

Escape-specific banned TypeScript scan over Todo 6 source/tests and related source-governance files:

```powershell
$files = @('apps/family-experience-mcp/src/sources/seoulCulture.ts','apps/family-experience-mcp/src/sources/types.ts','apps/family-experience-mcp/src/sources/registry.ts','apps/family-experience-mcp/test/seoulCulture.test.ts','apps/family-experience-mcp/test/sources.test.ts'); rg -n --pcre2 '(:\s*any\b|<\s*any\s*>|Promise<\s*any\s*>|Array<\s*any\s*>|Record<[^>]*\bany\b[^>]*>|\bas\s+any\b|\bas\s+unknown\b|@ts-ignore|@ts-expect-error|\benum\b|export\s+default|(?<=[A-Za-z0-9_)\]])!(?=[\.\[;,\)\s]|$)|\.only\(|\.skip\()' $files
```

Result: `NO_MATCHES`. A broader preliminary scan matched `expect.any(Number)` in a Vitest assertion; that is not a TypeScript escape hatch and is excluded from this gate result.

Pure LOC measurement:

```powershell
$paths = @('apps/family-experience-mcp/src/sources/seoulCulture.ts','apps/family-experience-mcp/src/sources/types.ts','apps/family-experience-mcp/test/seoulCulture.test.ts','apps/family-experience-mcp/test/sources.test.ts','apps/family-experience-mcp/src/sources/registry.ts'); foreach ($p in $paths) { $count = (Get-Content $p | Where-Object { $_ -notmatch '^\s*$' -and $_ -notmatch '^\s*(//|#|--)' }).Count; "$count $p" }
```

Result:

- `apps/family-experience-mcp/src/sources/seoulCulture.ts`: 249 pure LOC.
- `apps/family-experience-mcp/src/sources/types.ts`: 165 pure LOC.
- `apps/family-experience-mcp/test/seoulCulture.test.ts`: 146 pure LOC.
- `apps/family-experience-mcp/test/sources.test.ts`: 79 pure LOC.
- `apps/family-experience-mcp/src/sources/registry.ts`: 49 pure LOC.
