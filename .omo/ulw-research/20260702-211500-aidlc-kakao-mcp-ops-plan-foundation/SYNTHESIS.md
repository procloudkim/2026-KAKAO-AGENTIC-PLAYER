# Synthesis - AIDLC x Kakao MCP Inception-Build-Operations

## Bottom Line
The winning plan should not be "make a funny MCP". It should be a small, reliable MCP that converts messy KakaoTalk-style requests into a sourced action package: top choices, why they fit, freshness, what to verify, and the next action.

Use AIDLC as a control system: evidence first, explicit gates, unit-sized construction, and operations readiness. Do not copy its AWS/IDE mechanics into this repo.

## Chosen Direction
- Primary product: `family-experience-mcp`, following the existing `PLANS.md` direction.
- Primary edge: parent-friendly event discovery from vague child age/date/location conditions, with source/freshness/confidence packaging.
- Build stance: one public MCP tool first, then live-source proof, then hosted PlayMCP operations.
- Release stance: temporary PlayMCP registration is not enough; public review, Kakao Tools readiness, and operational evidence are separate gates.

## Inception Requirements
- Define the one-sentence chat promise: "아이 나이, 날짜, 지역을 대충 말해도 오늘 실행 가능한 체험 후보 3개를 근거와 함께 정리한다."
- Lock personas: parent, gift-giver, caregiver/grandparent. Keep parent safety and decision fatigue as the core problem.
- Record source authority map before adding data: official/open-data first, enrichment second, fixture only for deterministic demo.
- Record forbidden claims: no unsupported "nationwide", "real-time", "reservation guaranteed", "age-safe", or "official recommendation".
- Produce Kakao submission facts: service name, identifier, endpoint, short description, starter prompts, representative image, review/publication checklist.
- Define golden prompts as messy user language, not API-shaped requests.

## Build Requirements
- Preserve the current app pattern: one service, one public tool, strict schema, safe failure responses.
- Keep the source pipeline explicit: adapter -> raw snapshot -> normalized candidate -> ranking -> top-3 render.
- Require source metadata on every recommendation: source id, confidence label, retrieved date, raw snapshot id or equivalent trace.
- Add live-source proof before public claims: real API key smoke, redacted sample payload, empty/error case, freshness behavior.
- Keep scans in the gate: tests, MCP smoke, golden smoke, secret scan, claim scan, source scan.
- Do not expand to three products in parallel until the first product has live-data and hosted endpoint proof.

## Operations Requirements
- Host a real HTTPS MCP endpoint, expected path `/mcp`, compatible with current MCP Streamable HTTP requirements and PlayMCP registration expectations.
- Keep a `/health` or equivalent readiness endpoint outside the MCP protocol path.
- Define cache TTL, stale behavior, retry policy, source outage response, and no-result response.
- Log only redacted operational facts: request class, source id, result count, latency, failure class. Do not log secrets, child-identifying details, or raw user-sensitive text unnecessarily.
- Prepare runbook: deploy, smoke, rollback, key rotation, source outage, review resubmission, public switch.
- Treat Kakao timeline as an operations constraint: review can take up to seven business days; early review is safer than late polish.
- Keep Kakao Tools widget/additional standard requirements as finalist-stage backlog until exact specs are obtained.

## Method Selection
- Candidate A: Directly port AIDLC structure. Rejected because it would overfit to AWS/IDE workflow mechanics.
- Candidate B: Kakao checklist only. Rejected because it misses source governance, evaluation, and build quality.
- Candidate C: Build-first hackathon sprint. Rejected because it risks a demo that cannot survive review/public use.
- Chosen: Repo-native ULW/AIDLC hybrid. Use this repo's existing `family-experience-mcp` architecture, add AIDLC-style gates, and bind operations to Kakao PlayMCP process.
- Fallback: If live family-experience data cannot be proven quickly, switch to holiday pharmacy only after documenting why its official data/operations path is lower risk.

## Evidence Level
- High: AIDLC phase/control ideas, Kakao contest dates/process, current MCP stable spec, local family-experience architecture, local QA status.
- Medium: exact PlayMCP console field behavior, because dynamic/login surfaces may differ from captured text.
- Low/unresolved: Kakao Tools widget details and stricter finalist-stage MCP requirements until official guide/policy pages are inspected.

## Residual Risks
- The current app is fixture/demo proven, not live-source/public-release proven.
- Kakao review policy and Notion guide may add rejection criteria.
- A remote endpoint may expose auth/origin/logging concerns that local no-auth testing does not cover.
- Live event data may not contain clean age metadata; inferred age fit must remain clearly labeled.
- Public usefulness depends on freshness and geographic coverage, not only tool correctness.

## Next Smallest Safe Move
After approval, create the execution plan under `.omo/plans/` for the family-experience MCP:
1. live Seoul adapter proof,
2. hosted endpoint proof,
3. PlayMCP temporary registration,
4. review/public readiness package,
5. Kakao Tools finalist backlog.
