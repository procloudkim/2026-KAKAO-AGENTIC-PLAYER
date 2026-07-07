# MECE 종합: 3개 MCP 컨셉

날짜: 2026-07-01 KST

## 결론

1. 1순위 구현: `concept/family-experience-mcp`
2. 대체 구현: `concept/pharmacy-now-mcp`
3. 보류: `concept/parent-trust-mcp`

판단 근거: 가족 체험 컨셉은 카카오톡 대화 안에서 "이번 주말 아이와 갈 곳 3개"라는 가치가 가장 직관적이고, 약국의 실시간 영업 오판이나 제품 안전의 과잉 확신보다 공개 리스크가 낮다. 약국은 실용성이 강하지만 `open now` 표현이 위험하다. 부모 신뢰 컨셉은 차별화되지만 정확한 제품/모델/로트 매칭 전에는 안전 판단처럼 오해될 수 있다.

## 공통 제품 가설

MCP의 가치는 검색 결과를 많이 주는 것이 아니라, 채팅 안에서 바로 쓸 수 있는 의사결정 카드를 주는 것이다.

- 후보 3개
- 왜 이 3개인지
- 출처와 신선도
- 사용자가 확인해야 할 것
- 바로 할 다음 행동 1개

## 공통 데이터 파이프라인

모든 컨셉은 같은 뼈대를 쓴다.

1. 소스 레지스트리
2. 어댑터 계약
3. 원본 스냅샷
4. 정규화
5. 신뢰도/출처 표기
6. 캐시/스테일 정책
7. 비밀값 마스킹
8. 사용자 응답 카드

넓은 크롤러를 먼저 만들지 않는다. 공식 권위 소스와 편의성 보강 소스를 섞어 출처를 흐리지 않는다. fixture/demo 데이터는 절대 live/current처럼 보이면 안 된다.

## 주제별 요약

### 1. 아이 체험/행사 추천

- 첫 도구: `find_family_experiences`
- 핵심 소스:
  - 전국공연행사정보표준데이터: https://www.data.go.kr/data/15013106/standard.do
  - 한국관광공사 TourAPI: https://www.data.go.kr/data/15101578/openapi.do
  - 서울시 문화행사 정보: https://data.seoul.go.kr/dataList/OA-15486/S/1/datasetView.do
  - 서울 공공서비스예약/기관별 교육 데이터는 예약성 보강 소스
- 핵심 리스크: `이용대상`, 행사명, 프로그램 설명만 보고 나이 적합성을 과잉 추론하는 것
- MVP 절단선: 서울 또는 전국공연행사 1개 어댑터 + deterministic fixture. 나이 적합성은 `source-stated`, `inferred`, `unknown`으로 표시한다.

### 2. 휴일/야간 약국 후보

- 첫 도구: `find_nearby_pharmacy_candidates`
- 핵심 소스:
  - NMC 약국 API: https://www.data.go.kr/data/15000576/openapi.do
  - HIRA 약국 메타데이터: https://www.data.go.kr/data/15001673/openapi.do
  - HIRA 개폐업 정보: https://www.data.go.kr/data/15051043/openapi.do
  - Kakao Local 보강: https://developers.kakao.com/docs/ko/local/dev-guide
- 핵심 리스크: `운영 중`, `영업 중`, `open now`를 확정처럼 말하는 것
- MVP 절단선: "후보/전화 우선" 카드만 제공한다. Kakao Local은 지도/좌표/장소 링크 보강이지 영업 상태 권위가 아니다.

### 3. 육아용품/식품 신뢰 판단 보조

- 첫 도구: `intake_baby_product_identity`
- 핵심 소스:
  - KATS/SafetyKorea 인증/리콜: https://www.data.go.kr/data/15116894/openapi.do 및 https://www.safetykorea.kr/
  - Food Safety Korea/MFDS: https://www.foodsafetykorea.go.kr/
  - 수입식품정보마루: https://impfood.mfds.go.kr/
- 핵심 리스크: "리콜 없음"을 "안전함"으로 오해하게 만드는 것
- MVP 절단선: 제품 식별 intake + 소스 lane 라우팅 + Trust Ledger action card. 안전 점수, 안전/위험 판정은 금지한다.

## 증거 수준

- 높음: Kakao 해커톤 흐름은 `HTML.txt`와 공식 AGENTIC PLAYER 페이지, MCP 도구 구조는 공식 MCP 문서, 데이터 소스 역할은 공식 공공데이터/API 페이지로 확인.
- 중간: 브랜치 우선순위는 repo-local 토론/계획 산출물 기반.
- 낮음/미해결: PlayMCP 공식 Notion 세부 가이드, 사용자 계정/API 키 준비 상태, 실제 API payload edge case.

## 다음 최소 안전 행동

`concept/family-experience-mcp`부터 시작한다. 먼저 MCP 서버 skeleton과 `find_family_experiences` 도구를 deterministic fixture 모드로 만든 뒤, API 키가 확인되면 공식 어댑터 1개만 붙인다.
