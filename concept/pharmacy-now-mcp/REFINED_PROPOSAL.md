# Refined Proposal

## Product Promise

휴일/야간에 가까운 약국 후보 3개를 전화 우선으로 보여주고, 출처 기반 상태와 방문 전 확인 문구를 함께 제공한다.

## First Tool

`find_nearby_pharmacy_candidates(location, day_time?, radius_or_region?)`

## First Build Scope

- NMC-first candidate search.
- Kakao enrichment only for destination quality.
- Phone-first Top 3 response.
- Conservative status policy.

## Response Card

Each candidate must include:

- pharmacy name
- conservative status label
- phone
- address
- distance or region
- navigation link if safe
- source/freshness
- call-before-visit warning

## Assumptions

- NMC remains the primary source.
- Existing Holiday Pharmacy logic is reusable only through a clean implementation path.
- Conservative candidate wording is acceptable if phone action is immediate.

## Open Questions

- data.go.kr key availability.
- whether to reuse existing service code or build a minimal wrapper.
- PlayMCP hosting constraints for provider secrets.
