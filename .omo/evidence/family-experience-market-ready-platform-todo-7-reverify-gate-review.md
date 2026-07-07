# Todo 7 Reverify Gate Review

recommendation: REJECT

## originalIntent

Define portable deployment configuration and secret policy for `apps/family-experience-mcp`: no committed provider secrets, portable local/host secret placement, PlayMCP-in-KC image-baked secret path only as a non-default human-approved exception, and a secret scanner that fails closed for explicit includes and catches provider/API keys without suppressing real keys next to placeholders.

## desiredOutcome

- `--include` is fail-closed for malformed and missing paths.
- Mixed allowed placeholder plus separate real-looking `API_KEY` is detected.
- Pure allowed placeholder fixtures remain allowed only where intended.
- Docs/env examples do not instruct committing secrets.
- PlayMCP-in-KC image-baked secret path is `HUMAN_APPROVAL_REQUIRED`, non-default, private registry/repository only, with no raw logs/evidence and rotation/removal plan.
- Focused scanner tests, `scan:secrets`, and full `verify` are rerun and only confirmed passes are reported.

## userOutcomeReview

The deployment docs and main scanner lanes now mostly satisfy the user-visible Todo 7 outcome, and full integration verify is restored. However, the shipped scanner still permits placeholder-prefixed real-looking values because placeholder allowance is substring-based within a matched occurrence. That means the user would receive a false sense that allowed placeholders are constrained to pure fixtures, while a real-looking value containing an allowed placeholder token can pass undetected.

## blockers

1. Placeholder allowance is not exact, so pure placeholders are not allowed only where intended.
   - Current code: `apps/family-experience-mcp/scripts/scan-secrets.ts` lines 104-120 checks each regex match occurrence, but `isAllowedPlaceholderOccurrence(text)` returns true when the matched text merely contains an allowed placeholder substring.
   - Direct read-only probe:
     - `SERVICE_KEY=<redacted-synthetic-secret>` -> `findings: []` (expected allow)
     - `API_KEY=<redacted-synthetic-secret>` -> `findings: []` (unexpected allow)
     - `SERVICE_KEY=<redacted-synthetic-secret>` -> `findings: []` (unexpected allow)
   - This is an unresolved secret-scanner false negative for the adversarial class "allowed placeholder embedded in a longer provider/API key value".

2. Latest-fix review coverage is incomplete for the required slop/overfit criteria.
   - Missing path: `.omo/evidence/family-experience-market-ready-platform/task-7-implementation-review.md`.
   - Existing root artifact `.omo/evidence/task-7-implementation-review.md` is dated 2026-07-02 and covers older Todo 7 MCP/golden work, not the latest `scan-secrets.ts` mixed-token fix.
   - `.omo/evidence/family-experience-market-ready-platform/task-7-code-quality-doc-review.md` has a one-line "Overfit/slop check", but it does not explicitly cover deletion-only tests, tautological tests, implementation-mirroring tests, excessive/useless tests, unnecessary extraction/parsing/normalization, or the placeholder-exactness adversarial class.

## checkedArtifactPaths

- `apps/family-experience-mcp/scripts/scan-secrets.ts`
- `apps/family-experience-mcp/test/scanSecrets.test.ts`
- `apps/family-experience-mcp/test/etlNationwide.test.ts`
- `apps/family-experience-mcp/.env.example`
- `apps/family-experience-mcp/.gitignore` (absent)
- `.gitignore`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/docs/RUNBOOK.md`
- `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`
- `.omo/evidence/family-experience-market-ready-platform/task-7-done-claim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-7-scan-secrets.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-negative-secret.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-include-failclosed.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-doc-secret-review.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-policy-grep.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-code-quality-doc-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-7-final-focused-scanSecrets.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-final-scan-secrets.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-final-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-mixed-placeholder-cli-after-fix.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-loc.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-7-changed-files.txt`
- `.omo/evidence/task-7-implementation-review.md`
- `.omo/evidence/task-7-notepad.md`
- `.omo/evidence/task-7-diff-summary.md`

## commands

- `npm --prefix apps/family-experience-mcp test -- --run test/scanSecrets.test.ts`
  - PASS: 1 file passed, 10 tests passed.
- `npm --prefix apps/family-experience-mcp run scan:secrets`
  - PASS: `scanned_files: 148`.
- `npm --prefix apps/family-experience-mcp run verify`
  - PASS: typecheck passed, 18 test files passed, 134 tests passed.
- Existing mixed-token include fixture probe:
  - Skipped because `.omo/evidence/family-experience-market-ready-platform/task-7-red-mixed-placeholder-real-looking.env` is removed.
- Temporary include probe outside workspace:
  - Command: `npm run scan:secrets -- --include <temp mixed-token env>`
  - Expected rejection observed: exit 1, `rule: "key-assignment"`.
  - Temp cleanup verified: no `family-experience-mixed-secret-*.env` files remained in `%TEMP%`.
- Direct placeholder-exactness probe:
  - Command: `node --import tsx --input-type=module -e "import { scanText } from './scripts/scan-secrets.ts'; ..."`
  - Unexpected: placeholder-prefixed longer values returned `findings: []`.
- `git check-ignore -v apps/family-experience-mcp/.env apps/family-experience-mcp/.env.local apps/family-experience-mcp/.env.example`
  - PASS: `.env` and `.env.local` ignored; `.env.example` explicitly unignored.

## confirmedEvidence

- `--include` malformed/missing path behavior is fail-closed in scanner code and original evidence.
- Separate placeholder plus real-looking key on the same line is detected by test and by a temporary CLI include probe.
- Focused scanner tests pass.
- `scan:secrets` passes.
- Full `verify` now passes; previous done-claim failure is stale.
- Docs/env policy says do not commit `.env` or raw provider keys, maps provider keys to `.env` or secret managers, and makes PlayMCP-in-KC image-baked keys non-default `HUMAN_APPROVAL_REQUIRED` with private image/registry, no raw logs/evidence, rotation, and removal plan.

## adversarialClasses

- malformed include: PASS.
- missing include path: PASS.
- explicit include secret fixture: PASS.
- mixed placeholder plus separate real-looking key: PASS.
- pure placeholder fixture: PASS for the exact fixture.
- placeholder embedded in longer real-looking key value: FAIL.
- docs instruct committing secrets: PASS, no such instruction found.
- PlayMCP-in-KC host exception defaulting: PASS, documented non-default and human-approved.
- misleading stale success/failure evidence: PARTIAL; full verify restored, but review artifacts for latest fix remain incomplete.
- overfit/slop direct pass: FAIL due unresolved false-negative test gap and incomplete review coverage.

## exactEvidenceGaps

- No regression test proves that `API_KEY=<allowed-placeholder><extra-token>` is rejected.
- No latest-fix code review artifact in the Todo 7 subdirectory explicitly covers the required remove-ai-slops/programming criteria.
- Existing focused tests prove the fixed mixed-token class, but not exact placeholder value matching.

