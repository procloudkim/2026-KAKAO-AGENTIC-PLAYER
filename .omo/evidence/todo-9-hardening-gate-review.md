# Todo 9 Hardening Gate Review

Date: 2026-07-02
Reviewer role: independent final gate reviewer, read-only except scoped RED probes and this report.

## Recommendation

REJECT

## Original Intent

Verify Todo 9 of `.omo/plans/family-experience-mcp-first-build.md`: final hardening scans, docs, server-backed QA, and cleanup for the `apps/family-experience-mcp` build.

## Desired Outcome

Approve only if clean scans pass, RED probes fail as expected and clean up, server-backed fixture QA passes, port `3345` cleanup is proven, docs preserve project stop boundaries, and no slop/escape-hatch patterns remain in the reviewed app scope.

## User Outcome Review

Most user-visible hardening behavior is confirmed: `verify` passed, secret/claim/source scans passed, RED scanner probes failed on the intended rules, docs state fixture-first and no final PlayMCP/submission boundary, and no forbidden TypeScript escape hatches or forbidden imports were found in app `src`, `test`, or `scripts`.

The shipped artifact does not satisfy the required cleanup outcome. In two independent server-backed reproductions, the health endpoint, golden smoke, and scans passed, but killing the captured server PID did not remove the actual `127.0.0.1:3345` listener. Manual force cleanup was required.

## Blockers

1. Server cleanup gate failed independently.
   - First reproduction: server-backed QA passed, then cleanup left listener PID `80908` on `127.0.0.1:3345`; reviewer force-killed it.
   - Second reproduction using the plan's `kill $SERVER_PID; wait $SERVER_PID` pattern: cleanup left listener PID `51404`; reviewer force-killed it.
   - Final post-force-cleanup check showed no remaining `3345` listener.
   - This contradicts the required approval condition that killing the captured server PID proves no `3345` listener remains.

## Findings

### Confirmed Green Checks

- Clean command passed:
  - `cd apps/family-experience-mcp && npm run verify && npm run scan:secrets && npm run scan:claims && npm run scan:sources`
  - Result: exit 0, 9 Vitest files / 32 tests passed, all three scans passed.
- RED secret probe passed:
  - Temporary file: `apps/family-experience-mcp/test/fixtures/reviewer-dummy-secret.tmp.txt`
  - `npm run scan:secrets` exited 1 with `key-assignment`.
  - Temp file removed; `npm run scan:secrets` then passed.
- RED source probe passed:
  - Temporary file: `apps/family-experience-mcp/test/fixtures/unregistered-source.tmp.ts`
  - `npm run scan:sources` exited 1 with `scraper-browser-parser-dependency` and `unregistered-event-source-url`.
  - Temp file removed; `npm run scan:sources` then passed.
- Server behavior before cleanup passed:
  - Preflight had no `3345` listener.
  - `/health` returned exact HTTP 200 and body included `family-experience-mcp`.
  - `npm run smoke:golden` passed all four scenarios.
  - `npm run scan:secrets`, `npm run scan:claims`, and `npm run scan:sources` passed.
- Docs passed content review:
  - `DECISIONS.md` includes fixture-first operation, optional Seoul adapter, no pharmacy fallback unless golden QA fails, stopped source expansion, and no unsupported live/nationwide/reservation/operation/child-suitability claims.
  - `QA_REPORT.md` summarizes Todo 1-9 evidence, verified gates, residual risks, and no final PlayMCP review/submission/public switch/image upload.
- Review/support artifacts exist:
  - `task-9-implementation-review.md` has both Programming Review and Remove-AI-Slops Review sections.
  - `task-9-diff-summary.md`, `task-9-manual-qa.md`, and `task-9-notepad.md` exist and are non-empty.
- Static quality checks passed:
  - No `as any`, `@ts-ignore`, `@ts-expect-error`, `.skip(`, or `.only(` matches in app `src`, `test`, or `scripts`.
  - No forbidden package dependencies in `package.json`.
  - No forbidden imports/require calls for `cheerio`, `puppeteer`, `playwright`, `jsdom`, or `got-scraping` in app `src`, `test`, or `scripts`.
  - Scan script pure LOC: `scan-secrets.ts` 64, `scan-claims.ts` 77, `scan-sources.ts` 93.
  - Raw secret/keyed URL scan found no matches in reviewed app/evidence scope after excluding `node_modules`; one keyed URL exists only in a vendored `node_modules/zod` test fixture and is outside scanner scope.

### Slop And Overfit Review

