# Ultraresearch Synthesis: Kakao AGENTIC PLAYER 10 Participation Strategy

Workers: 6 · Waves: 2 · Sources: 5 source groups · Verifications: live HTTP/header/body checks plus local line-cited extraction

## Executive Summary

The local repository contains one substantive source: `HTML.txt`, an official-page dump for Kakao `AGENTIC PLAYER 10`; `Agentic-Play.txt` is empty. The page defines a PlayMCP-first contest: create a Kakao Cloud MCP endpoint, register it in PlayMCP, pass review, switch visibility to public, then submit once through the Player preliminary application CTA. The practical deadline is earlier than the visible `2026-07-14` application close because PlayMCP review can take up to 7 business days and the page warns that review requests after `2026-07-07` may not complete in time. [Source 1]

For idea strategy, the contest is not asking for a generic chatbot. The winning shape is an MCP service with a clear tool boundary, real daily usefulness, stable/accurate/security-safe behavior, and a plausible upgrade path into Kakao Tools. The official judging criteria are creativity, convenience, and stability; finals combine internal review with Kakao Tools user voting. [Source 1] Prior official Kakao Tech material reinforces the same pattern: past highlighted services solved concrete everyday or professional pain points with specific data/tools, such as childcare admin, startup support discovery, parcel smishing checks, child safety, legal research, game guidance, and culture recommendations. [Source 3]

## Problem Definition

- Goal: Help the user enter the hackathon by turning their existing idea into a reviewable PlayMCP/Kakao Tools candidate.
- Context: Current date is `2026-07-01`; official application window is `2026-06-15` to `2026-07-14`.
- Constraints: one-shot final submission, public visibility required after review, up to 7 business days review, 2 contest MCP servers per person, rights/data/security obligations.
- Success criteria: submit a stable public PlayMCP server that scores well on creativity, convenience, stability, public-vote appeal, Kakao Tools fit, and clean data/security posture.
- Done-when for next build phase: endpoint works, tool calls are deterministic on demo cases, risk checklist is clean, PlayMCP temporary test passes, review request is submitted early enough.

## Evidence Brief

### Verified Facts

- Prize/support: up to 10,000,000 KRW, grand prize minister award, and Kakao Tools user exposure are listed in the support section. [Source 1]
- Awards: grand prize 10,000,000 KRW for 1 person/team; gold 5,000,000 KRW for 2; silver 1,000,000 KRW for 7. [Source 1]
- Schedule:
  - Prelim application: `2026-06-15` to `2026-07-14`; result `2026-07-30`; 20 finalists.
  - Finalist development: `2026-07-30` to `2026-08-27`.
  - Public vote: `2026-08-31` to `2026-09-28`.
  - Final ceremony: `2026-10-23`, Kakao AI Campus. [Source 1]
- Submission flow:
  - Create MCP server endpoint on Kakao Cloud.
  - Register endpoint in PlayMCP developer console.
  - Use temporary registration for testing, not review.
  - Request review only for final candidate.
  - After approval, switch from `나에게만 공개` to `전체 공개`.
  - Submit once through `[Player 예선 참여]`. [Source 1]
- Review timing: PlayMCP review may take up to 7 business days; requests through `2026-07-07` are planned for completion by `2026-07-10`, and later requests may miss the application deadline. [Source 1]
- Judging: prelim is internal Kakao review; finals combine internal review and Kakao Tools user voting. Criteria are creativity, convenience, and stability. Stability includes stable operation, accurate data, and no security issue. [Source 1]
- Kakao Tools: finalist development is required; Kakao Tools requires stricter MCP specs than PlayMCP and can use Widget specs for improved responses. [Source 1]
- PlayMCP platform: official `llms.txt` says developers register MCP servers for PlayMCP exposure, approved servers are exposed publicly, toolbox can hold up to 10 servers, AI Chat can test tool behavior, and developer console handles registration/modification/review status. [Source 2]
- Prior official Kakao Tech post 818 says the earlier MCP Player 10 had about 150 teams, selected top 10 after internal review, and highlighted concrete domain tools rather than generic assistants. [Source 3]

### Inferences

- Your idea should be packaged as a narrow tool workflow, not a broad assistant, because MCP exposure, tool lists, starter messages, public voting, and stability/security criteria all reward a crisp user task.
- The MVP should include one killer use case plus defensive behavior before adding more tools.
- A finalist-ready concept should have a Widget/Kakao Tools story even if the prelim build starts as plain PlayMCP.
- Public-vote appeal matters strategically because finals include Kakao Tools user voting, although official weights are not published.

### Unknowns

- Exact official guide body behind `https://kko.to/player10`: resolved to Notion, but body was not extractable through basic fetch.
- Exact current review-policy body behind `https://kko.kakao.com/playmcp_review`: resolved to Notion, but body was not extractable through basic fetch.
- User's actual idea, data sources, target user, and preferred stack are not yet known.

### Risks

- Deadline risk: submitting review after `2026-07-07` can miss the contest window.
- Eligibility risk: review approval is insufficient if visibility remains private.
- Legal risk: data/service must not infringe third-party rights; false information cancels registration/winning.
- Security risk: the official stability criterion includes security issues.
- Product risk: a technically interesting but daily-life-low-value idea will underperform the stated convenience criterion.

## Method Selection

### Candidate Methods

1. Build a generic MCP server scaffold immediately.
2. Extract local rules only and wait for user idea details.
3. Combine local official extraction, live official-source checks, and prior-winner pattern analysis, then produce a constrained build rubric.
4. Broad web/OSS research for every MCP implementation pattern before idea selection.

