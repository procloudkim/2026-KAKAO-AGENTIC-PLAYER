# Todo 6 Seoul Adapter Evidence Backfill Gate Review

recommendation: APPROVE
verdict: confirmed
confidence: high

## originalIntent

Verify Todo 6 from `.omo/plans/family-experience-mcp-first-build.md`: add an optional Seoul cultural-events adapter behind the source contract. The adapter must stay disabled without `SEOUL_OPEN_DATA_KEY`, avoid keyed URL/API key leakage, classify source errors with typed failure codes, normalize stable source fields only, remain independent from public MCP wiring at this stage, and preserve fixture-mode QA.

## desiredOutcome

The user-visible outcome is a fixture-safe optional Seoul Open Data adapter whose redaction defect is fixed and whose final-gate support artifacts now close the earlier evidence-format blockers: manual QA matrix, implementation/code review with `programming` and `remove-ai-slops` coverage, notepad, and diff/scope artifact.

## userOutcomeReview

Confirmed. The previous raw-key/keyed-URL leak is closed in returned diagnostics: `redactRequestDetail()` replaces the full keyed URL, encoded key, and raw key before the request-loader error detail is returned. Fresh acceptance passed, and an independent no-live-network `tsx --eval` probe confirmed `missing_key`, unconfigured `source_failure`, `malformed_source`, `permission_failure`, and two thrown keyed-URL transport errors are typed and redacted in serialized result fields.

No public MCP/server wiring was added by Todo 6. `createSeoulCultureSourceAdapter`, `buildSeoulCultureRequest`, and `normalizeSeoulCulturePayload` are referenced only by `src/sources/seoulCulture.ts` and `test/seoulCulture.test.ts`; broader source references are registry/config/render metadata, not runtime adapter wiring. No `fetch(` path exists in the adapter; live execution requires injected `requestJson`.

## blockers

None.

## warnings

- Amber limitation: `apps/` and `.omo/` are untracked in this workspace, so `git diff -- <Todo 6 files>` is empty and cannot prove isolated provenance. This is explicitly documented by `.omo/evidence/task-6-redaction-fix-diff-summary.md`; direct source/artifact inspection and fresh commands were used instead.
- LOC warning band: `apps/family-experience-mcp/src/sources/seoulCulture.ts` is 249 pure LOC. It remains below the 250 hard ceiling and has one clear responsibility: Seoul Open Data cultural-event request construction, redaction, payload parsing, normalization, and typed source failure handling. The next additive change should split request/redaction, payload parsing, or row normalization before adding more code.

## checks run

- Loaded and applied `omo:programming` and `omo:remove-ai-slops` criteria.
- Read prior reports:
  - `.omo/evidence/todo-6-seoul-adapter-gate-review.md`
  - `.omo/evidence/todo-6-seoul-adapter-redaction-fix-gate-review.md`
- Read backfill artifacts:
  - `.omo/evidence/task-6-redaction-fix-manual-qa.md`
  - `.omo/evidence/task-6-redaction-fix-implementation-review.md`
  - `.omo/evidence/task-6-redaction-fix-diff-summary.md`
  - `.omo/evidence/task-6-redaction-fix-notepad.md`
  - `.omo/evidence/task-6-redaction-fix-RED.txt`
  - `.omo/evidence/task-6-redaction-fix-GREEN.txt`
- Inspected relevant source/tests:
  - `apps/family-experience-mcp/src/sources/seoulCulture.ts`
  - `apps/family-experience-mcp/src/sources/types.ts`
  - `apps/family-experience-mcp/src/sources/registry.ts`
  - `apps/family-experience-mcp/test/seoulCulture.test.ts`
  - `apps/family-experience-mcp/test/sources.test.ts`
- Required acceptance:
  - `cd apps/family-experience-mcp && npm test -- --run test/seoulCulture.test.ts test/sources.test.ts && npm run typecheck`
  - Result: exit 0; Vitest 2 files passed, 9 tests passed; `tsc --noEmit` passed.
- Independent no-live-network runtime probe:
  - `cd apps/family-experience-mcp && ./node_modules/.bin/tsx --eval '<inline probe importing ./src/sources/seoulCulture.ts>'`
  - Result: exit 0. Confirmed typed failures and absence of raw key, URL-encoded key, and full keyed URL in serialized result diagnostics for `RAW_SECRET_KEY` and `RAW SECRET/KEY?`.
