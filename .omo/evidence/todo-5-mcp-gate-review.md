recommendation: REJECT

# Todo 5 MCP Gate Review

## originalIntent
Verify Todo 5 of `.omo/plans/family-experience-mcp-first-build.md`: register exactly one MCP tool, `find_family_experiences`, expose HTTP MCP on `/mcp`, expose `/health`, prove safe fixture/no-key behavior, and prove port cleanup.

## desiredOutcome
From the user's perspective, the local MCP service should start on `127.0.0.1:3345`, return HTTP 200 from `/health` with `family-experience-mcp`, list exactly one public MCP tool, call that tool in fixture mode with three candidates, return safe structured errors without fixture/live key, and leave no listener on `:3345` after stop.

## userOutcomeReview
Needs fix. The actual HTTP and MCP behavior works, but the cleanup requirement failed under the normal `npm run dev:http` PID captured by the task script. After `kill $SERVER_PID`, `netstat` still showed `127.0.0.1:3345` LISTENING with PID `56132`. I forcibly cleaned that orphaned listener with `taskkill //PID 56132 //F`, and a final `netstat` check showed no listener.

## blockers
1. Cleanup is not reliable or proven by the shipped command path. Fresh independent run:
   - preflight: no listener on `:3345`
   - server start: `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http`
   - health: HTTP `200`, body contained `family-experience-mcp`
   - smoke: one tool, `find_family_experiences`, `candidate_count: 3`
   - attempted stop: `kill $SERVER_PID; wait $SERVER_PID`
   - result: `CLEANUP_LISTENING_FOUND`, `TCP 127.0.0.1:3345 ... LISTENING 56132`
   - forced cleanup: `taskkill //PID 56132 //F`, then `NO_LISTENING_ON_3345`
2. Todo 5 lacks a scoped implementation/code-review artifact with explicit `remove-ai-slops` overfit/slop coverage and `programming` TypeScript coverage. Direct review was performed here, but the executor support report coverage is absent.
3. Todo 5 remains unchecked in `.omo/plans/family-experience-mcp-first-build.md:180`, while `.omo/start-work/ledger.jsonl` has only a worker DoneClaim for Todo 5 and no independent confirmed verifier entry before this report.

## passingEvidence
- `cd apps/family-experience-mcp && npm run typecheck && npm test -- --run test/mcp.test.ts` exited 0. Vitest ran 1 file, 3 tests passed.
- `/health` returned exact HTTP `200`; response body included `{"name":"family-experience-mcp","tools":["find_family_experiences"],...}`.
- `npm run smoke:mcp -- --assert-tool-count=1` connected to `http://127.0.0.1:3345/mcp`, listed exactly `["find_family_experiences"]`, called that tool, and returned `candidate_count: 3`.
- No-fixture/no-key direct probe returned `isError: true`, structured `missing_configuration`, no `candidates`, and no keyed URL/secret-like content.
- Forbidden pattern scan over `src`, `scripts`, and `test` found no `as any`, `@ts-ignore`, `@ts-expect-error`, `.skip(`, or `.only(`.
- Scoped claim/action scan found no unsupported public claims or final PlayMCP review/submission action in app source/scripts/tests/docs.

## slopAndProgrammingPass
Direct `remove-ai-slops` pass:
- No deletion-only tests, tests merely verifying a requested removal, tautological tests, excessive useless test padding, or implementation-mirroring-only tests were found in Todo 5 scope.
- `test/mcp.test.ts` exercises observable MCP listing/call behavior, safe no-key error behavior, and health payload shape.
- `scripts/smoke-mcp.ts` is a real-surface smoke, not a fake green wrapper; it asserts tool count/name and parses structured content.
- No unnecessary production extraction or speculative abstraction was found in Todo 5 files.

