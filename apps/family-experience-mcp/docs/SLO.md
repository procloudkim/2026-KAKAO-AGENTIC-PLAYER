# Public-Beta SLOs And Incident Response

This document defines internal public-beta operating targets for `아이랑 어디가`
and `find_family_experiences`. These targets are not a public SLA, do not
promise user compensation, and do not claim PlayMCP review, public release, or
contest submission. They are operator thresholds for deciding when to hold,
rollback, refresh cache, rotate secrets, or narrow public copy.

Canonical references remain `RUNBOOK.md`, `DECISIONS.md`,
`HOST_REQUIREMENTS_SOT.md`, `SOURCE_LEDGER.md`, and `QA_REPORT.md`. If this
document conflicts with those files, follow the more specific canonical source
and update this document later.

## Beta Scope

| Item | Beta boundary |
| --- | --- |
| Service surface | HTTPS `/health` and MCP `/mcp` with one public tool, `find_family_experiences`. |
| Data mode | Cache-first operation. Live provider calls belong in ETL proof, smoke, or cache generation. |
| Source boundary | Official-source routes only: Seoul Open Data, Culture Portal, KTO TourAPI, and national culture festival standard data. |
| Claim boundary | Source-grounded candidates only. No public SLA promise, no broad coverage promise, no reservation/open-now/safety-certification promise. |
| Evidence home | `.omo/evidence/family-experience-market-ready-platform/`. |

## SLIs And Beta SLOs

| SLI | Measurement | Public-beta SLO | Alert threshold | Evidence or query |
| --- | --- | --- | --- | --- |
| MCP availability | Weekly successful `/health` checks and MCP smoke attempts divided by total attempts. | 99.0% weekly MCP availability for operator checks. | SEV2 if weekly success falls below 99.0%; SEV1 if `/health` and `/mcp` both fail for 15 minutes during a beta window. | `curl -i http://127.0.0.1:3349/health`; `npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed`. |
| Tool-call latency | P95 `tool_call.latency_ms` from newline JSON logs, excluding invalid-input requests. | P95 under 3 seconds from cache. | SEV3 if P95 is 3 to 5 seconds for 30 minutes; SEV2 if P95 exceeds 5 seconds or cache reads time out. | `grep '"event":"tool_call"' <log> | jq '.latency_ms'`; `/health.operations.tool_calls.latency_ms`. |
| Valid tool-call success | Successful valid `find_family_experiences` calls divided by valid calls. Invalid-input failures are tracked separately. | At least 98% valid tool-call success during a beta day. | SEV2 if valid success is below 98% for 30 minutes; SEV1 if every valid call fails for 15 minutes. | Runtime `tool_call` log outcomes and `/health.operations.tool_calls`. |
| Cache freshness | `/health.cache.status`, `cache.age_seconds`, and configured `cache.ttl_hours`. | Cache age under 24 hours for tier3 copy; status must be `fresh` before broad beta copy. | SEV2 if cache is `stale`, `missing`, `invalid`, or `refreshing` for 15 minutes; hold tier3 copy immediately. | `curl -s http://127.0.0.1:3349/health | jq '.cache'`. |
| Source ETL proof | Source-specific ETL dry-run or write-cache proof with redacted diagnostics. | At least one successful source ETL proof per launch day before beta traffic or demo copy. | SEV2 if no source ETL proof exists for the launch day; SEV3 if one source fails but another proven source can refresh cache. | `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source <configured_source>`. |
| No-result anomaly | No-result outcomes divided by valid tool calls for the same source/cache window. | No-result spikes must be explained by request constraints, source scope, or cache freshness. | SEV3 if no-result rate doubles the previous beta-day baseline for 30 minutes; SEV2 if no-result is paired with source failure or stale cache. | Runtime `tool_call` logs with `outcome=no-result`; golden no-result behavior in `docs/GOLDEN_RESULTS.md`. |
| Provider quota or failure | ETL failure codes, provider HTTP status, and `/health.cache.source_health`. | Provider quota and source failure must be isolated to the affected source and must not expose raw keys or keyed URLs. | SEV2 for provider quota exhaustion or repeated source failure; SEV1 if fallback serves unsupported claims or leaks diagnostics. | ETL stderr/stdout redacted proof; `/health.cache.source_health.failure_codes`. |
| Secret-scan gate | `scan:secrets` result before sharing docs, evidence, or deployable artifacts. | zero raw-secret leak incidents; `scan:secrets` must pass before handoff. | SEV1 for any raw-secret, keyed URL, bearer token, or provider key in docs, logs, screenshots, evidence, or public copy. | `npm run scan:secrets`; `npm run scan:secrets -- --include <evidence-path>`. |
| Source and claim gates | `scan:sources` and `scan:claims` results before handoff. | Both scans pass before any beta copy or PlayMCP information load. | SEV2 if either scan fails; SEV1 if failed claim/source copy already left operator control. | `npm run scan:sources`; `npm run scan:claims`. |

