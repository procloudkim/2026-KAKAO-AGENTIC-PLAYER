# ULW-Research Synthesis: Winning Beyond Submission For Family Experience MCP

Date: 2026-07-03

## Executive Summary

The existing checklist gets the project to "can be submitted." Winning requires proving that the MCP is materially better than generic search for a parent in KakaoTalk. The official contest criteria are creativity, convenience, and stability; the finals also add Kakao Tools exposure, user voting, widget/additional-development expectations, and stricter MCP standards.

The project should therefore add five winning layers beyond deployment/submission:

1. Live data value and coverage proof.
2. Search-quality evaluation harness.
3. Parent action-card UX polish.
4. Operations/security/reliability proof.
5. Demo, public-vote, and finalist package.

## P0: Must Finish Before Serious Submission

1. Live data proof, not only fixture proof.
   - Run actual Seoul Open Data live smoke in deployed environment.
   - Prove one happy prompt, one no-result, one upstream failure, one missing/invalid input.
   - Store redacted evidence only.

2. 20-prompt evaluation harness.
   - Prompt groups: weekend, rainy day, infant/toddler/preschool/school-age, budget, nearby, no-result, ambiguous, adversarial.
   - Metrics: source shown, freshness/confidence shown, age-fit basis shown, parent next action shown, no unsupported claims, response latency.

3. Production answer contract.
   - Every card: title, date/time, place/address, age-fit reason, source/retrieved date, confidence, parent check, next action.
   - When data is weak: answer should still help by saying what to verify, not pretending certainty.

4. Reliability envelope.
   - Health endpoint, deployed MCP smoke, uptime/restart check, timeout behavior, rate-limit/upstream-failure behavior.
   - Evidence: `curl -i /health`, `POST /mcp`, tool call transcript, cleanup/rollback notes.

5. Source rights and claim ledger.
   - List every upstream source, license/terms, allowed claims, forbidden claims, and freshness expectation.
   - This is important because official contest terms warn against third-party rights infringement and false information.

## P1: Strong Differentiators For Winning

1. "Chat bad input to good result" parser.
   - Handle loose Korean prompts: "오늘 비오는데 4살이랑 갈 곳", "이번 주말 실내", "초등 저학년 무료".
   - Return either a good Top 3 or one concise clarification question.

2. Parent-fit ranking beyond date/location.
   - Ranking should include child age, indoor/outdoor, travel friction if available, fee, reservation/contact existence, and confidence.
   - Do not call it a safety score; call it "parent practicality" or "fit reason."

3. Kakao ecosystem action hooks.
   - Not required for first submission, but winning demo should show future-ready hooks:
     - map/detail link,
     - calendar/date reminder copy,
     - shareable parent checklist,
     - reservation/source link when source provides it.

4. Kakao Tools card/widget readiness.
   - Keep an internal structured card model even if PlayMCP response is text.
   - Add fields that can map cleanly to widget UI later: title, image placeholder, map link, date, CTA, caution.

5. Human-centered demo narrative.
   - Show before/after:
     - before: parent searches multiple pages and cannot tell age fit/freshness;
     - after: one chat prompt returns 3 cards with source and action.

## P2: Finalist / Public Vote Work

1. Representative image and visual identity.
   - Rights-cleared image.
   - Short name, memorable icon/thumbnail, parent-friendly tone.

2. Public vote landing/demo pack.
   - 30-second script.
   - 3 demo prompts.
   - 3 screenshots or screen recordings.
   - One-line value: "아이 나이, 날짜, 지역을 말하면 출처 있는 체험 후보 3개."

3. Monitoring dashboard or proof bundle.
   - Daily smoke result.
   - Error log categories without secrets.
   - Upstream source status.
   - Last successful refresh time.

4. Source expansion after stability.
   - Add nationwide source only after source registry and evaluation harness support it.
   - Candidate next lanes: national performance/event standard data, TourAPI, local institution datasets.
   - Do not add unofficial scraping unless rights and stability are proven.

5. Finalist Kakao Tools readiness.
   - Expect stricter MCP validation and widget work after preliminary pass.
   - Prepare a separate workstream for widget schema, richer cards, and user-vote UX.

## What Not To Do

- Do not rush nationwide claims without official coverage/freshness evidence.
- Do not add many tools before the one core tool is excellent.
- Do not call recommendations "safe" or "guaranteed suitable" for children.
- Do not expose `.env`, keyed URLs, cookies, or raw upstream logs in any evidence.
- Do not submit before private PlayMCP smoke passes.
- Do not build a marketing page instead of a working KakaoTalk-style result.

## Priority Order

1. Deploy and live-smoke the current one-tool MCP.
2. Add the 20-prompt evaluation harness and pass it.
3. Polish response cards for parent actionability.
4. Create rights-cleared image and demo script.
5. Register temporary/private PlayMCP and run private smoke.
6. Request final review, switch public, submit.
7. Immediately start Kakao Tools/widget-readiness branch for finals.

## Evidence

- Official contest page: flow, public visibility, judging criteria, Kakao Tools, review time.
- Kakao press release: PlayMCP-based Kakao Tools contest, 20 finalist public exposure and voting.
- KakaoCloud tutorial: remote MCP should use HTTP/SSE-style transport; stdio is local-only.
- Repo QA report: local verification passes but live freshness, deployed proof, PlayMCP review, public switch, image upload, and submission are still absent.
- Repo decisions: fixture-first and no unsupported public claims.
- Repo data pipeline architecture: source registry, confidence, freshness, redaction, and action-card rules.

