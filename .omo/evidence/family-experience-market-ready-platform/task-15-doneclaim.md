# Todo 15 Done Claim: Deploy-To-Public-Beta Runbook

Date: 2026-07-08

## Verdict

PASS for runbook completion and local evidence capture.

No public deployment, remote `/health`, remote `/mcp`, PlayMCP `정보 불러오기`, review request, public switch, or contest submission was performed or claimed in this task.

## Acceptance Criteria

| Criterion | Result | Evidence |
| --- | --- | --- |
| Capture pre-edit RUNBOOK term baseline for rollback, cache, Docker, PlayMCP, `/health`, and `/mcp` terms. | PASS | `.omo/evidence/family-experience-market-ready-platform/task-15-runbook-before.txt` |
| Update only `apps/family-experience-mcp/docs/RUNBOOK.md` for the primary write scope. | PASS | `apps/family-experience-mcp/docs/RUNBOOK.md` |
| Add an ordered public-beta path from local validation to cache generation, Docker build, deployment, remote `/health`, remote `/mcp`, PlayMCP `정보 불러오기`, and post-release monitoring. | PASS | `apps/family-experience-mcp/docs/RUNBOOK.md` |
| Every deploy-path step has expected output and evidence path. | PASS | `apps/family-experience-mcp/docs/RUNBOOK.md` |
| Include Docker build command and Docker-daemon blocker fallback without claiming Docker runtime pass. | PASS | `apps/family-experience-mcp/docs/RUNBOOK.md` |
| Include exact HTTPS `curl` examples for remote `/health` and `MCP_ENDPOINT` remote `/mcp` smoke. | PASS | `apps/family-experience-mcp/docs/RUNBOOK.md` |
| Include PlayMCP `정보 불러오기` operator flow and preserve no-review/no-submission boundary. | PASS | `apps/family-experience-mcp/docs/RUNBOOK.md` |
| Include drills for bad cache rollback, exposed key incident, provider outage response, public-copy rollback, key rotation, and post-release monitoring tied to `docs/SLO.md`. | PASS | `apps/family-experience-mcp/docs/RUNBOOK.md`; `.omo/evidence/family-experience-market-ready-platform/task-15-rollback-drill.txt` |
| Run requested local MCP smoke against existing `data/family-experience-cache`. | PASS | `.omo/evidence/family-experience-market-ready-platform/task-15-runbook-local.txt` |
| Run `scan:claims`, `scan:sources`, and `scan:secrets`. | PASS | `.omo/evidence/family-experience-market-ready-platform/task-15-scan-claims.txt`, `task-15-scan-sources.txt`, `task-15-scan-secrets.txt` |

## Command Results

| Scenario | Invocation | Binary observable | Captured artifact |
| --- | --- | --- | --- |
| Pre-edit baseline grep | `rg -i "rollback|bad cache|exposed key|provider outage|public-copy rollback|docker build|PlayMCP|/health|/mcp" apps/family-experience-mcp/docs/RUNBOOK.md` | Exit 0; artifact length 4797 bytes. | `.omo/evidence/family-experience-market-ready-platform/task-15-runbook-before.txt` |
| Required rollback-drill grep | `grep -Ei 'rollback|bad cache|exposed key|provider outage|public-copy rollback|key rotation|post-release|docker build|정보 불러오기|MCP_ENDPOINT|/health|/mcp' apps/family-experience-mcp/docs/RUNBOOK.md > .omo/evidence/family-experience-market-ready-platform/task-15-rollback-drill.txt` via Git Bash | Exit 0; artifact length 9631 bytes. | `.omo/evidence/family-experience-market-ready-platform/task-15-rollback-drill.txt` |
| Existing-cache MCP smoke | `npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache` | Exit 0; `endpoint=in-memory`, tool `find_family_experiences`, `result_ok=true`, `mode=fixture`, `candidate_count=1`. | `.omo/evidence/family-experience-market-ready-platform/task-15-runbook-local.txt` |
| Claim scan | `npm --prefix apps/family-experience-mcp run scan:claims` | Exit 0; `status=PASS`, `scanned_files=144`. | `.omo/evidence/family-experience-market-ready-platform/task-15-scan-claims.txt` |
| Source scan | `npm --prefix apps/family-experience-mcp run scan:sources` | Exit 0; `status=PASS`, `scanned_files=111`. | `.omo/evidence/family-experience-market-ready-platform/task-15-scan-sources.txt` |
| Secret scan | `npm --prefix apps/family-experience-mcp run scan:secrets` | Exit 0; `status=PASS`, `scanned_files=163`. | `.omo/evidence/family-experience-market-ready-platform/task-15-scan-secrets.txt` |
| Focused secret scan over updated deliverables | `npm --prefix apps/family-experience-mcp run scan:secrets -- --include apps/family-experience-mcp/docs/RUNBOOK.md --include .omo/evidence/family-experience-market-ready-platform/task-15-doneclaim.md` | Exit 0; `status=PASS`, `scanned_files=165`. | `.omo/evidence/family-experience-market-ready-platform/task-15-focused-scan-secrets.txt` |

## Evidence Files

- `.omo/evidence/family-experience-market-ready-platform/task-15-runbook-before.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-15-rollback-drill.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-15-runbook-local.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-15-scan-claims.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-15-scan-sources.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-15-scan-secrets.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-15-focused-scan-secrets.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-15-doneclaim.md`

## Residual Risks

- Local MCP smoke used the existing cache and reports `mode=fixture`; it is not live provider proof.
- No Docker daemon run, Docker build, container runtime smoke, remote HTTPS `/health`, remote HTTPS `/mcp`, or PlayMCP console action was performed in this task.
- Source-specific live cache generation remains key-dependent and must be rerun by the operator for the deployment day.
- The worktree already contained broad unrelated added and untracked files from other lanes; this task did not clean or revert them.
- Default scan scripts do not scan every historical evidence file under `.omo/evidence`; they do scan the app's normal docs/code surface including the updated runbook.

## No-Commit Reason

No commit was created because the task explicitly requested no commit and the shared worktree contains unrelated user/other-agent changes.
