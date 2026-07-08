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
| Auth method | No auth for the current local fixture/demo build. If the console requires a choice, use the no-auth option and do not paste secrets. |
| Response visibility | Temporary/private testing only. Keep visibility limited to the operator until later approval and public-release gates are explicitly run. |

## Starter Messages

1. 이번 주말 서울에서 4살 아이와 갈 만한 실내 체험 장소를 추천해줘.
2. 내일 비가 오는데 24개월 아이와 갈 수 있는 키즈 체험이나 박물관을 찾아줘.
3. 초등학교 저학년 아이와 주말에 갈 수 있는 가족 행사 3개를 출처와 함께 정리해줘.

## Endpoint Note

Use the deployed HTTPS MCP endpoint ending in `/mcp`. The complete endpoint rule, KakaoCloud/PlayMCP-in-KC boundary, `정보 불러오기` flow, and stop lines are canonical in `docs/HOST_REQUIREMENTS_SOT.md`.

Do not click `등록 및 심사 요청` while this document is being used only for temporary/private testing.

## Deployment Notes

- Keep one public MCP tool: `find_family_experiences`.
- Set provider keys only through the hosting secret mechanism selected under `docs/HOST_REQUIREMENTS_SOT.md`.
- Configure `FAMILY_EXPERIENCE_ETL_CACHE_DIR` so the runtime can read the cache produced by `npm run etl:nationwide -- --fixture --write-cache` or a later live proof run.
- See `docs/PRODUCT_PRD_SOT.md`, `docs/SOURCE_LEDGER.md`, and `docs/DECISIONS.md` for source claim boundaries and live-proof policy.

## Copy Guardrails

- Use the product promise and caveats in `docs/PRODUCT_PRD_SOT.md`.
- Use source and coverage boundaries in `docs/SOURCE_LEDGER.md`.
- Use current proof status in `docs/QA_REPORT.md`.
- Do not include raw keys, bearer tokens, keyed URLs, cookies, or private operator logs.
- Representative image status is canonical in `DEMO_PACK.md`. Do not upload it until the operator confirms the rights/provenance note there.

## Operator Stop Line

After saving as temporary/private test material, stop. Do not take any public visibility, contest entry, or final release action in this Todo.
