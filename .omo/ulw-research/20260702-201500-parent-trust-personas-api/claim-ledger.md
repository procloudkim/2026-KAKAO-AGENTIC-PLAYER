# Claim Ledger

| claim | risk | domains | counter-search | primary? | status |
|---|---:|---|---|---|---|
| KATS/data.go provides an API for product safety certification and domestic/foreign recall information with product/model/certification/recall fields. | high | data.go.kr, safetykorea.kr | searched SafetyKorea OpenAPI and data.go KATS API | yes | verified |
| SafetyKorea OpenAPI exposes KC certification, domestic recall, and foreign recall data. | high | safetykorea.kr | searched SafetyKorea OpenAPI pages | yes | verified |
| MFDS/Food Safety Korea provides food recall and sales-suspension OpenAPI data including barcode/date/recall reason fields and real-time update label. | high | data.go.kr, foodsafetykorea.go.kr | searched Food Safety Korea API and data.go I0490 | yes | verified |
| MFDS provides imported-food recall/sales-suspension OpenAPI with product/company/date/barcode/reason fields. | high | data.go.kr | searched imported food recall API | yes | verified |
| MFDS provides adjacent category APIs for medical-device recall, medicine recall, and cosmetics ingredient/restriction information. | normal | data.go.kr, data.mfds.go.kr | searched MFDS category APIs | yes | verified |
| 초록누리 OpenAPI supports 생활화학제품 safety information, violation/recall products, and chemical substance information. | normal | ecolife.mcee.go.kr, keiti.re.kr | searched Environment/초록누리 API pages | yes | verified |
| CPSC recall data is available as public XML/JSON, but filtered calls may be unreliable and need fallback. | normal | cpsc.gov, saferproducts.gov, local verification | executed three API calls | yes | partial |
| SaferProducts.gov incident API exposes public incident/product/manufacturer fields but needs an application key. | normal | saferproducts.gov | searched API FAQ | yes | verified |
| CPSC pacifier guidance is useful for physical-hazard and clip/string boundaries. | high | cpsc.gov | searched official pacifier guidance and regulations | yes | verified |
| AAP/HealthyChildren and CDC safe-sleep guidance are context lanes, not product-specific recall/certification proof. | high | healthychildren.org, cdc.gov | searched official pediatric/public-health pages | yes | verified |
| Kakao Shopping/Gift API can be a commerce hook but requires application/partner access and cannot be used as safety evidence. | normal | shopping-developers.kakao.com, kakaocorp.com | searched Kakao commerce API docs and corporate update | yes | verified |
| Consumer24 is promising for barcode/product safety aggregation, but service-specific API access/details still need direct docs/account confirmation. | normal | consumer.go.kr, korea.kr | searched Consumer24 Open API and service pages | partial | unresolved |
| The user-stated Philips Avent BPA timeline requires exact model/country/batch and primary-source verification before being used in a demo verdict. | high | not verified in this turn | no fresh product-specific lookup performed in this pass | no | unresolved |
