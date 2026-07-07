# Todo 7 Fix2 Implementation Review

## Scope

- Changed code only in `apps/family-experience-mcp/scripts/scan-secrets.ts` and `apps/family-experience-mcp/test/scanSecrets.test.ts`.
- Evidence written only under `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-*`.
- Todo 4 ETL, Todo 6 output, and claim scanner files were not edited in this fix2 pass.

## Defect Reviewed

- Failure mode: `API_KEY=<redacted-synthetic-secret>` was accepted because placeholder allowance used substring matching inside the matched occurrence.
- RED artifact: `task-7-fix2-red-embedded-placeholder.txt` shows explicit `--include` returned exit 0 / PASS before the fix.
- Security impact: a real-looking longer token could be hidden by embedding an allowed placeholder prefix.

## Fix Reviewed

- Placeholder allowance now extracts the full matched secret value from bearer, query-keyed URL, path-keyed URL, and assignment occurrences.
- The allowlist comparison is exact equality against that extracted full value.
- Pure fixture placeholders remain allowed only when the full extracted value equals an allowed placeholder.
- Placeholder-embedded longer values and separate mixed placeholder-plus-secret lines are rejected.

## Required Coverage

- Embedded placeholder rejection: `scanSecrets.test.ts` now includes `flags placeholder-embedded longer key assignments`.
- Pure placeholder allowance: existing `allows pure synthetic service key placeholders` remains green under the exact-value matcher.
- Mixed-token rejection: existing unit and include-path tests remain green.
- Manual untrusted include probes:
  - `task-7-fix2-embedded-include-after-fix.txt` exits 1 with `key-assignment`.
  - `task-7-fix2-mixed-include-after-fix.txt` exits 1 with `key-assignment`.

## Overfit And Slop Review

- Not an exact-string-only hack: the fix does not special-case `CLI_SYNTHETIC_SERVICE_KEY_REDACTED_SUFFIX`; it changes the matcher to extract and compare the full occurrence value for every rule shape.
- No scanner weakening: secret regexes were not relaxed or removed; rejection remains default unless the complete extracted value exactly matches an allowed placeholder.
- Substring allowance risk closed: `text.includes(placeholder)` was removed from the allow decision.
- Untrusted include preserved: `--include` still scans caller-supplied files through the same scanner and fails closed on findings.
- No broad rewrite: file listing, include resolution, evidence scan surfaces, and CLI behavior were left unchanged.
- No unrelated cleanup: ETL, output/schema, and claim scanner files were not touched.
- Escape-hatch check: no `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`, `.only(`, or `.skip(` was added in the two changed TypeScript files.
- Size check: `task-7-fix2-loc.tsv` records `scan-secrets.ts` at 179 pure LOC and `scanSecrets.test.ts` at 116 pure LOC.

## Validation

- Focused scanner tests: `task-7-fix2-focused-scanSecrets.txt`, exit 0, 11/11 tests passed.
- Default secret scan: `task-7-fix2-scan-secrets.txt`, exit 0, PASS, 148 scanned files.
- Full verify: `task-7-fix2-full-verify.txt`, exit 0, typecheck passed, 18 test files and 135 tests passed.
- Cleanup: `task-7-fix2-cleanup.txt` records removal of temporary include fixtures.

## Residual Risks

- Scanner rule quality is still pattern-based and can only detect covered secret shapes.
- Evidence artifacts include command output and file paths, not raw finding values, so they are suitable for review without preserving the temporary `.env` fixtures.
