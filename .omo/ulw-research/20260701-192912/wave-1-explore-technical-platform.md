# Wave 1 Explore: Technical Platform Constraints

## Worker
- Agent: `019f1d3c-37d2-7511-80f0-6e10a9ff6297`
- Axis: PlayMCP/MCP/Kakao Tools implementation constraints

## Key Findings
- `HTML.txt` is the only substantive local source; `Agentic-Play.txt` has no additional clues.
- PlayMCP registration is the contest entrypoint, with total 20 finalists selected.
- The primary implementation flow is Kakao Cloud MCP endpoint -> PlayMCP developer console registration -> temporary testing if not final -> review request when final -> visibility switch to public -> final Player submission.
- Technical hard gates:
  - Up to 2 contest MCP servers per person.
  - Temporary registration must not be used for review request.
  - After review, default visibility is private to self; contestant must change it to public.
  - Kakao Tools finalist stage is mandatory and requires stricter MCP spec plus Widget support.
  - PlayMCP review can take up to 7 business days.

## Cited Local Evidence
- `HTML.txt:155`: PlayMCP server registration and application selects 20 finalists.
- `HTML.txt:196-205`: Kakao Cloud MCP server endpoint creation and official guide.
- `HTML.txt:207-209`: 2 servers/person, contest-only use, server-retention uncertainty.
- `HTML.txt:219-228`: PlayMCP developer console registration, temporary registration, review request.
- `HTML.txt:239-243`: post-review visibility must be changed from `나에게만 공개` to `전체 공개`.
- `HTML.txt:283`: Kakao Cloud normally required, with capacity-exhaustion exception.
- `HTML.txt:291-299`: Kakao Tools finalist requirement, Widget support, stricter MCP spec, one-month improvement window.
- `HTML.txt:337`: review SLA/cutoff timing.
- `HTML.txt:407-408`: PlayMCP CTA.

## Implications
- Build must prioritize a reviewable, public-safe MCP endpoint before feature breadth.
- The final architecture should leave space for Kakao Tools Widget output even if prelim MVP starts with basic MCP responses.
- Deadline planning should target review request before the public submission deadline because review time can consume the remaining window.

## EXPAND Verbatim
- LEAD: PlayMCP registration flow — WHY: it defines the required submission sequence and timing — ANGLE: inspect the `예선 참여 방법` section around lines 214-228
- LEAD: Kakao Cloud endpoint prerequisite — WHY: it constrains the implementation environment and server provisioning path — ANGLE: inspect lines 196-209 plus the FAQ on cloud requirement
- LEAD: temporary registration vs review request — WHY: it is the main state-machine constraint for safe submission — ANGLE: inspect lines 224-228 and verify no other local docs override it
- LEAD: public visibility after approval — WHY: it is a release gate for contest acceptance — ANGLE: inspect lines 239-243 and check for any alternate visibility wording
- LEAD: Kakao Tools final-stage requirements — WHY: it determines whether the implementation must include Widget support and stricter MCP compliance — ANGLE: inspect lines 291-299 and any follow-on documentation if present

## Lead Disposition
- Registration flow: covered by local lines and live event page comparison.
- Cloud prerequisite: covered locally; official guide still pending external inspection.
- Temporary vs review: covered locally; no local override found.
- Public visibility: covered locally; no local override found.
- Kakao Tools requirements: covered locally; external prior-winner/platform context pending.

