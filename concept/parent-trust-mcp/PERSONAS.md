# Parent Trust MCP Personas

Date: 2026-07-02 KST

## Product Principle

Main core: safety and purchase-decision support from exact, factual, source-bounded evidence.

Commerce or KakaoTalk Gift integration is only a convenience hook. It must not decide safety, trust, recall status, or suitability.

## Shared User Promise

"개떡같이 물어봐도 찰떡같이 정리해서, 지금 확인된 것과 아직 모르는 것과 바로 할 일을 알려준다."

The MCP should not answer with a broad search result. It should return a short parent action card backed by official source lanes.

## Persona 1: 초보 부모 / 주 양육자

### Situation
- Owns or is about to buy a baby/child product.
- Search phrases are messy: brand nickname, product photo text, seller listing title, "국민템", "BPA 나온 그 쪽쪽이 맞아?".
- Anxiety is high because the child will actually use the product.

### Jobs To Be Done
- Know whether the exact product/model/batch matches a recall, certification, or official warning.
- Separate manufacturer claims from regulator records.
- Decide whether to continue using, pause use, replace, ask seller/manufacturer, report, or consult a clinician.

### Required Inputs
- Product name or seller listing text.
- Product category or use context.
- Child age/stage.
- Purchase/use jurisdiction.
- Model, SKU, KC/certification number, barcode, lot/batch/date code if available.

### Output Needs
- `확인된 것`: exact/lane-level official records.
- `아직 모르는 것`: missing model, lot, certification number, jurisdiction, source not checked.
- `지금 할 일`: photo to capture, source to check, support message to send, whether to pause until confirmation.
- `보호자 공유 문구`: short text for spouse/grandparent/nanny.

### Failure Mode
If identity is weak, the tool must not guess. It should ask for model/KC/barcode/lot or return a lane-only checklist.

## Persona 2: 선물하려는 사람

### Situation
- Wants to gift a baby/newborn/pregnancy product through KakaoTalk or another commerce channel.
- Does not know child age, exact parent preference, product category risk, or whether a trendy item is appropriate.
- Wants to avoid sending a product that creates anxiety or extra work for the parents.

### Jobs To Be Done
- Avoid high-risk or identity-unclear product categories.
- Check age/stage suitability and official safety/certification/recall lanes before gifting.
- Prefer gifts where model, seller, return path, and official identifiers are visible.

### Required Inputs
- Gift recipient age/stage or expected birth/newborn context.
- Product candidate or category.
- Budget and purchase channel only after safety/evidence gates.

### Output Needs
- `선물 전 체크`: category risk, official identifiers to require, return/AS path.
- `피해야 할 신호`: no model/KC/barcode, unclear importer, ranking-only proof, influencer-only claim.
- `선물 hook`: Kakao gift link/search term only after evidence lane and identity gates.

### Failure Mode
Do not recommend from rankings or popularity. Ranking can only be a convenience tie-break after official-source checks pass or are explicitly unknown.

## Persona 3: 공동 돌봄자 - 조부모, 육아도우미, 친척

### Situation
- Uses the product while caring for the child but may not know purchase details.
- Needs simple instructions, not a long evidence report.
- Needs to know when to ask the parent, stop use, call support, or escalate.

### Jobs To Be Done
- Follow the parent's safety decision consistently.
- Avoid misuse such as wrong sleep surface, pacifier string/clip misuse, expired/worn product use, or using a recalled product.
- Report observations clearly.

### Required Inputs
- Product currently in use.
- Child age/stage.
- Usage context such as sleep, feeding, soothing, cleaning, travel.
- Observed issue, if any.

### Output Needs
- `오늘 사용할 때`: allowed checks and do-not-use triggers.
- `부모에게 물어볼 것`: missing identifiers, observed deterioration, product label photo.
- `바로 중단/연락`: recall match, injury, choking/strangulation/sleep risk, symptom escalation.

### Failure Mode
Do not overload with source tables. Provide a caregiver-safe summary plus a link/record ID for the parent-facing ledger.

## Cross-Persona Conversation Contract

1. Parse the messy chat into `ProductIdentityInput`.
2. If identity is insufficient, return missing-field requests before any conclusion.
3. Route by category and jurisdiction.
4. Query only appropriate official lanes.
5. Build a Trust Ledger.
6. Return a short action card.
7. If commerce is requested, add a post-evidence purchase/gift checklist, not a safety verdict.

## First Golden Prompts

```text
이 필립스 아벤트 쪽쪽이 국민템이라는데 BPA 기사 봤어. 우리 애가 쓰는 모델인지 뭘 확인해야 해?
```

```text
친구가 곧 출산하는데 카카오 선물하기에서 아기용품 고르려 해. 안전 이슈 덜한 쪽으로 어떻게 골라야 해?
```

```text
할머니가 낮잠 때 이 제품을 써도 되는지 물어봤어. 제품 사진에 KC 번호가 있는데 어떤 것부터 확인하지?
```
