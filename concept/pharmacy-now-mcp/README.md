# concept/pharmacy-now-mcp

상태: 강한 fallback

## 제품 약속

사용자가 채팅에서 한 번 물으면, 보수적인 상태 표현과 전화 우선 액션이 붙은 근처 약국 후보 3개를 받습니다.

## 대상 사용자

대한민국에서 휴일/야간 약국이 급하게 필요한 모바일 사용자.

## 대표 상호작용

```text
User: 지금 강남역 근처에서 갈 수 있는 휴일약국 3개만 알려줘.
MCP: 후보 3개 + 상태 라벨 + 전화 우선 + 길찾기 + 방문 전 확인 문구.
```

## 첫 범위

- `D:\KLab\workspace\2026-휴일약국`의 search/data decision을 재사용합니다.
- 기존 search path 또는 최소 NMC 어댑터를 MCP 도구 하나로 감쌉니다.
- source-backed live-open evidence 없이 약국이 확실히 열려 있다고 암시하지 않습니다.

## 중단 규칙

provider key가 없거나 MCP 응답이 open-status 과잉 claim을 피하지 못하면 첫 제출 후보에서 제외합니다.

## 파일

- `MECE_RESEARCH.md`
- `DATA_PIPELINE.md`
- `MCP_TOOLS.md`
- `GOLDEN_PROMPTS.md`
- `EXPERIMENTS.md`
- `DEBATE.md`
- `REFINED_PROPOSAL.md`
