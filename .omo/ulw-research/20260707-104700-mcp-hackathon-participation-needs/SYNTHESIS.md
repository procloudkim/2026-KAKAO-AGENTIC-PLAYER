# ULW-Research Synthesis: MCP Hackathon Participation Needs

Date: 2026-07-07

## Core Question

What is still needed to participate in Kakao AGENTIC PLAYER 10 with the current Family Experience MCP, and what should be prioritized before submission?

## Sources

1. Kakao AGENTIC PLAYER 10 official page: https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10
2. Kakao corporate announcement: https://www.kakaocorp.com/page/detail/12059
3. Local milestone status: .omo/ulw-loop/family-status-20260703/FAMILY_EXPERIENCE_MILESTONE_STATUS.md
4. Local PlayMCP draft: apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md
5. Local runbook: apps/family-experience-mcp/docs/RUNBOOK.md
6. Local QA report: apps/family-experience-mcp/docs/QA_REPORT.md
7. Local demo pack: apps/family-experience-mcp/docs/DEMO_PACK.md

## Official Requirements

- Preliminary participation is by registering a PlayMCP server and applying through AGENTIC PLAYER 10. Official deadline: 2026-07-14.
- Kakao Cloud MCP server endpoint is required for preliminaries unless official capacity exception applies.
- PlayMCP server must be registered with the Kakao Cloud endpoint.
- If not final, save as temporary registration only; do not request review from temporary state.
- When final server is ready, request PlayMCP review.
- After review approval, visibility must be changed from private/self-only to public before AGENTIC PLAYER 10 application.
- Player preliminary application is submitted once through the official page.
- Review can take up to 7 business days; the official page warns that requests after 2026-07-07 may not complete within the contest application window.
- Finals require Kakao Tools development and stricter MCP/widget work.

## Local Current Status

- Product: `아이랑 어디가`, one MCP tool `find_family_experiences`.
- Local package version currently reads `0.1.0`.
- Local docs and metadata for temporary PlayMCP registration exist.
- Local runbook documents `/mcp`, `/health`, no-auth temporary validation, cache-first operation, and secret-manager policy.
- Prior QA says local HTTP/MCP proof and scans existed, but no public PlayMCP final review, public visibility switch, representative image upload, or contest submission was performed.
- Recent source audit shows KTO and national festival CSV can produce live/local official-source samples after request-default correction; Culture Portal endpoint remains an external blocker with 404/timeout behavior.

## Required Items To Participate

### A. Account / Console / Cloud

- Kakao account with access to PlayMCP developer console.
- Kakao Cloud access for contest MCP server endpoint.
- One available contest MCP server slot; official page states contest MCP servers are limited to two per person.
- Public HTTPS endpoint ending in `/mcp`.
- `/health` endpoint exposed for operator verification.
- Stable deployment runtime: restart-safe, process manager/container, logs, environment variables.

### B. Deployment Secrets

- Deployment secret manager entries, not raw `.env` upload:
  - `SEOUL_OPEN_DATA_KEY`
  - `KTO_TOURAPI_SERVICE_KEY`
  - `CULTURE_PORTAL_SERVICE_KEY` only if endpoint is repaired or source is kept as candidate
  - `PUBLIC_DATA_STANDARD_SERVICE_KEY` only if live standard endpoint is used
- Plain env/config:
  - `SEOUL_OPEN_DATA_BASE_URL`
  - `KTO_TOURAPI_BASE_URL`
  - `CULTURE_PORTAL_BASE_URL`
  - `NATIONAL_CULTURE_FESTIVAL_CSV_PATH`
  - `FAMILY_EXPERIENCE_SOURCE_SET`
  - `FAMILY_EXPERIENCE_ETL_CACHE_DIR`
  - `FAMILY_EXPERIENCE_ALLOW_FIXTURE=false` for public live proof
  - `HOST=0.0.0.0`
  - platform `PORT`

### C. Data / ETL

