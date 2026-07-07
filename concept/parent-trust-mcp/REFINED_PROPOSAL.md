# Refined Proposal

## Product Promise

육아용품 안전 걱정을 제품 식별, 공식 source lane, 근거 공백, 부모 action card로 정리하되 안전 판정은 하지 않는다.

## First Tool

`intake_baby_product_identity(product_text_or_fields, jurisdiction?, child_age_stage?)`

## First Build Scope

- Korea-purchased baby product concern.
- Identity and source-lane routing first.
- Trust Ledger schema.
- Compact parent action card.

## Response Card

The answer must include:

- known product identity
- missing identity fields
- relevant official source lanes
- what each lane can and cannot prove
- do now
- check next
- escalate if

## Assumptions

- Identity intake creates value before live official lookup is complete.
- Korean official source lanes are the first public scope.
- Parents need a safe checklist more than a product safety verdict.

## Open Questions

- SafetyKorea/KIPS/MFDS API access and matching quality.
- first product category.
- whether product label photos will be supported later.
