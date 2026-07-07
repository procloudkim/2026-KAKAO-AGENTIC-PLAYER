# Parent Trust Personas/API Research Notepad

## Bootstrap
- Tier: HEAVY.
- Justification: external API/source integration, safety-sensitive parent decision support, official-source freshness, and debate/research mode both explicitly requested.
- Skills used:
  - `oml:debate`: role-based PRD/proposal convergence with dissent and unresolved risk.
  - `omo:ulw-research`: exhaustive research protocol, source ledger, expansion trace.
  - `babygear-risk-radar`: baby-product safety claim boundaries, Trust Ledger, Korean/US source lanes.
  - `parentpick-guard`: parent-facing purchase decision support, identity/batch/jurisdiction intake, no safety-score rule.
- Subagent status: multi-agent tools are available, but current tool policy allows spawning only on explicit subagent/delegation requests. I will run the debate roles in the main thread and journal role outputs.

## Problem Definition
- Goal: define personas and source/API pipeline for a KakaoTalk MCP that helps parents, gift buyers, and caregivers make baby/child product safety and purchase decisions from factual, current, official-source evidence.
- Context: user wants the main core to be safety and exact fact-based purchase decision support; Kakao gift hooks may be convenient but are not the core.
- Constraints: no medical diagnosis, no unsupported safe/danger verdict, no affiliate-style recommendation, exact product identity and batch/jurisdiction must gate stronger claims.
- Success criteria:
  - Personas cover parent, gift buyer, and caregiver roles with decision jobs and failure modes.
  - API/source map is MECE across certification, recall, incident, medical/public-health guidance, food/import, manufacturer, independent test, and commerce hook lanes.
  - Debate trace preserves PM, Tech Lead, User Advocate, Devil's Advocate, and CEO Visionary perspectives.
  - High-risk claims are labeled as verified, unresolved, or boundary-limited.
- Done when: synthesis artifacts exist and all asserted source/API claims cite current official pages or the local evidence trail.

## Method Selection
- Candidate methods:
  - A. Persona-first design only.
  - B. Source-first Trust Ledger only.
  - C. Combined persona x source-lane matrix with debate backstop.
  - D. Commerce-first Kakao gift recommender.
- Chosen: C, because the product's edge is not a shopping list but a trustworthy action card generated from identity-gated evidence.
- Fallback: B, if persona claims become too speculative.
- Rejected:
  - A lacks enough implementation guidance for a data pipeline.
  - D violates the user's stated priority and risks weakening safety credibility.

## Execution Plan
- Baseline: current family-experience MCP structure already supports source adapters, confidence labels, top-3 cards, and source URLs.
- Controllable variables: source lanes, identity fields, confidence labels, persona-specific prompts, output cards.
- Fixed variables: official-source priority, Trust Ledger, no safety score, certification and recall kept separate.
- Budget ladder: current-session official web verification first; local artifact write second; optional implementation later.
- Promotion rule: only lanes with official or primary-source availability become P0/P1 data pipeline candidates.
- Kill rule: any lane that cannot produce product-specific or category-specific evidence is relegated to context, not decision status.
- Stop rule: stop at source/API map and persona PRD; no live integration code in this turn.
- Final evaluation rule: artifacts contain source inventory, debate trace, claim ledger, API priority, and clear next smallest build step.
- Wall-clock estimate: one focused research pass in this turn.
- RAM estimate: negligible; no large local computation.
- CPU/GPU/NPU split: CPU/browser only; no GPU/NPU.
- Reboot-required resources: none.

## Manual QA Scenario
- Surface: document artifact.
- Invocation: `Get-Content -Raw .omo/ulw-research/20260702-201500-parent-trust-personas-api/SYNTHESIS.md`
- PASS observable: file includes personas, source/API map, debate trace reference, claim ledger, and next build priority without unsupported safe/danger verdicts.

## Running Notes
- Local CodeGraph found the existing family-experience MCP has source adapter types, source confidence labels, rendered Top 3 candidates, and source URL/reservation/contact output fields.

## Evidence Artifacts
- `wave-1-local-context.md`: local repo and contest context digest.
- `wave-1-official-source-map.md`: official/API source map.
- `claim-ledger.md`: high-risk claim status.
- `debate-trace.md`: OML role debate and synthesis.
- `verify-cpsc-recall-api.md`: execution check for CPSC Recall API.
- `SYNTHESIS.md`: final research synthesis.
- `REPORT.html`: lightweight readable report.
- `concept/parent-trust-mcp/PERSONAS.md`: durable concept personas.
- `concept/parent-trust-mcp/API_SOURCE_MAP.md`: durable concept API/source map.

## Manual QA Result
- Invocation: `Get-Content -Raw .omo/ulw-research/20260702-201500-parent-trust-personas-api/SYNTHESIS.md`
- PASS: synthesis includes personas, API/source lanes, chosen method, rejected alternatives, trust boundaries, metrics, evaluator, residual risks, and next smallest safe move.
- Structural check: `PERSONAS.md`, `API_SOURCE_MAP.md`, `SYNTHESIS.md`, `debate-trace.md`, `claim-ledger.md`, and `REPORT.html` all exist with zero trailing-whitespace lines.
- Boundary check: no unsupported `안전함/위험함` verdict was found. Safety wording appears only as boundary language such as no-hit not being safety proof.

## Self-Review
- Research gate: satisfied for a design artifact. Implementation is intentionally deferred.
- Debate verification: role outputs, dissent, unresolved risks, confidence, and early exit are recorded in `debate-trace.md`.
- Source governance: official/regulator/API sources are prioritized; unresolved API access and exact product-case claims remain explicit.
- Residual risk: live API credentials, exact request/response schemas, rate limits, and the Philips Avent product-specific timeline still require fresh implementation-phase verification.
