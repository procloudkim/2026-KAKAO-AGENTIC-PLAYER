# Todo 6 Seoul Adapter Gate Review

recommendation: REJECT
adversarialVerdict: needs-fix

## originalIntent

Independently verify the Todo 6 Seoul cultural-events adapter DoneClaim for `apps/family-experience-mcp` in read-only mode from the user's perspective: the optional Seoul Open Data adapter should be disabled without `SEOUL_OPEN_DATA_KEY`, avoid leaking keyed URLs in diagnostics, classify failures with typed codes, normalize stable source fields only, stay out of public MCP wiring, and pass the specified acceptance/regression commands.

## desiredOutcome

The shipped artifact should let family-experience MCP keep fixture-mode/golden QA deterministic while providing a pure, optional Seoul Open Data source adapter that can be tested without live network or a secret key. Diagnostics must not expose the Seoul API key or keyed URL.

## userOutcomeReview

Not confirmed. The acceptance and source-regression commands pass, the requested failure classes are representable, tests are deterministic and fixture-only, the adapter is not imported by a public MCP/server path, and `seoulCulture.ts` measures 241 pure LOC in the warning band with a clear single responsibility. However, an adversarial source-failure path can leak the raw API key into returned diagnostics when the injected request loader throws an error message containing the keyed URL. This violates the redaction expectation and source governance for keyed URLs.

## blockers

- `apps/family-experience-mcp/src/sources/seoulCulture.ts:95` copies `error.message` directly into `detail`; `apps/family-experience-mcp/src/sources/seoulCulture.ts:100` returns that detail in diagnostics. A probe with `apiKey = RAW_SECRET_KEY` and `requestJson` throwing `transport failed for ${built.url}` returned `source_failure` with `diagnosticsContainsRawKey: true`.
- The existing test `apps/family-experience-mcp/test/seoulCulture.test.ts:64` verifies `buildSeoulCultureRequest().diagnostics` redacts the key, but it does not cover caught request-loader errors that include keyed URLs.
- Required final-gate inputs were incomplete for the stricter reviewer protocol: no separate code review report, manual QA matrix, or notepad path was provided. Direct inspection was performed anyway, but report-coverage support is absent.

## checkedArtifactPaths

- `apps/family-experience-mcp/src/sources/seoulCulture.ts`
- `apps/family-experience-mcp/src/sources/types.ts`
- `apps/family-experience-mcp/test/seoulCulture.test.ts`
- `apps/family-experience-mcp/test/fixtures/seoul-culture-sample.json`
- `apps/family-experience-mcp/test/sources.test.ts`
- `apps/family-experience-mcp/src/sources/registry.ts`
- `apps/family-experience-mcp/src/config.ts`
- `apps/family-experience-mcp/src/index.ts`
- `apps/family-experience-mcp/src/pipeline/normalize.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/src/sources/fixture.ts`
- `apps/family-experience-mcp/package.json`
- `.omo/evidence/task-6-seoul-adapter-RED.txt`
- `.omo/evidence/task-6-seoul-adapter-GREEN.txt`

## verificationEvidence

- Acceptance command: `cd apps/family-experience-mcp && npm test -- --run test/seoulCulture.test.ts && npm run typecheck` exited 0; 1 test file passed, 4 tests passed; typecheck exited 0.
- Regression command: `cd apps/family-experience-mcp && npm test -- --run test/sources.test.ts test/seoulCulture.test.ts && npm run typecheck` exited 0; 2 test files passed, 8 tests passed; typecheck exited 0.
- Banned TS escape probe over changed Todo 6 files/tests returned no matches for `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`, `.skip(`, `.only(`, word `any`, or `enum`.
- Pure LOC: `seoulCulture.ts` 241, `types.ts` 165, `seoulCulture.test.ts` 125. No file is over 250 pure LOC; `seoulCulture.ts` is in the warning band.
- Scope probe: `git status --short` showed broad untracked workspace paths including `.omo/`, `apps/`, `research/`, etc. The claimed files and shared source compatibility were directly checked despite dirty-worktree noise.
- Wiring probe: `rg` found the adapter factory only in `src/sources/seoulCulture.ts` and `test/seoulCulture.test.ts`; no public MCP/server path imports `createSeoulCultureSourceAdapter`. Registry/type/render support for the source id exists, but not runtime public adapter wiring.
- Behavior probe results: `missing_key`, `source_failure`, `permission_failure`, `source_failure`, `malformed_source`, and `no_match` were all produced as typed failure codes; saved sample normalized into a `seoul-culture-events` live candidate with source fields.

## removeAiSlopsAndProgrammingPass

- Direct slop pass found no deletion-only tests, `.skip`/`.only`, tautological removal-only tests, or unnecessary production extraction. Tests cover observable adapter behavior and fixture/sample normalization.
- Direct programming pass found Zod boundary parsing for external payloads, typed result unions, no banned TS escape hatches in the changed files, and deterministic tests.
- Unresolved programming/slop blocker: redaction is incomplete on caught request-loader errors. The code returns untrusted error text without scrubbing the keyed URL, creating false confidence from the narrower redaction test.

## evidenceGaps

- No supplied code review report showing independent `programming` and `remove-ai-slops` criterion coverage.
- No supplied manual QA matrix.
- No supplied notepad path.
- Existing tests do not include the adversarial source-failure redaction case where a transport error contains the keyed URL.
