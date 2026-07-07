# API / Token Inventory for Completion

Date: 2026-07-03

Scope: three Kakao PlayMCP concepts.

- Family experience MCP: current build in `apps/family-experience-mcp`.
- Holiday pharmacy MCP: reference repo at `D:\KLab\workspace\2026-휴일약국`.
- Baby product safety MCP: reference repo at `D:\KLab\workspace\2026-06-07-harness`.

## Executive Decision

For the current hackathon-first path, the minimum live key set is one key:

```env
SEOUL_OPEN_DATA_KEY=<issued Seoul Open Data API key>
```

Put it in:

```text
apps/family-experience-mcp/.env
```

The existing `.gitignore` ignores `.env` and `.env.*` while allowing `.env.example`, so this is the right local secret management pattern for this repo.

## 1. Immediate Required Keys

| Priority | Product | Env name | Required for | Where to obtain | Local file |
|---|---|---|---|---|---|
| P0 | Family experience | `SEOUL_OPEN_DATA_KEY` | Live Seoul culture/event recommendations | Seoul Open Data 인증키 신청 | `apps/family-experience-mcp/.env` |
| P0 | Family experience | `SEOUL_OPEN_DATA_BASE_URL` | Override only; default exists | No key, default is built in | `apps/family-experience-mcp/.env` |
| P0 | Family experience | `FAMILY_EXPERIENCE_ALLOW_FIXTURE` | Fixture fallback toggle | No key | `apps/family-experience-mcp/.env` |
| P0 | Family experience | `PORT` | Local MCP HTTP port | No key | `apps/family-experience-mcp/.env` |

Recommended local `.env`:

```env
SEOUL_OPEN_DATA_KEY=<your-seoul-open-data-key>
SEOUL_OPEN_DATA_BASE_URL=http://openapi.seoul.go.kr:8088
FAMILY_EXPERIENCE_ALLOW_FIXTURE=false
PORT=3349
```

Evidence:

- Current repo config accepts only `SEOUL_OPEN_DATA_KEY`, `SEOUL_OPEN_DATA_BASE_URL`, `FAMILY_EXPERIENCE_ALLOW_FIXTURE`, and `PORT`.
- `apps/family-experience-mcp/.env.example` already lists those names.
- `apps/family-experience-mcp/src/config.ts` redacts the Seoul key from diagnostics.
- Seoul Open Data official pages require an issued 인증키 for Open API use.

## 2. Strongly Recommended Next Keys

These are not required to finish the first live MCP, but they unlock national coverage, ranking quality, or cross-checking.

| Priority | Product | Proposed env name | Why | Where to obtain | Notes |
|---|---|---|---|---|---|
| P1 | Family experience | `DATA_GO_KR_SERVICE_KEY` or `KTO_TOUR_API_SERVICE_KEY` | National tourism/event coverage through Korea Tourism / data.go.kr | data.go.kr / VisitKorea tourism content platform | Use one canonical name after adapter design; do not add both unless two providers need separate keys. |
| P1 | Family experience | `KAKAO_REST_API_KEY` | Geocoding, local search, travel-time/nearby context if Kakao APIs are used | Kakao Developers | Server-side only for REST calls. |
| P1 | Holiday pharmacy | `DATA_GO_NMC_KR_SERVICE_KEY` | NMC nationwide pharmacy lookup | data.go.kr | Already used in the reference repo. |
| P1 | Holiday pharmacy | `KAKAO_REST_API_KEY` | Address/geocode/enrichment | Kakao Developers | Already used in the reference repo. |
| P1 | Baby product safety | `SAFETY_KOREA_API_KEY` | KC certification, domestic recall, overseas recall | SafetyKorea email application | SafetyKorea issues key by email after application. |
| P1 | Baby product safety | `DATA_GO_KR_SERVICE_KEY` or `KATS_PRODUCT_SAFETY_SERVICE_KEY` | KATS product safety certification/recall open data | data.go.kr | Use if building live safety lookup rather than static evidence plugin. |

## 3. Optional / Later Keys

| Priority | Product | Proposed env name | Use | Status |
|---|---|---|---|---|
| P2 | Holiday pharmacy | `DATA_GO_HIRA_KR_SERVICE_KEY` | HIRA cross-check only, not primary live authority | Present in holiday pharmacy reference repo. |
| P2 | Baby product safety | `CONSUMER24_API_KEY` | Consumer24 recall/injury/certification feed aggregation | Official API catalog exists; exact service auth requires deeper per-service confirmation. |
| P2 | Baby product safety | none | CPSC recalls API | Public API docs show XML/JSON recall API; no key requirement found in fetched official docs. |
| P2 | Baby product safety | none yet | EU Safety Gate alerts | Public alerts confirmed; machine API not confirmed. Treat as manual/crawl/backstop until API contract is verified. |
| P2 | Family experience | none | 전국문화축제표준데이터 / 전국공연행사정보표준데이터 | Standard data pages, useful as batch sources rather than key-first live APIs. |

