# Refined Proposal

## Product Promise

아이 나이, 날짜, 지역을 기준으로 부모가 바로 검토할 수 있는 체험 후보 3개를 출처와 확인사항까지 채팅에서 제공한다.

## First Tool

`find_family_experiences(location, child_age, date_range, indoor_outdoor?, budget?, must_have?)`

## First Build Scope

- Seoul first.
- One child age or stage.
- One date range.
- Top 3 only.
- Deterministic fixture fallback if live API keys are unavailable.

## Response Card

Each candidate must include:

- title
- date/time
- venue/address
- age-fit reason
- fee/reservation/contact if present
- source and retrieved date
- confidence label
- one parent check before going

## Assumptions

- A deterministic demo fixture is acceptable if clearly labeled.
- Seoul is the first source lane.
- Recommendation clarity matters more than nationwide coverage in the first MVP.

## Open Questions

- Seoul API key availability.
- Final product name.
- Whether images are needed later for a Kakao Tools widget.
