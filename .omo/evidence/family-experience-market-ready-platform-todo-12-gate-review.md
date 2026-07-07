# Todo 12 Gate Review - Family Experience MCP Market-Ready Plan

recommendation: REJECT
sisyphusVerdict: needs-fix
reviewedAt: 2026-07-08 Asia/Seoul
reviewMode: final gate reviewer, read-only for product files

## originalIntent

Todo 12 asked for structured operational logs and launch metrics for request count, tool success/failure, latency, cache age, source failures, invalid input, no-result rate, deployed version, source-health state, and redaction verification. It explicitly forbids raw prompt logging when prompts may contain child personal data.

## desiredOutcome

Todo 12 can be marked complete only if `/health` or a documented diagnostics path exposes non-sensitive cache/config/source-health/operations state; structured logs are non-sensitive; captured logs pass scanner checks; current tests/typecheck/verify are green; manual health/failure probes are clean; no listener/process is left behind; and the Sisyphus evidence package includes supported DoneClaim, code-review/slop coverage, manual QA, and ledger state.

## userOutcomeReview

Current runtime behavior mostly satisfies the user-visible operational outcome: current focused observability tests pass, current full verify passes, current scanner runs pass, `/health` returns HTTP 200 with cache and operations diagnostics, operational tool-failure logs omit raw prompt/child-name/fake secret/stack data, malformed HTTP input returns a bounded parse error, and port 3349 is released after probes.

Do not mark Todo 12 complete yet. The completion package is not Sisyphus-complete: the start-work ledger does not contain a Todo 12 done-claim or task-completed event, the plan checkbox remains unchecked, and required code-review/manual-QA/notepad/diff artifacts are missing. The captured `task-12-redacted-failure-log.txt` also contains a raw `prompt` field from the smoke output; this appears to be a CLI smoke result rather than an operational log, but it weakens the redaction evidence and is inconsistent with the stronger "no raw prompts" claim unless explicitly scoped.

## blockers

1. Missing Sisyphus completion state:
   - `.omo/start-work/ledger.jsonl` has Todo 12 dispatch/subagent entries only; no `done-claim-received`, `adversarial-verify confirmed`, or `task-completed` entry for Todo 12 was found.
   - `.omo/plans/family-experience-market-ready-platform.md` still shows `- [ ] 12. Add structured operational logs and launch metrics`.

2. Missing required review package:
   - No Todo 12 code-review report artifact was found, such as `task-12-code-quality-review.md`.
   - No Todo 12 manual-QA matrix artifact was found.
   - No Todo 12 notepad path/artifact was found.
   - No Todo 12 diff/changed-files artifact was found; this matters because the relevant app files are untracked in the current worktree.

3. Required skill-perspective coverage is absent from executor artifacts:
   - I directly consulted `omo:remove-ai-slops` and `omo:programming` and ran an overfit/slop pass.
   - The DoneClaim does not itself provide a code-review report explicitly covering remove-ai-slops categories, overfit/tautological/deletion-only/implementation-mirroring tests, or programming criteria. Per final-gate rules, absent report coverage is a rejection even when the direct pass finds no unresolved runtime blocker.

