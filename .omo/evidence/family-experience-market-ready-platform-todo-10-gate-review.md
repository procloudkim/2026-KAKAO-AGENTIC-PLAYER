# Gate Review: family-experience-market-ready-platform Todo 10

recommendation: REJECT
adversarialVerdict: needs-fix
confidence: high

## originalIntent

Independently verify Todo 10, "Add API abuse and resource consumption controls", after a prior gate rejection. The requested user outcome was a confirmed public MCP request surface with controls for request body size, malformed JSON, overlong prompt, rate limiting, request timeout, bounded candidates, safe 408/500 failure shapes, Todo 10-specific code-quality/manual-QA evidence, no secret or stack-trace leakage, no import-time listener side effects, adversarial probes, and cleanup proof.

## desiredOutcome

Only `confirmed` can pass. The current on-disk code, tests, receipts, and independently reproduced commands must all support that Todo 10 is complete, including focused HTTP regressions and a full package verify of at least 17 files / 103 tests.

## userOutcomeReview

The focused Todo 10 HTTP suite is now green and the core public-surface controls are present in code: body cap and malformed JSON parsing in `mcpRequestLimits.ts`, timeout handling with 408 `request_timeout`, generic 500 `internal_error`, per-process rate limiting, schema prompt length limit, and render-path candidate bounding to three. The server factory/direct-run guard is also effective: importing `src/server.ts` did not start a listener.

The shipped state still does not satisfy the user's required outcome because the current full verification command fails at TypeScript checking before tests run. The executor's green `task-10-fix-verify.txt` is therefore stale relative to current artifacts. In addition, the Todo 10 code-quality review does not explicitly cover the required `remove-ai-slops` overfit/slop criteria, even though this gate's direct pass found no unresolved Todo 10 slop severe enough to be the primary blocker.

## blockers

1. Current full verification fails.
   - Command run: `npm --prefix apps/family-experience-mcp run verify`
   - Observed failure: `tsc --noEmit` exits nonzero.
   - Errors:
     - `test/scanSources.test.ts(7,10): Module '"../scripts/scan-sources.js"' has no exported member 'parseIncludeArgs'.`
     - `test/scanSources.test.ts(7,28): Module '"../scripts/scan-sources.js"' declares 'scanText' locally, but it is not exported.`
     - `test/sources.test.ts(11,3): Module '"../src/sources/types.js"' has no exported member 'LAUNCH_COVERAGE_TIERS'.`
     - `test/sources.test.ts(182,26): Property 'launch_tier' does not exist on type 'SourceRegistration'.`
   - Impact: the user explicitly required the focused suite to pass and full verify evidence to pass 17 files / 103 tests or better. Focused passes, but current full verify does not.

2. Success evidence is stale/misleading relative to current state.
   - Artifact inspected: `.omo/evidence/family-experience-market-ready-platform/task-10-fix-verify.txt`
   - Artifact claim: `17 passed (17)`, `103 passed (103)`, `EXIT_CODE=0`.
   - Independent reproduction: current `npm --prefix apps/family-experience-mcp run verify` fails at typecheck.
   - Impact: the prior green receipt cannot be used as current completion proof.

3. Required code-review/slop coverage is incomplete in the executor report.
   - Artifact inspected: `.omo/evidence/family-experience-market-ready-platform/task-10-code-quality-review.md`
   - Gap: no explicit `remove-ai-slops`, overfit, tautological-test, implementation-mirroring-test, excessive/useless-test, deletion-only-test, or unnecessary-extraction coverage.
   - Impact: the role instructions require rejecting when the report coverage is absent, missing, or unsupported. This gate's direct pass does not replace the missing executor-report coverage.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/evidence/family-experience-market-ready-platform/task-10-fix-red.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-10-fix-focused.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-10-fix-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-10-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-10-fix-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-10-overlong-prompt.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-10-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-10-red.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-10-verify.txt`
- `apps/family-experience-mcp/src/server.ts`
- `apps/family-experience-mcp/src/schemas.ts`
- `apps/family-experience-mcp/src/mcpRequestLimits.ts`
- `apps/family-experience-mcp/src/serverLifecycle.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/test/httpJson.test.ts`
- `apps/family-experience-mcp/test/mcpHttpTestHelpers.ts`
- `apps/family-experience-mcp/package.json`

## reproducedCommands

- `npm --prefix apps/family-experience-mcp test -- --run test/httpJson.test.ts`
  - Result: PASS, 1 file / 8 tests, duration about 23s.
- `npm --prefix apps/family-experience-mcp run verify`
  - Result: FAIL, typecheck errors listed in blockers.
- `Push-Location apps/family-experience-mcp; node --import tsx --input-type=module -e "import './src/server.ts'; console.log('import-ok')"; Pop-Location`
  - Result: PASS, output only `import-ok`, no listener startup log.
- Current cleanup probe for repo-local `src/server.ts|vitest|tsx` processes.
  - Result: `matching_processes=0`.