## 4. Do Not Treat As Core Yet

| Candidate | Reason |
|---|---|
| KakaoTalk Gift / 선물하기 API | Useful hook for baby-product shopping flow, but not the core safety decision engine. No confirmed public general-purpose Gift API path in this research pass. |
| Pharm114 / 휴일지킴이약국 scraping | Operationally relevant, but no public API contract was confirmed. Use only after legal/terms review or as a user-facing outbound link. |
| EU Safety Gate API | Public alerts exist, but no official machine API contract was confirmed. |

## 5. Product-by-Product MECE Requirements

### A. Family Experience MCP

Current completion state:

- Runtime key needed: `SEOUL_OPEN_DATA_KEY`.
- Runtime file: `apps/family-experience-mcp/.env`.
- Existing config: `apps/family-experience-mcp/src/config.ts`.
- Existing adapter: `apps/family-experience-mcp/src/sources/seoulCulture.ts`.
- Existing run command: `npm run dev:http:env` from `apps/family-experience-mcp`.

Minimum live local setup:

```powershell
cd apps/family-experience-mcp
notepad .env
npm run dev:http:env
```

Required `.env`:

```env
SEOUL_OPEN_DATA_KEY=<your-seoul-key>
SEOUL_OPEN_DATA_BASE_URL=http://openapi.seoul.go.kr:8088
FAMILY_EXPERIENCE_ALLOW_FIXTURE=false
PORT=3349
```

Expansion keys:

- `DATA_GO_KR_SERVICE_KEY` or `KTO_TOUR_API_SERVICE_KEY` for national coverage.
- `KAKAO_REST_API_KEY` only if geocoding/local-search enrichment is implemented.

### B. Holiday Pharmacy MCP

Reference repo already defines:

```env
PHARMACY_DATA_MODE=live
DATA_GO_NMC_KR_SERVICE_KEY=<data.go.kr NMC key>
DATA_GO_HIRA_KR_SERVICE_KEY=<data.go.kr HIRA key, cross-check only>
KAKAO_REST_API_KEY=<kakao REST key>
NEXT_PUBLIC_APP_NAME=<public display name>
```

Local file in reference repo:

```text
D:\KLab\workspace\2026-휴일약국\web\.env.local
```

Core rule:

- NMC is the primary live pharmacy provider.
- Kakao is enrichment/geocoding.
- HIRA is cross-check/future authority, not the primary live source.

### C. Baby Product Safety MCP

Current reference repo state:

- No runtime secret is required today because the plugin is static/source-governed.
- Completion as a live MCP will require at least one safety source key.

Recommended live key sequence:

```env
SAFETY_KOREA_API_KEY=<issued SafetyKorea key>
DATA_GO_KR_SERVICE_KEY=<data.go.kr key if using KATS product safety API>
```

Optional:

```env
CONSUMER24_API_KEY=<only if the selected Consumer24 service requires it>
```

No-key supplemental:

- CPSC recalls API for US/import cross-checks.

## 6. Source Reliability Map

| Tier | Source | Product | Use |
|---|---|---|---|
| Official primary | Seoul Open Data | Family experience | Seoul event inventory |
| Official primary | NMC / data.go.kr | Holiday pharmacy | Nationwide pharmacy lookup |
| Official primary | SafetyKorea | Baby safety | KC certification and recall |
| Official primary | KATS / data.go.kr | Baby safety | Certification and recall data |
| Official support | Kakao Developers | Family/pharmacy | Geocoding/local enrichment |
| Official support | KTO / VisitKorea | Family experience | National tourism/event expansion |
| Official support | Consumer24 | Baby safety | Consumer risk/recall aggregation |
| Official support | CPSC | Baby safety | US recall cross-check |
| Unconfirmed API | Pharm114 | Holiday pharmacy | Link/reference only until API/terms confirmed |
| Unconfirmed API | EU Safety Gate | Baby safety | Public alert reference only until API confirmed |

## 7. Secret Handling Rules

- Never commit `.env` or `.env.local`.
- Keep only variable names in `.env.example`.
- Use server-side env only for REST/service keys.
- Do not put provider keys in browser-visible variables unless the provider explicitly intends them to be public.
- Run existing scans before packaging:

```powershell
cd apps/family-experience-mcp
npm run scan:secrets
npm run scan:sources
npm run scan:claims
```

## 8. Open Questions

| Question | Current status | Next action |
|---|---|---|
| Exact KTO/TourAPI auth and rate limit | Official platform found; low-level public docs not fully visible | Log in to data.go.kr / VisitKorea and confirm issued key format and quota. |
| Consumer24 per-service auth | Official catalog found; per-service auth not confirmed | Select exact Consumer24 API and confirm key/rate rules. |
| EU Safety Gate machine API | Public alerts found; API not confirmed | Treat as non-core until official machine endpoint is found. |
| Kakao PlayMCP platform token | No separate runtime token found in current repo | Follow PlayMCP registration instructions; do not invent env until official requirement appears. |