- Direct remove-ai-slops pass: no excessive production extraction, no shared scanner framework added, and no oversized scan script. Duplication in three short scanners is acceptable single-responsibility duplication, not a maintenance blocker.
- Direct programming pass: no TypeScript escape hatches, no skipped/focused tests, no forbidden dependency/import, and scan scripts stay below the 250 pure-LOC cap.
- Test/probe overfit pass: RED probes validate scanner failure behavior through real CLI exits and findings, not implementation-mirroring assertions. No deletion-only or tautological tests were found in the Todo 9 surface.
- Executor report coverage: `task-9-implementation-review.md` explicitly contains Programming Review and Remove-AI-Slops Review sections, including LOC, escape-hatch, deletion-ladder, abstraction, and missing-test risk notes.

## Checked Artifact Paths

- `.omo/evidence/task-9-secret-scan-RED.txt`
- `.omo/evidence/task-9-secret-scan-cleanup.txt`
- `.omo/evidence/task-9-source-scan-RED.txt`
- `.omo/evidence/task-9-source-scan-cleanup.txt`
- `.omo/evidence/task-9-plain-verify-GREEN.txt`
- `.omo/evidence/task-9-final-verify-GREEN.txt`
- `.omo/evidence/task-9-implementation-review.md`
- `.omo/evidence/task-9-diff-summary.md`
- `.omo/evidence/task-9-notepad.md`
- `.omo/evidence/task-9-manual-qa.md`
- `.omo/evidence/task-9-health.json`
- `.omo/evidence/task-9-preflight-listening.txt`
- `.omo/evidence/task-9-cleanup-listening.txt`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/scripts/scan-secrets.ts`
- `apps/family-experience-mcp/scripts/scan-claims.ts`
- `apps/family-experience-mcp/scripts/scan-sources.ts`
- `apps/family-experience-mcp/docs/DECISIONS.md`
- `apps/family-experience-mcp/docs/QA_REPORT.md`
- `.omo/plans/family-experience-mcp-first-build.md`

## Commands Run

- `cd apps/family-experience-mcp && npm run verify && npm run scan:secrets && npm run scan:claims && npm run scan:sources`
- `rg -n --glob '!node_modules/**' -e 'as[[:space:]]+any|@ts-ignore|@ts-expect-error|\\.(skip|only)\\(' apps/family-experience-mcp/src apps/family-experience-mcp/test apps/family-experience-mcp/scripts`
- `rg -n --glob '!node_modules/**' -e '^\\s*import\\s+.*[\"'\"'](cheerio|puppeteer|playwright|jsdom|got-scraping)[\"'\"']|require\\([\"'\"'](cheerio|puppeteer|playwright|jsdom|got-scraping)[\"'\"']\\)' apps/family-experience-mcp/src apps/family-experience-mcp/test apps/family-experience-mcp/scripts apps/family-experience-mcp/package.json`
- `node -e "<package dependency check for cheerio, puppeteer, playwright, jsdom, got-scraping>"`
- `awk` pure-LOC checks for the three scan scripts.
- `cd apps/family-experience-mcp && npm run scan:secrets` with scoped reviewer dummy secret, then after deletion.
- `cd apps/family-experience-mcp && npm run scan:sources` with scoped reviewer unregistered source, then after deletion.
- Server-backed QA command with preflight, local fixture server, `/health` HTTP 200, `smoke:golden`, three scans, captured-PID cleanup check, and force cleanup on remaining listener.
- Exact plan-pattern server-backed cleanup rerun using `kill $SERVER_PID; wait $SERVER_PID`, followed by force cleanup on remaining listener.
- `netstat -ano | grep ':3345' | grep LISTENING || true` after forced cleanup.
- Targeted documentation/review artifact `rg` checks.

## Evidence Gaps

- No reliable cleanup proof: submitted evidence says no `3345` listener remained, but independent reproduction left actual listener PIDs after captured-PID cleanup twice.
- Git provenance is weak: the workspace is broadly untracked, so there is no meaningful `git diff` for the app changes. Review was file/artifact based.
- Submitted secret RED artifact used an `.omo/evidence` temp file, while this review reproduced the stricter scoped app fixture probe requested by the user.

## Residual Risks

- The server process cleanup issue is likely a Windows/Git Bash PID tree mismatch around `npm run dev:http`. A fix should start the server in a way that captures the actual listener process, or explicitly discover and terminate the listener PID with evidence.
- Fixture-mode QA still does not prove live Seoul freshness or availability. This is correctly documented and not a Todo 9 blocker.
- Broadly untracked workspace state makes future provenance audits harder until files are committed or a stable diff artifact is supplied.
