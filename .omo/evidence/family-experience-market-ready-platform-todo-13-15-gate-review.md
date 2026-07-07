# Gate Review: Family Experience Market-Ready Platform Todo 13-15

recommendation: REJECT
finalVerdict: rejected

## originalIntent

Independently gate-review Todo 13, Todo 14, and Todo 15 for the Family Experience MCP market-ready plan from the user's perspective. The expected outcome is an audit artifact that verifies only the named deliverables/evidence and returns `confirmed` only if packaging, SLOs, runbook, regression evidence, scans, and raw-secret review all support completion.

## desiredOutcome

- Todo 13: production-safer Docker/runtime packaging, with Docker daemon unavailability truthfully recorded and no Docker runtime pass claimed when unavailable.
- Todo 14: measurable beta-only SLIs/SLOs, alert thresholds, SEV response, rollback command, owner actions, and no public SLA/release claim.
- Todo 15: exact public-beta operator sequence with expected outputs/evidence paths, remote `/health` and `/mcp` smoke commands, PlayMCP `정보 불러오기`, rollback drills for bad cache/exposed key/provider outage/public-copy/key rotation/post-release monitoring, and no deployment/review/submission completion claim.
- Final regression: `verify` PASS with 21 test files / 150 tests and `scan:claims`, `scan:sources`, `scan:secrets` PASS.
- No raw secret or keyed URL exposure in the reviewed docs/evidence.

## userOutcomeReview

The reviewed production artifacts largely satisfy the user-visible Todo 13-15 behavior:

- Todo 13 source/evidence supports a conditional pass on packaging: `apps/family-experience-mcp/Dockerfile` uses a build/runtime split, production dependency install, compiled JS runtime, non-root `node` user, `/health` healthcheck, safe env defaults, and no `.env` copy. `.dockerignore` excludes `.env`, `.env.*`, `.npmrc`, `node_modules`, `dist`, `.omo`, `test`, `docs`, logs, and temp output. Docker build evidence records an unavailable Docker daemon at `npipe:////./pipe/dockerDesktopLinuxEngine` with `exit_code=1`; the doneclaim explicitly says no Docker image build or container runtime pass is claimed.
- Todo 14 source/evidence supports the SLO criteria: `SLO.md` defines beta-only scope, measurable SLIs/SLOs, alert thresholds, SEV levels, rollback commands, and owner actions. It explicitly says the targets are not a public SLA and do not claim PlayMCP review, public release, or contest submission.
- Todo 15 source/evidence supports the runbook criteria: `RUNBOOK.md` includes an ordered public-beta operator sequence with expected output and evidence paths, remote `/health`, remote `/mcp`, PlayMCP `정보 불러오기`, Docker daemon fallback, and drills for bad cache, exposed key, provider outage, public-copy rollback, key rotation, and post-release monitoring. It repeatedly preserves the no deployment/review/submission-completion boundary.
- Final regression evidence is present: `task-13-15-verify.txt` reports 21 test files passed and 150 tests passed; `task-13-15-scan-claims.txt`, `task-13-15-scan-sources.txt`, and `task-13-15-scan-secrets.txt` all report `status: PASS`.
- Manual raw-secret review found no raw provider key, bearer token, keyed URL, or real secret value in the reviewed scope. Regex hits for `sk-...` were false positives from evidence filenames such as `task-15-...`, not secrets. The reviewed secret-scan evidence also reports PASS.

However, approval is blocked because required gate-review prerequisites are missing/unsupported.

## blockers

1. Missing required code-review/slop-coverage artifact.
   - Evidence gap: none of the user-scoped artifacts is a code review report, and none explicitly shows the required `remove-ai-slops` plus `programming` perspective coverage.
   - Required coverage absent: excessive/useless tests, deletion-only tests, tests that merely verify requested removal, tautological tests, implementation-mirroring tests, unnecessary production extraction/parsing/normalization, maintenance burden, false confidence, and scope drift.
   - Direct reviewer pass: no unresolved slop was found in the reviewed Docker/docs/evidence that would independently fail Todo 13-15, but the required report coverage itself is absent, so approval is not allowed.
   - Required fix: add or provide an explicit Todo 13-15 code-review report that covers the above overfit/slop and programming criteria, marks non-applicable items as N/A with rationale, and grounds claims in the exact reviewed artifacts.

2. Plan status drift for Todo 13-15.
   - Evidence gap: `.omo/plans/family-experience-market-ready-platform.md` still marks Todo 13, Todo 14, and Todo 15 as unchecked at lines 228, 238, and 248, despite doneclaim artifacts asserting completion.
   - User impact: the source-of-truth plan does not reflect the doneclaim state, which makes the handoff ambiguous for later launch gates.
   - Required fix: update the plan status for Todo 13-15 or add a clear plan-note explaining why the gate-reviewed work remains intentionally unchecked.

## directChecks

### Todo 13 Packaging

PASS on substantive criteria, conditional on blocker resolution.

