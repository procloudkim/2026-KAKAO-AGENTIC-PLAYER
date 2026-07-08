# PlayMCP Temporary Registration

Purpose: prepare the PlayMCP console fields for local/private testing only. This document is for `임시 등록`; it is not a public switch or final release action.

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

Register the deployed server endpoint with the MCP path ending in `/mcp`. The local development server exposes `http://127.0.0.1:3345/mcp`; the PlayMCP console should use the actual temporary server URL plus `/mcp`.

For AGENTIC PLAYER 10, use the host SOT in `HOST_REQUIREMENTS_SOT.md`. The official Kakao contest page supports only the registration flow boundary: create a KakaoCloud MCP endpoint, register it in PlayMCP, use temporary registration for testing, request review only when final, switch to public after approval, and submit once. The organizer-provided PlayMCP-in-KC endpoint pattern is:

```text
https://mcp-name.playmcp-endpoint.kakaocloud.io/mcp
```

After changing the endpoint in the developer console, click `정보 불러오기` and verify that tool discovery returns exactly `find_family_experiences`. Do not click `등록 및 심사 요청` while this document is being used only for temporary/private testing.

## Deployment Notes

- Keep one public MCP tool: `find_family_experiences`.
- Set provider keys only through the hosting secret mechanism supported by the target platform. For PlayMCP-in-KC, see `HOST_REQUIREMENTS_SOT.md`: the organizer notice quoted on 2026-07-07 says env/Secret injection is not yet supported, so any private image-baked key workaround is a temporary host-specific exception requiring human approval and key rotation.
- Configure `FAMILY_EXPERIENCE_ETL_CACHE_DIR` so the runtime can read the cache produced by `npm run etl:nationwide -- --fixture --write-cache` or a later live proof run.
- See `DECISIONS.md` for source claim boundaries and live-proof policy.

## Copy Guardrails

- Market promise: source-grounded family experience candidates for bounded parent decision support, not complete event search.
- Label fixture output as `fixture/demo`; do not present fixture rows as live records.
- Do not claim nationwide coverage, live freshness, reservation status, current opening status, or child suitability unless a cited source field supports that exact claim.
- Explicit public caveats: no nationwide completeness, no real-time freshness, no reservation/open-now guarantee, and no child safety certification.
- Do not describe cache-backed candidate coverage as live nationwide completeness.
- Mention missing or inferred fields plainly with `unknown`, `inferred`, or `stale` where applicable.
- Do not include raw keys, bearer tokens, keyed URLs, cookies, or private operator logs.
- Representative image status is canonical in `DEMO_PACK.md`. Do not upload it until the operator confirms the rights/provenance note there.

## Operator Stop Line

After saving as temporary/private test material, stop. Do not take any public visibility, contest entry, or final release action in this Todo.