## Alert Checks

Run these from `apps/family-experience-mcp` unless a command uses the repo-root
`npm --prefix` form.

| Check | Frequency | Manual command or query | Expected beta result |
| --- | --- | --- | --- |
| Health readiness | Before launch, every 15 minutes during beta smoke, and after rollback. | `curl -s http://127.0.0.1:3349/health` | Service name is correct; cache is `fresh`; source failures are understood. |
| MCP smoke | Before launch and after cache refresh or deploy changes. | `npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed` | `called=find_family_experiences`, bounded candidate count, no raw keys, no source failure. |
| Latency P95 | Every 30 minutes during beta smoke. | `grep '"event":"tool_call"' <log> | jq -s 'map(.latency_ms) | sort | .[(length*0.95|floor)]'` | P95 under 3 seconds from cache. |
| Cache freshness | Before any tier3 copy and hourly during beta. | `curl -s http://127.0.0.1:3349/health | jq '.cache.status,.cache.age_seconds,.cache.ttl_hours'` | `fresh`; age below 86400 seconds; TTL is aligned with 24 hours. |
| Source ETL proof | Once per launch day and before broad copy. | `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source <configured_source>` | `ok=true`, records greater than zero for the source proof, diagnostics redacted. |
| No-result anomaly | Every 30 minutes during beta smoke. | Count `tool_call` log outcomes for `no-result`, valid success, and source failure in the same window. | No-result rate is stable or explained by request constraints. |
| Provider quota | After ETL failures and before retrying source-specific cache refresh. | Inspect ETL failure code and `/health.cache.source_health.failure_codes`. | Quota/failure is source-scoped and does not leak keyed URLs. |
| Secret, source, claim gates | Before handoff, before sharing evidence, and before PlayMCP information load. | `npm run scan:secrets && npm run scan:sources && npm run scan:claims` | All PASS. |

## Severity Levels

| Severity | Trigger | Owner action |
| --- | --- | --- |
| SEV1 | Raw-secret leak, keyed URL exposure, every valid MCP call failing, public unsupported claim already shared, or diagnostics exposing provider secrets. | Stop sharing artifacts; keep PlayMCP private; remove or redact the artifact; rotate affected provider keys; rerun `scan:secrets`, `scan:sources`, and `scan:claims`; record evidence before retrying. |
| SEV2 | Availability below 99.0%, P95 over 5 seconds, cache stale/missing/invalid, no launch-day source ETL proof, repeated source failure, provider quota exhaustion, or failed source/claim gate. | Hold beta traffic and broad copy; refresh or rebuild cache from a proven source; rerun smoke and scans; narrow source claims to current proof. |
| SEV3 | P95 between 3 and 5 seconds, no-result anomaly without source failure, one provider degraded while another proven source remains available, or scan warning requiring manual review. | Triage within the beta day; capture logs; compare against previous window; rerun source-specific ETL proof if needed. |
| SEV4 | Documentation drift, stale evidence references, or non-blocking operator checklist gaps. | Fix docs or evidence before the next handoff; no user-facing copy change until scans pass. |

