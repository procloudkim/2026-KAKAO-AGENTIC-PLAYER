# Demo Pack

## 30-Second Script

아이랑 어디가는 source-grounded family experience candidates를 부모가 빠르게 비교할 수 있게 좁혀 주는 PlayMCP용 도구입니다. 예를 들어 "오늘 비오는데 4살이랑 갈 곳"처럼 말하면 날짜, 장소, 주소, 연령 근거, 출처, 확인 시점, 부모 확인사항, 다음 행동을 한 장의 action card로 돌려줍니다. 완전한 행사 검색이 아니라 bounded parent decision support이며, 출처가 뒷받침하지 않는 범위, 상태, 신청 관련 주장은 하지 않고 다시 확인해야 할 항목을 분리합니다.

Public caveat: no nationwide completeness, no real-time freshness, no reservation/open-now guarantee, and no child safety certification. Demo users must confirm schedule, venue rules, fees, booking steps, opening state, and safety needs at the cited source.

## Starter Prompts

1. 오늘 비오는데 4살이랑 갈 곳
2. 이번 주말 초등 저학년 실내 체험
3. 종로구 근처 5살 아이랑 갈 행사

## Before / After

Before: 부모가 포털, 지도, 기관 페이지를 오가며 날짜, 장소, 연령, 신청 여부를 직접 확인해야 합니다.

After: 카카오톡 채팅에서 아이 나이, 날짜, 지역, 조건을 말하면 출처 기반 후보 3개와 확인사항을 바로 받습니다.

## Representative Image Prompt

Rights plan: generate an original image, do not use third-party logos, event posters, child faces, or Seoul Open Data screenshots.

Prompt: "A warm but practical mobile chat interface showing a parent receiving three concise family activity cards for a rainy weekend in Seoul, with date, venue, address, source, parent checklist, and next action. No brand logos, no real child faces, no copyrighted posters, clean Korean app-style layout."

## Screenshot / Transcript Checklist

- Local `/health` screenshot or transcript.
- MCP tool discovery transcript with exactly `find_family_experiences`.
- Starter prompt transcript for "오늘 비오는데 4살이랑 갈 곳".
- Eval summary showing 42 market prompt scenarios, `market_scenarios.status: pass`, unsupported claim failures equal to 0, no-result behavior pass, and max candidate count at 3 or below.
- No `.env`, raw API key, keyed URL, cookie, bearer token, private console URL, or account identifier.
