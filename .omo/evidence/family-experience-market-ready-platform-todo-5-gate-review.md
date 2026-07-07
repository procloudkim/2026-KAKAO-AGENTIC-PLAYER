# Gate Review: family-experience-market-ready-platform Todo 5

recommendation: REJECT
adversarialVerdict: needs-fix
confidence: high

## originalIntent

Independently verify Todo 5 from `.omo/plans/family-experience-market-ready-platform.md`: add source-health and ETL proof reports for `apps/family-experience-mcp/scripts/etl-nationwide.ts`.

The intended user-visible outcome is a repeatable ETL proof command/report that records source success or failure, normalized record counts, raw snapshot presence/counts, cache directory, source diagnostics, proof paths, and redaction verification without leaking raw API keys or keyed URLs.

## desiredOutcome

Approve only if current code, timestamped proof artifacts, rerun commands, secret scans, cleanup receipts, adversarial probes, code review report, manual QA matrix, and slop/overfit review all support the Todo 5 DoneClaim.

## userOutcomeReview

The core runtime behavior is mostly present and independently reproduced:

- `scripts/etl-nationwide.ts` writes timestamped and `etl-proof-latest.json` proofs, includes `proof.evidence_dir`, `proof.latest_path`, `proof.timestamped_path`, and proof-level `redaction_verified`.
- `runNationwideEtl` reports `ok`, `cache_dir`, source summaries, source provenance, `counts.normalized_records`, `counts.raw_snapshots`, `counts.failures`, `raw_snapshots_present`, and diagnostics.
- Cited timestamped failure proof `etl-proof-2026-07-07T14-24-34-665Z.json` records `ok=false`, `source=culture_portal`, `failure_code=source_failure`, `normalized_records=0`, `raw_snapshots=0`, `failures=1`, and a redacted 401 diagnostic URL.
- Cited timestamped success proof `etl-proof-2026-07-07T14-24-35-625Z.json` records `ok=true`, `normalized_records=10`, `raw_snapshots=1`, `failures=0`, `raw_snapshots_present=true`, and `redaction_verified=true`.
- Fresh current-env dry-run with temp proof dir exited `0`, did not hang, and produced `ok=true`, `records=10`, `raw=1`, `failures=0`, proof/report redaction true.
- Fresh fake-key dry-run with temp proof dir exited `2`, produced a redacted source failure diagnostic, and `FAKE_MARKET_PLAN_SECRET_REDACTED` was absent from the command output and temp proof files.
- Fresh `scan:secrets` over ETL proof artifacts plus Todo 5 text evidence exited `0` with `status=PASS`, `scanned_files=173`.
- Fresh full `verify` ultimately exited `0`: `tsc --noEmit` passed; Vitest reported `20` test files and `149` tests passed.

The shipped artifact still does not pass the final gate because several evidence and stability requirements are unresolved.

## blockers

1. Required review packet is incomplete.
   - Missing Todo 5 code review report: `.omo/evidence/family-experience-market-ready-platform/task-5-code-quality-review.md`.
   - Missing Todo 5 manual QA matrix: `.omo/evidence/family-experience-market-ready-platform/task-5-manual-qa-matrix.md`.
   - Missing Todo 5 notepad: `.omo/evidence/family-experience-market-ready-platform/task-5-notepad.md`.
   - Missing Todo 5 doneclaim/diff artifacts: `.omo/evidence/family-experience-market-ready-platform/task-5-doneclaim.md` and `task-5-diff.patch`.

2. Required code-review coverage for `programming` and `remove-ai-slops` is absent.
   - No Todo 5 review report exists, so there is no report-side coverage of excessive/useless tests, deletion-only tests, tests that merely verify removal, tautological tests, implementation-mirroring tests, unnecessary extraction/parsing/normalization, or TypeScript strictness/slop checks.
   - Direct reviewer pass found a test isolation problem in `test/etlNationwide.test.ts`: the CLI redaction test runs `scripts/etl-nationwide.ts` without overriding `FAMILY_EXPERIENCE_ETL_PROOF_DIR`, so `npm run verify` mutates `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-latest.json` and creates new proof artifacts.
   - Direct reviewer pass also found weak redaction-test shape: the fixture dry-run test checks for the hardcoded `<redacted>` sample URL and absence of the synthetic service key, but fixture mode does not exercise a source diagnostic containing that key.

3. `etl-proof-latest.json` is not stable evidence for Todo 5.
   - The user-cited timestamped proofs are from `2026-07-07T14:24:34.665Z` and `2026-07-07T14:24:35.625Z`.
   - During review, `etl-proof-latest.json` advanced repeatedly to later fixture proofs, ending at `etl-proof-2026-07-07T14-33-24-186Z.json` with `fixture=true`, `normalized_records=1`, and `raw_snapshots=1`.
   - The submitted cleanup receipt says `etl-proof-latest.json length=2187`; current latest length is `2252`.
   - This is caused at least in part by `verify` running the CLI test against the default proof directory.

4. Dirty/untracked workspace prevents diff-based approval.
   - `git ls-files --error-unmatch apps/family-experience-mcp/scripts/etl-nationwide.ts` reports the path is not known to git.
   - The Todo 5 script and evidence are all untracked in `git status --short`.
   - The broader workspace is heavily dirty, with concurrent changes observed during this review.

5. The claimed prior `verify` blocker is stale and unsupported by current evidence.
   - Submitted `task-5-verify.txt` says `test/health.test.ts` syntax errors blocked full verify.
   - A fresh verify first failed because `src/observability.js` could not be resolved, then the workspace changed and a rerun passed.
   - Current truth: full verify passes, but the verification surface is unstable under concurrent workspace mutation.

