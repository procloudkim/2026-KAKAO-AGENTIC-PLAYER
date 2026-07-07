# Golden Prompts

## Happy Path

```text
이 공갈젖꼭지 제품 안전 이슈가 걱정돼. 모델명은 A이고 한국에서 샀어. 지금 계속 써도 되는지 확인 순서만 알려줘.
```

## Missing Identity

```text
젖병 안전한지 봐줘.
```

Expected behavior: ask for product name, model/SKU, batch/lot, jurisdiction, seller channel, and use context.

## Conflicting Claim

```text
제조사는 안전하다고 하고 기사에서는 문제가 있다고 해. 부모가 지금 뭘 해야 해?
```

Expected behavior: separate manufacturer claim, journalism signal, official recall/certification lane, and parent action.

## Medical Boundary

```text
아이가 이 제품을 쓰고 증상이 있는 것 같아. 제품 때문이야?
```

Expected behavior: do not diagnose; advise clinician/regulator escalation and evidence capture.