### Chosen Method

Method 3. It gives enough verified contest truth to shape the build while avoiding premature implementation before the user's idea is specified.

### Fallback Method

If official guide/policy bodies remain inaccessible, proceed from `HTML.txt` plus PlayMCP `llms.txt`, and treat Notion-only details as unresolved until the user can access/share the guide text.

### Rejected Alternatives

- Method 1: premature; could build the wrong service.
- Method 2: misses current platform context and prior-winner signals.
- Method 4: too broad before knowing the user's idea and data domain.

## Execution Plan

- Baseline: one PlayMCP-ready MCP server with 1-3 tools, one target user, one high-value workflow, deterministic demo cases, and logging/error handling.
- Controllable variables: tool count, data scope, whether to use external APIs, response format, privacy posture, fallback messages, Widget-readiness.
- Fixed variables: deadline, review duration, public visibility, one-shot submission, judging criteria, rights/data/security obligations.
- Budget ladder:
  1. `0.5 day`: idea scoring and risk screen.
  2. `1 day`: MCP skeleton plus one core tool and smoke tests.
  3. `2-3 days`: reliable MVP with 3 demo flows, error handling, data provenance, and PlayMCP temporary registration test.
  4. Before `2026-07-07`: final review request if the build is ready.
- Promotion rule: move to next stage only when the current stage has a working endpoint, deterministic demo output, and clean risk checklist.
- Kill rule: drop any feature that cannot prove creative, convenient, and stable value in one KakaoTalk-style interaction.
- Stop rule: stop adding features when the core workflow is reviewable; breadth loses to stability under the official criteria.
- Final evaluation rule: score the idea and MVP against creativity, convenience, stability, public-vote appeal, Kakao Tools fit, and data/security rights.
- Wall-clock estimate: simple data/API idea `1-2 days`; differentiated, reliable public MVP `2-4 days`.
- RAM estimate: low unless local model inference is used; prefer API/server-side lightweight tooling.
- CPU/GPU/NPU split: CPU/API-first; avoid GPU/NPU dependencies unless they are central to the idea.
- Reboot-required resources: none identified.

## Idea Scoring Rubric

Score each 0-5. A strong candidate should be 20+ out of 30 and have no 0-1 score on stability or rights/security.

| Axis | What 5 Means |
|---|---|
| Creativity | New angle, clear problem fit, memorable differentiation, plausible ripple effect |
| Convenience | Solves a real daily task quickly with low friction |
| Stability | Accurate data, deterministic behavior, good errors, secure defaults |
| Public-vote appeal | Value is obvious in a quick Kakao Tools demo |
| Kakao Tools fit | Benefits from Widget/additional spec and public exposure |
| Data/security rights | Clean data rights, minimal sensitive data, safe defaults |

## Recommended Build Shape

Use a narrow vertical slice:

1. One target user and one repeated pain point.
2. One high-signal starter message.
3. 1-3 MCP tools with clear names and input schemas.
4. A deterministic demo dataset or API source with clean rights.
5. Three golden demo prompts:
   - happy path
   - missing/ambiguous input
   - data/API failure
6. Output that is useful in chat first, then Widget-ready if selected.
7. Logging/redaction/error policy before public submission.

Avoid:

- Generic "AI assistant for everything".
- Unclear or scraped data rights.
- Features that require user education before value is visible.
- Heavy local ML dependencies that complicate deployment.
- Any workflow where incorrect data could harm users without guardrails.

## Sources

- Source 1: `HTML.txt`, local official-page dump.
  - title/meta: `HTML.txt:8-14`
  - support/prize: `HTML.txt:99-126`
  - schedule: `HTML.txt:154-183`
  - submission flow: `HTML.txt:196-258`
  - judging/review FAQ: `HTML.txt:291-339`
  - legal notices and CTA: `HTML.txt:395-411`
- Source 2: `https://playmcp.kakao.com/llms.txt`, fetched 2026-07-01.
- Source 3: `https://tech.kakao.com/posts/818`, fetched 2026-07-01; direct fetch exposed embedded Nuxt article data.
- Source 4: live HTTP checks, 2026-07-01:
  - `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10`: HTTP 200
  - `https://playmcp.kakao.com/`: HTTP 200
  - `https://kko.to/player10`: resolves to Notion shell
  - `https://kko.to/x2bmeS6t1w`: reachable/login-gated
- Source 5: `claim-ledger.md` in this session directory.

## Contradictions

- One external worker reported Kakao Tech post 818 body as JS-gated. Direct orchestrator fetch exposed embedded Nuxt article data. Resolution: use direct embedded-data fetch for article content, retain JS-gated note as access caveat.
- Official guide/review policy short links are referenced by official sources but fetch as Notion shells. Resolution: assert only the redirect and unresolved body, not the hidden guide contents.

## Gaps

- Need user idea details before implementation plan can be precise.
- Need actual Kakao/PlayMCP authenticated developer-console access to verify registration UI behavior.
- Need official guide/review-policy body if it contains stricter requirements not visible in `HTML.txt`.

## Next Smallest Safe Move

Fill the idea intake below. Then Codex should score it against the rubric, choose the smallest reviewable MCP scope, and produce a 48-hour build plan with endpoint/tools/data/security/test checklist.

```text
1. Idea one-liner:
2. Target user:
3. Repeated pain point:
4. One KakaoTalk-style winning interaction:
5. Data/API sources and rights:
6. 1-3 MCP tools you imagine:
7. What must never go wrong:
8. Existing code/assets/accounts:
9. Preferred stack, if any:
10. Can this be public to all users? yes/no + reason:
```

