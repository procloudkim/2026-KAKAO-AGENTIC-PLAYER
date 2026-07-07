# Todo 9 Cleanup Fix Gate Review

Date: 2026-07-02
Reviewer role: independent re-gate reviewer, read-only for product code/docs/tests/scripts.

## Recommendation

APPROVE

## Original Intent

Determine whether Todo 9 of `.omo/plans/family-experience-mcp-first-build.md` can now be accepted after the prior cleanup rejection, where killing the captured Git Bash/npm server PID left a real `127.0.0.1:3345` listener behind.

## Desired Outcome

Approve only if the cleanup failure class is independently closed, the Todo 9 hardening scans and server-backed QA remain green, temporary RED probes fail closed and are removed, docs preserve stop boundaries, and the lifecycle fix does not add slop, forbidden dependencies, forbidden TypeScript escape hatches, or final PlayMCP review/submission action.

## User Outcome Review

The shipped artifact now satisfies the requested Todo 9 outcome. The clean command passed, the server-backed hardening flow passed, two repeat cleanup cycles left no `3345` listener, and fresh scanner RED/GREEN probes failed and recovered as expected. No forced listener cleanup was needed in the successful reruns.

Docs still preserve the intended stop boundaries: fixture-first behavior, optional Seoul adapter only, no pharmacy fallback unless golden QA fails on event evidence, no further source expansion, and no unsupported live/reservation/current-operation/child-suitability claims. Repo artifacts continue to state that PlayMCP remains temporary-registration preparation only, with no final review request, public switch, representative image upload, or contest submission performed.

## Blockers

None.

## Findings

### Independent Verification

- Clean command passed:
  - `cd apps/family-experience-mcp && npm run verify && npm run scan:secrets && npm run scan:claims && npm run scan:sources`
  - Result: exit 0; TypeScript check passed; Vitest reported 9 files and 32 tests passed; all three scans passed.
- Server-backed hardening command passed:
  - Preflight found no `3345` listener.
  - Fixture server started with captured Git Bash PID `1248`.
  - `/health` returned exact HTTP 200 on attempt 2.
  - `smoke:golden` passed all four scenarios: `happy`, `missing-age`, `no-result`, `source-failure`.
  - `scan:secrets`, `scan:claims`, and `scan:sources` passed.
  - Killing the captured PID, waiting, and sleeping 2 seconds left no `3345` listener.
- Repeat cleanup stress passed:
  - Cycle 1 captured PID `627`, health HTTP 200 on attempt 2, no listener after kill.
  - Cycle 2 captured PID `657`, health HTTP 200 on attempt 2, no listener after kill.
- RED/GREEN probes passed:
  - Temporary scoped dummy secret in `test/fixtures/` made `scan:secrets` exit 1 with `key-assignment`; after removal, `scan:secrets` passed.
  - Temporary scoped unregistered source file in `test/fixtures/` made `scan:sources` exit 1 with `scraper-browser-parser-dependency` and `unregistered-event-source-url`; after removal, `scan:sources` passed.
  - Final check confirmed both temp probe files were removed.
- Final listener check:
  - No `3345` listener remained after all QA.

### Static And Policy Checks

- Forbidden pattern scan found no `as any`, `@ts-ignore`, `@ts-expect-error`, `.skip(`, or `.only(` in `src`, `test`, or `scripts`.
- Forbidden dependency/import scan found no `cheerio`, `puppeteer`, `playwright`, `jsdom`, or `got-scraping` dependencies in `package.json` or the root lock package, and no matching imports/requires in app `src`, `test`, or `scripts`.
- `scan:secrets` passed after temp cleanup. A follow-up raw secret/keyed-URL grep over app docs/src/test/scripts/package and Todo 9/golden evidence returned no matches.
- Pure LOC:
  - `apps/family-experience-mcp/src/server.ts`: 248.
  - `apps/family-experience-mcp/scripts/scan-secrets.ts`: 64.
  - `apps/family-experience-mcp/scripts/scan-claims.ts`: 77.
  - `apps/family-experience-mcp/scripts/scan-sources.ts`: 93.
- `server.ts` remains under the hard 250 pure-LOC cap. I accept it as still single-responsibility for this gate because its platform-specific process discovery is scoped to one runtime responsibility: shutting down the same HTTP server when the Git Bash/npm parent wrapper detaches. It is in the warning band and should be split before further lifecycle code is added.

### Programming And Remove-AI-Slops Pass

