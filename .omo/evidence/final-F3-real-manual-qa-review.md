# Final Verification F3 Real Manual QA Review

Verdict: CONFIRMED
Confidence: high
Plan: `.omo/plans/family-experience-mcp-first-build.md`
Surface: `apps/family-experience-mcp` HTTP + MCP fixture mode
Evidence root: `.omo/evidence/`

## Commands

- Preflight: `netstat -ano | grep ":3345" | grep LISTENING`
- Server: `env -u SEOUL_OPEN_DATA_KEY -u SEOUL_OPEN_DATA_BASE_URL FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http`
- Health: `curl -i http://127.0.0.1:3345/health`
- MCP smoke: `env -u SEOUL_OPEN_DATA_KEY -u SEOUL_OPEN_DATA_BASE_URL EVIDENCE_DIR=.omo/evidence FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:mcp -- --assert-tool-count=1`
- Golden smoke: `env -u SEOUL_OPEN_DATA_KEY -u SEOUL_OPEN_DATA_BASE_URL EVIDENCE_DIR=.omo/evidence FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:golden`
- Public output validation: `EVIDENCE_DIR=.omo/evidence node .omo/evidence/final-F3-validate-public-output.cjs`
- Claim scan: `npm run scan:claims`
- Secret scan: `npm run scan:secrets`
- Cleanup proof: `netstat -ano | grep ":3345" | grep LISTENING`

## Findings

- Preflight passed: no listener on `:3345` before start.
- Fixture server started on `127.0.0.1:3345`; captured PID was `1720`.
- `/health` returned `HTTP/1.1 200 OK`; body contains `family-experience-mcp` and the single tool name.
- `smoke:mcp -- --assert-tool-count=1` exited 0, listed `find_family_experiences`, called that tool, returned `result_ok: true`, and returned `candidate_count: 3`.
- `smoke:golden` exited 0. Scenario results: `happy` passed with `isError: false`; `missing-age`, `no-result`, and `source-failure` passed with safe `isError: true` outcomes.
- Generated public-output JSON validation passed after correcting the local evidence validator: happy output has `response.action_cards.length = 3` and `structuredContent.candidates.length = 3`; safe cases contain safe fallback/clarification text.
- `npm run scan:claims` and `npm run scan:secrets` both returned PASS over 73 scanned files.
- Cleanup passed: final receipt says `no LISTENING on :3345 after corrected rerun 2`.

## Warnings

- The first post-golden public-output validation attempt failed because my inline Bash heredoc was malformed. This was a QA harness quoting issue after app smoke checks had completed, not a product failure.
- The first corrected validator guessed the wrong happy JSON shape and failed its own card-count assertion. I inspected the generated artifact, corrected the validator to assert `response.action_cards` and `structuredContent.candidates`, and reran successfully.
- The raw transcript intentionally preserves these failed validation-runner attempts for auditability.

## Residual Risks

- This F3 pass intentionally used fixture mode and unset Seoul API environment variables. It does not validate live Seoul Open Data availability, live current data, or real API-key behavior.
- No browser UI was involved; the observable surface for this plan section is HTTP, MCP smoke, and generated JSON evidence.

## manualQa

### surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| F3-preflight | Required check 1 | OS port table | `netstat -ano \| grep ":3345" \| grep LISTENING` | PASS | A1, A12 |
| F3-health | Required check 3 | HTTP | `curl -i http://127.0.0.1:3345/health` | PASS | A2, A3, A4 |
| F3-mcp-smoke | Required check 4 | MCP over HTTP fixture server | `npm run smoke:mcp -- --assert-tool-count=1` | PASS | A5 |
| F3-golden | Required check 5 | MCP golden scenarios | `npm run smoke:golden` | PASS | A6, A7, A8, A9, A10 |
| F3-cleanup | Required check 6 | OS port table | `netstat -ano \| grep ":3345" \| grep LISTENING` | PASS | A11, A12 |
| F3-artifact-nonempty | Required check 7 | Filesystem evidence audit | `wc -c <required evidence files>` | PASS | A1 |
| F3-public-output-safety | Required check 8 | Generated public-output JSON + repo scanners | `node .omo/evidence/final-F3-validate-public-output.cjs`; `npm run scan:claims`; `npm run scan:secrets` | PASS | A13, A14, A15 |

### adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| F3-missing-age | Required check 5 | malformed or incomplete user input | Missing child age does not fabricate ranked candidates; asks for age/stage safely | PASS | A6, A8 |
| F3-no-result | Required check 5 | empty/no matching source result | No fabricated candidates; returns safe error and one relaxation suggestion | PASS | A6, A9 |
| F3-source-failure | Required check 5 and 8 | external source failure | Source failure sets safe error, no candidates, no raw keyed URL or secret | PASS | A6, A10, A13, A15 |
| F3-misleading-success-output | Required checks 4, 5, 7 | log-based success claim | Exit codes, generated JSON checks, and non-empty artifacts agree with smoke output | PASS | A1, A5, A6, A13 |
| F3-stale-state | Required checks 1 and 6 | stale server/listener state | No pre-existing listener before start; no listener after cleanup | PASS | A11, A12 |
| F3-secret-or-keyed-url | Required check 8 | raw secret or keyed URL leakage | Generated golden JSON and scanner output contain no raw secrets or keyed URLs | PASS | A13, A15 |
| F3-unsupported-public-claim | Required check 8 | unsupported public claims | Generated golden JSON and scanner output contain no unsupported public claims | PASS | A13, A14 |

### artifactRefs

| id | kind | description | path |
|---|---|---|---|
| A1 | raw transcript | Full F3 command transcript, correction history, and final artifact audit | `.omo/evidence/final-F3-real-manual-qa.txt` |
| A2 | HTTP transcript | Full `curl -i /health` response | `.omo/evidence/final-F3-health.http` |
| A3 | HTTP headers | Extracted `/health` headers | `.omo/evidence/final-F3-health.headers` |
| A4 | HTTP body | Extracted `/health` JSON body | `.omo/evidence/final-F3-health.json` |
| A5 | command log | `smoke:mcp -- --assert-tool-count=1` output | `.omo/evidence/final-F3-smoke-mcp.log` |
| A6 | command log | `smoke:golden` output | `.omo/evidence/final-F3-smoke-golden.log` |
| A7 | generated JSON | Happy golden output | `.omo/evidence/golden-family-experience-happy.json` |
| A8 | generated JSON | Missing-age safe behavior output | `.omo/evidence/golden-family-experience-missing-age.json` |
| A9 | generated JSON | No-result safe behavior output | `.omo/evidence/golden-family-experience-no-result.json` |
| A10 | generated JSON | Source-failure safe behavior output | `.omo/evidence/golden-family-experience-source-failure.json` |
| A11 | cleanup receipt | Final cleanup no-listener proof | `.omo/evidence/final-cleanup-family-experience-mcp-first-build.txt` |
| A12 | preflight receipt | Preflight no-listener proof | `.omo/evidence/final-F3-preflight-listening.txt` |
| A13 | validation helper | Evidence-only public-output validation script used for corrected rerun | `.omo/evidence/final-F3-validate-public-output.cjs` |
| A14 | command log | Unsupported-claim scanner output | `.omo/evidence/final-F3-scan-claims.log` |
| A15 | command log | Secret scanner output | `.omo/evidence/final-F3-scan-secrets.log` |
