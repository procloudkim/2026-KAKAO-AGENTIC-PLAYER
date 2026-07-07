# Task 5 Implementation Review

## programming review: type safety, module responsibility, lifecycle behavior, no broad refactor

- Type safety: `npm run typecheck` passed after the lifecycle change. The changed TypeScript uses typed process/lifecycle helpers, no `as any`, no `@ts-ignore`, no `@ts-expect-error`, and no skipped or focused tests.
- Module responsibility: the source change is confined to `src/server.ts`, which still owns only HTTP routing, MCP transport handoff, and dev-server lifecycle cleanup. It does not modify MCP schemas, the tool contract, pipeline rendering, fixture data, or the Seoul adapter.
- Lifecycle behavior: `npm run dev:http` now runs `node --import tsx src/server.ts` to avoid the extra `tsx` CLI wrapper. The server installs shutdown handlers and a Windows Git Bash/MSYS ancestor watcher so killing the captured `npm run dev:http` job exits the listener process. GREEN evidence shows `family-experience-mcp shutting down: parent-exit` and no `LISTENING` socket on `:3345`.
- No broad refactor: no new public MCP tools were added, `/health` and `/mcp` behavior were preserved, and Todo 5 fixture/no-key behavior remains covered by the existing focused test and smoke path.
- LOC check: `src/server.ts` is 236 pure LOC after the lifecycle helper, which is in the 200-250 warning band but below the hard cap. The file remains single-responsibility; split before adding unrelated behavior.

## remove-ai-slops review: no fake claims, no fake green, no dead/demo-only code hiding behavior, no `as any`/ignored TS/skipped tests

- No fake claims: RED evidence records the original cleanup failure, including orphan listener PID `11756` and forced cleanup. GREEN evidence records the passing cleanup run after the fix.
- No fake green: the GREEN cleanup command used the same captured `npm run dev:http` PID pattern that failed in RED, then checked `netstat` for no `LISTENING` socket on `:3345`.
- No dead/demo-only code hiding behavior: the lifecycle helper is exercised by the real dev-server command path and is visible in `task-5-cleanup-fix-server.log` as `parent-exit`; it is not a detached test-only shim.
- No escape hatches: scoped scan over `src`, `scripts`, and `test` found no `as any`, `@ts-ignore`, `@ts-expect-error`, `.skip(`, or `.only(`.
- Behavior preservation: focused tests still pass, and fixture-mode `smoke:mcp` still lists exactly one tool, `find_family_experiences`, and returns three candidates.

## residual risks

- The Windows Git Bash cleanup fix depends on Git for Windows `ps.exe` at `C:\Program Files\Git\usr\bin\ps.exe`, with fallback to `ps` on PATH. If Git is installed elsewhere and `ps` is not on PATH, direct signal handling still works but the MSYS orphan detection may not.
- `src/server.ts` is in the LOC warning band. Future unrelated lifecycle/routing additions should split lifecycle helpers into a separate module before crossing 250 pure LOC.
- Verification used fresh single runs, not repeated stress runs across many kill/start cycles.