6. Secret-leak evidence is not perfectly clean if every Todo 5 evidence file is included.
   - Direct search found no unredacted `serviceKey=` values and no raw env-key assignments in the 18 ETL/Todo 5 files checked.
   - The fake key literal appears in `.omo/evidence/family-experience-market-ready-platform/task-5-fake-key-search.txt` as the search pattern itself.
   - This is not a real provider key, but it means the broad claim "no raw fake key appears anywhere in evidence" is false unless the self-referential search receipt is explicitly excluded.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `apps/family-experience-mcp/scripts/etl-nationwide.ts`
- `apps/family-experience-mcp/src/etl/nationwide.ts`
- `apps/family-experience-mcp/src/etl/redaction.ts`
- `apps/family-experience-mcp/test/etlNationwide.test.ts`
- `apps/family-experience-mcp/test/health.test.ts`
- `apps/family-experience-mcp/package.json`
- `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-latest.json`
- `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-2026-07-07T14-24-34-665Z.json`
- `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-2026-07-07T14-24-35-625Z.json`
- `.omo/evidence/family-experience-market-ready-platform/task-5-culture-etl.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-5-redaction-negative.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-5-scan-secrets-proof-artifacts.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-5-fake-key-search.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-5-script-typecheck.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-5-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-5-cleanup-receipt.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-5-loc-check.txt`

## commandsRun

- `codegraph_explore apps/family-experience-mcp/scripts/etl-nationwide.ts source-health ETL proof redaction cache diagnostics`
- `codegraph_explore apps/family-experience-mcp/src/etl/nationwide.ts runNationwideEtl summarizeSourceResult hasSecretLeak redactDiagnosticText`
- `codegraph_explore apps/family-experience-mcp/src/etl/redaction.ts redactDiagnosticText`
- `Get-Content .omo/plans/family-experience-market-ready-platform.md`
- `git status --short`
- `git diff -- apps/family-experience-mcp/scripts/etl-nationwide.ts`
- `git diff --stat`
- `Get-ChildItem .omo/evidence/family-experience-market-ready-platform/etl`
- Proof JSON parsing for latest and timestamped 14:24 proofs.
- Todo 5 text evidence header inspection.
- `rg` searches for fake key, env-key assignments, and unredacted keyed URLs across ETL/Todo 5 evidence.
- Fresh current-env dry-run using temp proof dir: `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source culture_portal`; exit `0`.
- Fresh fake-key dry-run using temp proof dir: `CULTURE_PORTAL_SERVICE_KEY=<redacted-synthetic-secret> node --import tsx scripts/etl-nationwide.ts --dry-run --source culture_portal`; exit `2`.
- `npm --prefix apps/family-experience-mcp run scan:secrets -- --include ...`; exit `0`, `status=PASS`, `scanned_files=173`.
- `npm --prefix apps/family-experience-mcp run verify`; first exit `1` due missing `observability.js`; rerun exit `0`, `20` test files, `149` tests.
- `git ls-files --error-unmatch apps/family-experience-mcp/scripts/etl-nationwide.ts`; not tracked.
- Missing artifact probe for Todo 5 code review, manual QA, notepad, doneclaim, and diff.

## adversarialClasses

- secret_leakage: PARTIAL PASS. Timestamped proofs and fresh temp proofs redact keyed URLs and fake service key. Evidence has one self-referential fake-key literal in `task-5-fake-key-search.txt`.
- misleading_success_output: PASS for CLI behavior. Fresh fake-key failure exited `2` and printed `ok=false`; fresh current-env success exited `0` and printed `ok=true`.
- stale_state_latest_overwrite: FAIL. `etl-proof-latest.json` is mutable and was overwritten by later fixture/test runs after the cited Todo 5 proofs.
- dirty_worktree: FAIL. Todo 5 script/evidence are untracked, and concurrent changes occurred during verification.
- malformed_provider_diagnostic: PASS. Fake-key source failure produced `failure_code=source_failure` and redacted `redacted_url`/`detail`.
- hung_long_external_command: PASS. Fresh current-env and fake-key ETL dry-runs completed inside the 45-second watchdog.
- cleanup_fake_env_and_temp_artifacts: PASS for fresh reruns. Temp proof dirs were removed and `CULTURE_PORTAL_SERVICE_KEY` was absent afterward. Submitted cleanup receipt is stale for latest-file length.
- proof_completeness: PARTIAL PASS. Timestamped proofs have required counts, source provenance, raw snapshot presence, cache dir, diagnostics, and proof paths; latest alias is not stable.
- slop_overfit: FAIL. Direct pass found non-isolated proof-writing test and weak fixture-mode redaction assertion; required report-side slop coverage is absent.

## exactEvidenceGaps

- No Todo 5 code review report.
- No Todo 5 manual QA matrix.
- No Todo 5 notepad path.
- No Todo 5 doneclaim/diff artifact.
- No report-side coverage for the required `remove-ai-slops` overfit/slop subcriteria.
- No stable latest-proof receipt; `etl-proof-latest.json` is overwritten by tests and later fixture runs.
- No clean tracked diff for the changed file because it is untracked.
- Submitted `scan:secrets` receipt says `scanned_files=158`, while the DoneClaim says `162`; fresh rerun over a broader Todo 5 set says `173`.
- Submitted `verify` blocker is stale relative to current successful verify.

## final

REJECT
