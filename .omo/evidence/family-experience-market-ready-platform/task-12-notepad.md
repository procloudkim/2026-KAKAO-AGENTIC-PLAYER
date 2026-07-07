# Todo 12 Notepad

task: Add structured operational logs and launch metrics
status: ready for independent re-gate after evidence repair
updatedAt: 2026-07-08 Asia/Seoul

## Read First Completed

- `.omo/plans/family-experience-market-ready-platform.md` Todo 12 section
- `.omo/evidence/family-experience-market-ready-platform-todo-12-gate-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-12-doneclaim.md`
- Existing `task-12-*` evidence files
- CodeGraph exploration of Todo 12 observability, health, server, MCP, and redaction paths

## Blocker Repair Notes

- Added explicit code quality review: `task-12-code-quality-review.md`.
- Added manual QA matrix: `task-12-manual-qa-matrix.md`.
- Added this notepad artifact for review traceability.
- Added fresh operational log redaction receipt: `task-12-operational-log-redaction-proof.txt`.
- Preserved and scoped the old CLI smoke artifact: `task-12-redacted-failure-log.txt` is not used as operational-log proof because it includes the CLI input `prompt` field.
- Added scope artifact: `task-12-changed-files.txt`.
- Updated DoneClaim: `task-12-doneclaim.md`.

## Adversarial Classes

- stale_state: reran focused observability tests, full verify, and all scanner lanes in this turn.
- dirty_worktree: workspace remains heavily dirty/untracked; scope is recorded in `task-12-changed-files.txt`.
- misleading_success_output: command artifacts include exit codes and test counts.
- secret leakage/untrusted diagnostics: fresh operational log probe checks secret, child name, raw prompt key/content, stack, and bounded failure.
- hung_long_external_command: verify completed and manual server was stopped.
- malformed_input: malformed `/mcp` JSON returns HTTP 400 bounded parse error.
- cleanup: post-probe listener check reports no listener on port 3349.

## Risks

- Metrics are in-memory and reset on restart; persistent telemetry/export is Todo 14.
- `observability.ts` is 246 pure LOC; future behavior additions should split before expanding it.
- Current proof is local/manual. Remote deployment proof remains out of Todo 12 unless a deployed endpoint exists.
