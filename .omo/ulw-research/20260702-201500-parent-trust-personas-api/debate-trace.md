# OML Debate Trace: Parent Trust Personas And API Pipeline

## Round 0 - Moderator

Agenda:
- Generate personas for parents, gift buyers, and caregivers.
- Decide what source/API lanes are needed for factual safety and purchase decision support.
- Keep KakaoTalk gift integration as hook only, not the core.
- Preserve dissent on overclaiming, category routing, and official-source gaps.

Source inventory:
- Local concept docs: `concept/parent-trust-mcp/*`, `concept/DATA_PIPELINE_ARCHITECTURE.md`, `PLANS.md`.
- Official source digest: `wave-1-official-source-map.md`.
- Claim ledger: `claim-ledger.md`.
- CPSC verification: `verify-cpsc-recall-api.md`.

Confidence: medium-high for API/source existence, medium for integration effort, low for product-specific incident demo until exact product identity is supplied.

## Round 1 - Independent Proposals

### PM
Add three primary personas:
- 초보 부모 - already owns or is about to buy. Needs "what can I trust right now?" in one card.
- 선물하려는 사람 - wants to avoid harming a friend's baby and avoid awkward unsafe/inappropriate gifts.
- 공동 돌봄자 - grandparent, sitter, relative. Needs simple shared instructions and consistency.

Core tool:
- `check_parent_product_trust(product_text, child_age_stage?, jurisdiction?, decision_context?)`

Output must be:
- identity gaps first,
- official source lanes checked,
- Trust Ledger,
- buy / pause / ask seller / ask pediatrician or regulator action card.

Vote: build this as flagship if we accept slower integration.

### Tech Lead
The first build must be identity-gated. Do not call all APIs for every vague phrase.

Pipeline:
1. `parse_identity`: product/category/model/cert/barcode/lot/importer/manufacturer.
2. `route_category`: child product, food/imported food, cosmetic, medicine/quasi-drug, medical device, chemical product, general product.
3. `lookup_lane`: only lanes that match category.
4. `normalize_evidence`: evidence records with exact/probable/lane-only/context-only match.
5. `render_action_card`.

P0 adapters:
- SafetyKorea/KATS product certification and recalls.
- MFDS food and imported-food recalls.
- 초록누리 if household chemical products are in first demo.

P1 adapters:
- MFDS cosmetics/medicine/medical devices.
- KIPS/Consumer24 references.

Vote: proceed only with a narrow first category set.

### User Advocate
The emotional job is not "rank products". It is "help me not miss a serious issue and tell me what to do next without panic".

Persona-specific needs:
- Parent: use status, replacement timing, what to photograph, what to ask seller/manufacturer.
- Gift buyer: age fit, category risk, official evidence, safer replacement criteria without saying "buy this one".
- Caregiver: "do / do not use" household instruction card, not a long legal explanation.

Output tone:
- "확인됨", "아직 모름", "지금 할 일" sections.
- One short "share with caregiver" text block.

Vote: strong yes if card is short and conservative.

### Devil's Advocate
Main risks:
- Product search will be messy. Korean/English brand names, importers, platform listing names, and models will not match exactly.
- Certification date can mislead users. It proves a record existed for a matched model/scope, not that the exact current batch is issue-free.
- "Kakao 선물하기 추천" can undermine trust if it looks like affiliate commerce.
- Medical guidance can be misused as product verdict.

Blocking requirements:
- No "안전함/위험함" verdict.
- No score.
- No recommendation before identity gates.
- Every no-hit must say "not found in checked sources", not "no issue".

Vote: revise unless these boundaries become product contract.

### CEO Visionary
Positioning:
- "소중한 한 생명을 더 소중히" is the right north star, but must translate into practical trust: parents ask messy questions and get a calm, exact, shareable action card.
- This is stronger than a generic shopping recommender because it makes KakaoTalk a trusted decision layer in daily parenting.
- The winning edge is "official-source packaging", not another content search.

Hook:
- Kakao Gift can appear only after evidence gates as "gift-safe criteria" or "ask seller for these identifiers", not as the core.

Vote: flagship candidate with strict safety language.

## Round 1 - Moderator Synthesis

Consensus:
- Build around Parent Trust, not shopping.
- Personas are valid and map to distinct action cards.
- Identity and category routing must precede source lookup.
- Official-source proof boundaries must remain visible.

Unresolved:
- Which first demo category to implement: pacifier, baby food/formula, or baby detergent/chemical product.
- Whether Consumer24 API can be used directly without access friction.
- Product-specific Avent BPA case remains unresolved until exact model/batch and primary sources are verified.

Early exit decision: disagreement is low on product direction, high only on first demo category. Stop debate at one round and carry category choice into implementation planning.

## Risk / Editor Backstop

- Do not frame "official source no result" as safety clearance.
- Do not use Kakao shopping rank/recommendation as safety evidence.
- Use "source-reported", "manufacturer states", "regulator record says", "unknown", and "parent action" wording.
- Keep certification and recall as separate rows in the Trust Ledger.
