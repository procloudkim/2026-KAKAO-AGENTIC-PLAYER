# Wave 1 Explore: Judging Criteria and Product Strategy

## Worker
- Agent: `019f1d3c-3ea9-77a0-9e8a-dc6e8621d5bb`
- Axis: judging criteria, public voting, user exposure, target surface, idea-fit rubric

## Key Findings
- The page positions the contest around a service publicly exposed to a large KakaoTalk/Kakao Tools audience.
- Official evaluation facts:
  - Finalists get Kakao Tools exposure and a further development stage.
  - Finals combine Kakao Tools user voting and judge review.
  - Prelim is internal review.
  - Judging criteria: creativity, convenience, stability.
  - Stability explicitly includes stable operation, accurate data, and no security issue.
- Worker converted the page criteria into a practical 0-5 rubric for:
  - Creativity
  - Convenience
  - Stability
  - Public-vote appeal
  - Kakao Tools fit
  - Data/security rights

## Cited Local Evidence
- `HTML.txt:64-66`: public audience framing.
- `HTML.txt:99-101`: Kakao Tools user exposure.
- `HTML.txt:163-183`: finalist development, public vote, final judging/ceremony.
- `HTML.txt:172-174`: Kakao Tools user vote.
- `HTML.txt:234-244`: public visibility gate.
- `HTML.txt:247-257`: final Player submit button and one-shot submission.
- `HTML.txt:314-320`: internal prelim, finals by internal review plus user voting, and three judging criteria.
- `HTML.txt:337`: review timing risk.

## Practical Rubric
- Creativity, 0-5: new approach, problem fit, differentiation, ripple effect.
- Convenience, 0-5: real daily task solved fast with low friction and UI/UX clarity.
- Stability, 0-5: deterministic, accurate, error-handled, secure-by-default.
- Public-vote appeal, 0-5: understandable and valuable in a quick Kakao Tools demo.
- Kakao Tools fit, 0-5: benefits from Widget/additional spec and public exposure.
- Data/security rights, 0-5: clean data posture and safe defaults.

## Inference Boundary
- The rubric is not official weighting; it is a decision aid derived from official criteria plus the final-round voting surface.
- Public-vote appeal is strategic, not an explicit named judging item, but follows from final user voting.

## EXPAND Verbatim
- LEAD: official guide redirect `https://kko.to/player10` not yet locally captured — WHY: likely contains implementation and submission details beyond the page dump — ANGLE: inspect the redirected official guide text and harvest rule-specific lines
- LEAD: PlayMCP public site `https://playmcp.kakao.com/` not yet locally captured — WHY: may clarify how public exposure and Kakao Tools surfacing work in practice — ANGLE: extract developer-console and visibility constraints
- LEAD: prior winner interview `https://tech.kakao.com/posts/818` not yet locally captured — WHY: may reveal successful idea patterns and judging expectations — ANGLE: look for concrete winning traits, demo style, and value framing

## Lead Disposition
- Official guide: pending; Notion fetch accessible only as JS app shell so far.
- PlayMCP root: fetched; metadata confirms PlayMCP/MCP/AI-agent positioning and `/llms.txt` pointer.
- Prior winner interview: external worker reported JS-gated, but direct local fetch exposed embedded Nuxt article data; use direct fetch as stronger evidence and note conflict.

