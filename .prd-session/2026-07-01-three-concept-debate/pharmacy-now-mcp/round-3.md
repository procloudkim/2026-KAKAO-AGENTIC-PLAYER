# Round 3 - pharmacy-now-mcp

Agenda: final convergence.

## PM

- Addition: MVP name placeholder: `CallFirst Pharmacy`.
- Objection: Keep name secondary to safety wording.
- Vote: approve as fallback.
- Confidence: 0.80.

## Tech Lead

- Addition: First build should expose `find_nearby_pharmacy_candidates`; explanatory and navigation tools can be internal helper functions.
- Objection: Do not touch dirty pharmacy repo until a clean integration branch is made.
- Vote: approve.
- Confidence: 0.80.

## User Advocate

- Addition: The chat card should place phone before map.
- Objection: If no phone number exists, the candidate should rank lower.
- Vote: approve.
- Confidence: 0.86.

## Devil's Advocate

- Addition: Block labels `운영 중` unless live source semantics are proven.
- Objection: If demo fixture is used, it must say demo/not live availability.
- Vote: approve with strict status policy.
- Confidence: 0.82.

## CEO Visionary

- Addition: Keep this as the operationally useful fallback if family event data is weaker than expected.
- Objection: It needs a clear differentiator beyond "existing app as chat."
- Vote: approve fallback.
- Confidence: 0.78.

## Moderator Synthesis

Consensus: approve as strong fallback, not first branch.

Carry-forward state:

- first tool: `find_nearby_pharmacy_candidates`
- source lane: NMC first, Kakao enrichment optional
- response: phone-first Top 3 candidate card
- critical safeguard: no open-now certainty without proof

Unresolved:

- live provider key availability
- clean integration path from existing repo

