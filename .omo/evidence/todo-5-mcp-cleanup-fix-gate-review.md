recommendation: APPROVE

# Todo 5 MCP Cleanup Fix Gate Review

## originalIntent
Verify Todo 5 of `.omo/plans/family-experience-mcp-first-build.md` after the prior gate rejection: register exactly one MCP tool, `find_family_experiences`; expose HTTP MCP on `/mcp`; expose `/health`; preserve safe fixture/no-key behavior; and prove the Windows Git Bash cleanup path no longer leaves a `:3345` listener after killing the captured `npm run dev:http` PID.

## desiredOutcome
From the user's perspective, the local MCP service should start on `127.0.0.1:3345`, return HTTP 200 from `/health` with `family-experience-mcp`, list exactly one public MCP tool, call `find_family_experiences` successfully in fixture mode with three candidates, return safe structured errors without fixture/live key, expose no raw secrets, and leave no `LISTENING` socket on `:3345` after stop.

## userOutcomeReview
Confirmed. The prior blocker is closed in a fresh independent run. I started `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http`, captured `SERVER_PID=1778`, verified `/health` returned `200` and contained `family-experience-mcp`, ran `npm run smoke:mcp -- --assert-tool-count=1` while the server was running, then killed the captured PID, waited, slept 2 seconds, and verified `netstat -ano | grep ':3345' | grep LISTENING` had no match. No force cleanup was needed.

## blockers
None.

## commands
- `cd apps/family-experience-mcp && npm run typecheck && npm test -- --run test/mcp.test.ts`
  - Result: exit 0; `tsc --noEmit` passed; Vitest ran 1 file and 3 tests passed.
- Cleanup lifecycle reproduction:
  - Preflight: `netstat -ano | grep ':3345' | grep LISTENING`
  - Start: `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http`
  - Health: `curl -sS -o "$TMPDIR/health.json" -w "%{http_code}" http://127.0.0.1:3345/health`
  - MCP smoke: `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run smoke:mcp -- --assert-tool-count=1`
  - Stop: `kill "$SERVER_PID"; wait "$SERVER_PID"; sleep 2`
  - Cleanup assert: `netstat -ano | grep ':3345' | grep LISTENING`
  - Result: preflight no listener; captured PID `1778`; health `200`; smoke listed only `find_family_experiences`, called it, and returned `candidate_count: 3`; cleanup no listener.
- Safe no-fixture/no-key probe:
  - `cd apps/family-experience-mcp && node --import tsx --eval '<inline callFindFamilyExperiences probe>'`
  - Result: `isError: true`, `ok: false`, `failure_code: "missing_configuration"`, no `candidates`, `secret_like_content: false`.
- Forbidden pattern scan:
  - `rg -n --pcre2 '(^|[^A-Za-z0-9_])as\s+any\b|@ts-ignore|@ts-expect-error|\.(skip|only)\s*\(' apps/family-experience-mcp/src apps/family-experience-mcp/scripts apps/family-experience-mcp/test`
  - Result: no matches.
- LOC warning-band check:
  - `awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|#|--)/ { n++ } END { print n+0 }' apps/family-experience-mcp/src/server.ts`
  - `awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|#|--)/ { n++ } END { print n+0 }' apps/family-experience-mcp/src/mcp.ts`
  - Result: `src/server.ts` 236 pure LOC; `src/mcp.ts` 227 pure LOC.
- Public-tool and PlayMCP action scan:
  - `rg -n 'registerTool|FAMILY_EXPERIENCE_PUBLIC_TOOLS|find_family_experiences|PlayMCP|심사|제출|submission|submit|review request|public switch|등록 및 심사 요청' apps/family-experience-mcp/src apps/family-experience-mcp/scripts apps/family-experience-mcp/test apps/family-experience-mcp/docs`
  - Result: one `registerTool` call, one public tool constant, and no final PlayMCP review/submission action in the app scope.

## findings
- Acceptance command passes.
- Real HTTP health and MCP behavior pass while the server is running.
- The cleanup failure class from the prior rejection is closed: killing the captured `npm run dev:http` PID no longer leaves a `:3345` listener.
- No-fixture/no-key behavior returns a safe structured `missing_configuration` tool error without fabricated candidates or secret-like content.
- `task-5-implementation-review.md` explicitly covers both `programming` and `remove-ai-slops` review perspectives, including lifecycle behavior, no broad refactor, fake-green avoidance, no demo-only code, forbidden pattern scan, and LOC warning-band notes.
- Direct `remove-ai-slops` pass found no deletion-only tests, tests merely verifying a requested removal, tautological tests, implementation-mirroring-only tests, unnecessary production extraction, or fake smoke wrappers in Todo 5 scope.
- Direct `programming` pass found no banned TypeScript escape hatches in scoped source/scripts/tests. `server.ts` owns HTTP routing, MCP transport handoff, and dev-server lifecycle cleanup; `mcp.ts` owns MCP tool registration/call orchestration. Both are below the 250 pure LOC hard cap.
- No additional public MCP tool is exposed. The real smoke listed exactly `["find_family_experiences"]`.
- No final PlayMCP review/submission action was found in the inspected app scope.

## checkedArtifactPaths
- `.omo/evidence/todo-5-mcp-gate-review.md`
- `.omo/evidence/task-5-mcp-GREEN.txt`
- `.omo/evidence/task-5-mcp-manual-qa.md`
- `.omo/evidence/task-5-cleanup-fix-RED.txt`
- `.omo/evidence/task-5-cleanup-fix-GREEN.txt`
- `.omo/evidence/task-5-cleanup-fix-verification.txt`
- `.omo/evidence/task-5-cleanup-fix-iteration-notes.txt`
- `.omo/evidence/task-5-implementation-review.md`
- `.omo/evidence/task-5-cleanup-fix-server.log`
- `.omo/plans/family-experience-mcp-first-build.md`
- `.omo/start-work/ledger.jsonl`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/src/server.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`
- `apps/family-experience-mcp/test/mcp.test.ts`

## evidenceGaps
- The repository tree is broadly untracked (`apps/`, `.omo/`, and other work areas), so git diff provenance cannot isolate Todo 5 changes. This is not blocking for this re-gate because the requested files and artifacts were directly inspected and the required behavior was independently rerun.
- `.omo/plans/family-experience-mcp-first-build.md` still shows Todo 5 unchecked. This gate report supplies the independent confirmation needed for the orchestrator to mark the checkbox; the report itself does not edit the plan.
- Verification used fresh single runs, not repeated stress loops.

## residualRisks
- `src/server.ts` is in the 200-250 pure LOC warning band at 236 pure LOC. It remains acceptable for Todo 5, but future unrelated lifecycle/routing additions should split lifecycle helpers before crossing 250 pure LOC.
- `src/mcp.ts` is also in the warning band at 227 pure LOC. It remains single-purpose for MCP registration/call orchestration but should be watched before adding more tool logic.
- Cleanup fix depends on Git for Windows/MSYS process behavior; the fresh required Git Bash path passed on this host.

## verdict
APPROVE. Todo 5 can now be accepted after the cleanup fix.
