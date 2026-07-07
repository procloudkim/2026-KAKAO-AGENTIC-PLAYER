# DoneClaim: Todo 5 Source-Health and ETL Proof Reports

Status: DONE for Todo 5 reject repair.

Changed files:
- `apps/family-experience-mcp/test/etlNationwide.test.ts`
- `.omo/evidence/family-experience-market-ready-platform/task-5-*`
- `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-2026-07-07T15-05-03-090Z.json`
- `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-latest.json`

Commands and results:
- `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts`: PASS, exit 0, 20 tests in `task-5-focused-etl-test.txt`.
- `npm --prefix apps/family-experience-mcp run verify`: PASS, exit 0, 20 test files and 149 tests in `task-5-verify.txt`.
- Verify isolation receipt: PASS, `canonical_latest_mutated_by_verify=false` in `task-5-verify-proof-dir-isolation.txt`.
- `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source culture_portal`: PASS, exit 0, `ok=true`, 10 normalized records, 1 raw snapshot in `task-5-culture-etl.txt`.
- Fake-key redaction negative with temp proof dir: PASS, exit 2, `ok=false`, redacted keyed diagnostic path, `fake_key_occurrences_in_output_and_temp_proofs=0` in `task-5-redaction-negative.txt`.
- `npm --prefix apps/family-experience-mcp run scan:secrets -- --include ...`: PASS, exit 0, `scanned_files=176` in `task-5-scan-secrets-proof-artifacts.txt`.
- Broader Todo 5 evidence secret scan: PASS, exit 0, `scanned_files=180` in `task-5-final-evidence-secret-scan.txt`.

Manual QA:
- CLI proof JSON contains source success/failure, normalized record count, raw snapshot count/presence, cache dir, diagnostics, timestamped/latest proof paths, proof redaction flag, and no raw key or keyed URL.
- Matrix recorded at `task-5-manual-qa-matrix.md`.

Adversarial classes:
- generated/cached stale_state: PASS with caveat. `etl-proof-latest.json` is mutable alias only; timestamped proof files are stable evidence.
- dirty_worktree: RECORDED. Scoped files are untracked in `task-5-status.txt`; no unrelated changes reverted.
- misleading_success_output: PASS. Success exits 0 with `ok=true`; fake-key failure exits nonzero with `ok=false`.
- untrusted external text/secret leakage: PASS. Provider diagnostics are redacted and secret scan passes.
- hung_long_external_command: PASS. Required dry-runs completed within bounded tool waits.
- flaky_tests: PASS. Focused ETL tests and full verify both pass.
- malformed input: PASS via existing invalid source/max-pages/cache-dir test.
- not applicable: cancel/resume and mid-operation interrupts were not tested.

Cleanup:
- Fake-key env override and temp proof dir removed after capture.
- No Docker, deployment, remote endpoint, PlayMCP submission, or public launch completion is claimed.

Risks:
- `etlNationwide.test.ts` remains oversized under existing `SIZE_OK` waiver.
- External Culture Portal availability can change; this Todo records the current proof, not a deployment guarantee.

Evidence packet:
- `task-5-code-quality-review.md`
- `task-5-manual-qa-matrix.md`
- `task-5-notepad.md`
- `task-5-diff.patch`
- `task-5-doneclaim.md`
- `task-5-final-evidence-secret-scan.txt`
