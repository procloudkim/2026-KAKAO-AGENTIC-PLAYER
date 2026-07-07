# API Pipeline List Research Notepad

Date: 2026-07-02 KST
Mode: ULTRAWORK + ULW-RESEARCH
Tier: HEAVY - external API/data integration choices across three MCP product ideas.

## Skills
- omo:ulw-research - explicit user request for exhaustive research.
- babygear-risk-radar - baby-product safety source hierarchy and proof boundaries.
- parentpick-guard - parent-facing trust ledger and Korean official source lanes.

## Problem Definition
- Goal: list APIs needed to build data pipelines for three MCP ideas.
- Context: Kakao Agentic Player hackathon, local first build already prioritizes family experience MCP.
- Constraints: official sources first, no invented live status, API keys server-side only, no public release action.
- Success criteria:
  1. Cover all three topics with at least primary, secondary, and optional API lanes.
  2. Separate live API candidates from web-only/manual lanes and enrichment APIs.
  3. Mark proof boundaries and implementation priority.
  4. Cite official or repo-local evidence for each asserted source lane.
- Done when: final answer gives a MECE API list plus implementation order and unresolved gaps.

## Research Axes
1. Holiday pharmacy: NMC/data.go.kr live pharmacy lane, HIRA cross-check, Kakao location/geocoding.
2. Baby product safety: SafetyKorea/KATS/KC, KIPS, MFDS/Food Safety Korea, imported-food lane, global recalls.
3. Family experience events: Seoul cultural events, TourAPI, national/public standard data, education/forest/culture program lanes.
4. Shared pipeline needs: geocoding, caching, source freshness, schema normalization, trust/provenance ledger.
5. Skeptic pass: legal/API terms, rate limits, proof boundaries, hackathon practicality.

## Verification Plan
- Local: inspect existing repo docs and source references.
- External: verify current official API pages or authoritative source pages by browsing.
- No code execution required because this is a source/API inventory, not a behavior change.

## Verification Result
- Session files created: `SYNTHESIS.md`, `claim-ledger.md`, `expansion-log.md`, and three wave digests.
- Coverage check passed for pharmacy, parent-trust, and family-experience API axes.
- Boundary check passed: live-open and safety claims appear only as restrictions/refutations, not positive claims.
- No product code, public registration, API key, or live provider call was changed/performed.