- Current listener probe for `127.0.0.1:3345` and `127.0.0.1:3349`.
  - Result: no matching listeners.

## codeFindings

- Body cap: implemented in `readLimitedJsonBody` with `maxMcpRequestBodyBytes = 64 * 1024`, preflight `Content-Length` rejection and streamed byte rejection, returning 413 `request_body_too_large`.
- Malformed JSON: implemented via `JSON.parse` with `SyntaxError` converted to 400 `parse_error`.
- Timeout: implemented via app timer with 408 `request_timeout`; server timeout headroom is set with `requestTimeout = MCP_REQUEST_TIMEOUT_MS + 1000` and `headersTimeout = MCP_REQUEST_TIMEOUT_MS + 2000`.
- Rate limit: implemented by remote-address map with 60 requests per 60 seconds and 429 `rate_limited`.
- Overlong prompt: implemented in `FindFamilyExperiencesLoosePromptInputSchema` with `MAX_FAMILY_EXPERIENCE_PROMPT_LENGTH = 4096`; focused test covers safe rejection.
- Bounded candidates: implemented in `renderFamilyExperienceResponse` with `.slice(0, 3)` and covered by existing pipeline/MCP/golden tests.
- 500 failure shape: `createFamilyExperienceHttpServer` catches unexpected route errors and returns JSON-RPC `internal_error` without the thrown message; focused test covers this.
- Import-time side effects: direct `isMainModule` guard prevents listener start on import; direct import probe passed.
- Failure-surface leakage: focused tests assert no `stack`, `SyntaxError`, or `TypeError` on malformed JSON, body cap, timeout, internal error, and overlong prompt; code emits generic 500. No raw env or secret output path was found in the Todo 10 failure surfaces.

## adversarialClasses

- stale_state: FAIL. Green `task-10-fix-verify.txt` is stale; current verify fails.
- dirty_worktree: AMBER. `git status --short` shows a heavily dirty/untracked workspace, and relevant app files are untracked in git, weakening diff-based proof.
- misleading_success_output: FAIL. Executor full-verify receipt says 17/103 pass, but independent reproduction fails.
- malformed_input: PASS for Todo 10 focused scope. Malformed JSON regression passes in focused suite.
- hung_or_long_commands/resource_timeout: PASS for focused timeout regression. `request_timeout` test passes but the focused suite is slow because it waits for the 10s timeout.
- flaky_tests: AMBER. Focused suite passed in executor receipt and independent rerun; prior red receipt timed out before the fix. Current full verify fails deterministically at typecheck, not due flake.
- secrets_stack_traces: PASS for inspected Todo 10 surfaces. Tests and code do not expose stack traces, raw env, or secrets in checked failure responses.
- import_time_listener_side_effects: PASS. Direct import produced `import-ok` only.
- cleanup: PASS. Receipt says no matching processes/listeners; current process and listener probes also found none.
- other adversarial classes: N/A because this task does not touch auth, persistence, payment, bookings, remote deployment, or personal-data storage beyond remote-address rate buckets.

## slopOverfitPass

Direct `remove-ai-slops` / `programming` pass:

- Excessive/useless tests: no unresolved excess in Todo 10 focused tests; the long timeout test is behavior-relevant, though slow.
- Deletion-only tests: none found.
- Tests merely verifying removal: none found.
- Tautological tests: none found; tests drive public HTTP behavior and the server factory seam.
- Implementation-mirroring tests: acceptable risk; 500 seam test uses an injected route error to exercise the boundary catch, but asserts observable status/body rather than internals.
- Unnecessary production extraction/parsing/normalization: no new unnecessary extraction found; `mcpHttpTestHelpers.ts` is a small test helper and keeps `httpJson.test.ts` under the 250 pure-LOC threshold.
- Escape hatches: no `as any`, `@ts-ignore`, `@ts-expect-error`, or skipped tests found in Todo 10 files.
- Size: inspected Todo 10 files are under 250 pure LOC: `server.ts` 90, `mcpRequestLimits.ts` 139, `serverLifecycle.ts` 202, `schemas.ts` 146, `httpJson.test.ts` 232, `mcpHttpTestHelpers.ts` 82.
- Production concern noted but not blocker: rate-limit buckets are in-memory and per-process only; this matches the Todo 10 beta criterion but should be revisited before stronger public traffic claims.

Executor report coverage:

- `.omo/evidence/family-experience-market-ready-platform/task-10-code-quality-review.md` covers escape hatches, PII/logging, broad rewrite scope, and LOC.
- It does not explicitly cover the required overfit/slop categories, so report coverage is incomplete.

## exactEvidenceGaps

- Current `npm --prefix apps/family-experience-mcp run verify` does not pass.
- No current full-verify receipt matching the current workspace state.
- Todo 10 code-quality artifact lacks explicit `remove-ai-slops` overfit/slop coverage.
- No tracked git diff baseline for relevant app files; `git diff`/`git ls-files` do not show the untracked Todo 10 files as tracked artifacts.

## final

REJECT