- Decide public source set:
  - Keep Seoul Open Data.
  - Keep KTO TourAPI.
  - Keep national festival CSV fallback as lower-freshness official fallback.
  - Either repair Culture Portal endpoint or exclude it from public source set until official endpoint is confirmed.
- Generate or mount ETL cache for deployed runtime.
- Capture live proof per source:
  - Seoul live dry-run proof.
  - KTO live dry-run proof.
  - National festival CSV proof.
  - Culture Portal blocked/repaired proof.
- Do not claim nationwide completeness; claim official-source candidate coverage with source freshness limitations.

### D. Local Verification Before Deployment

- `npm run verify`
- `npm run scan:secrets`
- `npm run scan:claims`
- `npm run scan:sources`
- `npm run etl:nationwide -- --dry-run --source seoul`
- `npm run etl:nationwide -- --dry-run --source kto_tourapi`
- `npm run etl:nationwide -- --dry-run --source national_festival`
- MCP smoke with cache-backed prompts.

### E. Deployed Verification

- `curl -i https://<public-host>/health`
- MCP initialize/list-tools against `https://<public-host>/mcp`
- Tool call proof for:
  - happy path: age/date/location prompt returns up to three candidates
  - no-result path
  - missing age/child selector clarification
  - source failure path with no raw key leak
- Verify tool list contains exactly one public tool unless explicitly changed.
- Capture redacted logs/evidence.

### F. PlayMCP Registration Materials

- Service name: `아이랑 어디가`
- Identifier: `familyexp` unless PlayMCP rejects it.
- Endpoint: deployed HTTPS URL ending `/mcp`.
- Description: must avoid unsupported live/nationwide/reservation/suitability claims.
- Starter prompts:
  - `이번 주말 4살 실내 체험 찾아줘`
  - `오늘 아이랑 갈 곳 3개만 골라줘`
  - `비 오는 날 가족 체험 추천해줘`
- Auth: no-auth only if server does not require user auth.
- Visibility: temporary/private first, public only after approval.
- Representative image: original or rights-cleared, no third-party logos, no real child faces, no copyrighted posters.

### G. Review / Submission Flow

1. Deploy public HTTPS MCP server.
2. Verify `/health` and `/mcp` on deployed URL.
3. Register as PlayMCP temporary/private.
4. Run PlayMCP tool discovery and prompt smoke.
5. Request PlayMCP review only after final endpoint is stable.
6. After approval, switch visibility to public.
7. Submit AGENTIC PLAYER 10 preliminary application once.
8. Preserve screenshots/transcripts for every step.

### H. Winning Readiness

- Demo story: "Parent can type messy age/date/region conditions in KakaoTalk and receive concise source-backed cards."
- Accuracy story: every result carries source, retrieved time, confidence, parent-check, and unknown/stale labels.
- Safety story: no unsupported claims for live operation, reservation, or child suitability.
- UX story: one tool, compact cards, no data-dump behavior.
- Reliability story: cache-first ETL, safe failure behavior, redacted diagnostics.
- Finals story: Kakao Tools widget/action-card extension plan ready after preliminary pass.

## Critical Path

1. Fix or remove Culture Portal from public source set.
2. Deploy to Kakao Cloud public HTTPS.
3. Configure secrets in deployment secret manager.
4. Generate/mount ETL cache.
5. Run deployed health/MCP/tool-call proof.
6. Create rights-cleared representative image.
7. Register private PlayMCP entry.
8. Smoke test inside PlayMCP.
9. Request review immediately because review may take up to 7 business days.
10. On approval, switch to public and submit once.

## Open Risks

- Today is already 2026-07-07; official page warns later review requests may not complete before the 2026-07-14 application deadline.
- Culture Portal endpoint is not currently reliable.
- Docker daemon was previously unavailable, so deployment proof must be checked on the actual target environment.
- Local worktree is broadly untracked; submission should be based on command evidence and a clean release branch/commit if time allows.
- PlayMCP console and Kakao Cloud actions require operator login/manual action.

