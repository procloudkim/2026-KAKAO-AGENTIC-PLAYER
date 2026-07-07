# Todo 3 Gate Code-Quality Review

Scope: Todo 3 only for `.omo/plans/family-experience-market-ready-platform.md`.

Changed code reviewed:
- `apps/family-experience-mcp/scripts/scan-sources.ts`

## Programming Smell Coverage

- Parameter bloat: fixed. `sourceLedgerRowFindings` no longer takes six positional parameters. It now takes one typed `SourceLedgerRowScan` context that groups the row location, text, scan surface, and parsed ledger header.
- Long-parameter check: `task-3-gate-long-params-check.txt` records `NO_FUNCTION_WITH_4PLUS_POSITIONAL_PARAMS_FOUND`.
- Pure LOC: `task-3-gate-loc.tsv` records `scan-sources.ts` at 239 pure LOC. This is in the programming warning band, not the defect band. The file remains a single-purpose source scanner; the next growth edit should split file collection, URL/dependency rules, or ledger rules before adding substantial logic.
- Escape hatches: no `any`, `as any`, non-null assertion, `@ts-ignore`, or `@ts-expect-error` were introduced.
- Boundary behavior: include parsing and file existence remain fail-closed at the CLI boundary.

## Remove-AI-Slops / Overfit Coverage

- Deletion ladder: no dead unit was safe to delete. The offending helper is load-bearing, so the safe action was simplify-in-place.
- Obvious comments: no new explanatory comments were added to justify simple code.
- Over-defensive code: no post-action verification or duplicate validation was added in code.
- Excessive complexity: the six-parameter helper was simplified into a named context. No algorithm change.
- Needless abstraction: one small typed context was added because it represents one domain concept, "source ledger row scan"; it is not a generic config wrapper and has fewer than six fields.
- Performance equivalence: no performance rewrite was attempted; scanner behavior is preserved by focused tests and CLI gates.
- Overfit risk: the refactor does not key behavior to specific test names, fixture paths, or evidence artifact names.

## Path-Name Hacks and Scanner Bypass Risks

- No new path-name allowlist or bypass was added.
- Existing default-scan allowance for test files remains unchanged.
- Included files still scan under the stricter include surface. `task-3-gate-negative-include.txt` proves an included source ledger with a blank URL fails with `source-ledger-missing-url`.
- `task-3-gate-malformed-include.txt` proves malformed `--include` fails with `Missing path for --include`.

## Source-Ledger Claim Boundaries

- The scanner enforces presence of source-ledger URLs. It does not prove URL freshness, official status, live availability, or factual truth of the underlying claims.
- Todo 3 evidence must therefore avoid claiming "source-verified" beyond the scanner's actual contract.

## Untracked Diff Limitation

- The scoped code and evidence files are untracked, so ordinary `git diff -- <paths>` is empty.
- `task-3-gate-changed-files.txt` records scoped `git status --short`, line counts, and the empty-diff limitation.
- `task-3-gate-scan-sources-untracked.diff` records a no-index diff for the untracked scanner file.

## Maintainability Assessment

The implementation is maintainable because the ledger row helper now receives a named context, the header indices are carried as a typed `SourceLedgerHeader`, and the scanner's observable behavior is still covered through direct unit tests plus CLI happy and negative include scenarios.
