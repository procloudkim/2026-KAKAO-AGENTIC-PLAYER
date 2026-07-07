# Round 3 - family-experience-mcp

Agenda: final convergence.

## PM

- Addition: Final MVP name placeholder: `KidTrip 3`.
- Objection: Name can change, but the promise must stay "3 choices, not search results."
- Vote: approve with open naming.
- Confidence: 0.87.

## Tech Lead

- Addition: Define first implementation as one MCP endpoint exposing `find_family_experiences` with fixture and optional Seoul adapter.
- Objection: Do not implement global-city expansion now.
- Vote: approve.
- Confidence: 0.84.

## User Advocate

- Addition: Golden prompt should stay exactly: "이번 토요일 서울에서 4살 아이랑 갈 만한 실내 체험 3개만 골라줘."
- Objection: Do not ask follow-up if age, date, and region are already present.
- Vote: approve.
- Confidence: 0.90.

## Devil's Advocate

- Addition: Mandatory labels: `source-stated`, `inferred`, `unknown`.
- Objection: Block if the response hides sparse data behind confident prose.
- Vote: approve with label condition.
- Confidence: 0.80.

## CEO Visionary

- Addition: This should be the primary branch for first implementation.
- Objection: It needs an emotionally clear demo title and not just technical API proof.
- Vote: approve.
- Confidence: 0.90.

## Moderator Synthesis

Consensus: approve as primary implementation candidate.

Carry-forward state:

- first tool: `find_family_experiences`
- source lane: Seoul open data first, deterministic fixture fallback
- response: Top 3 action card
- critical safeguard: confidence labels for age fit and reservation/operation status

Unresolved:

- final product name
- whether live Seoul API key is available

