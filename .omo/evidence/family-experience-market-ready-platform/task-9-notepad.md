# Task 9 Notepad: cache refresh and stale-cache behavior

Date: 2026-07-08
Working status: ready_for_reverify_but_blocked_until_todo5_confirmed

## Current read

- Todo 9 implementation behavior is already present: stale/missing cache paths fail closed with `missing_configuration`, zero candidates, and refresh guidance.
- Todo 9 cannot be marked complete because `.omo/plans/family-experience-market-ready-platform.md` still has Todo 5 unchecked and Todo 9 says `Blocked by: 5`.
- A fresh Todo 5 DoneClaim exists, but the latest Todo 5 gate review in this workspace is still `REJECT`; I did not treat Todo 5 as confirmed.
- I did not edit the plan checkbox or mark Todo 9 complete.

## Evidence package repairs

- Added `task-9-code-quality-review.md` with explicit `omo:programming` and `omo:remove-ai-slops` criteria.
- Added `task-9-manual-qa-matrix.md` with exact CLI/HTTP surfaces and binary observables.
- Added this notepad artifact.
- Added/refreshing `task-9-changed-files.txt` as the scope/status artifact.
- Updating `task-9-cache-doneclaim.md` to `ready_for_reverify_but_blocked_until_todo5_confirmed`.

## Adversarial classes

- stale_state: PASS for Task 9 behavior after direct rerun; BLOCKING DEPENDENCY remains Todo 5 confirmation.
- dirty_worktree: RECORDED. The workspace has substantial tracked/untracked state from other work; no unrelated changes were reverted.
- misleading_success_output: PASS if exit codes and output fields match the matrix; tests and smoke outputs are treated as untrusted until rerun.
- generated_cached_artifacts: PASS for Todo 9 scope. The mutable ETL proof area belongs to Todo 5 and is not used to complete Todo 9.
- hung_long_external_command: PASS if server process is stopped and no long command is left running after health smoke.
- malformed_input: PASS via existing focused tests for malformed cache metadata/records/source inputs.
- cleanup: PASS when temporary cache dirs are removed and the temporary health server is stopped.
- untrusted_external_text: NOT_APPLICABLE for this repair. No prompt-injection cache evidence is used as Todo 9 completion proof.

## Scope guard

No unrelated feature work. No plan checkbox edits. No claim that Todo 9 is complete until Todo 5 is independently confirmed.
