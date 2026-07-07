# concept/parent-trust-mcp

상태: 사용자가 선택하면 진행, 기본은 보류

## 제품 약속

부모가 육아용품/식품 걱정을 한 번 묻고, 공포/마케팅/거짓 확신 대신 공식 근거 lane 기반 action card를 받습니다.

## 대상 사용자

육아용품의 안전, 리콜, 인증, 제조사, 공공 신고 claim을 비교하는 부모.

## 대표 상호작용

```text
User: 이 젖병/공갈젖꼭지/아기침대 제품, 안전 이슈가 걱정돼. 지금 뭘 확인해야 해?
MCP: 제품 식별 체크 + 공식 source lanes + unknowns + do-now/check-next/escalate-if action card.
```

## 첫 범위

- `D:\KLab\workspace\2026-06-07-harness`의 Trust Ledger와 parent action card 모델을 재사용합니다.
- 한국 공식 source lane부터 시작합니다.
- 안전 점수를 만들지 않습니다.

## 중단 규칙

정확한 모델/배치/jurisdiction을 안전하게 다루지 못하거나, 출력이 의료/안전 확정처럼 흐르면 첫 제출 후보에서 제외합니다.

## 파일

- `MECE_RESEARCH.md`
- `DATA_PIPELINE.md`
- `PERSONAS.md`
- `API_SOURCE_MAP.md`
- `MCP_TOOLS.md`
- `GOLDEN_PROMPTS.md`
- `EXPERIMENTS.md`
- `DEBATE.md`
- `REFINED_PROPOSAL.md`
