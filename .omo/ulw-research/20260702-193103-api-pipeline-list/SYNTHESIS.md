# API Pipeline List Synthesis

## Executive Summary

For the hackathon, the API plan should be source-registry first and adapter-thin. Each MCP should expose one highly useful tool, but internally keep official sources, cross-check sources, enrichment, context, fixtures, and stale cache separated.

Recommended build order:
1. Family experience: keep current fixture + Seoul Open Data and add one national lane only after Seoul demo is stable.
2. Holiday pharmacy: reuse NMC-first policy, add Kakao enrichment only after NMC candidate cards work, defer HIRA cross-check.
3. Parent trust: start with identity intake + Trust Ledger + source-lane router; add SafetyKorea/MFDS live lookup after exact-match tests exist.

## API List by Product

### 1. Holiday Pharmacy MCP

| Priority | API/source | Role | Use | Boundary |
|---|---|---|---|---|
| P0 | NMC national pharmacy lookup, data.go.kr `15000576` | authority | candidate pharmacy lookup by region/day/name | candidate source, not guaranteed desk-side open-now |
| P1 | HIRA pharmacy information service, data.go.kr `15001673` | cross-check | identity, phone/address/provider registry context | provider-reported registry, not live availability |
| P1 | HIRA opening/closure institution API | cross-check | closure/change conflict detection | monthly/recent semantics only |
| P2 | Kakao Local REST API | enrichment | geocoding, address normalization, place/nav links | cannot strengthen open-status claims |

### 2. Parent Trust / Baby Product Safety MCP

| Priority | API/source | Role | Use | Boundary |
|---|---|---|---|---|
| P0 | SafetyKorea/KATS/KC product safety OpenAPI | authority | KC certification, domestic recall, overseas recall records | exact model/cert scope only; no-hit is not safe |
| P0 | MFDS/Food Safety Korea I0490 recall/sales-stop API | authority | food/formula/baby-food recall or sales-stop lookup | matched product/business/lot/date only |
| P1 | Imported Food Information Maru | portal/manual + related open data | imported formula/food/container traceability | traceability and recall context, not safety clearance |
| P1 | CPSC Recalls API | authority/global | US consumer-product recall feed | US scope; useful for imported/global products |
| P1 | SaferProducts.gov API | incident signal | consumer incident reports and manufacturer comments | public reports, not official recall verdicts |
| P2 | openFDA food enforcement API | food recall context | FDA-regulated food recall/enforcement records | not medical-care decision source; update/status caveats |
| P2 | eCFR/CPSC/FDA/AAP/CDC/NIEHS guidance | context/rule pack | rule and parent-safety context | not live product-data APIs |

### 3. Family Experience / Events MCP

| Priority | API/source | Role | Use | Boundary |
|---|---|---|---|---|
| P0 | Seoul cultural events Open API OA-15486 | city authority | first live city lane with target, fee, date, venue, link/contact/coordinates | Seoul only; target-age often text, not normalized age |
| P1 | Korea TourAPI / KTO domestic tourism service | national authority | nationwide tourism/event/location/image enrichment | age-fit is not a core structured field |
| P1 | National performance/event standard data | national backbone | event title, date/time, fee, entry age, reservation info, address/lat/lon | aggregation cadence; child/family tag needs filtering |
| P2 | MCST institutional culture/event API | national enrichment | official culture/arts/sports/tourism events | broad event feed, may require child-fit inference |
| P2 | Korea Forest Service forest education program API | vertical enrichment | forest/eco/child education programs | XML; program period/target may be sparse |

## Shared Pipeline Contract

- Source registry: id, institution, URL, license, auth, freshness, allowed claims, redaction.
- Adapter: typed request/response, raw snapshot id, request hash, retrieved_at, typed failure.
- Normalization: preserve unknowns; never fake missing date, age, live-open, recall, or safety fields.
- Confidence labels: source-stated, api-returned, computed, inferred, stale, unknown.
- Output: Top 3 or smallest useful set, reason, source, retrieved_at, user checks, immediate next action.
- Secret handling: no service keys, bearer tokens, keyed URLs, raw XML, raw stack traces, or precise private coordinates in logs/output.

## Gaps

- No live API keys or live provider calls were executed in this research pass.
- SafetyKorea interface document should be fetched before implementing exact field mapping.
- HIRA live cross-check is not implemented in the holiday-pharmacy runtime.
- TourAPI and national event sources are not implemented in the family-experience app yet.