- Checked `apps/family-experience-mcp/Dockerfile`: build stage, runtime stage, `npm ci --omit=dev --ignore-scripts`, `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=3349`, fixture disabled by default, cache dir set, compiled JS copied from build, `data` copied, `chown`, `USER node`, `/health` healthcheck, and `CMD ["node", "dist/src/server.js"]`.
- Checked `apps/family-experience-mcp/.dockerignore`: excludes secret/local/dev/evidence paths.
- Checked `.omo/evidence/family-experience-market-ready-platform/task-13-docker-build.txt`: Docker daemon unavailable, exact pipe error recorded, `exit_code=1`.
- Checked `.omo/evidence/family-experience-market-ready-platform/task-13-doneclaim.md`: no Docker build/runtime pass claimed; fallback Node/npm runtime path only.
- Checked `.omo/evidence/family-experience-market-ready-platform/task-13-fallback-node-runtime.txt`: compiled Node runtime served `/health` 200 and safe malformed `/mcp` 400, then cleaned up.

### Todo 14 SLOs

PASS on substantive criteria, conditional on blocker resolution.

- Checked `apps/family-experience-mcp/docs/SLO.md`: beta boundary and no public SLA/release claim; measurable SLI/SLO rows for availability, latency, valid tool-call success, cache freshness, source ETL proof, no-result anomaly, provider failure/quota, secret scan, and source/claim gates.
- Checked alert checks, SEV table, incident steps, rollback command, recovery steps, close criteria, and owner actions.
- Checked `.omo/evidence/family-experience-market-ready-platform/task-14-slo-check.txt` and `task-14-alert-sim.txt`: required terms are present. These grep artifacts are shallow by themselves, but direct SLO source review supports the criteria.

### Todo 15 Runbook

PASS on substantive criteria, conditional on blocker resolution.

- Checked `apps/family-experience-mcp/docs/RUNBOOK.md`: public-beta deploy-to-runbook steps 1-12 include invocation, expected output, and evidence path.
- Checked remote smoke coverage: `curl -fsS "$DEPLOY_BASE_URL/health"` and `MCP_ENDPOINT="$MCP_ENDPOINT" npm --prefix "$APP_DIR" run smoke:mcp ...`.
- Checked PlayMCP `정보 불러오기` operator flow and explicit no `등록 및 심사 요청` boundary.
- Checked rollback drills: bad cache, exposed key incident, provider outage response, public-copy rollback, key rotation, and post-release monitoring.
- Checked `.omo/evidence/family-experience-market-ready-platform/task-15-rollback-drill.txt` and `task-15-runbook-local.txt`: local smoke evidence is fixture-mode only and does not claim live provider or remote deployment proof.

### Final Regression Evidence

PASS on named evidence.

- `.omo/evidence/family-experience-market-ready-platform/task-13-15-verify.txt`: 21 test files passed, 150 tests passed.
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-scan-claims.txt`: `status: PASS`.
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-scan-sources.txt`: `status: PASS`.
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-scan-secrets.txt`: `status: PASS`.

### Secret/Keyed URL Review

PASS on reviewed scope.

- Reviewed docs/evidence do not expose raw `.env` values, provider API keys, bearer tokens, or keyed provider URLs.
- Public/provider base URLs and endpoint placeholders are not secrets.
- Regex hits matching `sk-...` were evidence filename fragments such as `task-15-...`, not OpenAI-style keys.
- `task-13-secret-scan-final-rerun.txt` and `task-13-15-scan-secrets.txt` report secret-scan PASS.

### remove-ai-slops / programming Direct Pass

No additional direct blocker found in the reviewed production artifacts.

- No excessive production extraction, parsing, or normalization was introduced in the reviewed source scope.
- No deletion-only or tautological production tests were found in the reviewed source scope.
- Grep-based evidence files are weak as standalone proof, but they were not treated as sufficient on their own; direct source review of `SLO.md` and `RUNBOOK.md` confirmed the semantic criteria.
- Maintenance-burden risk is bounded to docs/packaging. The remaining approval blocker is missing explicit review-report coverage, not an observed source-code slop defect.

## checkedArtifactPaths

- `apps/family-experience-mcp/Dockerfile`
- `apps/family-experience-mcp/.dockerignore`
- `apps/family-experience-mcp/docs/SLO.md`
- `apps/family-experience-mcp/docs/RUNBOOK.md`
- `.omo/plans/family-experience-market-ready-platform.md`
- `.omo/evidence/family-experience-market-ready-platform/task-13-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-14-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-15-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-13-docker-build.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-13-fallback-node-runtime.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-13-fallback-verify-final.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-13-secret-scan-final-rerun.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-14-slo-check.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-14-alert-sim.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-15-rollback-drill.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-15-runbook-local.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-scan-claims.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-scan-sources.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-scan-secrets.txt`

## exactEvidenceGaps

- Missing explicit code-review report artifact for Todo 13-15 with `remove-ai-slops` overfit/slop criteria and `programming` maintenance/scope criteria.
- `.omo/plans/family-experience-market-ready-platform.md` still marks Todo 13-15 unchecked, while doneclaims assert completion.

## requiredFixes

1. Add or provide a Todo 13-15 code-review report that explicitly covers the required slop/overfit and programming-maintenance criteria, including supported N/A judgments where relevant.
2. Resolve plan status drift by marking Todo 13-15 complete or documenting why those plan items intentionally remain unchecked after the doneclaims.
3. Rerun or reattach the final regression evidence after those fixes if any reviewed artifact changes.
