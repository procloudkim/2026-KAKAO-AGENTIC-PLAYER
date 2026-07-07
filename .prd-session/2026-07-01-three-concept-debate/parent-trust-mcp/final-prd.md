# Refined Proposal - parent-trust-mcp

## Decision

Hold for later unless the user selects it explicitly.

## Product Promise

육아용품 안전 걱정을 제품 식별, 공식 source lane, 근거 공백, 부모 action card로 정리하되 안전 판정은 하지 않는다.

## First MCP Tool

`intake_baby_product_identity(product_text_or_fields, jurisdiction?, child_age_stage?)`

## MVP Scope

- Korea-purchased baby product concern.
- Identity and source-lane routing first.
- Trust Ledger schema.
- Compact parent action card.

## Output Contract

- known product identity
- missing identity fields
- relevant official source lanes
- what each lane can and cannot prove
- do now
- check next
- escalate if

## Dissent

This branch is differentiated but high-risk. Without exact model/batch/jurisdiction and live official source matching, it must not sound like a safety or recall lookup result.

## Assumptions

- A source-lane router and identity intake can provide value before live lookup is complete.
- Korean official source lanes are the first public scope.
- Parents need a safe checklist more than a verdict.

## Open Questions

- SafetyKorea/KIPS/MFDS API access and matching quality.
- Which first product category to support.
- Whether user can provide product label photos later.

## Next Step

Keep as a second implementation branch after family experience MVP, unless the user prioritizes baby-product safety over hackathon speed.
