# MECE 리서치: 부모 신뢰/육아용품 MCP

날짜: 2026-07-01 KST

## 제품 설계

| 영역 | 요구사항 |
|---|---|
| 사용자 | 아기/어린이 제품과 식품의 신뢰 근거를 확인하려는 부모/보호자 |
| 핵심 과업 | "공식 근거 lane에서 무엇을 확인해야 하고, 무엇은 아직 모르는지 알려줘" |
| 첫 도구 | `intake_baby_product_identity(product_text_or_fields, jurisdiction?, child_age_stage?)` |
| 응답 | 식별 누락, source lane, Trust Ledger, unknowns, do-now/check-next/escalate-if action card |
| 기본 범위 | 한국 육아용품, 어린이제품, 분유/이유식/어린이 식품, 수입식품 |
| 비목표 | 제품 안전 verdict, 제품 ranking, affiliate recommendation |

## 소스 레지스트리

| Source ID | 소스 | 역할 | 유용 필드 | 신선도 | 한계 |
|---|---|---|---|---|---|
| PTR-01 | KATS/SafetyKorea 인증/리콜, https://www.data.go.kr/data/15116894/openapi.do 및 https://www.safetykorea.kr/ | KC/인증/리콜 authority | 제품명, 모델명, 인증번호, 기관, 제조/수입사, 리콜 사유/조치/일자 | portal상 실시간 | no hit은 안전 증명 아님 |
| PTR-02 | Food Safety Korea/MFDS, https://www.foodsafetykorea.go.kr/ | 식품 리콜/부적합 authority | 제품, 리콜사유, 제조사, 바코드, 날짜, 회수등급, 이미지, 등록일 | service/API별 상이. API 제한 공지 가능 | 식품 lane 전용 |
| PTR-03 | MFDS 국내 부적합 API, https://www.data.go.kr/data/15063677/openapi.do | 식품 부적합 | 제품, 업체, 제조/소비기한, 바코드, 부적합 항목/결과 | source-specific | lot/date matching 필요 |
| PTR-04 | 수입식품정보마루, https://impfood.mfds.go.kr/ | 수입식품 traceability | 한/영 제품명, 유형, 해외제조업소, 제조국, 수입일, 소비기한, 원료 | live public search | traceability이지 safety clearance 아님 |
| PTR-05 | 수입식품 DB/표시 API, 예: https://www.data.go.kr/data/15073949/openapi.do 및 https://www.data.go.kr/data/15110214/openapi.do | identity enrichment | 수입신고, 제품 DB, 한글 표시사항 | portal상 실시간 | recall authority 아님 |
| PTR-06 | KDCA/NHIS, https://www.kdca.go.kr/ 및 https://www.nhis.or.kr/ | 공중보건 context | 영유아 건강/공중보건 guidance | live/static guidance | 제품별 근거 아님 |

## 데이터 파이프라인 요구사항

1. 제품 식별 intake
   - 가능한 경우 필수: 제품명, 모델명, KC/인증번호, 제조/수입사, 바코드, 로트/배치, 제조/소비기한, 제품 카테고리, 아이 나이/stage.
   - 식별이 약하면 검색보다 먼저 identity gap을 반환한다.
2. lane 라우팅
   - 어린이제품/인증/리콜 -> PTR-01.
   - 분유, 이유식, 어린이 간식 -> PTR-02/PTR-03/PTR-04/PTR-05.
   - 증상/노출 우려 -> context only + 의사/공중보건 escalation copy.
3. 정규화 record: `ProductEvidenceRecord`
   - `source_id`
   - `lane`
   - `query_identity`
   - `matched_identity`
   - `match_strength`
   - `evidence_type`
   - `what_it_proves`
   - `what_it_does_not_prove`
   - `record_date`
   - `retrieved_at`
   - `official_url`
   - `parent_action`
4. Trust Ledger
   - 인증, 리콜, 부적합, 수입식품 traceability, 제조사 공지, context를 분리한다.
   - 충돌과 unknown을 보존한다.
   - evidence를 점수로 합치지 않는다.
5. 응답
   - "현재 확인 가능한 것"과 "아직 모르는 것"을 먼저 보여준다.
   - do-now/check-next/escalate-if 행동을 준다.
   - 리콜 부재만으로 safe/dangerous를 말하지 않는다.

## 신뢰도 정책

| 라벨 | 사용 조건 |
|---|---|
| `exact-match` | 모델/인증번호/바코드/로트가 정확히 일치 |
| `probable-match` | 제품명/제조사/카테고리는 맞지만 로트/모델 누락 |
| `lane-only` | source lane은 식별됐지만 강한 record match 없음 |
| `context-only` | 공중보건/영양 guidance, 제품 record 아님 |
| `unknown` | identity insufficient |

## MVP 절단선

제품 식별 intake와 source-lane router부터 만든다. 기존 harness의 Trust Ledger 템플릿을 응답 구조로 재사용한다. live official lookup은 API 접근과 exact-match 동작 검증 뒤에 붙인다.

## 중단/정지 규칙

- live verdict 동작은 만들지 않는다. 이 컨셉은 evidence-lane/action-card 기반이어야 한다.
- exact model/lot matching을 명확히 표현할 수 없으면 중단한다.
- 텍스트 identity intake가 안정화되기 전에는 사진/라벨 OCR을 지원하지 않는다.

## 미해결

- 첫 demo 제품 카테고리: 어린이제품, 분유, 이유식, 어린이 간식 중 선택 필요.
- SafetyKorea/MFDS lane API 승인과 접근.
- 한/영 혼합 제품명과 수입제품 matching quality.