Direct `programming` pass:
- TypeScript uses Zod schemas at boundaries, typed failure metadata, readonly typed contracts, `import type` where relevant, named exports, and no banned TypeScript escape hatches in scoped scan.
- Error boundary in `server.ts` catches `unknown` at HTTP boundary and writes structured JSON; no raw secret logging was observed.
- Warning-band LOC only, no hard LOC blocker:
  - `src/mcp.ts`: 227 pure LOC, warning band, single responsibility is MCP tool registration/call orchestration.
  - Existing non-Todo-5 warning-band files: `src/sources/seoulCulture.ts` 249, `src/pipeline/normalize.ts` 248, `src/sources/fixture.ts` 226.
  - No checked source/script/test file exceeded 250 pure LOC.

Executor report coverage:
- FAIL. No `.omo/evidence/task-5-*implementation-review*`, `task-5-*review*`, `task-5-*notepad*`, or `task-5-*diff*` artifact exists. This report cannot substitute for the missing executor-side review coverage required by the final-gate policy.

## commands
- `cd apps/family-experience-mcp && npm run typecheck && npm test -- --run test/mcp.test.ts`
- `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http`, then `curl -sS -D <tmp>/health.headers -o <tmp>/health.json -w '%{http_code}' http://127.0.0.1:3345/health`
- `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run smoke:mcp -- --assert-tool-count=1`
- `kill $SERVER_PID; wait $SERVER_PID; netstat -ano | grep ':3345' | grep LISTENING`
- `taskkill //PID 56132 //F`, then `netstat -ano | grep ':3345' | grep LISTENING`
- temporary no-network `.mts` probe calling `callFindFamilyExperiences` with `{ allowFixture: false, seoulOpenDataKey: undefined }`
- `rg -n --pcre2 '(^|[^A-Za-z0-9_])as\s+any\b|@ts-ignore|@ts-expect-error|\.(skip|only)\s*\(' apps/family-experience-mcp/src apps/family-experience-mcp/scripts apps/family-experience-mcp/test`
- pure LOC `awk` scan over `apps/family-experience-mcp/src`, `scripts`, and `test`
- scoped public claim/final-submission `rg` scan over app source/scripts/tests/docs

## checkedArtifactPaths
- `.omo/evidence/task-5-mcp-RED.txt`
- `.omo/evidence/task-5-mcp-GREEN.txt`
- `.omo/evidence/task-5-mcp-manual-qa.md`
- `.omo/evidence/task-5-health.json`
- `.omo/evidence/task-5-health.headers`
- `.omo/evidence/task-5-preflight-listening.txt`
- `.omo/evidence/task-5-cleanup-listening.txt`
- `.omo/evidence/task-5-server.log`
- `.omo/plans/family-experience-mcp-first-build.md`
- `.omo/start-work/ledger.jsonl`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/src/server.ts`
- `apps/family-experience-mcp/src/health.ts`
- `apps/family-experience-mcp/src/index.ts`
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`
- `apps/family-experience-mcp/test/mcp.test.ts`
- `apps/family-experience-mcp/src/config.ts`
- `apps/family-experience-mcp/src/schemas.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/src/sources/fixture.ts`
- `apps/family-experience-mcp/src/sources/seoulCulture.ts`
- `apps/family-experience-mcp/src/sources/types.ts`

## evidenceGaps
- `git diff` and `git diff --stat` are empty because the relevant workspace tree is untracked; changed-file provenance cannot be established from git metadata.
- No Todo 5 implementation review/report/notepad/diff artifacts exist.
- Worker cleanup receipt conflicts with independent runtime behavior; the fresh run left PID `56132` listening after the nominal kill path.

## residualRisks
- Server cleanup scripts that kill only the `npm` parent may leave the `tsx`/Node child process running on Windows Git Bash.
- `src/mcp.ts` is in the LOC warning band at 227 pure LOC; it is acceptable for now but should be split before additive behavior grows.
- Test stability was verified with single fresh runs, not repeated-seed stress.
