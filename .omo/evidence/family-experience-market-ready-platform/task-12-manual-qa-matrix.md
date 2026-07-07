# Todo 12 Manual QA Matrix

reviewedAt: 2026-07-08 Asia/Seoul
verdict: PASS

| Scenario | Surface | Invocation | Binary observable | Artifact |
| --- | --- | --- | --- | --- |
| Health diagnostics | HTTP `GET /health` | Start `node --import tsx src/server.ts` with `HOST=127.0.0.1`, `PORT=3349`, `FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache`; then `curl.exe -i http://127.0.0.1:3349/health` | HTTP `200 OK`; body includes `cache`, `cache_metrics`, and `operations`; `operations.deployed_version=0.1.0`; cache/source-health fields present | `task-12-manual-health.http`, `task-12-manual-server.out.log` |
| Malformed MCP JSON | HTTP `POST /mcp` | `curl.exe -i http://127.0.0.1:3349/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d "{bad json"` | HTTP `400 Bad Request`; JSON-RPC error code `-32700`; bounded `parse_error`; no stack/secret/prompt marker in response | `task-12-manual-malformed-mcp.http`, `task-12-manual-redaction-scan.txt` |
| Operational tool failure log | CLI/in-process MCP call with injected logger | `node --import tsx --input-type=module -e "<callFindFamilyExperiences with logger and fake secret/child-name-like prompt>"` | `pass=true`; `event_is_tool_call=true`; `bounded_failure_present=true`; `raw_secret_absent=true`; `child_name_absent=true`; `raw_prompt_key_absent=true`; `raw_prompt_content_absent=true`; `stack_absent=true` | `task-12-operational-log-redaction-proof.txt` |
| Cleanup | OS listener state | Preflight and post-cleanup `Get-NetTCPConnection -LocalPort 3349 -State Listen` | No listener before start; `listener_after_cleanup=absent`; server process stopped | `task-12-manual-preflight-listening.txt`, `task-12-manual-cleanup.txt` |

## Sensitive Output Scan

Artifact: `task-12-manual-redaction-scan.txt`.

Result: PASS. The fresh manual QA operational artifacts do not contain `FAKE_MARKET_PLAN_SECRET_REDACTED`, `PRIVATE_PROMPT_CONTENT_MARKER`, `Minjun`, raw `"prompt"`, raw `"stack"`, or `Error:` markers.

## Scope Note for Old CLI Smoke Artifact

`task-12-redacted-failure-log.txt` is CLI smoke output, not a structured operational log. It contains a top-level smoke input `prompt` field, so it is not used as proof that operational logs omit prompt content. The current operational-log redaction proof is `task-12-operational-log-redaction-proof.txt`.
