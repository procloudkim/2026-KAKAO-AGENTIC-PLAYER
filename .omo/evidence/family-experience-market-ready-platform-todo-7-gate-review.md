recommendation: REJECT

# Todo 7 Gate Review

## originalIntent

Todo 7 from `.omo/plans/family-experience-market-ready-platform.md` is to define portable deployment configuration and secret policy for local `.env`, KakaoCloud/PlayMCP-in-KC, and non-Kakao secret managers. It must extend `scan-secrets.ts` with documented `--include <path>` behavior for negative QA fixtures, must not instruct users to commit secrets, and must mark any PlayMCP-in-KC image-baked secret path as `HUMAN_APPROVAL_REQUIRED`, non-default, and subject to post-submit rotation.

## desiredOutcome

An operator can tell where every provider key belongs for local and deployed operation, docs contain no raw secrets or commit-secret instruction, image-baked keys are default-denied, and the scanner rejects provider-looking secrets from normal and explicit include surfaces while failing closed on malformed or nonexistent include paths.

## userOutcomeReview

The docs/env portion substantially satisfies the intended operator outcome: `.env.example`, `RUNBOOK.md`, and `HOST_REQUIREMENTS_SOT.md` distinguish local `.env`, host secret manager/env injection, KakaoCloud/PlayMCP-in-KC preferred secret injection, and the temporary image-baked exception. The docs explicitly forbid committing `.env` and require `HUMAN_APPROVAL_REQUIRED`, private image/registry, rotation, and removal for the image-baked path.

The shipped scanner outcome is not acceptable. A placeholder allowlist short-circuits all secret rules for the entire line, so a real-looking key on the same line as an allowed placeholder is silently skipped. This is an unresolved overfit/slop false negative in the secret-leakage gate.

## blockers

1. Secret scanner false negative through whole-line placeholder allowlist.
   - Evidence: `scanText("probe.txt", "CLI_SYNTHETIC_SERVICE_KEY_12345 API_KEY=<redacted-synthetic-secret>")` returned `[]`.
   - Evidence: `npm --prefix apps/family-experience-mcp run scan:secrets -- --include <temp file>` with `CLI_SYNTHETIC_SERVICE_KEY_12345 API_KEY=<redacted-synthetic-secret>` exited `0` and printed `{"status":"PASS","scanned_files":149}`.
   - Root cause: `isAllowedPlaceholderContext()` in `apps/family-experience-mcp/scripts/scan-secrets.ts:102-108` returns before any secret rule is evaluated.

2. Required full verification is not green.
   - Command: `npm --prefix apps/family-experience-mcp run verify`.
   - Result: exit `1`; typecheck passed, but Vitest failed `test/scanClaims.test.ts` two tests: `allows explicit include with a public unsupported-claim caveat` and `allows explicit include with an English live-now caveat only`.

3. Slop/overfit coverage is incomplete.
   - Direct `remove-ai-slops` pass found the whole-line placeholder bypass above.
   - Direct programming size pass found `apps/family-experience-mcp/test/etlNationwide.test.ts` at 368 pure LOC with no `SIZE_OK`/exception marker.
   - The executor code-review artifact mentions scanner LOC and overfit checks, but does not cover the actual placeholder bypass or the oversized changed test file.

4. Dirty/stale delivery state remains high risk.
   - Specific status: `RUNBOOK.md`, `scan-secrets.ts`, and `scanSecrets.test.ts` are added in the index; `.gitignore`, `.env.example`, `HOST_REQUIREMENTS_SOT.md`, and `etlNationwide.test.ts` are untracked.
   - Current rerun of `scan:secrets` scanned 148 files, while the claimed artifact says 147, so file-count claims are stale-state-sensitive and not proof by themselves.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `apps/family-experience-mcp/scripts/scan-secrets.ts`
- `apps/family-experience-mcp/test/scanSecrets.test.ts`
- `apps/family-experience-mcp/.env.example`
- `apps/family-experience-mcp/docs/RUNBOOK.md`
- `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`
- `apps/family-experience-mcp/test/etlNationwide.test.ts`
- `apps/family-experience-mcp/package.json`
- `.gitignore`
- `.omo/evidence/family-experience-market-ready-platform/task-7-scan-secrets.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-negative-secret.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-include-failclosed.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-doc-secret-review.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-policy-grep.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-code-quality-doc-review.md`

## commands

- `npm --prefix apps/family-experience-mcp run scan:secrets`
  - Exit: `0`
  - Evidence: `{"status":"PASS","scanned_files":148}`
- `npm --prefix apps/family-experience-mcp test -- --run test/scanSecrets.test.ts`
  - Exit: `0`
  - Evidence: 1 file passed, 7 tests passed.
- `npm --prefix apps/family-experience-mcp run scan:secrets -- --include`
  - Exit: `1`
  - Evidence: `Missing path for --include`
- `npm --prefix apps/family-experience-mcp run scan:secrets -- --include .omo/tmp/market-plan/no-such-secret-fixture.env`
  - Exit: `1`
  - Evidence: `ENOENT`
- `npm --prefix apps/family-experience-mcp run scan:secrets -- --include <temp fake provider secret>`
  - Exit: `1`
  - Evidence: finding rule `provider-service-key`; raw key value was not printed.
- `node --import tsx --input-type=module -e <scanText placeholder bypass probe>` from `apps/family-experience-mcp`
  - Exit: `0`
  - Evidence: all placeholder+`API_KEY=` cases returned empty findings.
- `npm --prefix apps/family-experience-mcp run scan:secrets -- --include <temp placeholder bypass file>`
  - Exit: `0`
  - Evidence: `{"status":"PASS","scanned_files":149}` despite a real-looking `API_KEY=` value.
- `npm --prefix apps/family-experience-mcp run verify`
  - Exit: `1`
  - Evidence: 17 test files passed, 1 failed; 126 tests passed, 2 failed.

## adversarialClasses

- malformed_input: malformed `--include` and nonexistent include path fail closed.
- untrusted_external_text: normal fake provider-key include is rejected, but placeholder+secret external text bypasses detection.
- secret leakage: docs/env do not show raw key patterns in reviewed artifacts, but scanner false negative leaves leakage gate incomplete.
- dirty_worktree: claimed files are mixed between added-index and untracked state; unrelated evidence dirt also exists.
- misleading_success_output: `scan:secrets` PASS is misleading for the placeholder-bypass class.
- stale_state: claimed scan count 147 differs from rerun 148; full verify blocker changed from the executor's reported Todo 4 typecheck blocker to current claim-test failures.

## exactEvidenceGaps

- No supplied diff artifact covering all six claimed changed files; `git diff` showed only the indexed added files, while three claimed changed files are untracked.
- No supplied manual QA matrix for Todo 7; not fatal for docs/scanner-only scope, but absent from the gate packet.
- No supplied Todo 7 notepad path in the brief.
- Existing code-review report does not substantiate the placeholder-bypass class and does not cover the 368 pure-LOC changed test file.

## rationale

Narrow happy-path Todo 7 checks are confirmed: docs define secret placement, `scan:secrets` currently passes, malformed/nonexistent includes fail closed, normal provider-key includes are rejected, and focused scanner tests pass. Approval is still blocked because the scanner can be bypassed by the exact kind of synthetic placeholder allowlist added to avoid test noise, full package verification fails, and the review/slop coverage misses both the false negative and an oversized changed test file.
