# Task 9 Cleanup Fix Implementation Review

Date: 2026-07-02
Scope: `apps/family-experience-mcp/src/server.ts` lifecycle cleanup only.

## Problem

Todo 9 gate rejected cleanup because killing the Git Bash captured `npm run dev:http` PID left the real Windows listener on `127.0.0.1:3345`.

RED evidence reproduced the same failure class in `.omo/evidence/task-9-cleanup-fix-RED.txt`: captured PID `85` exited, but listener PID `77644` remained and was force-killed.

## Fix

`server.ts` now resolves Windows ancestors from a single Win32 process-table snapshot instead of the prior per-PID CIM loop that could return only the immediate `cmd.exe` parent. The watcher then maps the discovered Windows ancestor chain to MSYS PIDs, refreshes until it has the Git Bash wrapper PIDs, and shuts the HTTP server down when those MSYS ancestors detach. Generic Windows ancestor death is not used as a Windows shutdown signal because stale top-level Windows parents caused false `parent-exit` during startup.

## Programming Review

- TypeScript strict gate passed through `npm run verify`.
- No `as any`, `@ts-ignore`, `@ts-expect-error`, `.skip(`, or `.only(` in scoped app source/scripts/tests.
- `apps/family-experience-mcp/src/server.ts` is 249 pure LOC, under the 250 pure-LOC cap.
- No public MCP tools were added or changed.
- No live API key or live network dependency was introduced.
- Lifecycle change is bounded to the existing shutdown seam and preserves `/health`, `/mcp`, golden smoke, and scanner behavior.

## Remove-AI-Slops Review

- No port-kill workaround was added to product code.
- No broad scanner/docs refactor was introduced.
- No new dependency or speculative abstraction was added.
- Temporary lifecycle debug logging was removed before final verification.
- Remaining compact statements in `server.ts` are local to ancestor parsing and were used to keep the existing file under the hard LOC cap; future lifecycle edits should split this code before adding more source lines.

## Evidence

- RED: `.omo/evidence/task-9-cleanup-fix-RED.txt`
- GREEN: `.omo/evidence/task-9-cleanup-fix-GREEN.txt`
- Repeat cleanup stress: `.omo/evidence/task-9-cleanup-fix-repeat.txt`
- Plain verify and scans: `.omo/evidence/task-9-cleanup-fix-plain-verify.txt`

## Residual Risk

Cleanup remains specific to Windows + Git Bash + npm wrapper behavior. The repeat stress covers the reviewer-observed two-failure class on this host, but future lifecycle expansion should move the watcher out of `server.ts` before adding more code.
