# ULW-Research Synthesis: API / Token Inventory for Completion

Workers: 4 subagents plus main-thread official-source checks.
Waves: 1 saturation wave plus lead integration.
Access date: 2026-07-03.

## Executive Summary

The immediate completion path for the active repo is narrow: the family-experience MCP needs only `SEOUL_OPEN_DATA_KEY` to run the live Seoul adapter. The repo already has the correct local secret pattern: `apps/family-experience-mcp/.env` is ignored, while `.env.example` contains variable names only.

The broader three-product strategy needs three provider families: Seoul/KTO/data.go.kr for family events, NMC/data.go.kr plus Kakao for holiday pharmacies, and SafetyKorea/KATS/data.go.kr for baby product safety. Consumer24, CPSC, EU Safety Gate, Pharm114, and Kakao Gift are supplemental, not first critical path.

## Findings By Theme

### Family Experience

Verified:

- Current code accepts `SEOUL_OPEN_DATA_KEY`, `SEOUL_OPEN_DATA_BASE_URL`, `FAMILY_EXPERIENCE_ALLOW_FIXTURE`, and `PORT`.
- Seoul Open Data culture-event API requires an issued 인증키.
- Seoul culture/event data is the correct first live source because it maps to event title, venue, date, fee, contact, homepage, coordinates, and audience fields.

Inference:

- National expansion should add KTO/TourAPI or data.go.kr standard event/festival datasets after Seoul live smoke passes.

### Holiday Pharmacy

Verified from the reference repo:

- `DATA_GO_NMC_KR_SERVICE_KEY` is the primary live provider key.
- `KAKAO_REST_API_KEY` is used for server-side Kakao enrichment.
- `DATA_GO_HIRA_KR_SERVICE_KEY` exists, but HIRA is documented as cross-check/future role, not the primary live source.
- Local injection file is `D:\KLab\workspace\2026-휴일약국\web\.env.local`, which contains real values and must not be copied into this repo or final reports.

Inference:

- If this concept becomes an MCP, reuse the same env names rather than inventing new ones.

### Baby Product Safety

Verified from the reference repo:

- The current BabyGear / ParentPick repo is static/source-governed and has no live runtime secret requirement.
- A live MCP version needs SafetyKorea first because its Open API covers KC certification, domestic recall, and overseas recall information.
- KATS/data.go.kr product safety certification and recall data is the second strongest Korean source.
- CPSC recall API is useful as a no-key supplemental import cross-check.

Inference:

- Do not start with marketplace/shopping APIs. The main value is safety and evidence conflict resolution.

## Ranked API / Token List

1. `SEOUL_OPEN_DATA_KEY` - required now for family-experience live mode.
2. `DATA_GO_NMC_KR_SERVICE_KEY` - required if holiday pharmacy becomes live.
3. `KAKAO_REST_API_KEY` - strongly recommended for geocoding/local enrichment.
4. `SAFETY_KOREA_API_KEY` - required if baby safety becomes live.
5. `DATA_GO_KR_SERVICE_KEY` / provider-specific data.go.kr keys - needed for KTO, KATS, HIRA, or other public-data APIs.
6. `CONSUMER24_API_KEY` - only after selecting a Consumer24 service that explicitly requires it.

## Local Injection Map

| Repo | File | Keys |
|---|---|---|
| Current repo | `apps/family-experience-mcp/.env` | `SEOUL_OPEN_DATA_KEY`, optional base URL, fixture toggle, port |
| Current repo sample | `apps/family-experience-mcp/.env.example` | names only |
| Holiday pharmacy reference | `D:\KLab\workspace\2026-휴일약국\web\.env.local` | NMC, HIRA, Kakao, app name |
| Baby safety reference | none | current plugin is static; no live secret file found |

## Sources

1. Seoul Open Data culture events: https://data.seoul.go.kr/dataList/OA-15486/S/1/datasetView.do?tab=A
2. Seoul Hanyangdoseong events/programs: https://data.seoul.go.kr/dataList/datasetView.do?currentPageNo=1&infId=OA-15370&serviceKind=1&srvType=A
3. Seoul real-time city data: https://www.data.go.kr/data/15146211/openapi.do?recommendDataYn=Y
4. KTO / VisitKorea content platform: https://conlab.visitkorea.or.kr/
5. KTO data.go.kr tourism API page: https://www.data.go.kr/data/15101578/openapi.do
6. National culture festival standard data: https://www.data.go.kr/data/15013104/standard.do
7. National performance event standard data: https://www.data.go.kr/data/15013106/standard.do
8. HIRA notice directing hospital/pharmacy data to data.go.kr APIs: https://www.hira.or.kr/bbsDummy.do?brdBltNo=12040&brdScnBltNo=4&pageIndex=1&pageIndex2=1&pgmid=HIRAA020002000100
9. NMC pharmacy OpenAPI: https://www.data.go.kr/data/15000576/openapi.do
10. SafetyKorea Open API: https://www.safetykorea.kr/release/openapi
11. SafetyKorea Open API usage process: https://www.safetykorea.kr/release/openapi2
12. SafetyKorea certification search: https://www.safetykorea.kr/release/itemSearch
13. SafetyKorea recall search: https://www.safetykorea.kr/recall/recallBoard
14. KATS product safety certification and recall API: https://www.data.go.kr/data/15116894/openapi.do?recommendDataYn=Y
15. Consumer24 Open API catalog: https://www.consumer.go.kr/user/ftc/consumer/openApiSvcUser/120/selectOpenApiSvcList.do
16. CPSC recalls API: https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information
17. CPSC data page: https://www.cpsc.gov/Data
18. EU Safety Gate alerts: https://ec.europa.eu/safety-gate-alerts/
19. Kakao Developers getting started: https://developers.kakao.com/docs/en/tutorial/start
20. Kakao quota docs: https://developers.kakao.com/docs/en/getting-started/quota

## Gaps

- KTO/TourAPI exact key format and quota require logged-in or deeper official portal confirmation.
- Consumer24 per-service auth and quota were not confirmed from the catalog page alone.
- EU Safety Gate machine API was not confirmed.
- Kakao Gift API was not confirmed as a public/open integration path for this use case.

## Convergence

All first-wave axes returned consistent results: current repo has one active live key, holiday pharmacy reference has three provider keys, and baby safety reference has no runtime key today but needs SafetyKorea/data.go.kr keys for live operation. No additional required token surfaced for current family-experience completion.