- Direct programming pass: typecheck passed; no TypeScript escape hatches or focused/skipped tests were found; no forbidden dependencies/imports were added; source files remain under the 250 pure-LOC cap.
- Direct remove-ai-slops pass: no port-kill workaround was added to product code; no broad scanner/docs refactor, speculative abstraction, new dependency, deletion-only test, tautological test, or implementation-mirroring test was found. The RED/GREEN probes exercise scanner behavior through real CLI exits and findings.
- Lifecycle fix risk is real but bounded: `server.ts` now parses Windows and MSYS process tables. That parsing is justified by the reproduced cleanup failure class and verified by server-backed and repeat cleanup checks, but future lifecycle expansion should move it out of `server.ts`.
- Executor review coverage is present in `.omo/evidence/task-9-cleanup-fix-implementation-review.md`: it includes lifecycle-specific Programming Review and Remove-AI-Slops Review sections covering strict verification, escape hatches, pure LOC, no public MCP changes, no live API dependency, no port-kill workaround, no new dependency/speculative abstraction, removed debug logging, and the future split warning.

## Commands Run

- `cd apps/family-experience-mcp && npm run verify && npm run scan:secrets && npm run scan:claims && npm run scan:sources`
- Server-backed hardening script equivalent to the requested flow: preflight no `3345`, start `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http`, health HTTP 200, `EVIDENCE_DIR="$REPO/.omo/evidence" FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:golden`, three scans, kill captured PID, wait, sleep, assert no listener.
- Repeat cleanup stress script: two cycles of start, health HTTP 200, kill captured PID, wait, sleep, assert no listener.
- Scanner RED/GREEN probe script: create scoped dummy secret file, run `npm run scan:secrets`, remove file, rerun scan; create scoped unregistered source/import file, run `npm run scan:sources`, remove file, rerun scan.
- `rg` forbidden-pattern scan for `as any`, `@ts-ignore`, `@ts-expect-error`, `.skip(`, `.only(`.
- `rg` forbidden import/require scan for scraper/browser-parser packages.
- Node manifest check for forbidden dependency names in `package.json` and root `package-lock.json` package entries.
- `npm run scan:secrets` plus raw secret/keyed-URL grep after temp cleanup.
- Pure LOC `awk` checks for `server.ts` and the scan scripts.
- Documentation boundary grep over `DECISIONS.md`, `QA_REPORT.md`, the plan, and cleanup-fix implementation review.
- Final `netstat` listener check for `:3345`.

## Checked Artifact Paths

- `.omo/evidence/todo-9-hardening-gate-review.md`
- `.omo/evidence/task-9-cleanup-fix-RED.txt`
- `.omo/evidence/task-9-cleanup-fix-GREEN.txt`
- `.omo/evidence/task-9-cleanup-fix-repeat.txt`
- `.omo/evidence/task-9-cleanup-fix-plain-verify.txt`
- `.omo/evidence/task-9-cleanup-fix-implementation-review.md`
- `.omo/plans/family-experience-mcp-first-build.md`
- `apps/family-experience-mcp/src/server.ts`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/package-lock.json`
- `apps/family-experience-mcp/scripts/scan-secrets.ts`
- `apps/family-experience-mcp/scripts/scan-claims.ts`
- `apps/family-experience-mcp/scripts/scan-sources.ts`
- `apps/family-experience-mcp/docs/DECISIONS.md`
- `apps/family-experience-mcp/docs/QA_REPORT.md`

## Evidence Gaps

- Git provenance remains weak: the workspace is broadly untracked, so `git diff -- apps/family-experience-mcp .omo/evidence` and `git ls-files` cannot prove isolated provenance. This review is based on direct artifact/source inspection and fresh command execution.
- External PlayMCP console state was not checked because the task forbids live network use. Repo-local docs/evidence show no final review/submission action.
- Initial PowerShell quoting attempts for a few audit commands failed before executing checks; each affected check was rerun through Git Bash here-string wrappers and passed or returned the expected empty output.

## Residual Risks

- `server.ts` is exactly in the 200-250 pure-LOC warning band at 248 lines. Further lifecycle changes should split process-watching into a dedicated module before adding source lines.
- The cleanup fix is specific to Windows + Git Bash + npm wrapper behavior. It is now covered on this host by one full server-backed rerun plus two repeat cleanup cycles.
- Fixture-mode QA proves shape, safety, and parent-facing behavior only. It does not prove live Seoul freshness or availability, which remains correctly documented as out of scope for Todo 9.

