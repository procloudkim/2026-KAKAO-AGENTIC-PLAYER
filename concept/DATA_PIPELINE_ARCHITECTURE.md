# 공통 MCP 데이터 파이프라인 아키텍처

날짜: 2026-07-01 KST

범위: `family-experience-mcp`, `pharmacy-now-mcp`, `parent-trust-mcp`에 공통 적용할 구현 계약.

## 목표

공식/공개 데이터를 MCP 도구로 얇게 연결해, 사용자가 바로 행동할 수 있는 짧고 신뢰 가능한 카드를 만든다. 서버는 광범위한 크롤러나 블랙박스 검색엔진이 아니라 출처가 보이는 오케스트레이션 계층이어야 한다.

## MECE 파이프라인

| 단계 | 목적 | 필수 산출 | 실패 규칙 |
|---|---|---|---|
| 1. 소스 레지스트리 | 사용 전 소스 권한과 용도를 선언 | source id, 기관, URL, 라이선스, 인증, 갱신주기, 허용 claim | 등록되지 않은 소스는 권위 claim에 쓰지 않는다 |
| 2. 어댑터 | 한 소스를 typed boundary로 호출 | 정규화 요청, 원본 응답, `retrieved_at`, 에러 유형 | 추측 record 대신 typed failure 반환 |
| 3. 원본 스냅샷 | 사후 검증 가능성 확보 | raw payload 또는 fixture id, request hash, source id | 감사 불가 record는 unverifiable로 낮춘다 |
| 4. 정규화 | 브랜치 record로 변환 | 안정 필드만 변환, unknown 보존 | 누락 필드를 fake 값으로 채우지 않는다 |
| 5. 출처/신뢰도 | 근거 강도 설명 | field-level source/confidence label | enrichment가 authority를 강화하지 못한다 |
| 6. 캐시/스테일 | 신선도 통제 | cache key, TTL, stale label, 재확인 액션 | stale 데이터는 사용자에게 보인다 |
| 7. 마스킹 | 비밀값 유출 방지 | key, token, keyed URL, raw secret 제거 | 민감값은 redaction 후 안전 실패 |
| 8. 응답 카드 | 행동 가능하게 압축 | Top 3, 이유, 출처/신선도, 확인사항, 다음 행동 | 불확실성을 숨기지 않는다 |

## 소스 역할

| 역할 | 의미 | 지원 가능한 claim | 금지 claim |
|---|---|---|---|
| Authority | 해당 도메인의 공식 근거 | 후보 존재, registry match, 리콜/인증/행사 필드 | 소스 범위 밖 법적/실시간/안전 확정 |
| Cross-check | 공식 보조 확인 | identity, 폐업/변동, 충돌 탐지 | 단독으로 더 강한 live claim |
| Enrichment | 편의 정보 보강 | 지도, 좌표, 이미지, place URL, 표시명 | 영업상태, 안전성, 적합성 확정 |
| Context | 설명/가이드 | 배경 설명, escalation route | 제품별 판정 |
| Fixture | deterministic demo 데이터 | schema, UI, smoke test | live/current claim |

## 공통 신뢰도 라벨

- `source-stated`: 상위 소스가 직접 명시한 필드.
- `api-returned`: API가 반환했지만 의미가 일반적인 필드.
- `computed`: source-stated 필드에서 결정적으로 계산한 값.
- `inferred`: 텍스트에서 규칙/모델로 추론한 값. 이유를 보여야 한다.
- `stale`: 소스 또는 캐시가 브랜치 기준보다 오래됨.
- `unknown`: 누락 또는 모호함.

신뢰도는 근거 품질이지 추천 매력도나 안전 점수가 아니다.

## 공통 응답 계약

모든 공개 MCP 응답은 다음을 포함한다.

1. Top 3 후보 또는 가장 작은 유용 후보 집합.
2. 왜 이 후보인지.
3. 출처와 `retrieved_at`.
4. 사용자가 확인해야 할 것.
5. 바로 할 다음 행동.
6. 신뢰 가능한 답이 없을 때의 명확한 실패 메시지.

## 브랜치별 신선도 정책

| 브랜치 | 기본 TTL | stale 처리 | 이유 |
|---|---:|---|---|
| 약국 | 분 단위~당일 | `확인 필요`로 강등, 전화 우선 | 영업 상태는 시간 민감 |
| 가족 체험 | 행사 목록 6~24시간 | 소스 일자와 예약/공식 링크 표시 | 행사는 변하지만 분 단위는 아님 |
| 부모 신뢰 | 소스별, record date 표시 | no-hit으로 안전 추론 금지 | 리콜/인증은 evidence-specific |

## 마스킹 규칙

- API key, bearer token, service key, keyed URL, raw secret, 사용자 개인정보를 로그/응답에 남기지 않는다.
- credentialed request URL 대신 `request_hash`를 저장한다.
- debug output에는 source id와 status category만 표시한다.
- fixture record는 live record와 구조/표기상 구분한다.

## 브랜치별 금지선

### 가족 체험

- 소스가 대상 연령/관객을 말하지 않았으면 나이 적합성을 확정하지 않는다.
- 예약 상태나 가능 여부는 소스가 제공할 때만 말한다.
- MVP에서는 비공식 행사 페이지 크롤링을 하지 않는다.

### 약국

- 같은 시점의 live evidence가 없으면 `운영 중`, `open now`라고 말하지 않는다.
- NMC는 후보 authority, HIRA는 registry/cross-check, Kakao Local은 enrichment다.
- 모든 결과에는 전화/방문 전 확인 액션이 있어야 한다.

### 부모 신뢰

- `safe`, `dangerous`, 점수형 verdict를 만들지 않는다.
- 리콜 부재를 안전으로 해석하지 않는다.
- 매칭이 약하면 모델명, KC/인증번호, 제조/수입사, 로트/날짜, 바코드를 요청한다.

## MVP 방법

1. 최종 schema 뒤에 fixture 모드를 먼저 만든다.
2. 공식 어댑터 1개만 붙인다.
3. 소스 레지스트리와 confidence label을 붙인다.
4. golden prompt 3개를 통과한다.
5. 그 다음에만 두 번째 소스를 붙인다.

field-level evidence 없이 claim을 만들 수 없는 소스나 브랜치는 중단한다.
