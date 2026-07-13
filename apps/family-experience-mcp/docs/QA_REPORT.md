# QA Report

Date: 2026-07-13

This is the canonical verification summary for the current Family Experience MCP release candidate. Local proof, production-cache proof, remote deployment proof, and human-only release actions are kept separate.

## Current Status

| Area | Status | Evidence |
| --- | --- | --- |
| Integrated release gate | PASS locally: typecheck, 37 Vitest files / 308 tests, three scanners, production cache, contract, sealed holdout, compiled HTTP, and the root-context `linux/amd64` container gate. The gate writes a unique receipt and verifies that the release tree is unchanged from start to finish. | `npm run qa:submission`; newest run under `.omo/evidence/family-experience-submission-ready/c003-release/runs/` |
| Secret scan | PASS in the integrated release gate. | `npm run scan:secrets` |
| Source scan | PASS in the integrated release gate. | `npm run scan:sources` |
| Claim scan | PASS in the integrated release gate. | `npm run scan:claims` |
| Production cache | PASS: schema v2, KTO TourAPI only, 100 normalized records, 12 integrity-bound raw snapshots, 11 records with source-stated age eligibility, zero source failures, and all three exact PlayMCP starter messages returned one bounded live-mode candidate. | `npm run qa:production-cache`; `docs/PLAYMCP_TEMP_REGISTRATION.md` |
| Sealed holdout | PASS: 8/8 cases with manifest and dataset hash binding. | `npm run qa:holdout` |
| Compiled HTTP | PASS: build, fresh/stale health behavior, one-tool MCP lifecycle, adversarial requests, average and p99 performance thresholds, rate limit, concurrency limit, and process/port cleanup. Cache integrity is warmed before readiness and reused only for the immutable image lifetime. | `npm run qa:compiled-http` |
| Local Docker runtime | PASS on `linux/amd64`: non-root UID 1000, direct `node dist/src/server.js` PID 1, fresh `/health`, one-tool `/mcp` smoke with one KTO candidate, SIGTERM shutdown, and exit code 0. | Repository-root `Dockerfile`; `family-experience-mcp:rc-20260713-r3` local image |
| Public HTTPS endpoint | PENDING: no KakaoCloud PlayMCP-in-KC endpoint has passed remote `/health` and `/mcp` smoke in this report. | `docs/HOST_REQUIREMENTS_SOT.md` |
| PlayMCP information load and private smoke | PENDING: `정보 불러오기` and the three private starter-message runs have not yet been recorded against a deployed endpoint. | `docs/PLAYMCP_TEMP_REGISTRATION.md` |
| PlayMCP review, public switch, contest submission | NOT CLAIMED. These remain explicit human actions. | `docs/HOST_REQUIREMENTS_SOT.md` |

## Cache and Release Boundary

- The bundled cache was generated at `2026-07-13T13:44:26.517Z` with a 24-hour TTL and expires at `2026-07-14T13:44:26.517Z`.
- The runtime image serves the bundled static cache and does not refresh it in place. Refresh requires external ETL, production-cache validation, a new image build, and redeployment.
- KTO `searchFestival2` supplies festival records. `detailIntro2` may promote an age statement only when the returned content ID matches and the age text is parseable; otherwise age remains unknown.
- Seoul is not in the production source set because a verified HTTPS transport is not currently available. Plain non-loopback HTTP is not enabled as a workaround.

## Residual Risks

- The KTO cache is a bounded snapshot, not proof of complete national coverage, real-time availability, reservation availability, open-now state, indoor/outdoor status, or guaranteed child suitability.
- Source-stated age text is evidence to show parents, not a safety certification. Parents must confirm dates, fees, access, and participation conditions at the official source.
- Local package and container proof do not establish KakaoCloud availability or PlayMCP compatibility. Those claims require the remote endpoint and private PlayMCP smoke.
- A stale, missing, invalid, or source-mismatched cache must fail readiness and block release until a fresh validated cache is rebuilt and redeployed.
