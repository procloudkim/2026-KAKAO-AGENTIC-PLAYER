# 2026 KAKAO AGENTIC PLAYER

Repository for the Kakao AGENTIC PLAYER 10 MCP entry `아이랑 어디가`.

`아이랑 어디가` is a Family Experience MCP that helps caregivers find a small, source-grounded set of family activity candidates by child age, date, region, and practical conditions such as indoor/outdoor preference. It is not a complete national event index, real-time open-now service, booking service, or child-safety certifier.

## Current Focus

| Item | Status |
| --- | --- |
| Main app | `apps/family-experience-mcp` |
| Public MCP tool | `find_family_experiences` |
| Runtime stance | cache-first; live providers are for ETL proof, smoke, and cache generation |
| Local verification | maintained in `apps/family-experience-mcp/docs/QA_REPORT.md` |
| PlayMCP / KakaoCloud requirements | maintained in `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md` |
| Public HTTPS deployment | NOT CLAIMED until a KakaoCloud endpoint is active and smoke-tested |
| PlayMCP review/public/contest submission | NOT CLAIMED until the console actions are actually performed |
| License | MIT, see `LICENSE` |

## Repository Map

```text
apps/family-experience-mcp/          Family Experience MCP server
apps/family-experience-mcp/docs/     Product, source, QA, PlayMCP, runbook docs
concept/                             Early concept notes
공공데이터-관련/                      Local public-data CSV fallback assets
문화포털-관련/                        Culture Portal reference material
참고문서-카카오/                      Kakao/PlayMCP reference notes
roundtable/                          PRD roundtable artifacts
research/                            Research briefs and planning notes
schema/                              Shared schema/rule notes
```

## Quick Start

```bash
cd apps/family-experience-mcp
npm install
npm run verify
npm run scan:secrets
npm run scan:sources
npm run scan:claims
```

Optional local HTTP run:

```bash
FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3349 npm run dev:http
```

Then check:

```bash
curl -i http://127.0.0.1:3349/health
npm run smoke:mcp
```

## Environment Variables

Copy the local template only when you need live provider proof:

```bash
cd apps/family-experience-mcp
cp .env.example .env
```

Do not commit `.env`.

Provider secrets belong in `.env` locally or in the deployment platform's Secret mechanism:

```text
SEOUL_OPEN_DATA_KEY
CULTURE_PORTAL_SERVICE_KEY
KTO_TOURAPI_SERVICE_KEY
PUBLIC_DATA_STANDARD_SERVICE_KEY
```

`PUBLIC_DATA_STANDARD_SERVICE_KEY` is optional while the national festival source uses the local CSV/cache fallback.

## PlayMCP in KC Git Source Build

Use this branch for the current deploy-fast path:

```text
Branch / ref:
family-experience-deploy-fastpath
```

PlayMCP in KC form values:

```text
Git URL:
https://github.com/procloudkim/2026-KAKAO-AGENTIC-PLAYER.git

Dockerfile path:
apps/family-experience-mcp/Dockerfile

container_port:
3349
```

Recommended plain environment variables:

```text
HOST=0.0.0.0
PORT=3349
FAMILY_EXPERIENCE_ALLOW_FIXTURE=false
FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache
FAMILY_EXPERIENCE_SOURCE_SET=seoul,culture_portal,kto_tourapi,national_festival
FAMILY_EXPERIENCE_ETL_TTL_HOURS=24
SEOUL_OPEN_DATA_BASE_URL=http://openapi.seoul.go.kr:8088
CULTURE_PORTAL_BASE_URL=https://apis.data.go.kr/B553457/cultureinfo
KTO_TOURAPI_BASE_URL=https://apis.data.go.kr/B551011/KorService2
```

Recommended Secrets:

```text
SEOUL_OPEN_DATA_KEY
CULTURE_PORTAL_SERVICE_KEY
KTO_TOURAPI_SERVICE_KEY
```

After the server becomes `Active`, copy the issued endpoint URL and use it in PlayMCP as the MCP Endpoint. Add `/mcp` only if the issued endpoint does not already include it.

Do not click `등록 및 심사 요청` until remote `/health`, remote `/mcp`, PlayMCP `정보 불러오기`, and private starter-prompt smoke have passed.

## Canonical Docs

| Need | Read |
| --- | --- |
| Product promise, users, output contract | `apps/family-experience-mcp/docs/PRODUCT_PRD_SOT.md` |
| Source inventory and coverage tiers | `apps/family-experience-mcp/docs/SOURCE_LEDGER.md` |
| Current verification and blockers | `apps/family-experience-mcp/docs/QA_REPORT.md` |
| KakaoCloud / PlayMCP / MCP host rules | `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md` |
| Operator runbook | `apps/family-experience-mcp/docs/RUNBOOK.md` |
| PlayMCP temporary registration fields | `apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md` |
| PRD roundtable decision | `roundtable/family-experience-prd-20260709/final-synthesis.md` |

## Claim Boundaries

The project must not claim:

- complete nationwide coverage
- real-time freshness
- reservation availability
- current open/operating status
- child safety certification
- guaranteed age suitability
- PlayMCP review completion, public release, or contest submission before evidence exists

When a source does not support a field, return `unknown`, `inferred`, or a parent confirmation note.

## Git Hygiene

- Keep `.env`, provider keys, keyed URLs, cookies, and bearer tokens out of Git.
- Keep deployment proof, raw console screenshots, and noisy generated evidence out of public commits unless explicitly reviewed.
- Commit user-facing docs, source code, tests, and safe templates.
- Run `npm --prefix apps/family-experience-mcp run verify` plus all three scans before pushing deploy-facing changes.

## License

MIT License. See `LICENSE`.
