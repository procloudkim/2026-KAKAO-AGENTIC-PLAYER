# Ultraresearch Synthesis: Parent Trust Personas And API Pipeline

Workers: main-thread simulated roles · Waves: 1 current wave plus prior repo artifacts · Sources: 18+ official/current sources · Verifications: 1 execution check

## Executive Summary

The strongest product direction is a `Parent Trust MCP`: a KakaoTalk tool that turns messy parent, gift-buyer, or caregiver questions into a fact-bounded action card. The core must be product identity, official source lanes, Trust Ledger, uncertainty, and next action. KakaoTalk Gift or Kakao Shopping can be a convenience hook, but it cannot be the decision engine.

This is viable because the official-source surface exists: Korea has SafetyKorea/KATS product certification and recall APIs, MFDS food/imported-food and adjacent regulated-product APIs, 초록누리 생활화학제품 OpenAPI, Consumer24/KCA consumer-safety surfaces, and KIPS/SafetyKorea reporting/follow-up paths. US/global sources such as CPSC and SaferProducts can provide side-lane context for imported or globally discussed products, but they need jurisdiction labels and fallbacks.

The product edge is not "more search". The edge is: "I can ask KakaoTalk in messy Korean, and it tells me what is officially checked, what is still unknown, and exactly what to do before my child uses this product."

## Personas

### 1. 초보 부모 / 주 양육자
- Decision job: can I keep using, pause, replace, ask support, or report?
- Needs: exact model/batch/certification matching; regulator vs manufacturer separation; short do-now card.
- Failure risk: panic from ambiguous reports or false reassurance from no-hit results.

### 2. 선물하려는 사람
- Decision job: can I gift this without creating safety anxiety or extra burden for the parents?
- Needs: age/stage fit, product identifiers, seller reliability, return/AS path, official-source precheck.
- Failure risk: popularity/ranking mistaken for safety.

### 3. 공동 돌봄자 - 조부모, 육아도우미, 친척
- Decision job: can I use this product today while caring for the child, and when should I stop or ask the parent?
- Needs: simple shareable "use / do not use / ask parent / escalate" instructions.
- Failure risk: long evidence tables that are not executable during care.

## API And Source Lanes

### P0 - MVP-critical
- SafetyKorea/KATS product safety certification and recall API.
- MFDS/Food Safety Korea food recall and sales-suspension API.
- MFDS imported-food recall/sales-suspension API.

### P1 - Strong next lanes
- 초록누리 생활화학제품 OpenAPI.
- MFDS medical-device, medicine/quasi-drug, and cosmetics APIs.
- KIPS/SafetyKorea accident/reporting and recall follow-up.
- Consumer24/KCA as aggregation and comparison context.

### P2 - Global/context side lanes
- CPSC Recall API, with timeout/cache/fallback.
- SaferProducts.gov incident reports, with application key and signal-only wording.
- AAP/HealthyChildren, CDC, and CPSC guidance for parent-use context.

### P3 - Convenience hook
- Kakao Shopping/Gift API. Use only for post-evidence product lookup, gifting checklist, or handoff.

## Chosen Method

Use a combined persona x source-lane matrix:

1. Parse messy product identity.
2. Gate on missing model/KC/barcode/lot/jurisdiction.
3. Route category to official lanes.
4. Query only the matching lanes.
5. Normalize each source into `ProductEvidenceRecord`.
6. Build a Trust Ledger.
7. Render a persona-specific action card.

Rejected alternatives:
- Persona-only design: not enough for a safe data pipeline.
- Source-only report: too heavy for KakaoTalk chat.
- Commerce-first recommender: conflicts with the user's stated core and weakens trust.

## Trust Boundaries

- Certification and recall are separate.
- No-hit is not "safe".
- Manufacturer response is a claim to record, not a regulator finding.
- KCA/comparison reports are useful context, not live recall status.
- Ranking, recommendation, influencer, and gift-store popularity are demand signals only.
- Medical/public-health guidance can inform use context and escalation, not product-specific status.

## Recommended First Build

Build `parent-trust-mcp` as a narrow identity-first tool, not a live verdict engine.

MVP tools:
- `parse_parent_product_identity`
- `route_parent_product_lanes`
- `check_parent_product_trust` in fixture mode
- `render_parent_action_card`

First live adapter:
- SafetyKorea/KATS product safety certification and recall.

Best demo story:
- Pacifier/soother concern, because it demonstrates the exact conflict the user cares about: public report or manufacturer claim vs certification/recall/source time gap. The response must say what is checked and unknown, not declare the product safe/dangerous.

Fallback demo:
- Baby food/formula with MFDS food recall API if MFDS access is faster.

## Metric Definition

- Identity completeness rate: percent of requests where required identifiers are found or explicitly requested.
- Lane routing accuracy: category routed to the correct official source lanes.
- Overclaim rate: zero unsupported "safe/dangerous/no issue" verdicts.
- Action-card usefulness: user gets one next action even when evidence is insufficient.
- Source visibility: every evidence row has source, retrieved_at, proof boundary, and what it cannot prove.

## Evaluator

Document/artifact evaluator for this turn:
- `claim-ledger.md` has verified/unresolved statuses.
- `debate-trace.md` preserves role dissent.
- `PERSONAS.md` and `API_SOURCE_MAP.md` exist in `concept/parent-trust-mcp`.
- `verify-cpsc-recall-api.md` records the only execution-shaped claim.

## Residual Risks

- API approval and exact request schemas remain unverified for SafetyKorea, MFDS, Consumer24, Kakao Shopping, and 초록누리.
- Product identity matching across Korean/English names and sellers will be the hardest implementation problem.
- Consumer24 API details remain unresolved beyond listed service availability.
- The Philips Avent BPA case still needs exact model/batch/country and primary-source verification before being used as a product-specific demo.

## Next Smallest Safe Move

Implement a fixture-mode `parent-trust-mcp` contract with identity intake, lane routing, Trust Ledger, and three golden prompts. Add one live official adapter only after the source API key and response schema are verified.