4. Evidence hygiene gap:
   - `.omo/evidence/family-experience-market-ready-platform/task-12-redacted-failure-log.txt` contains `"prompt": "부산 이번 주말 4살 실내"`.
   - This is not present in the structured operational log probe, and my fresh operational-log redaction probe passed, but the artifact name and DoneClaim wording make it easy to misread the file as a redacted operational failure log. Regenerate or relabel the artifact, or add a redaction check that explicitly distinguishes CLI smoke output from operational logs and checks prompt omission where required.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/start-work/ledger.jsonl`
- `.omo/evidence/family-experience-market-ready-platform/task-12-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-12-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-doneclaim-scan.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-health.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-loc.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-12-observability-test.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-preflight-listening.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-redacted-failure-log.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-redacted-failure-scan.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-redaction-check.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-scan-claims.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-scan-secrets.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-scan-sources.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-server.err.log`
- `.omo/evidence/family-experience-market-ready-platform/task-12-server.out.log`
- `.omo/evidence/family-experience-market-ready-platform/task-12-tool-log-probe.json`
- `.omo/evidence/family-experience-market-ready-platform/task-12-tool-log-scan.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-typecheck.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-12-verify.txt`
- `apps/family-experience-mcp/src/observability.ts`
- `apps/family-experience-mcp/src/observabilityTypes.ts`
- `apps/family-experience-mcp/src/observabilityCache.ts`
- `apps/family-experience-mcp/src/observabilityRedaction.ts`
- `apps/family-experience-mcp/src/health.ts`
- `apps/family-experience-mcp/src/server.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/src/config.ts`
- `apps/family-experience-mcp/src/etl/cacheStatus.ts`
- `apps/family-experience-mcp/test/observability.test.ts`
- `apps/family-experience-mcp/docs/RUNBOOK.md`

## directVerification

- `npm --prefix apps/family-experience-mcp test -- --run test/observability.test.ts`: PASS, 1 file / 3 tests.
- `npm --prefix apps/family-experience-mcp run verify`: PASS, 20 files / 149 tests.
- `npm --prefix apps/family-experience-mcp run scan:secrets`: PASS, 160 files.
- `npm --prefix apps/family-experience-mcp run scan:claims`: PASS, 141 files.
- `npm --prefix apps/family-experience-mcp run scan:sources`: PASS, 108 files.
- `npm --prefix apps/family-experience-mcp run scan:secrets -- --include task-12-redacted-failure-log.txt --include task-12-tool-log-probe.json --include task-12-server.out.log`: PASS, 163 files.
- Manual in-process `/health` probe on `127.0.0.1:3349`: HTTP 200; response included `cache`, `cache_metrics`, and `operations`; server emitted JSON `server_start` and `http_request` logs.
- Fresh operational failure-log probe with fake secret and child-name-like prompt: `raw_secret_present=false`, `child_name_present=false`, `prompt_key_present=false`, `stack_present=false`, `bounded_failure_present=true`.
- Malformed HTTP JSON probe to `/mcp`: HTTP 400 parse error; no stack or secret-like token in response.
- Cleanup: pre/post `Get-NetTCPConnection -LocalPort 3349 -State Listen` returned no listener.

## directSlopAndProgrammingPass

- Production implementation: cohesive files for metrics/logging/cache summary/redaction/types; no unresolved deletion-only code, tautological production extraction, or obvious needless abstraction found.
- Tests: `observability.test.ts` asserts observable behavior through `callFindFamilyExperiences`, `getHealthStatus`, and HTTP server paths; not deletion-only and not merely verifying removal. Some assertions mirror expected log shape, but they are tied to the public operational contract, not private helper internals.
- Size: task artifact reports touched TypeScript files under 250 pure LOC. `observability.ts` is in the warning band at 246 pure LOC, `mcp.ts` at 225, `observability.test.ts` at 211; not a current defect, but future changes should split before adding behavior.
- Programming criteria: boundary parsing is still through Zod schemas; logs avoid request bodies and prompt content in operational entries; catch paths convert unknown internal errors to bounded HTTP errors. No direct `any`, non-null assertion, or empty catch blocker was found in reviewed Todo 12 files.
- Report coverage: executor artifacts do not include an explicit programming/remove-ai-slops code review report, so final-gate report-coverage criteria are not met.

## adversarialClasses

- stale_state: partially mitigated by current reruns of focused tests, full verify, scans, `/health`, redaction, malformed input, and cleanup. Still blocked by stale/incomplete Sisyphus ledger state.
- dirty_worktree: active. `git status --short` shows a heavily dirty/untracked workspace, including the app files and many evidence files. This does not invalidate current command results, but it prevents a normal git diff from proving Todo 12 scope without a changed-files/diff artifact.
- misleading_success_output: current command exits and counts were inspected directly. No false green observed in current verification. Sisyphus success prose remains unsupported because ledger and review-package artifacts are missing.
- secret_leakage/untrusted diagnostics: operational structured logs passed direct fake-secret/child-name/prompt/stack checks; scanners passed. Evidence artifact `task-12-redacted-failure-log.txt` still contains a raw smoke `prompt`, so evidence hygiene needs repair or explicit scoping.
- hung_long_external_command: current verify completed in about 18-21 seconds and no long-running server remained. No hang observed.
- malformed_input: passed direct `/mcp` bad JSON probe with HTTP 400 bounded parse error and no stack/secret output.
- cleanup: passed direct port 3349 pre/post listener checks. Broader existing Node process noise was not attributed to this probe; no Todo 12 listener was left behind.

## exactEvidenceGaps

- Missing `.omo/start-work/ledger.jsonl` Todo 12 `done-claim-received`.
- Missing `.omo/start-work/ledger.jsonl` Todo 12 `adversarial-verify` confirmation.
- Missing `.omo/start-work/ledger.jsonl` Todo 12 `task-completed`.
- Missing checked plan checkbox for Todo 12.
- Missing Todo 12 code-review report with explicit `omo:programming` and `omo:remove-ai-slops`/overfit criteria.
- Missing Todo 12 manual QA matrix.
- Missing Todo 12 notepad path.
- Missing Todo 12 diff or changed-files artifact that can support scope review in an untracked/dirty tree.
- Ambiguous `task-12-redacted-failure-log.txt` contains a raw smoke prompt and the paired redaction check does not assert prompt omission.

## finalDecision

Do not mark Todo 12 complete yet. Runtime behavior is close, but Sisyphus completion evidence and review-package hygiene are incomplete. Fix the missing artifacts/ledger state and regenerate or explicitly scope the ambiguous redacted-failure evidence, then rerun the same verification lanes for a confirmable gate.
