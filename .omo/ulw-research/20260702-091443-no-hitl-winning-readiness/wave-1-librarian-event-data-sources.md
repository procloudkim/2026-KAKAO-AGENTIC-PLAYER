# Wave 1 - Official Event Data Sources

Worker: `019f202e-e4f3-7873-aa76-793bfb11ac77`

## Key Findings

- Seoul OA-15486 is an official Seoul Open Data Plaza cultural-events dataset sourced from Seoul Culture Portal. It exposes category, district, event name, place, dates, institution, target audience, fee, program, homepage, contact, coordinates, start/end date, free/paid, and event time. It is refreshed daily and was updated on `2026-07-02`.
- Seoul reservation dataset OA-2269 is official and useful as a reservation metadata overlay, but reservation should remain a link-out action to `yeyak.seoul.go.kr`, not an MCP booking claim.
- Visit Seoul API is official and broad, but key/registered URL constraints and firewall-blocked docs mean it is a later enrichment lane, not first-build dependency.
- KTO TourAPI is official and useful for broader coverage, but current endpoint inventory/use terms require a live contract check before integration.
- No single official source gives clean child suitability across all providers. Age fit must remain `source-stated`, `inferred`, or `unknown`.

## Sources

- https://data.seoul.go.kr/dataList/OA-15486/S/1/datasetView.do
- https://data.seoul.go.kr/dataList/OA-2269/S/1/datasetView.do
- https://api.visitseoul.net/main/home?lang=en
- https://api.visitseoul.net/apiinfo/apiovr/view/3?lang=en
- https://api.visitseoul.net/support/faq/list?lang=en
- https://api.visitseoul.net/apiinfo/apiovr/view/6?lang=en
- https://www.data.go.kr/data/15101578/openapi.do
- https://www.data.go.kr/data/15101897/openapi.do
- https://www.data.go.kr/en/bbs/ntc/selectNotice.do?originId=NOTICE_0000000002687

## EXPAND

- Pending explicit EXPAND/CLAIMS tail follow-up from worker because the initial reply ended with headers only.
