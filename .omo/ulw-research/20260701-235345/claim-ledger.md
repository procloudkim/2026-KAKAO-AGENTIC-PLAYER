# Claim Ledger

Date: 2026-07-01 KST

Status labels:
- `verified`: supported by repo artifact or official source surfaced in this research session.
- `inference`: reasonable design conclusion from verified facts.
- `unresolved`: must not be claimed as true in product copy or implementation.

| ID | Claim | Status | Evidence | Decision Impact |
|---|---|---:|---|---|
| C-001 | Family experience is the current primary branch; pharmacy is fallback; parent trust is hold/later. | verified | `concept/README.md`, `research/decisions/2026-07-01-three-mcp-idea-branches.md`, `.prd-session/2026-07-01-three-concept-debate/TRACE_SUMMARY.md` | Build family first unless user overrides. |
| C-002 | PlayMCP flow requires endpoint creation, registration, review, public visibility switch, and final submission. | verified | `HTML.txt`; Kakao AGENTIC PLAYER page: https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10 | MVP must be registration-testable, not only local. |
| C-003 | Temporary PlayMCP registration is for testing, not final review. | verified | `HTML.txt`; Kakao AGENTIC PLAYER page | Demo plan needs temporary smoke plus final review path. |
| C-004 | MCP tools should expose named schema-bound operations. | verified | MCP tools spec: https://modelcontextprotocol.io/specification/2025-11-25/server/tools | Each concept should ship one public first tool. |
| C-005 | Nationwide performance/event standard data is the strongest family-event backbone because it includes age, fee, reservation, date, and coordinates. | verified | data.go.kr: https://www.data.go.kr/data/15013106/standard.do | Prefer this over broader but less age-structured feeds for nationwide family MVP. |
| C-006 | KTO TourAPI is the broadest official nationwide tourism/event expansion source. | verified | data.go.kr: https://www.data.go.kr/data/15101578/openapi.do | Add after first family MVP or for nationwide expansion. |
| C-007 | Seoul cultural events feed includes audience, fee, date, venue, contact, links, and coordinates. | verified | Seoul Open Data: https://data.seoul.go.kr/dataList/OA-15486/S/1/datasetView.do | Good Seoul-first live adapter candidate. |
| C-008 | Family age-fit is often inferred, not explicitly proven. | inference | Family source field review; branch debate files | Product must label `source-stated`, `inferred`, or `unknown`. |
| C-009 | NMC/data.go.kr pharmacy API is the primary official source for pharmacy candidates. | verified | data.go.kr: https://www.data.go.kr/data/15000576/openapi.do | Pharmacy pipeline starts with NMC. |
| C-010 | HIRA pharmacy/open-close APIs are useful cross-checks but do not prove `open now`. | verified | data.go.kr: https://www.data.go.kr/data/15001673/openapi.do and https://www.data.go.kr/data/15051043/openapi.do | HIRA must not strengthen open-status copy. |
| C-011 | Kakao Local category search can enrich pharmacy place metadata but does not expose operating hours in the documented response. | verified | Kakao Local docs: https://developers.kakao.com/docs/ko/local/dev-guide | Kakao Local is enrichment only. |
| C-012 | No source found supports a hard pharmacy `open now` guarantee by itself. | inference | NMC/HIRA/Kakao official source review | UI copy must say candidate/call-first. |
| C-013 | SafetyKorea/KATS is the official KC certification and product recall lane for child products. | verified | data.go.kr: https://www.data.go.kr/data/15116894/openapi.do and SafetyKorea: https://www.safetykorea.kr/ | Parent-trust starts with product identity and source-lane routing. |
| C-014 | MFDS/Food Safety Korea is the official food recall/nonconformity lane. | verified | Food Safety Korea API docs: https://www.foodsafetykorea.go.kr/api/main.do and recall API pages | Required for formula, baby food, snacks, and child food. |
| C-015 | "No recall found" does not mean "safe". | verified | Parent-trust source-lane review; local harness authority docs | Parent-trust must never output safe/dangerous verdicts from absence. |
| C-016 | Kakao Notion guide may contain operational details not captured in `HTML.txt`. | unresolved | Linked but not publicly fetched in this session | Treat deployment details as open until account/browser access confirms them. |
| C-017 | User currently has all required API keys. | unresolved | No environment/account check was requested or completed | Implementation must support fixture mode and key-readiness gate. |
