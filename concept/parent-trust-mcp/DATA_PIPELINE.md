# Data Pipeline

## Source Priority

1. SafetyKorea/KATS/KC certification and product-safety recall lanes.
2. KIPS product accident, illegal/defective product, recall implementation, and risk context.
3. MFDS/Food Safety Korea lanes when food, formula, utensils, containers, or imported food are in scope.
4. Manufacturer notices and certificates as lower-tier conflict context.
5. Consumer tests, journalism, ranking, and influencer claims only as signals, not proof.

## Pipeline Shape

```text
product identity intake
-> source lane selection
-> official lookup or explicit unknown
-> trust ledger
-> evidence completeness
-> parent action card
```

## Normalized Evidence Fields

- `claim_type`
- `source_lane`
- `source_name`
- `source_url`
- `retrieved_at`
- `product_name`
- `model`
- `batch_or_lot`
- `jurisdiction`
- `what_it_proves`
- `what_it_cannot_prove`
- `time_validity`
- `batch_applicability`
- `parent_action_impact`

## Safety Rules

- Do not state that a real product is safe or dangerous without official product-specific evidence.
- Certification status and recall status stay separate.
- Evidence completeness is not a safety score.
- Medical symptoms route to clinician/pediatrician guidance, not MCP conclusions.