- Forbidden escape/focus scan:
  - `rg -n --pcre2 '(:\s*any\b|<\s*any\s*>|Promise<\s*any\s*>|Array<\s*any\s*>|Record<[^>]*\bany\b[^>]*>|\bas\s+any\b|@ts-ignore|@ts-expect-error|\.only\(|\.skip\()' apps/family-experience-mcp/src/sources/seoulCulture.ts apps/family-experience-mcp/src/sources/types.ts apps/family-experience-mcp/src/sources/registry.ts apps/family-experience-mcp/test/seoulCulture.test.ts apps/family-experience-mcp/test/sources.test.ts`
  - Result: no matches. Vitest `expect.any(Number)` was not counted as a TypeScript escape hatch.
- Public wiring/source reference scan:
  - `rg -n 'createSeoulCultureSourceAdapter|buildSeoulCultureRequest|normalizeSeoulCulturePayload|seoulCulture' apps/family-experience-mcp/src apps/family-experience-mcp/test`
  - Result: adapter factory and helpers appear only in `seoulCulture.ts` and `seoulCulture.test.ts`.
- Network/key scan:
  - `rg -n 'fetch\(|requestJson|SEOUL_OPEN_DATA_KEY' apps/family-experience-mcp/src apps/family-experience-mcp/test`
  - Result: no `fetch(` in adapter path; source execution is injected via `requestJson`.
- LOC measurement:
  - `awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|#|--)/ { n++ } END { print n+0 }'`
  - Results: `seoulCulture.ts` 249, `types.ts` 165, `registry.ts` 49, `seoulCulture.test.ts` 146, `sources.test.ts` 79.
- Diff/status:
  - `git status --short` shows broad untracked `.omo/`, `apps/`, `research/`, `schema/`, etc.
  - `git diff -- apps/family-experience-mcp/src/sources/seoulCulture.ts apps/family-experience-mcp/src/sources/types.ts apps/family-experience-mcp/src/sources/registry.ts apps/family-experience-mcp/test/seoulCulture.test.ts apps/family-experience-mcp/test/sources.test.ts` returned no textual diff.

## findings

- PASS: Redaction defect is fixed. Source lines 95-103 route caught request-loader errors through `redactRequestDetail`; lines 109-113 scrub full keyed URL, encoded key, and raw key.
- PASS: Existing regression covers the prior raw-key/keyed-URL failure. `.omo/evidence/task-6-redaction-fix-RED.txt` shows the raw sentinel key leaked before the fix; current tests and probe pass.
- PASS: Typed failure behavior remains intact: `missing_key`, `source_failure`, `malformed_source`, `permission_failure`, and `no_match` are returned through `SourceAdapterResult`.
- PASS: No public MCP wiring was added for Todo 6; only source-governance metadata references the Seoul source outside the adapter and tests.
- PASS: Backfill artifacts close the previous evidence blockers. The manual QA matrix, implementation review, diff/scope artifact, and notepad are present, directly relevant, and consistent with inspected source and fresh command output.
- PASS: Direct `remove-ai-slops` pass found no deletion-only tests, tautological removal tests, implementation-mirroring-only tests, excessive useless test padding, unnecessary production extraction, speculative abstraction, or skipped/focused tests in the relevant scope.
- PASS: Direct `programming` pass found typed boundaries, Zod parsing of external payloads, readonly typed contracts, no banned TS escape hatches in the relevant scope, deterministic fixture-only tests, and no live-network dependency.

## checkedArtifactPaths

- `.omo/plans/family-experience-mcp-first-build.md`
- `.omo/evidence/todo-6-seoul-adapter-gate-review.md`
- `.omo/evidence/todo-6-seoul-adapter-redaction-fix-gate-review.md`
- `.omo/evidence/task-6-redaction-fix-manual-qa.md`
- `.omo/evidence/task-6-redaction-fix-implementation-review.md`
- `.omo/evidence/task-6-redaction-fix-diff-summary.md`
- `.omo/evidence/task-6-redaction-fix-notepad.md`
- `.omo/evidence/task-6-redaction-fix-RED.txt`
- `.omo/evidence/task-6-redaction-fix-GREEN.txt`
- `apps/family-experience-mcp/src/sources/seoulCulture.ts`
- `apps/family-experience-mcp/src/sources/types.ts`
- `apps/family-experience-mcp/src/sources/registry.ts`
- `apps/family-experience-mcp/test/seoulCulture.test.ts`
- `apps/family-experience-mcp/test/sources.test.ts`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/tsconfig.json`

## evidenceGaps

No blocking evidence gaps remain. The only evidence limitation is provenance-related: the app subtree is untracked, so there is no meaningful isolated git diff. This is amber, not blocking, because the requested direct artifacts, source/test inspection, acceptance command, and independent runtime probe all support completion.

## residualRisks

- Future additive changes to `seoulCulture.ts` are likely to cross the 250 pure LOC hard ceiling unless the adapter is split first.
- Fixture-only/no-network verification confirms contract behavior and redaction, but does not validate live Seoul API availability or current official payload drift. That is acceptable for this requested no-live-network gate.
