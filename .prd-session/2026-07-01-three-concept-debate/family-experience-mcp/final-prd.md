# Refined Proposal - family-experience-mcp

## Decision

Primary implementation candidate.

## Product Promise

아이 나이, 날짜, 지역을 기준으로 부모가 바로 검토할 수 있는 체험 후보 3개를 출처와 확인사항까지 채팅에서 제공한다.

## First MCP Tool

`find_family_experiences(location, child_age, date_range, indoor_outdoor?, budget?, must_have?)`

## MVP Scope

- Seoul first.
- One date range.
- One child age or stage.
- Top 3 output only.
- Deterministic fixture fallback if API keys are unavailable.

## Output Contract

For each candidate:

- title
- date/time
- venue/address
- age-fit reason
- fee/reservation/contact if present
- source and retrieved date
- confidence label
- one parent check before going

## Dissent

Age-fit and indoor/outdoor tags can be weak if official source text is sparse. These must be labeled as inferred or unknown.

## Assumptions

- A deterministic demo fixture is acceptable for temporary PlayMCP testing if it is clearly labeled.
- Seoul event data is the fastest first source lane.
- The first public value is recommendation clarity, not nationwide coverage.

## Open Questions

- Seoul API key availability.
- Final product name.
- Whether images are needed for a Kakao Tools widget later.

## Next Step

Build one MCP endpoint with a fixture-backed `find_family_experiences` tool and one optional Seoul source adapter.
