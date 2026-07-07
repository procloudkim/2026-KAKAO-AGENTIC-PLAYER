# Task 13 Doneclaim: Docker/runtime packaging

## Verdict

CONDITIONAL PASS for production-safe packaging changes.

Docker daemon was unavailable on this host, so Docker image build and container runtime pass are not claimed. The exact blocker is recorded, and the fallback Node/npm package/runtime path passed.

## Acceptance criteria

- Dependency strategy: Dockerfile now uses a build stage with dev tooling for TypeScript emit and a runtime stage with `npm ci --omit=dev --ignore-scripts`.
- Runtime command: container runs compiled JavaScript with `node dist/src/server.js`; it no longer requires `tsx` in the runtime image.
- Data/cache policy: Dockerfile copies `data/` and sets `FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache`; it does not copy `.env`, `test`, `docs`, `.omo`, or local build outputs.
- Non-root user: runtime switches to the official image `node` user after install/copy/chown.
- Port/env defaults: Dockerfile sets `HOST=0.0.0.0`, `PORT=3349`, `NODE_ENV=production`, and `FAMILY_EXPERIENCE_ALLOW_FIXTURE=false`.
- Health probe: Dockerfile includes a `/health` `HEALTHCHECK` implemented with Node's built-in HTTP client.
- Secret boundary: no raw `.env` or raw keys are copied or required; `.dockerignore` excludes `.env`, `.env.*`, `.npmrc`, `.omo`, `node_modules`, `dist`, test/docs, logs, and temp build output.
- Scope: only `apps/family-experience-mcp/Dockerfile`, `apps/family-experience-mcp/.dockerignore`, and this Todo 13 evidence artifact were intentionally edited. `RUNBOOK.md` and `SLO.md` were not edited.

## Exact commands and evidence

- Baseline before edits:
  - `npm --prefix apps/family-experience-mcp run verify`
  - `docker version`
  - `docker build --platform linux/amd64 -t family-experience-mcp:market .`
  - Evidence: `.omo/evidence/family-experience-market-ready-platform/task-13-docker-build-before.txt`
  - Result: npm verify passed; Docker daemon failed at `npipe:////./pipe/dockerDesktopLinuxEngine`.

- Final Docker build attempt:
  - Workdir: `apps/family-experience-mcp`
  - Command: `docker build --platform linux/amd64 -t family-experience-mcp:market .`
  - Evidence: `.omo/evidence/family-experience-market-ready-platform/task-13-docker-build.txt`
  - Result: Docker daemon unavailable with the same Linux engine pipe error. No container runtime pass is claimed.

- Fallback compile/package proof:
  - `npx tsc --noEmit false --outDir .tmp-task-13-build`
  - `npm ci --omit=dev --ignore-scripts --dry-run`
  - Evidence:
    - `.omo/evidence/family-experience-market-ready-platform/task-13-fallback-compile.txt`
    - `.omo/evidence/family-experience-market-ready-platform/task-13-fallback-npm-ci-production.txt`
  - Result: passed.

- Fallback runtime proof without `.env`:
  - Env: `HOST=127.0.0.1`, `PORT=3349`, `FAMILY_EXPERIENCE_ALLOW_FIXTURE=false`, `FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache`
  - Command path: compile to `dist`, run `node dist/src/server.js`, `curl /health`, `curl` malformed `/mcp`, stop process, remove `dist`.
  - Evidence: `.omo/evidence/family-experience-market-ready-platform/task-13-fallback-node-runtime.txt`
  - Result: `/health` returned HTTP 200; malformed `/mcp` returned HTTP 400 JSON-RPC parse error; process stopped; `dist` removed.

- Final verify:
  - Command: `npm run verify`
  - Evidence: `.omo/evidence/family-experience-market-ready-platform/task-13-fallback-verify-final.txt`
  - Result: 21 test files passed, 150 tests passed.

- MCP smoke:
  - Command: `npm run smoke:mcp`
  - Evidence: `.omo/evidence/family-experience-market-ready-platform/task-13-fallback-smoke-mcp.txt`
  - Result: passed.

- Secret scan:
  - Final scoped command is recorded in `.omo/evidence/family-experience-market-ready-platform/task-13-secret-scan-final-rerun.txt`.
  - The earlier broad scan of the whole shared platform evidence directory failed on pre-existing non-Task-13 evidence files; that is recorded in `task-13-secret-scan.txt` and is not used as the final verdict.

## Trust boundary

The image must be run with safe environment variables supplied by the platform or orchestrator. The Dockerfile does not bake raw secrets, does not read `.env`, and does not copy local secret-bearing files into the image. Docker container runtime behavior remains unverified on this host because the Docker daemon was unavailable.

## Cleanup receipt

- Fallback runtime process was stopped: recorded in `task-13-fallback-node-runtime.txt`.
- Local `dist` was removed: recorded in `task-13-fallback-node-runtime.txt`.
- Local `.tmp-task-13-build` was removed before final verify: recorded in `task-13-fallback-node-runtime.txt`.
- Current probe showed both `apps/family-experience-mcp/dist` and `apps/family-experience-mcp/.tmp-task-13-build` absent before this doneclaim was written.

## No-commit reason

No commit was made because the user explicitly requested no commit and the worktree is shared with many unrelated user/other-lane changes.
