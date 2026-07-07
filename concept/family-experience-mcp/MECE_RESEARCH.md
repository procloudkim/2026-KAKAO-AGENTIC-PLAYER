# MECE 리서치: 가족 체험/행사 MCP

날짜: 2026-07-01 KST

## 제품 설계

| 영역 | 요구사항 |
|---|---|
| 사용자 | 신생아~초등학생 아이와 갈 곳을 고르는 부모/보호자 |
| 핵심 과업 | "이번 주말/내 주변에서 아이가 할 만한 것 3개만 골라줘" |
| 첫 도구 | `find_family_experiences(location, child_age, date_range, indoor_outdoor?, budget?, must_have?)` |
| 응답 | Top 3, 나이 적합 이유, 실내/실외, 비용, 예약/문의 링크, 출처/신선도, 부모 확인사항 |
| 기본 범위 | 대한민국. 첫 구현은 키 준비 상태에 따라 서울 우선 가능 |
| 비목표 | 긴 행사 디렉터리, 일반 여행 검색 |

## 소스 레지스트리

| Source ID | 소스 | 역할 | 유용 필드 | 신선도 | 한계 |
|---|---|---|---|---|---|
| FAM-01 | 전국공연행사정보표준데이터, https://www.data.go.kr/data/15013106/standard.do | 전국 backbone authority | 행사명, 일시, 요금, 입장연령, 예매정보, 주소, 위도/경도 | 표준데이터 cadence. 리서치상 분기/월 집계 caveat | child/family tag는 추가 필터 필요 |
| FAM-02 | KTO TourAPI, https://www.data.go.kr/data/15101578/openapi.do | 전국 확장 | 관광, 행사, 위치, 키워드, 상세/이미지 | portal상 실시간 | age-fit 필드가 핵심 schema는 아님 |
| FAM-03 | 서울시 문화행사 정보, https://data.seoul.go.kr/dataList/OA-15486/S/1/datasetView.do | 서울 authority | 분류, 자치구, 행사명, 장소, 날짜, 이용대상, 요금, 홈페이지, 문의, 좌표 | portal상 일 단위 | 이용대상이 항상 구조화된 나이는 아님 |
| FAM-04 | 서울 공공서비스예약 계열, 예: https://data.seoul.go.kr/dataList/OA-12099/S/1/datasetView.do | 예약 보강 | 예약/상세 URL, 지역 행사 metadata | 소스별 상이 | 예약은 로그인/상세 payload 확인 필요 |
| FAM-05 | 산림교육프로그램, https://www.data.go.kr/data/3057832/openapi.do | 자연/교육 vertical | 프로그램/시설, 분류, 기간, 주소 | portal상 실시간 | 나이/요금 sparse 가능 |
| FAM-06 | 과학관/박물관 교육 데이터, 예: https://www.data.go.kr/data/15084197/fileData.do 및 https://www.data.go.kr/data/15040795/fileData.do | 교육 vertical | 대상, 요금, 교육내용, 일정, 장소 | 대개 연간/file 기반 | 좌표가 항상 없음 |

## 데이터 파이프라인 요구사항

1. 입력
   - 필수: `location`, `child_age`, `date_range`.
   - 선택: 실내/실외, 예산, 대중교통/차량, 예약 필요 여부, 유모차 가능성.
2. 어댑터
   - FAM-03 또는 FAM-01부터 시작한다.
   - 공식 API/file-converted 데이터만 사용한다.
   - `source_id`, `retrieved_at`, request parameter, raw snapshot id를 남긴다.
3. 정규화 record: `FamilyExperienceCandidate`
   - `title`
   - `source_id`
   - `event_type`
   - `venue_name`
   - `address`
   - `lat`
   - `lon`
   - `start_at`
   - `end_at`
   - `target_text`
   - `age_fit_label`
   - `age_fit_reason`
   - `fee_text`
   - `reservation_url`
   - `contact`
   - `official_url`
   - `retrieved_at`
   - `confidence`
4. 랭킹
   - 날짜와 위치를 먼저 필터링한다.
   - 소스가 대상 연령/관객을 직접 밝힌 후보를 우선한다.
   - 비용/예약/문의 metadata가 완전한 후보를 우선한다.
   - stale, unknown age-fit, 공식 링크 누락은 감점한다.
5. 응답
   - 최대 Top 3만 반환한다.
   - "왜 이 3개인지"와 "부모가 확인할 것"을 포함한다.
   - age-fit이 추론이면 근거 텍스트를 같이 보여준다.

## 신뢰도 정책

| 라벨 | 사용 조건 |
|---|---|
| `source-stated` | 소스가 어린이, 유아, 초등, 청소년 등 대상/연령을 직접 명시 |
| `computed` | 날짜 겹침, 거리, 비용 구간처럼 소스 필드에서 계산 |
| `inferred` | 제목/프로그램 텍스트에서 키워드/규칙으로 추론 |
| `unknown` | 신뢰 가능한 대상 연령/관객 필드 없음 |
| `stale` | 행사일 기준 source/cache가 오래됨 |

## MVP 절단선

도구 1개, deterministic fixture, 공식 어댑터 1개로 시작한다. 추천 첫 어댑터는 키 준비가 빠르면 서울시 문화행사, 전국성을 우선하면 FAM-01 전국공연행사정보표준데이터다.

## 중단/정지 규칙

- 행사일, 장소, 공식 링크를 제공하지 못하는 소스는 중단한다.
- golden prompt 3개가 confidence label 포함 Top 3 카드를 반환하면 소스 확장을 멈춘다.
- 대한민국 MVP에서 소스 레지스트리와 나이 적합 라벨링을 검증하기 전에는 세계 도시로 확장하지 않는다.

## 미해결

- 서울 Open Data, data.go.kr, TourAPI API key/account 준비 상태.
- 최종 제품명.
- 첫 공개 demo를 서울-only로 할지 전국공연행사 기반으로 할지.