## Incident Steps

### 1. Confirm Scope

1. Record the incident start time, severity, affected source, endpoint, and
   cache directory.
2. Check `/health` and the most recent runtime logs.
3. Identify whether the symptom is availability, latency, stale cache, source
   failure, provider quota, no-result anomaly, or secret/claim/source gate
   failure.
4. Do not claim public beta deployed, PlayMCP review submitted, or public
   visibility enabled unless the relevant console action has actually happened
   and is recorded elsewhere.

### 2. Contain

1. Keep or move the PlayMCP entry to private/operator-only mode.
2. Stop broad beta copy when cache is not `fresh`, no launch-day source ETL
   proof exists, or scans fail.
3. If raw-secret exposure is suspected, stop sharing the artifact immediately
   and rotate the affected provider key before retrying.

### 3. Rollback Command

Use the runbook rollback boundary: keep the entry private, return to a
cache-safe proven source, and rerun smoke plus scans before retrying.

```bash
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source <configured_source>
npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed
npm run scan:secrets
npm run scan:sources
npm run scan:claims
```

If the incident is a secret leak, the rollback command is not enough. Rotate
the affected provider key first, remove the exposed artifact or replace it with
a redacted one, then run:

```bash
npm run scan:secrets -- --include <redacted-evidence-path>
npm run scan:secrets
```

### 4. Recover

1. For stale, missing, invalid, or refreshing cache, rerun the source-specific
   cache refresh command from `RUNBOOK.md`, then confirm `/health.cache.status`
   is `fresh`.
2. For source failure or provider quota, switch only to a source with current
   proof; do not broaden copy beyond that proof.
3. For P95 latency alerts, verify cache mode first. If cache is fresh and
   latency remains high, collect the 30-minute log window and hold beta traffic
   until the slow path is understood.
4. For no-result anomaly, verify the source/cache state before changing ranking
   or copy. No-result responses must remain explicit and must not fabricate
   candidates.
5. For claim or source scan failures, fix the failing copy or source entry and
   rerun the exact failed scan plus the full scan set.

### 5. Close

1. Capture the final command outputs under
   `.omo/evidence/family-experience-market-ready-platform/`.
2. Confirm all relevant scan gates pass.
3. Record residual risk: unavailable keys, source-specific proof gaps, cache
   age, and whether public beta traffic stayed private/operator-only.
4. Do not mark the incident closed until the binary observable matches the
   relevant SLO: healthy endpoint, fresh cache, valid tool success, acceptable
   P95, current source ETL proof, no unresolved provider quota, no unexplained
   no-result spike, and zero raw-secret exposure.

## Owner Actions By SLI

| SLI breach | Primary owner action | Secondary owner action |
| --- | --- | --- |
| Availability | Check `/health`, endpoint path, and MCP smoke; keep PlayMCP private if smoke fails. | Rerun local verification and inspect redacted logs. |
| P95 latency | Confirm cache mode and cache directory; compare tool-call log window. | Hold beta traffic if P95 remains above threshold. |
| Valid tool-call success | Separate invalid input from valid failures; inspect failure code. | Rerun `npm run smoke:mcp` and the relevant golden/eval path if behavior changed. |
| Cache freshness | Refresh cache from a currently proven source; verify `fresh` status and age. | Narrow copy when only one source has current proof. |
| Source ETL proof | Run source-specific ETL dry-run or write-cache proof for available keys. | Record absent keys as blockers instead of switching to unofficial sources. |
| No-result anomaly | Compare no-result rate to previous beta-day baseline and source/cache health. | Preserve safe no-result behavior; do not invent candidates. |
| Provider quota or source failure | Isolate affected source; avoid retry storms; check provider approval/quota status. | Switch to another currently proven source only if claims remain accurate. |
| Secret-scan gate | Stop sharing; redact/remove artifact; rotate keys if exposure occurred. | Rerun `scan:secrets` on the specific artifact and default scan surface. |

