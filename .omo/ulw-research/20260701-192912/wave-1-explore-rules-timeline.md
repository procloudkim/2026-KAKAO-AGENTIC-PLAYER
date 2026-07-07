# Wave 1 Explore: Rules, Timeline, Rewards, Submission Gates

## Worker
- Agent: `019f1d3c-2fbd-7e12-982f-f9da879d1cb6`
- Axis: official local rules, schedule, rewards, and submission gates

## Key Findings
- Workspace is not a git repository, so no history exists to cross-check.
- `HTML.txt` is the captured source of truth for AGENTIC PLAYER 10.
- Official schedule:
  - Prelim application: 6/15-7/14; result: 7/30; 20 finalists.
  - Finalist development: 7/30-8/27.
  - Public vote: 8/31-9/28.
  - Offline final award: 10/23 at Kakao AI Campus.
- Rewards:
  - Grand prize: minister award plus 10,000,000 KRW for 1 person/team.
  - Gold: 5,000,000 KRW for 2 people/teams.
  - Silver: 1,000,000 KRW for 7 people/teams.
- Submission hard gates:
  - Create Kakao Cloud MCP endpoint.
  - Register endpoint in PlayMCP.
  - Use temporary registration only for testing.
  - Request review only when final.
  - Switch visibility to public after review.
  - Submit once via Player prelim button.
- Review timing: up to 7 business days; page warns later requests may miss the contest window.

## Cited Local Evidence
- `HTML.txt:99-105`: support/prize headline and Kakao Tools exposure.
- `HTML.txt:107-139`: award table and prior-winner interview link.
- `HTML.txt:154-157`: prelim schedule and 20 finalists.
- `HTML.txt:163-166`: finalist development window.
- `HTML.txt:172-175`: public vote.
- `HTML.txt:181-183`: final ceremony.
- `HTML.txt:204-209`: guide, server limit, contest-only cloud use.
- `HTML.txt:218-229`: PlayMCP registration and review request state.
- `HTML.txt:234-244`: visibility gate.
- `HTML.txt:249-258`: one-shot final submission and KakaoTalk channel result notice.
- `HTML.txt:330-337`: review SLA and 7/7 cutoff warning.
- `HTML.txt:407-411`: PlayMCP and Player submission CTAs.

## Implications
- Practical submission deadline is earlier than 7/14 because review can block eligibility.
- Passing PlayMCP review is not enough; public visibility and one-shot application are separate gates.
- Build plan must reserve time for finals-stage Kakao Tools work if selected.

## EXPAND Verbatim
- LEAD: official guide link `https://kko.to/player10` is embedded twice — WHY: likely contains the authoritative rules/details beyond the captured page — ANGLE: inspect any locally captured guide content or linked text if present in the repo
- LEAD: review timing FAQ says 7 business days and special cutoff for `7/7` requests — WHY: this is the clearest hard gate affecting submission eligibility — ANGLE: search for any mirrored FAQ or announcement text with dates/exception handling
- LEAD: one-shot final submission via `[Player 예선 참여]` — WHY: this is the main participant-risk gate — ANGLE: verify whether any hidden page state or JS handling indicates confirmation or irreversible POST behavior
- LEAD: visibility must be changed from `나에게만 공개` to `전체 공개` after review — WHY: this is a mandatory public/private gate — ANGLE: search for any other public/private references or exceptions elsewhere in the capture
- LEAD: prize table includes 1st/2nd/3rd amounts and counts — WHY: this is the concrete reward structure participants need — ANGLE: check whether any CSS/alt text or adjacent sections mention additional sponsor prizes or special awards

## Lead Disposition
- Official guide: pending external guide inspection; local page has link only.
- Review timing: covered locally and live page comparison.
- One-shot submission: covered locally; direct GET shows login-gated Kakao account page.
- Visibility: covered locally; no local exception found.
- Prize table: covered locally; no extra local awards found.

