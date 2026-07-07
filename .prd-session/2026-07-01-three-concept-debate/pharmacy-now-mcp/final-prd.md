# Refined Proposal - pharmacy-now-mcp

## Decision

Strong fallback candidate.

## Product Promise

휴일/야간에 가까운 약국 후보 3개를 전화 우선으로 보여주고, 출처 기반 상태와 방문 전 확인 문구를 함께 제공한다.

## First MCP Tool

`find_nearby_pharmacy_candidates(location, day_time?, radius_or_region?)`

## MVP Scope

- NMC-first candidate search.
- Kakao enrichment only for destination quality.
- Phone-first Top 3 response.
- Conservative status policy.

## Output Contract

For each candidate:

- pharmacy name
- conservative status label
- phone
- address
- distance or region
- navigation link if safe
- source/freshness
- call-before-visit warning

## Dissent

Even conservative cards can be read as live-open claims. The UI/text must consistently say candidate and phone confirmation.

## Assumptions

- NMC remains the primary source for pharmacy candidate data.
- Existing Holiday Pharmacy logic can be reused or copied only through a clean branch/path.
- Users will accept conservative candidate wording if phone action is immediate.

## Open Questions

- data.go.kr key availability.
- whether to reuse existing service code or build a minimal wrapper.
- PlayMCP hosting constraints for provider secrets.

## Next Step

Do not edit the dirty pharmacy workspace yet. Create a clean implementation branch or copy a minimal search adapter after the primary family branch is tested.
