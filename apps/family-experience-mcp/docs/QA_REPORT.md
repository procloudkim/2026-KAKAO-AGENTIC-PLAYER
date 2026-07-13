# QA Report

Date: 2026-07-14

This is the canonical verification summary for the current Family Experience MCP P0 tree. Current-tree proof, historical pre-P0 proof, remote deployment proof, and human-only release actions are kept separate.

## Current Status

| Area | Status | Evidence |
| --- | --- | --- |
| P0 local implementation | PASS on the current tree: typecheck, 41 Vitest files / 353 deterministic tests, and all four golden scenarios. This covers weekday/time eligibility, diverse default-three selection with typed shortage reasons, evidence-rich cards, Kakao navigation links, bounded stale/LKG behavior, request-limit cleanup, and fail-closed privacy publication. | `npm run verify`; `npm run smoke:golden` |
| Integrated release gate | PASS on the current P0 tree: typecheck, 41/353 Vitest tests, three scanners, production cache, contract, sealed holdout, compiled HTTP, and root-context `linux/amd64` container. The receipt binds identical start/finish release-tree hashes. | `npm run qa:submission`; newest PASS run under `.omo/evidence/family-experience-submission-ready/c003-release/runs/` |
| Secret scan | PASS on the current tree: 217 files. | `npm run scan:secrets` |
| Source scan | PASS on the current tree: 165 files, including scoped HTTPS policy references and exact Kakao navigation-link exceptions with negative tests. | `npm run scan:sources`; `test/scanSources.test.ts` |
| Claim scan | PASS on the current tree: 198 files. | `npm run scan:claims` |
| Production cache | PASS on the current cache: schema v2, KTO TourAPI only, 299 normalized records, 35 integrity-bound raw snapshots, 32 eligible records, zero source failures, and exact PlayMCP starter results of Seoul 3, Jeju 1, and Gangwon 1. Sub-three responses carry a structured shortage reason. | `npm run qa:production-cache`; `.omo/evidence/family-experience-submission-ready/c002-production-cache/receipt.json` |
| Submission contract | PASS on the current tree. | `npm run qa:contract`; `.omo/evidence/family-experience-submission-ready/c001-contract.json` |
| Sealed holdout | PASS on the current tree: 8/8 cases with dataset and expected-label hash binding. | `npm run qa:holdout`; `.omo/evidence/family-experience-submission-ready/c003-release/holdout/holdout-results.json` |
| Compiled HTTP | PASS on the current tree: build, health and adversarial HTTP, persistent one-tool MCP lifecycle, a cold probe plus five warmups and 100 sequential three-card calls over one keep-alive socket, separate 30-call concurrent throughput/p99 stress, rate/concurrency limits, expired-cache fail-closed behavior, process cleanup, and port cleanup. The Windows QA child explicitly uses `signals_only`, matching the Linux deployment lifecycle and excluding the Windows-only synchronous MSYS ancestor watcher from latency measurements. | `npm run qa:compiled-http`; `.omo/evidence/family-experience-submission-ready/c003-release/compiled-http/receipt.json` |
| Local Docker runtime | PASS on the current P0 tree for `linux/amd64`: non-root UID 1000, direct Node PID 1, fresh live cache, one public tool, three-candidate Seoul starter, clean SIGTERM, and complete container/image/port cleanup. | Repository-root `Dockerfile`; `npm run qa:container`; `.omo/evidence/family-experience-submission-ready/c003-release/container/receipt.json` |
| Privacy publication | BLOCKED until the real operator name and privacy contact are configured. `/privacy` intentionally returns HTTP 503 before then. | `FAMILY_EXPERIENCE_OPERATOR_NAME`; `FAMILY_EXPERIENCE_PRIVACY_CONTACT` |
| Public HTTPS endpoint | PENDING: the deployed KakaoCloud endpoint has not passed current-tree remote `/health`, `/privacy`, and `/mcp` smoke in this report. | `docs/HOST_REQUIREMENTS_SOT.md` |
| PlayMCP information load and private smoke | PENDING: `정보 불러오기` and the three private starter-message runs have not been recorded against a deployment containing this P0 tree. | `docs/PLAYMCP_TEMP_REGISTRATION.md` |
| PlayMCP review, public switch, contest submission | NOT CLAIMED. These remain explicit human actions after current-tree release and privacy gates pass. | `docs/HOST_REQUIREMENTS_SOT.md` |

## Cache and Release Boundary

- The bundled cache was generated at `2026-07-13T14:46:02.053Z` with a 24-hour TTL. Freshness expires at `2026-07-14T14:46:02.053Z`; with the default 24-hour grace, degraded serving ends at `2026-07-15T14:46:02.053Z`.
- `fresh` is required for broad release proof. `stale_servable` is a bounded continuity mode that must disclose degraded freshness; `expired`, missing, corrupt, fixture, or source-mismatched cache state fails closed.
- The runtime image serves the bundled static cache and does not refresh it in place. Refresh requires external ETL, production-cache validation, a new image build, and redeployment. An all-source ETL failure preserves the last validated snapshot instead of publishing an empty replacement.
- A validated in-process snapshot is reused for at most one second to keep cache-hit latency within the host target. After that bounded interval the files and integrity contract are checked again; concurrent callers share only the same validation work.
- KTO `searchFestival2` supplies festival records. `detailIntro2` enriches age, place, duration, and fee fields only when the returned content ID matches; otherwise unsupported evidence remains unknown.
- Seoul is not in the production source set because a verified HTTPS transport is not currently available. Plain non-loopback HTTP is not enabled as a workaround.

## Residual Risks

- The KTO cache is a bounded snapshot, not proof of complete national coverage, real-time availability, reservation availability, current opening state, indoor/outdoor status, or guaranteed child suitability.
- Source-stated age text is evidence to show parents, not a safety certification. Parents must confirm dates, fees, access, and participation conditions at the official source.
- The technical privacy notice does not substitute for operator confirmation or legal review. KakaoCloud/PlayMCP platform-log retention remains outside this repository's verified boundary.
- Current local source, test, compiled-HTTP, and container proof does not establish KakaoCloud or PlayMCP compatibility. Those claims require a rebuilt deployment and private remote smoke.

## Gate Reliability Note

- One pre-deduplication aggregate run observed a nested `qa-compiled-http` `ECONNRESET`. The same full process matrix had been executed once inside Vitest and again as the canonical receipt step. The redundant nested child-runner test was removed; deterministic threshold checks remain in Vitest, and `qa:submission` still requires the full compiled HTTP matrix exactly once with a fresh fail-closed receipt.
- No network reset or latency breach is accepted or retried. The canonical process matrix measures the guide's average target on warmed sequential full-body response times, while a separate 30-call concurrent lane preserves an internal throughput and p99 pressure check without redefining queue time as single-tool latency. The final aggregate gate must pass both lanes with complete cleanup and matching release-tree hashes.
