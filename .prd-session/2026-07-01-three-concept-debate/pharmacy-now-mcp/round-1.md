# Round 1 - pharmacy-now-mcp

Agenda: independent proposals before critique.

## PM

- Addition: Product promise is "전화 먼저 할 수 있는 가까운 후보 3개."
- Objection: Do not market this as "open pharmacy finder" unless evidence supports it.
- Vote: proceed as fallback.
- Confidence: 0.78.

## Tech Lead

- Addition: Wrap existing search route or service; avoid rebuilding ETL.
- Objection: Dirty upstream repo means first implementation should happen in this hackathon repo or a clean copy, not by editing the pharmacy worktree now.
- Vote: proceed later.
- Confidence: 0.72.

## User Advocate

- Addition: Phone button/call script is the differentiator in chat.
- Objection: Long status explanations will be ignored in urgent situations.
- Vote: proceed if answer is phone-first.
- Confidence: 0.82.

## Devil's Advocate

- Addition: Every result must say "방문 전 전화 확인 권장."
- Objection: A Top 3 list may still imply open-now certainty.
- Vote: block as primary unless wording is conservative.
- Confidence: 0.74.

## CEO Visionary

- Addition: This has strong public utility and existing implementation leverage.
- Objection: It is less novel than family-experience unless the action handoff is excellent.
- Vote: keep as fallback.
- Confidence: 0.76.

## Moderator Synthesis

Carry forward:

- fallback, not primary
- first tool: `find_nearby_pharmacy_candidates`
- must use conservative labels
- phone-first response is mandatory

Unresolved: live provider key availability and whether to integrate via existing repo code or copy a minimal service.

