# Wave 1 Official Source/API Digest

Access date: 2026-07-02 KST.

## P0 Korea Product Safety

### KATS / SafetyKorea product safety certification and recall
- Official API: https://www.data.go.kr/data/15116894/openapi.do?recommendDataYn=Y
- SafetyKorea OpenAPI page: https://www.safetykorea.kr/release/openapi
- Verified scope: safety certification/confirmation records for products under Korean electrical/living/children product safety laws, plus domestic/foreign recall information.
- Useful fields from official page: product name, model name, certification number, certification agency, manufacturer/importer, recall reason, corrective action, publication date.
- Proof boundary: certification record proves only matched model/category/date/scope. Recall no-hit is not proof that a product is safe.

### KIPS / SafetyKorea reporting and recall follow-up
- Product accident reporting: https://www.safetykorea.kr/report/product
- KIPS recall implementation guidance: https://kips.kr/cntns/cntns.do?menuSn=5032
- Verified scope: product accident reporting, illegal/defective product complaints, recall implementation context.
- Proof boundary: reporting creates follow-up/investigation input. It does not immediately prove a recall or defect.

### Consumer24 and KCA
- Consumer24 Open API list: https://www.consumer.go.kr/user/ftc/consumer/openApiSvcUser/120/selectOpenApiSvcList.do
- Consumer24 safety info service: https://www.consumer.go.kr/consumer/subIndex/55.do
- KCA pacifier comparison card news: https://www.kca.go.kr/home/sub.do?menukey=4004&mode=view&no=1004003064&page=5
- Verified scope: Consumer24 aggregates product, comparison, certification, recall, hazard, and safety information; KCA publishes comparison/test content.
- Proof boundary: comparison content is static and sample-specific. It does not replace live product-specific recall/certification lookup.

## P0/P1 Korea MFDS And Adjacent Categories

### Food recall and sales suspension
- Official API: https://www.data.go.kr/data/15074318/openapi.do?recommendDataYn=Y
- Food Safety Korea endpoint: https://www.foodsafetykorea.go.kr/api/openApiInfo.do?menu_grp=MENU_GRP31&menu_no=661&show_cnt=10&start_idx=1&svc_no=I0490&svc_type_cd=API_TYPE06
- Verified scope: food recall/sales-suspension records with product, reason, manufacturer, barcode, package, manufacture date, recall method, expiration date, product photo URL, item code, recall grade/type, registration date.
- Proof boundary: food lane only; requires product/lot/date/barcode matching.

### Imported food recall
- Official API: https://www.data.go.kr/data/15095378/openapi.do?recommendDataYn=Y
- Verified scope: imported food recall/sales-suspension records with product, company, manufacture date, expiration date, reason, method, business registration, address, barcode, package, registration date, recall grade, food classification.
- Proof boundary: imported-food records only. Traceability is not a general child-product safety clearance.

### Medical devices, medicines, cosmetics
- Medical device recall/sales suspension API: https://www.data.go.kr/data/15056785/openapi.do
- Medicine recall/sales suspension API: https://www.data.go.kr/data/15059114/openapi.do
- Cosmetics restricted ingredients API: https://www.data.go.kr/data/15111772/openapi.do
- Cosmetics recall page found via MFDS data portal: https://data.mfds.go.kr/opendata/CsmtcsRtrvlSleStpgeInfo
- Verified scope: regulated adjacent categories that may apply to thermometers, aspirators, medicine/quasi-drugs, baby lotions/cosmetics, and hygiene-related products.
- Proof boundary: route by legal category. Do not query one MFDS lane and infer status in another.

## P1 Chemical Product Lane

### 초록누리 생활화학제품
- Official OpenAPI page: https://ecolife.mcee.go.kr/ecolife/infoCenter/openApi?pMENU_NO=588
- Verified scope: 생활화학제품 safety information, recalled products violating safety/labeling standards, and chemical substance information.
- Use cases: baby detergents, disinfectants, cleaners, deodorizers, repellents, adhesives or other household chemical products used around children.
- Proof boundary: not for toys, pacifiers, beds, or food unless the product legally belongs to the 생활화학제품 lane.

## P2 US/Global Context

### CPSC recalls
- Official page: https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information
- Execution artifact: `verify-cpsc-recall-api.md`
- Verified scope: public recall database has XML/JSON machine-readable access. Base JSON call worked in this session, but filtered calls showed reliability/latency risk.
- Proof boundary: US recalls are strong for US-market products, but Korea purchase/use needs jurisdiction labeling.

### SaferProducts.gov incident reports
- Official API FAQ: https://www.saferproducts.gov/FAQs/FrequentlyAskedQuestions11
- Verified scope: public incident database with incident, manufacturer, product, retailer, and victim fields; access requires an application key as basic-auth username.
- Proof boundary: incident report database is signal/context, not automatic proof of recall or defect.

### Pacifier and safe-use context
- CPSC pacifier guidance: https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Pacifiers
- AAP/HealthyChildren pacifier guidance: https://www.healthychildren.org/English/ages-stages/baby/crying-colic/Pages/Pacifiers-and-Thumb-Sucking.aspx
- CDC safe sleep page: https://www.cdc.gov/sudden-infant-death/sleep-safely/index.html
- Verified scope: physical hazard and parent-use guidance.
- Proof boundary: guidance supports safe-use card and escalation, not product-specific BPA/material status unless tied to a product-specific record.

## P3 Commerce Hook

### Kakao Shopping/Gift API
- Official page: https://shopping-developers.kakao.com/hc/ko/articles/4681097907087-%EC%B9%B4%EC%B9%B4%EC%98%A4%EC%87%BC%ED%95%91-Open-API-%EC%95%88%EB%82%B4
- Kakao corporate product update: https://www.kakaocorp.com/page/detail/11905
- Verified scope: seller/partner-oriented REST API for 상품 등록/조회, 주문 조회/처리, 문의 조회/처리. Separate use application is required. Kakao also says AI product attribute tags and recommendation areas help purchase decisions in 선물하기.
- Proof boundary: useful for discovery/handoff only. It cannot prove safety, recall, certification, or batch applicability.

## EXPAND
- LEAD: API key approval for SafetyKorea, MFDS, 초록누리 - WHY: docs prove existence, but production must verify schemas, errors, and rate limits - ANGLE: apply for keys and build one adapter at a time.
- LEAD: exact category router - WHY: same product phrase can mean child product, food, cosmetic, medical device, or chemical product - ANGLE: deterministic category-first router plus unknown path.
- LEAD: barcode support - WHY: Consumer24 and MFDS fields include barcode relevance - ANGLE: add optional barcode and product photo OCR later, after text identity intake works.
