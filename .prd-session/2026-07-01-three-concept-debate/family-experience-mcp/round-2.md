# Round 2 - family-experience-mcp

Agenda: critique and source-risk reduction.

## PM

- Addition: Product promise becomes "아이 나이와 날짜에 맞는 이번 주 갈 곳 Top 3."
- Objection: Do not promise nationwide coverage in prelim.
- Source references: `research/briefs/2026-07-01-three-mcp-idea-branches.md`.
- Vote: proceed.
- Confidence: 0.86.

## Tech Lead

- Addition: Use source adapter interface now, but implement one Seoul adapter first.
- Objection: If Seoul API key is unavailable, use checked-in deterministic fixture clearly labeled as demo.
- Source references: `DATA_PIPELINE.md`, `EXPERIMENTS.md`.
- Vote: proceed.
- Confidence: 0.80.

## User Advocate

- Addition: Response card should be:
  1. Top 3
  2. why fit
  3. check before going
  4. reservation/contact
- Objection: A separate itinerary is extra; not MVP.
- Source references: `GOLDEN_PROMPTS.md`.
- Vote: proceed.
- Confidence: 0.88.

## Devil's Advocate

- Addition: "예약 가능" must not be asserted unless the source explicitly says it.
- Objection: User may assume current availability; add "운영/예약 확인 필요" when unknown.
- Source references: `DATA_PIPELINE.md`.
- Vote: proceed with warning copy.
- Confidence: 0.78.

## Moderator Synthesis

Decision:

- First build should implement adapter abstraction but only activate Seoul source plus demo fixture.
- TourAPI is phase 2 after first PlayMCP smoke.

Early exit: not yet. Submission name, exact output schema, and fallback behavior still need final convergence.

