# Demo Pack

## 30-Second Script

아이랑 어디가는 source-grounded family experience candidates를 부모가 빠르게 비교할 수 있게 좁혀 주는 PlayMCP용 도구입니다. 명시적인 날짜, 지역, 아이 나이 또는 단계를 말하면 KTO TourAPI production cache에서 날짜, 장소, 주소, 확인 가능한 source-stated 연령 근거, 출처, 확인 시점, 부모 확인사항, 다음 행동을 action card로 돌려줍니다. 입력이 빠지면 임의로 서울이나 주말을 채우지 않고 `invalid_input`과 필요한 필드를 알려 줍니다. 완전한 행사 검색이 아니라 bounded parent decision support이며, 출처가 뒷받침하지 않는 실내외, 날씨, 운영 상태, 신청 관련 주장은 하지 않고 다시 확인해야 할 항목을 분리합니다.

Public caveat: no nationwide completeness, no real-time freshness, no indoor/weather/booking or open-now guarantee, and no child safety certification. Demo users must confirm schedule, venue rules, fees, application steps, opening state, and safety needs at the cited source.

## Starter Prompts

Use the exact three production-cache-proven messages in
`docs/PLAYMCP_TEMP_REGISTRATION.md` under `## Starter Messages`. Do not duplicate
or add indoor/outdoor, weather, booking, or keyword constraints here.

Negative-path prompt: `오늘 4살 아이와 갈 곳` intentionally omits location. It must return typed `invalid_input`, `missing_fields=["location"]`, and make zero source calls.

## Before / After

Before: 부모가 포털, 지도, 기관 페이지를 오가며 날짜, 장소, 연령, 신청 여부를 직접 확인해야 합니다.

After: 카카오톡 채팅에서 아이 나이, 날짜, 지역을 말하면 출처 기반 후보와 확인사항을 최대 3개의 action card로 바로 받습니다.

## Representative Image Prompt

Candidate image: `../../../Main-image-KAKAO-MCP-10.png`.

Rights/provenance status: candidate selected for PlayMCP representative-image upload, but public upload remains a human decision until the operator confirms the image was generated or otherwise licensed for this submission. Do not use third-party logos, event posters, real child faces, private screenshots, or Seoul Open Data screenshots.

Prompt: "A warm but practical mobile chat interface showing a parent receiving concise family activity cards for an explicit date and region, with date, venue, address, source, parent checklist, and next action. No brand logos, no real child faces, no copyrighted posters, clean Korean app-style layout."

## Screenshot / Transcript Checklist

- Local `/health` screenshot or transcript.
- MCP tool discovery transcript with exactly `find_family_experiences`.
- Starter prompt transcripts for the exact three messages in `docs/PLAYMCP_TEMP_REGISTRATION.md`.
- Current gate status and evidence paths referenced from `docs/QA_REPORT.md`; this demo pack does not repeat test counts or claim remote success.
- No `.env`, raw API key, keyed URL, cookie, bearer token, private console URL, or account identifier.
