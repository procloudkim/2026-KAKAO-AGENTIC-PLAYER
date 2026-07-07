# 컨셉 브랜치 작업공간

이 폴더는 계획한 git branch namespace와 같은 구조로 나눈 로컬 작업공간입니다.

| 컨셉 브랜치 | 로컬 폴더 | 상태 |
|---|---|---|
| `concept/family-experience-mcp` | `concept/family-experience-mcp/` | 1순위 추천 |
| `concept/pharmacy-now-mcp` | `concept/pharmacy-now-mcp/` | 강한 fallback |
| `concept/parent-trust-mcp` | `concept/parent-trust-mcp/` | 사용자가 고르면 진행, 기본은 보류 |

## 규칙

브랜치별 계획, source policy, prompt, 실험은 각 폴더 안에 둡니다. 공통 해커톤 전략은 `research/`와 `PLANS.md`에 둡니다.

공통 데이터 파이프라인 계약: `DATA_PIPELINE_ARCHITECTURE.md`.

## 공통 응답 계약

모든 브랜치는 다음을 반환해야 합니다.

```text
Top 3 answer
Why these 3
Source and freshness
What the parent/user should verify
One immediate next action
```

## MECE 리서치 산출물

- `family-experience-mcp/MECE_RESEARCH.md`
- `pharmacy-now-mcp/MECE_RESEARCH.md`
- `parent-trust-mcp/MECE_RESEARCH.md`
