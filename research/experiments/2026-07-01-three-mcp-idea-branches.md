# Experiment Plan: Three MCP Concept Branches

Date: 2026-07-01 KST

## Shared Architecture

```text
MCP tool request
-> source adapter
-> source snapshot with retrieved_at and source_url
-> normalized candidate record
-> confidence/provenance policy
-> short answer card for chat
```

Shared tool policy:

- No secrets in logs.
- No raw keyed URLs in responses.
- Every result includes source freshness or "needs confirmation."
- Missing/ambiguous input returns a clarifying question, not a fake answer.
- Broad crawlers are excluded from the first MVP unless terms are verified.

## Branch 1: `concept/pharmacy-now-mcp`

### User Job

"지금 근처에서 갈 가능성이 높은 약국 3곳과 전화/길찾기를 바로 줘."

### Winning Interaction

```text
User: 지금 강남역 근처에서 갈 수 있는 휴일약국 3개만 알려줘.
MCP: 후보 3개 + 상태 라벨 + 전화 우선 + 길찾기 + 방문 전 확인 문구.
```

### Data Pipeline

- Primary: NMC `국립중앙의료원_전국 약국 정보 조회 서비스`.
- Optional enrichment: Kakao place/navigation metadata, never availability status.
- Cross-check later: HIRA phone/address/closure consistency only.
- Local cache/ETL: reuse existing pharmacy repo pattern, but keep batch data non-authoritative.

### MCP Tools

1. `find_nearby_pharmacy_candidates(location, day_time, radius_or_region)`
2. `explain_pharmacy_availability(pharmacy_id_or_name)`
3. `prepare_pharmacy_call_and_navigation(pharmacy_id_or_name)`

### Kill Rule

Kill this first if it cannot avoid open-status overclaiming or if live provider keys are unavailable before the PlayMCP review target.

### 48-Hour MVP

- Wrap existing search route or service behind one MCP endpoint.
- Hard-code one safe demo region if live keys are missing.
- Return Top 3 with conservative status and phone-first action.
- Smoke test happy path, missing location, provider failure.

## Branch 2: `concept/parent-trust-mcp`

### User Job

"이 육아용품을 지금 계속 써도 되는지, 어떤 근거를 확인해야 하는지 바로 정리해줘."

### Winning Interaction

```text
User: 이 젖병/공갈젖꼭지/아기침대 제품, 안전 이슈가 걱정돼. 지금 뭘 확인해야 해?
MCP: 제품 식별 체크 + 공식 source lanes + unknowns + do-now/check-next/escalate-if action card.
```

### Data Pipeline

- Primary Korean lanes: SafetyKorea/KATS/KC, KIPS, MFDS recall/open-data lanes where category applies.
- Primary global lanes later: CPSC, FDA/NIEHS, official manufacturer notices, standards.
- Store source lane, proof boundary, time validity, batch applicability, and jurisdiction fit.
- Do not produce a numeric safety score.

### MCP Tools

1. `intake_baby_product_identity(product_text_or_fields)`
2. `lookup_product_safety_lanes(product_identity, jurisdiction)`
3. `build_parent_action_card(evidence_bundle)`

### Kill Rule

Kill this first if official lookup cannot match exact model/batch/jurisdiction or if output drifts into medical/safety certainty.

### 48-Hour MVP

- Convert existing Trust Ledger template into MCP response schema.
- Implement static/demo official-lane lookup for one product category.
- Return action card with explicit unknowns and source gaps.
- Smoke test real brand public-source case note, unknown model, conflicting claim.

## Branch 3: `concept/family-experience-mcp`

### User Job

"이번 주말, 내 아이 나이와 위치에 맞는 체험행사 3개만 골라줘."

### Winning Interaction

```text
User: 이번 토요일 서울에서 4살 아이랑 갈 만한 실내 체험 3개만 골라줘.
MCP: 후보 3개 + 나이 적합 이유 + 실내/실외 + 비용 + 예약/문의 링크 + 부모 체크사항.
```

### Data Pipeline

- Primary national source: KTO TourAPI Korean tourism service for event/tourism/location/image info.
- Seoul fast lane: Seoul cultural events Open API because it includes target audience, fee, event time, coordinates, and daily update.
- National baseline: National cultural festival standard data.
- Education/experience enrichment:
  - Culture arts education resource/program API.
  - Forest education program API.
  - Science museum and local institution datasets where fields include target, fee, date, and homepage.
- Future global city lane: separate source registry per city; do not mix scraped pages until terms are verified.

### MCP Tools

1. `find_family_experiences(location, child_age, date_range, indoor_outdoor, budget)`
2. `score_child_fit(event_candidates, child_age, constraints)`
3. `build_family_day_plan(selected_event, travel_context)`

### Kill Rule

Kill or narrow this first if event records cannot provide at least date, location, age/target or program clue, contact/homepage, and source freshness.

### 48-Hour MVP

- Implement one-region MVP: Seoul + national fallback.
- Return Top 3 events with age-fit explanation and source confidence.
- Include filters: child age band, date range, indoor/outdoor, free/paid.
- Smoke test happy path, no age provided, no results, stale/missing field.

## Promotion Rule

Promote a branch only if all are true:

- One MCP tool works against real or deterministic demo data.
- Response is under 8 bullets and action-ready.
- Source/provenance appears in the response.
- Missing data produces a safe fallback.
- Demo can be explained in one KakaoTalk-style prompt.

## Stop Rule

Stop feature expansion when one branch can pass PlayMCP temporary registration with one core tool and three golden prompts.

