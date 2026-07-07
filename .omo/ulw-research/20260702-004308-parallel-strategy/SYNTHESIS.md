# Strategy Synthesis: Three MCP Ideas vs Focused Submission

Date: 2026-07-02 KST

## Direct Answer

Yes: building all three to real submission quality in parallel is likely disadvantageous.

No: researching all three and keeping two fallback prototypes is not disadvantageous. That is the right shape.

The practical strategy is:

1. Keep the three folders as concept/research lanes.
2. Spend only enough time to validate each tool contract and overlap risk.
3. Pick one primary MCP for PlayMCP temporary registration and review.
4. Keep one fallback ready if the primary hits API/key/review risk.

## Best Current Ranking

1. `concept/family-experience-mcp` as primary.
2. `concept/pharmacy-now-mcp` as fallback.
3. `concept/parent-trust-mcp` as later/differentiated branch unless the user strongly wants the safety story.

## Why

### Family Experience

Best first build under the user's thesis: "개떡같이 채팅해도 찰떡같이 결과."

It has the clearest chat promise:

```text
이번 토요일 서울에서 4살 아이랑 갈 만한 실내 체험 3개만 골라줘.
```

The current public list has a strong performance-event MCP (`ArtBridge`), but searches for `체험`, `가족`, `어린이`, `행사`, `박물관`, and `체험학습` found no direct family/child-age outing recommender. That leaves a defensible wedge: child age, parent constraints, weather/indoor, travel burden, booking/contact, and "Top 3 only."

### Holiday Pharmacy

Most mature engineering substrate, but weaker public differentiation today.

The PlayMCP public list already has `병원 · 약국 정보 조회`, including pharmacy region/detail tools and holiday/emergency lookup. A new pharmacy MCP would need a sharper wedge, such as "phone-first, uncertainty-aware, immediately nearby holiday pharmacy candidates with conservative source freshness." That is useful, but not as fresh as the family-experience gap.

### Parent Trust

Potentially most differentiated, but highest claim-risk.

Searches for baby/product-safety terms found no obvious direct competitor, but this branch can fail if it sounds like a safety verdict. It must remain an evidence assistant: identify product/model, check official certification/recall lanes, show evidence completeness, and say what a parent should verify next. It should not score products as safe/dangerous.

## Recommended 48-72 Hour Operating Model

### Day 0-1

- Do not create three real git branches yet.
- Implement or scaffold only `family-experience-mcp`.
- One public tool only: `find_family_experiences`.
- Data: deterministic demo data plus one official/open-data adapter if key access is ready.
- Output: Top 3, why fit, source/freshness, parent check, next action.

### Day 1-2

- Run three golden prompts.
- Prepare PlayMCP temporary registration.
- Validate endpoint returns tool metadata and handles data/API failure.
- If API/key/data quality blocks by the cutoff, switch to `pharmacy-now-mcp`.

### Day 2-3

- Polish one submission narrative.
- Keep pharmacy and parent-trust as documented expansion/fallback tracks, not equal implementation tracks.

## Kill/Promotion Rules

- Promote family-experience if one core tool returns useful Top 3 cards for the three golden prompts with source/freshness and safe failure behavior.
- Switch to pharmacy if event data lacks date, place, child-age/program clue, contact/homepage, or freshness.
- Do not switch to parent-trust first unless official lookup can match product/model and the output stays away from safety verdicts.
- Stop feature expansion once one MCP can pass temporary PlayMCP registration with one core tool.

## Evidence Level

Medium-high.

Strengths:

- Local repo already has concept plans, score matrix, and method selection.
- Official PlayMCP instructions and public API were checked during this session.
- Public overlap checks were run for the user's three idea areas.

Limits:

- The PlayMCP public API search is keyword-based, so semantic competitors may exist under different names.
- The final winning factor depends on review and user vote behavior, not only current marketplace gap.
