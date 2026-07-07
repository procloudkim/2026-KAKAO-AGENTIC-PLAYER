# Decisions

Date: 2026-07-07

## Current Policy

- Product contract: this service presents source-grounded family experience candidates for bounded parent decision support. It is not a complete event search engine.
- Keep chat/runtime operation cache-first. Live provider calls belong in ETL proof, smoke, or cache generation, not in every user chat request.
- Keep fixture rows deterministic and visibly labeled as fixture/demo. Fixture rows prove response shape and safety, not live event freshness.
- Keep official-source boundaries only: Seoul Open Data, Culture Portal, KTO TourAPI, and national culture festival standard data. Do not add unofficial scraping pipelines or browser parsers.
- Keep source diagnostics redacted. Raw keys and keyed URLs must not appear in docs, logs, evidence, or user-visible responses.
- Do not make unsupported public claims: nationwide completeness, live freshness, reservation availability, current operation, or child suitability require an exact supporting source field.
- Public copy must carry these unsupported-claim caveats: no nationwide completeness, no real-time freshness, no reservation/open-now guarantee, and no child safety certification.

## Nationwide ETL Source Matrix

Canonical source inventory and launch coverage tiers are maintained in
`docs/SOURCE_LEDGER.md`. The summary below is non-authoritative if the files
conflict.

| Source id | Official source | Role | Key/env | Current proof status | Coverage note |
| --- | --- | --- | --- | --- | --- |
| `seoul-culture-events` | Seoul Open Data Plaza culture event API, `https://data.seoul.go.kr/` | City authority source for Seoul events | `SEOUL_OPEN_DATA_KEY`, optional `SEOUL_OPEN_DATA_BASE_URL` | Proven only when the key-backed live smoke or ETL proof is rerun in the current environment | Seoul only. |
| `culture-portal-oneview` | KCISA/Culture Portal culture information API, `https://www.culture.go.kr/portal/main/contents.do?menuNo=200155`; live route `https://apis.data.go.kr/B553457/cultureinfo/period2` | National culture-event source | `CULTURE_PORTAL_SERVICE_KEY`, `CULTURE_PORTAL_BASE_URL` | Key-backed live proof passed on 2026-07-07. See `docs/QA_REPORT.md`. | National candidate source; not proof of complete coverage. |
| `kto-tourapi-events` | Korea Tourism Organization TourAPI, `https://www.data.go.kr/data/15101578/openapi.do` | National tourism/event breadth source | `KTO_TOURAPI_SERVICE_KEY`, `KTO_TOURAPI_BASE_URL` | Candidate/cache-backed until current live proof exists | Broader tourism/event source; source-returned fields only. |
| `national-culture-festival-standard` | National culture festival standard data, `https://www.data.go.kr/data/15013104/standard.do` | Lower-freshness fallback source | `NATIONAL_CULTURE_FESTIVAL_CSV_PATH`; `PUBLIC_DATA_STANDARD_SERVICE_KEY` only for confirmed live endpoint mode | Local CSV fallback is the current canonical data path. | Useful fallback; dataset lag must remain visible. |

## Cache And Coverage Decisions

- MCP requests use cache-first nationwide routing. The chat path must not fan out to all national live APIs on every request.
- Fixture/cache evidence proves schema shape, normalization, redaction, ranking, and source attribution. It does not prove live nationwide completeness.
- A source can appear in the registry before live proof, but docs and user-visible copy must distinguish candidate/cache coverage from current key-backed live proof.
- Live proof requires a current ETL or smoke command with the relevant key present and redacted diagnostics. `docs/QA_REPORT.md` is the canonical verification summary.

## Gate Decisions

- `scan:secrets` covers app docs/source/tests/scripts/package plus current golden JSON and Todo 9 evidence only.
- `scan:claims` treats prohibited-claim examples as allowed only in guardrail, negative-test, or explicit non-promise context.
- `scan:sources` allows local endpoints, synthetic fixture/test domains, Seoul official domains, Culture Portal, KTO TourAPI, Public Data Portal URLs, official host/platform documentation URLs, and the PlayMCP-in-KC endpoint hostname pattern recorded in `docs/HOST_REQUIREMENTS_SOT.md`; it rejects scraper/browser-parser packages and unregistered event-source URLs.
- PlayMCP remains temporary/private-registration preparation only. No final review request, public switch, representative image upload, or contest submission is claimed by these docs.
- The Kakao AGENTIC PLAYER 10 official page is used only for contest flow boundaries: create/register an MCP endpoint, use temporary registration for testing, request review only when final, switch to public after approval, and submit once. It is not evidence for data coverage, freshness, reservations, open-now state, or safety certification.
