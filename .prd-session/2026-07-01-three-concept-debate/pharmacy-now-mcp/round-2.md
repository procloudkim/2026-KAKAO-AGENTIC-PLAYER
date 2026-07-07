# Round 2 - pharmacy-now-mcp

Agenda: critique and risk reduction.

## PM

- Addition: Reframe from "find open pharmacy" to "find candidates to call now."
- Objection: Public-vote appeal may be lower if uncertainty wording dominates.
- Vote: proceed as fallback.
- Confidence: 0.79.

## Tech Lead

- Addition: Start with region/manual search before coordinate search if keys are missing.
- Objection: Kakao enrichment must not alter ranking or status.
- Vote: proceed.
- Confidence: 0.77.

## User Advocate

- Addition: Response should include a one-line call script: "지금 조제/판매 가능한지 확인 부탁드립니다."
- Objection: Do not require user to understand source semantics.
- Vote: proceed.
- Confidence: 0.84.

## Devil's Advocate

- Addition: If source is stale, all status labels must downgrade to `확인 필요`.
- Objection: "휴일약국" itself can sound confirmed; copy must say candidate.
- Vote: proceed with wording condition.
- Confidence: 0.80.

## Moderator Synthesis

Decision:

- Keep fallback ranking.
- Implement only if data.go.kr/NMC key or deterministic demo is ready.
- Use candidate/call-first wording.

Early exit: not yet. Need final output contract and integration boundary.

