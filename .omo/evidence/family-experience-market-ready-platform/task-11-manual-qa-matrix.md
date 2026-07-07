# Task 11 Manual QA Matrix

Date: 2026-07-08
Surface type: CLI/manual evidence review. No browser UI exists for Todo 11.

## Matrix

| Scenario | Actual surface | Invocation | Binary observable | Artifact |
| --- | --- | --- | --- | --- |
| Parent prompt evaluator happy path | Package CLI | `npm --prefix apps/family-experience-mcp run eval:nationwide-prompts` | Exit 0; `prompt_count=42`; `passed_count=42`; `market_scenarios.status=pass`; `prompt_path.accepted_count=42` | `.omo/evidence/family-experience-market-ready-platform/task-11-eval-nationwide-prompts-fix.txt` |
| Prompt text no-fabrication path | Package CLI via in-memory MCP client | `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache --prompt "2099년 화성에서 초등학생이 참여할 수 있는 체험행사 3개" --expect-error` | Exit 0; stdout JSON `prompt` equals supplied prompt; `result_ok=false`; `candidate_count=0`; `failure_code=missing_configuration` | `.omo/evidence/family-experience-market-ready-platform/task-11-no-fabrication-plan-command.txt` |
| CLI parser regression | Vitest process-level test | `npm --prefix apps/family-experience-mcp test -- --run test/smokeMcp.test.ts` | Exit 0; 1 test passed | `.omo/evidence/family-experience-market-ready-platform/task-11-smoke-parser-GREEN.txt` |
| Package integrity | Package CLI | `npm --prefix apps/family-experience-mcp run verify` | Exit 0; typecheck pass; 21 test files and 150 tests pass | `.omo/evidence/family-experience-market-ready-platform/task-11-verify-fix.txt` |
| Claim scanner | Package CLI | `npm --prefix apps/family-experience-mcp run scan:claims` | Exit 0; JSON `status=PASS`; `scanned_files=142` | `.omo/evidence/family-experience-market-ready-platform/task-11-scan-claims-fix.txt` |
| Source scanner | Package CLI | `npm --prefix apps/family-experience-mcp run scan:sources` | Exit 0; JSON `status=PASS`; `scanned_files=109` | `.omo/evidence/family-experience-market-ready-platform/task-11-scan-sources-fix.txt` |
| Secret scanner | Package CLI | `npm --prefix apps/family-experience-mcp run scan:secrets` | Exit 0; JSON `status=PASS`; `scanned_files=161` | `.omo/evidence/family-experience-market-ready-platform/task-11-scan-secrets-fix.txt` |

## Manual Review Notes

- The actual manual surface for Todo 11 is the CLI output and generated JSON evidence, not a hosted webpage.
- The no-fabrication command drives the MCP tool through the in-memory MCP client used by `smoke-mcp.ts`.
- The manual binary check is the stdout JSON field equality for `prompt`; this specifically prevents the old misleading default-prompt success.
- No long-lived server was started for this Todo 11 fix.
