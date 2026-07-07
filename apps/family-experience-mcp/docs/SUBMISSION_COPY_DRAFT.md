# Submission Copy Draft

This is draft copy for a future operator to paste into PlayMCP temporary/private fields. It is not proof of release, public visibility, contest entry, or final review action.

## Service Name

아이랑 어디가

## Identifier

familyexp

## Short Description

source-grounded family experience candidates를 최대 3개로 좁혀 주는 MCP입니다. 아이 나이, 날짜, 지역, 실내외 선호를 받아 fixture/demo 또는 공식 출처 캐시에서 후보를 고르고, 출처, 나이 적합 근거, 보호자 확인사항, 다음 행동을 함께 보여줍니다. 현재 빌드는 데모/검증용이며 완전한 행사 검색을 약속하지 않습니다.

## Starter Messages

1. 이번 주말 4살 실내 체험 찾아줘
2. 오늘 아이랑 갈 곳 3개만 골라줘
3. 비 오는 날 가족 체험 추천해줘

## Endpoint

Use the temporary deployed base URL plus `/mcp`.

## Auth

No auth for the current local fixture/demo build. Do not paste API keys, bearer tokens, cookies, or keyed URLs into PlayMCP copy fields.

## Response Visibility

Keep private/operator-only until a later release gate explicitly changes this.

## Guardrail Copy

Fixture/demo rows are test data. Source-backed rows show their source, freshness label, confidence, parent check, and next action. This is bounded parent decision support, not complete event search.

Unsupported-claim caveats: no nationwide completeness, no real-time freshness, no reservation/open-now guarantee, and no child safety certification. Parents must confirm schedule, venue rules, fees, booking steps, opening state, and safety needs at the cited source before visiting.

For the canonical source and verification policy, see `RUNBOOK.md`, `DECISIONS.md`, and `QA_REPORT.md`.

## Representative Image

TODO: prepare a rights-cleared representative image separately. This Todo does not generate, upload, or submit an image.
