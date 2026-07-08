# QA Report

Date: 2026-07-09

This is the canonical verification summary for the current local Family Experience MCP package. It separates local proof, source-specific ETL proof, deployment blockers, and actions that are not claimed.

## Current Status

| Area | Status | Evidence |
| --- | --- | --- |
| Local package verification | PASS on 2026-07-09 local run: typecheck plus 21 Vitest files / 151 tests. | `npm --prefix apps/family-experience-mcp run verify` |
| Secret scan | PASS on 2026-07-09 local run; observed `scanned_files=177`. Exact count is not a release promise. | `npm --prefix apps/family-experience-mcp run scan:secrets` |
| Source scan | PASS on 2026-07-09 local run; observed `scanned_files=125`. Exact count is not a release promise. | `npm --prefix apps/family-experience-mcp run scan:sources` |
| Claim scan | PASS on 2026-07-09 local run; observed `scanned_files=158`. Exact count is not a release promise. | `npm --prefix apps/family-experience-mcp run scan:claims` |
| Golden MCP evidence | PASS for the local golden scenarios. | `.omo/evidence/golden-family-experience-*.json`; see `docs/GOLDEN_RESULTS.md` |
| Culture Portal ETL dry-run | PASS: `ok=true`, `normalized_records=10`, `raw_snapshots=1`, redaction verified. | `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-2026-07-08T06-51-07-435Z.json` |
| KTO TourAPI ETL dry-run | PASS: `ok=true`, `normalized_records=41`, `raw_snapshots=1`, redaction verified. | `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-2026-07-08T06-51-14-174Z.json` |
| National festival CSV fallback ETL dry-run | PASS: `ok=true`, `normalized_records=35`, `raw_snapshots=1`, redaction verified. | `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-2026-07-08T06-51-14-710Z.json` |
| Seoul ETL dry-run | PASS: `ok=true`, `normalized_records=20`, `raw_snapshots=1`, redaction verified. | `.omo/evidence/family-experience-market-ready-platform/etl/etl-proof-2026-07-08T06-51-15-419Z.json` |
| Docker runtime proof | BLOCKED locally: Docker daemon was unavailable in prior proof runs. | `docs/RUNBOOK.md` container section and market-ready Todo 13 evidence |
| Public HTTPS endpoint | BLOCKED: no deployed KakaoCloud PlayMCP-in-KC `/mcp` endpoint is recorded. | `docs/HOST_REQUIREMENTS_SOT.md` |
| PlayMCP information load | NOT CLAIMED: `정보 불러오기` has not been recorded against a deployed endpoint. | `docs/PLAYMCP_TEMP_REGISTRATION.md` |
| PlayMCP review, public switch, contest submission | NOT CLAIMED. | `docs/HOST_REQUIREMENTS_SOT.md` |
| Representative image upload | NOT CLAIMED. Candidate image and rights boundary are in `docs/DEMO_PACK.md`. | `docs/DEMO_PACK.md` |
| Launch readiness | BLOCKED, not `PUBLIC_BETA_READY`, until public HTTPS smoke and PlayMCP private smoke exist. | This report plus `.omo/plans/family-experience-market-ready-platform.md` Todo 16 |

## Residual Risks

- Fixture-mode proof validates shape, safety, and parent-facing text only; it does not prove public live event freshness or availability.
- Source-specific ETL proofs validate one configured run per source. They do not prove complete national coverage, real-time freshness, reservation availability, open-now status, or child suitability.
- The national festival source currently uses the local CSV fallback as the canonical data path; `PUBLIC_DATA_STANDARD_SERVICE_KEY` is required only if a live standard-data endpoint is confirmed and configured.
- Public release remains blocked until a KakaoCloud PlayMCP-in-KC HTTPS endpoint serves `/health` and `/mcp`, PlayMCP `정보 불러오기` succeeds, and private starter-prompt smoke is recorded.
- The worktree contains pre-existing generated evidence and research artifacts, so current proof is command/evidence based rather than clean git-diff provenance based.
