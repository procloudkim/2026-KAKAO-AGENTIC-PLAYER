# MECE 리서치: 휴일/야간 약국 MCP

날짜: 2026-07-01 KST

## 제품 설계

| 영역 | 요구사항 |
|---|---|
| 사용자 | 휴일/야간/주말에 약국이 급한 부모/일반 사용자 |
| 핵심 과업 | "가까운 약국 후보를 찾고 바로 전화/이동하게 해줘" |
| 첫 도구 | `find_nearby_pharmacy_candidates(location, day_time?, radius_or_region?)` |
| 응답 | Top 3 후보, 전화 우선 액션, 출처/신선도, 지도/길찾기 링크, 확인 문구 |
| 기본 범위 | 대한민국. 기존 `2026-휴일약국` repo의 source policy를 설계 입력으로 사용 |
| 비목표 | 확정적인 `open now` oracle |

## 소스 레지스트리

| Source ID | 소스 | 역할 | 유용 필드 | 신선도 | 한계 |
|---|---|---|---|---|---|
| PHA-01 | NMC 약국 API, https://www.data.go.kr/data/15000576/openapi.do | 후보 primary authority | 시도/시군구/요일/기관명 filter, 약국 목록 metadata | portal상 실시간 | 단독으로 desk-side `open now` 증명 불가 |
| PHA-02 | HIRA 약국정보서비스, https://www.data.go.kr/data/15001673/openapi.do | registry cross-check | 약국 identity, 신고 기반 metadata | registry cadence | live availability feed 아님 |
| PHA-03 | HIRA 요양기관 개폐업, https://www.data.go.kr/data/15051043/openapi.do | 폐업/변동 cross-check | 개업/폐업/휴업 월 단위 정보 | 월/최근 폐업 semantics | 현재 시점 영업 증명 아님 |
| PHA-04 | Kakao Local, https://developers.kakao.com/docs/ko/local/dev-guide | enrichment | `PM9`, 장소명, 전화, 주소, 도로명, 좌표, place URL, 거리 | quota/policy 의존 | 문서화된 응답에 영업시간 필드 없음 |
| PHA-05 | data.go.kr 이용가이드, https://www.data.go.kr/ugs/selectPublicDataUseGuideView.do | 인증/절차 | service key 신청/사용 방식 | account-dependent | 데이터 소스 아님 |

## 데이터 파이프라인 요구사항

1. 입력
   - 필수: 위치 또는 행정구역.
   - 선택: 시각, 날짜, 반경, 약국명.
   - 시각/날짜가 없으면 질문하거나 현재 query context를 쓰되 가정을 표시한다.
2. 어댑터
   - PHA-01이 1순위다.
   - PHA-04는 후보 identity가 있거나 geo/ranking 보강이 필요할 때만 쓴다.
   - PHA-02/PHA-03은 폐업/변동 conflict 탐지용 cross-check다.
3. 정규화 record: `PharmacyCandidate`
   - `name`
   - `source_id`
   - `address`
   - `phone`
   - `lat`
   - `lon`
   - `distance`
   - `duty_day_or_time_text`
   - `status_label`
   - `status_reason`
   - `map_url`
   - `retrieved_at`
   - `requires_phone_confirmation`
4. 랭킹
   - 공식 후보 match를 우선한다.
   - 전화/주소 completeness를 우선한다.
   - 거리는 source reliability 뒤에 적용한다.
   - stale cache 또는 폐업 conflict는 감점한다.
5. 응답
   - Top 3 후보만 반환한다.
   - "방문 전 전화 확인"을 primary action으로 둔다.
   - 같은 시점 live evidence가 없으면 `운영 중`, `영업 중`, `open now` 표현을 쓰지 않는다.

## 신뢰도 정책

| 라벨 | 사용 조건 |
|---|---|
| `candidate-official` | NMC가 후보 약국을 반환 |
| `registry-crosscheck` | HIRA가 identity/변동 context를 확인 |
| `enriched` | Kakao Local이 지도/place metadata를 제공 |
| `needs-confirmation` | live open proof 없음 |
| `stale` | cache 또는 upstream timestamp가 현재 사용에 오래됨 |

## MVP 절단선

응답 계약과 deterministic demo를 먼저 만든다. provider key가 있으면 기존 NMC-oriented search path를 감싸거나 최소 NMC 어댑터를 구현한다. Kakao enrichment는 optional이다.

## 중단/정지 규칙

- provider key가 없고 fixture-only demo를 정직하게 설명할 수 없으면 첫 제출 후보에서 제외한다.
- 공식 same-time evidence가 없으면 availability claim을 중단한다.
- Top 3 전화 우선 흐름이 golden prompt 3개를 통과하면 확장을 멈춘다.

## 미해결

- dirty 상태인 기존 휴일약국 repo 코드를 직접 재사용할지, source policy만 포팅할지.
- live provider key 준비 상태.
- Kakao Cloud runtime에서의 PlayMCP secret handling 세부사항.
