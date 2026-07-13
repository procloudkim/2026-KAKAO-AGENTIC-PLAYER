# PlayMCP Temporary Registration

Purpose: prepare the PlayMCP console fields for local/private testing only. This document is for `임시 등록`; it is not a public switch or final release action.

Canonical scope:

- This document owns only PlayMCP console field values.
- Product promise, users, output contract, and claim boundaries live in `docs/PRODUCT_PRD_SOT.md`.
- KakaoCloud / PlayMCP-in-KC / MCP protocol / endpoint / secret rules live in `docs/HOST_REQUIREMENTS_SOT.md`.
- Current readiness status lives in `docs/QA_REPORT.md`.

## Metadata

| Field | Value |
| --- | --- |
| Name | 아이랑 어디가 |
| Identifier | family |
| Endpoint path | /mcp |
| Description | 언제 어디서든 아이와 함께 갈 곳 정보를 큐레이션합니다. 아이 나이, 날짜, 지역, 실내외 조건을 바탕으로 가족 체험 후보를 최대 3개까지 정리해 주는 MCP입니다. 공식 출처 또는 검증된 캐시를 기반으로 장소, 일정, 나이 적합 근거, 출처, 보호자 확인사항, 다음 행동을 함께 제공합니다. 출처가 뒷받침하지 않는 예약 가능 여부, 운영 상태, 전국 모든 행사 포함, 아동 적합성 보장은 제공하지 않습니다. |
| Auth method | No auth for the current private static-cache runtime. The serving container needs no provider key; do not paste secrets into PlayMCP. |
| Response visibility | Temporary/private testing only. Keep visibility limited to the operator until later approval and public-release gates are explicitly run. |

## Starter Messages

1. 2026년 8월 1일 서울에서 4살 아이와 갈 만한 곳을 추천해줘.
2. 2026년 8월 1일 제주에서 4살 아이와 갈 만한 곳을 추천해줘.
3. 2026년 8월 1일 강원에서 초등학교 저학년 아이와 갈 만한 곳을 추천해줘.

Each starter supplies location, an explicit calendar date, and exactly one child selector. The current production cache proves one KTO TourAPI candidate for each starter from source-stated age evidence. Do not add indoor/outdoor, weather, booking, or keyword constraints unless the selected production source explicitly supports them. Missing required fields are an explicit negative-path demo: expect typed `invalid_input`, exact `missing_fields`, and zero source access.

## Endpoint Note

Use the deployed HTTPS MCP endpoint ending in `/mcp`. The complete endpoint rule, KakaoCloud/PlayMCP-in-KC boundary, `정보 불러오기` flow, and stop lines are canonical in `docs/HOST_REQUIREMENTS_SOT.md`.

Do not click `등록 및 심사 요청` while this document is being used only for temporary/private testing.

## Deployment Notes

- Keep one public MCP tool: `find_family_experiences`.
- Build with `npm run build` and start the compiled server with `npm run start`; do not use the TypeScript development runner as the production command.
- Keep the runtime cache TTL at the safe 24-hour default unless an operator pairs a different TTL with a source-specific refresh schedule.
- Do not configure provider keys on the serving host. `KTO_TOURAPI_SERVICE_KEY` is used only by the external ETL environment.
- Serve only the bundled KTO cache from `data/family-experience-cache`. To refresh it, run the external KTO ETL, pass the production-cache gate, rebuild the image, and redeploy; do not write or seed fixture data inside the serving container.
- See `docs/PRODUCT_PRD_SOT.md`, `docs/SOURCE_LEDGER.md`, and `docs/DECISIONS.md` for source claim boundaries and live-proof policy.

## Copy Guardrails

- Use the product promise and caveats in `docs/PRODUCT_PRD_SOT.md`.
- Use source and coverage boundaries in `docs/SOURCE_LEDGER.md`.
- Use current proof status in `docs/QA_REPORT.md`.
- Do not include raw keys, bearer tokens, keyed URLs, cookies, or private operator logs.
- Public health/error/log copy must not expose filesystem paths, provider URLs, refresh commands, stack traces, or deployment topology.
- Representative image status is canonical in `DEMO_PACK.md`. Do not upload it until the operator confirms the rights/provenance note there.

## Operator Stop Line

After saving as temporary/private test material, stop. Do not take any public visibility, contest entry, or final release action in this Todo.
