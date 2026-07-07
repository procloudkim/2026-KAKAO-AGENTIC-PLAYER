# Parent Trust MCP API Source Map

Date: 2026-07-02 KST

## Source Priority

| Priority | Lane | Source | Use | Proof Boundary |
|---:|---|---|---|---|
| P0 | Korean product safety | SafetyKorea/KATS product safety certification and recall API | 어린이제품, 전기/생활용품 KC/certification and domestic/foreign recalls | Matched model/certification/record scope only. No-hit is not safety proof. |
| P0 | Korean food recall | MFDS/Food Safety Korea food recall/sales-suspension API | 분유, 이유식, 어린이 식품, 간식, food contact when legally food lane applies | Matched product/date/barcode/lot only. |
| P0 | Imported food recall | MFDS imported-food recall/sales-suspension API | Imported formula, baby food, imported snacks | Imported-food lane only. Traceability is not general safety clearance. |
| P1 | 생활화학제품 | 초록누리 OpenAPI | Baby detergent, sanitizer, cleaner, repellent, deodorizer, household chemical products around children | Chemical-product lane only. |
| P1 | Adjacent MFDS regulated goods | MFDS medical-device, medicine/quasi-drug, cosmetics APIs | Thermometers, aspirators, medicines/quasi-drugs, baby lotion/cosmetics | Category-specific. Do not infer across lanes. |
| P1 | Consumer aggregation | Consumer24 Open API / safety information | Barcode/product safety aggregation, certification/recall cross-check, comparison entry point | Needs service-specific access confirmation. Aggregation does not outrank primary source. |
| P1 | Product-safety follow-up | KIPS / SafetyKorea product accident and recall implementation | Incident reporting, illegal/defective product report, recall follow-up | Report/follow-up context, not instant defect proof. |
| P2 | US/global recalls | CPSC Recall API | Global/US-market recall side lane for imported or overseas products | Use with jurisdiction label, timeout, cache, fallback. |
| P2 | US incident reports | SaferProducts.gov API | Incident signal and manufacturer response context | Incident reports are signals, not automatic recall/defect proof. |
| P2 | Pediatric/public-health guidance | AAP/HealthyChildren, CDC, CPSC business guidance | Safe-use context: pacifier strings, sleep surfaces, age/stage guidance | Context only, not product-specific status. |
| P3 | Commerce hook | Kakao Shopping/Gift API | Seller/product lookup, gifting handoff, convenience action | Requires application/partner access. Never safety evidence. |

## Required Normalized Inputs

```ts
type ProductIdentityInput = {
  product_text: string
  child_age_stage?: "newborn" | "infant" | "toddler" | "preschool" | "school_age"
  decision_context?: "already_using" | "buying" | "gift" | "caregiver_use" | "incident_or_symptom"
  jurisdiction?: "KR" | "US" | "EU" | "unknown"
  product_category_hint?: string
  brand?: string
  product_name?: string
  model?: string
  sku?: string
  certification_number?: string
  barcode?: string
  batch_or_lot?: string
  date_code?: string
  manufacture_date?: string
  expiration_date?: string
  manufacturer?: string
  importer?: string
  seller_channel?: string
  seller_url?: string
}
```

## Evidence Record Contract

```ts
type ProductEvidenceRecord = {
  source_id: string
  source_lane: string
  source_tier: "official_regulator" | "official_public_health" | "manufacturer" | "independent_test" | "journalism" | "commerce_context"
  retrieved_at: string
  query_identity: ProductIdentityInput
  matched_identity: {
    product_name?: string
    model?: string
    certification_number?: string
    barcode?: string
    batch_or_lot?: string
    manufacturer?: string
    importer?: string
  }
  match_strength: "exact-match" | "probable-match" | "lane-only" | "context-only" | "no-match" | "unknown"
  evidence_type: "certification" | "recall" | "incident" | "standard" | "guidance" | "manufacturer_claim" | "comparison" | "commerce"
  claim_type: "verified-fact" | "source-reported-claim" | "inference" | "unknown" | "parent-action"
  what_it_proves: string
  what_it_cannot_prove: string
  time_validity: string
  batch_applicability: string
  jurisdiction_fit: string
  official_url: string
  parent_action_impact: string
}
```

## Adapter Priority For MVP

1. `parse_parent_product_identity`
   - No external key.
   - Returns identity completeness and category candidates.
2. `route_parent_product_lanes`
   - No external key.
   - Returns P0/P1/P2 lane plan and missing fields.
3. `render_parent_trust_card`
   - Uses fixture evidence first.
   - Proves output contract and safety wording.
4. `lookup_safetykorea_product_safety`
   - First live official adapter after API approval.
5. `lookup_mfds_food_recall`
   - Add if first demo includes formula/baby food.

## First Demo Category Recommendation

Use pacifier/soother as the story anchor but implement the first live adapter around the official Korean product-safety lane.

Reason:
- It matches the user's real story.
- It exercises product identity, certification date, recall separation, manufacturer conflict, and parent anxiety.
- It must avoid a safety verdict, which proves the product's trust boundary.

Fallback demo:
- Baby food/formula if MFDS API access is faster than SafetyKorea approval.

## Output Contract

Every MCP response should include:

1. `제품 식별 상태`
2. `확인한 공식 lane`
3. `Trust Ledger`
4. `아직 모르는 것`
5. `부모 액션 카드`
6. `선물/구매 hook`, only if requested and only after safety evidence boundaries are shown.
