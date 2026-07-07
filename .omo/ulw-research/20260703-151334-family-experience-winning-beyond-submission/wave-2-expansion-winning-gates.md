# Wave 2: Expansion Into Winning Gates

## Lead: Official Judging Criteria As Gates

Gate mapping:

- Creativity: the service must solve a repeated parent decision problem better than generic search by converting vague chat into ranked, source-backed action cards.
- Convenience: one KakaoTalk-style prompt should produce usable top 3 choices with age/date/location constraints, warnings, and next action.
- Stability: deployed endpoint, accurate data labels, no secret leakage, no unsupported claims, reproducible smoke tests, and safe failures.

## Lead: Search-Quality Improvement Harness

The project needs a small evaluation set:

- 20 realistic parent prompts.
- 5 ambiguity prompts: "오늘 뭐하지", "비 와", "5살인데 너무 멀지 않게".
- 5 no-result prompts.
- 5 adversarial prompts asking for unsupported live/reservation/safety certainty.
- 5 regional/freshness prompts.

For each prompt, measure:

- valid top 3 or correct no-result,
- source shown,
- freshness/confidence shown,
- age-fit basis shown,
- parent next action shown,
- no unsupported claims,
- response under target latency.

## Lead: Kakao Tools / Widget Readiness

Even before the widget spec is available, the response should be internally modeled as cards:

- title,
- date/time,
- place/address,
- age-fit,
- source/freshness,
- caution,
- next action,
- optional map/reservation/detail link.

This keeps PlayMCP text usable now and reduces finals rewrite risk.

## Lead: Public Vote / Demo Package

Winning requires a story voters understand within seconds:

- Pain: parents ask "오늘/이번 주말 아이랑 어디 가지?" and search results are noisy.
- Solution: age/date/location-aware top 3 with source and parent checks.
- Trust: no fake certainty; every result says what is known, inferred, or unknown.
- Action: click/source/phone/reservation/map next step.

## EXPAND

- LEAD: Prioritize implementation work into P0/P1/P2.
- LEAD: Separate contest submission package from finalist Kakao Tools package.
- LEAD: Add operations/monitoring and incident proof requirements.

