# Todo 12 DoneClaim - structured operational logs and launch metrics

status: ready-for-independent-regate
updatedAt: 2026-07-08 Asia/Seoul

## Changed Files

- `apps/family-experience-mcp/src/observability.ts`
- `apps/family-experience-mcp/src/observabilityTypes.ts`
- `apps/family-experience-mcp/src/observabilityCache.ts`
- `apps/family-experience-mcp/src/observabilityRedaction.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/src/server.ts`
- `apps/family-experience-mcp/src/health.ts`
- `apps/family-experience-mcp/test/observability.test.ts`
- `apps/family-experience-mcp/docs/RUNBOOK.md`
- Todo 12 evidence package files under `.omo/evidence/family-experience-market-ready-platform/`

## Implemented Behavior

- Structured JSON operational logs for `server_start`, `http_request`, and `tool_call`.
- In-process launch metrics for request count, request success/failure, rate-limit count, tool success/failure, invalid input, no-result count, source-failure count, and latency snapshots.
- `/health` exposes non-sensitive `cache`, `cache_metrics`, and `operations` diagnostics, including cache age/TTL and source-health summary.
- Tool failure diagnostics are redacted and bounded to failure code, retryability, and sanitized message.
- Operational logs avoid raw prompts, child names, raw secrets, keyed URLs, request bodies, and stack traces.
- Request-control behavior from Todo 10 remains in the server path; HTTP request logs are emitted after bounded responses.

## Commands and Results

| Scenario | Invocation | Binary observable | Artifact |
| --- | --- | --- | --- |
| Focused observability tests | `npm --prefix apps/family-experience-mcp test -- --run test/observability.test.ts` | exit code 0; 1 test file passed; 3 tests passed | `task-12-observability-test.txt` |
| Full package verification | `npm --prefix apps/family-experience-mcp run verify` | exit code 0; TypeScript compile passed; 21 test files passed; 150 tests passed | `task-12-verify.txt` |
| Secret scan | `npm --prefix apps/family-experience-mcp run scan:secrets` | exit code 0; PASS JSON | `task-12-scan-secrets.txt` |
| Claim scan | `npm --prefix apps/family-experience-mcp run scan:claims` | exit code 0; PASS JSON | `task-12-scan-claims.txt` |
| Source scan | `npm --prefix apps/family-experience-mcp run scan:sources` | exit code 0; PASS JSON | `task-12-scan-sources.txt` |
| Escape hatch scan | `rg` over reviewed Todo 12 TypeScript files for `@ts-ignore`, `@ts-expect-error`, `as any`, `: any`, `<any>`, and non-null assertion forms | no matches | `task-12-code-quality-escape-hatch-scan.txt` |
| Code-size review | PowerShell pure LOC count over touched TypeScript files | all reviewed files under 250 pure LOC; `observability.ts` at 246 warning band | `task-12-loc.tsv` |

## Manual QA

Manual QA matrix: `task-12-manual-qa-matrix.md`.

| Scenario | Surface | Binary observable | Artifact |
| --- | --- | --- | --- |
| Health diagnostics | HTTP `GET /health` on local server `127.0.0.1:3349` | HTTP `200 OK`; body includes `cache`, `cache_metrics`, and `operations` | `task-12-manual-health.http` |
| Malformed MCP JSON | HTTP `POST /mcp` with malformed JSON body | HTTP `400 Bad Request`; JSON-RPC `parse_error`; bounded response | `task-12-manual-malformed-mcp.http` |
| Operational failure log redaction | in-process `callFindFamilyExperiences` with fake secret and child-name-like prompt plus injected logger | `pass=true`; raw secret absent; child name absent; raw prompt key/content absent; stack absent; bounded failure present | `task-12-operational-log-redaction-proof.txt` |
| Cleanup | port listener state after server stop | `listener_after_cleanup=absent` | `task-12-manual-cleanup.txt` |

## Redaction Evidence Repair

The prior `task-12-redacted-failure-log.txt` artifact is retained only as CLI smoke output. It contains the CLI smoke input field `prompt`, so it is not operational-log proof.

Fresh operational proof is `task-12-operational-log-redaction-proof.txt`:

- `pass=true`
- `raw_secret_absent=true`
- `child_name_absent=true`
- `raw_prompt_key_absent=true`
- `raw_prompt_content_absent=true`
- `stack_absent=true`
- `bounded_failure_present=true`
- `event_is_tool_call=true`

Additional sensitive-marker scan: `task-12-manual-redaction-scan.txt` reports PASS for fresh manual QA operational artifacts.

## Code Quality and Slop Review

Review artifact: `task-12-code-quality-review.md`.

- `omo:programming` criteria: PASS for escape hatches, boundary typing, bounded error handling, exhaustive failure-code handling, and logging safety.
- `omo:remove-ai-slops` criteria: PASS for no deletion-only tests, no tautological/implementation-mirroring tests, no excessive/useless tests, no unnecessary extraction/parsing/normalization, and no dead/debug code in reviewed Todo 12 files.
- LOC/complexity: PASS with warning-band note for `observability.ts`, `mcp.ts`, and `observability.test.ts`.

## Scope Review

Artifact: `task-12-changed-files.txt`.

The app/evidence workspace is heavily dirty and many Todo 12 files are untracked in this baseline, so the scope artifact records untracked status rather than pretending a normal git diff is complete.

## Adversarial Classes

- stale_state: PASS. Focused test, full verify, and scans were rerun in this turn with exit code 0.
- dirty_worktree: MITIGATED. Current status is captured in `task-12-changed-files.txt`; unrelated existing work was not reverted.
- misleading_success_output: PASS. Artifacts include command exit codes and observable counts/status.
- secret leakage/untrusted diagnostics: PASS. Fresh operational log proof checks fake secret, child name, prompt key/content, stack, and bounded failure.
- hung_long_external_command: PASS. Full verify completed; manual server process was stopped.
- malformed_input: PASS. Malformed `/mcp` JSON returned HTTP 400 bounded parse error.
- cleanup: PASS. Manual QA cleanup records no listener on port 3349.
- stale_remote_endpoint: NOT APPLICABLE. Todo 12 verification was local because no deployed endpoint was provided.
- external_provider_outage: NOT APPLICABLE. Todo 12 operational failure path uses missing configuration/local cache diagnostics, not live provider calls.

## Cleanup

- Server process started for manual `/health` and malformed `/mcp` probes was stopped.
- Port cleanup observable: `listener_after_cleanup=absent`.
- Artifacts: `task-12-manual-cleanup.txt`, `task-12-cleanup.txt`.
- `task-12-server.err.log` and `task-12-manual-server.err.log` are not used as proof when empty; success is established through HTTP artifacts and cleanup receipts.

## Risks and Notes

- Metrics are in-process counters and reset on process restart; public-beta external alerting/export remains Todo 14.
- `observability.ts` is at 246 pure LOC, so future changes should split before adding behavior.
- Remote `/health` and `/mcp` evidence is not claimed because no deployed endpoint was supplied.
