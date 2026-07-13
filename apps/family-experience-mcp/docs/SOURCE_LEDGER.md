# Source Ledger

Date: 2026-07-08

This is the canonical launch source inventory for `find_family_experiences`.

Runtime freshness defaults to `FAMILY_EXPERIENCE_ETL_TTL_HOURS=24`, followed by a bounded `FAMILY_EXPERIENCE_ETL_STALE_GRACE_HOURS=24` for integrity-validated live last-known-good data. Grace is hard-capped at seven days and is disclosed in every served response. Missing, corrupt, fixture, source-mismatched, or grace-expired caches fail closed. The source-specific refresh values below do not silently change these runtime bounds or justify a freshness claim without current proof.
The production source set is `kto_tourapi`. The runtime serves a static bundled
cache; refresh is an external ETL, production-cache gate, image rebuild, and
redeploy operation. Provider credentials are ingestion credentials only; the
serving runtime has no provider authentication input.
The ledger records source-level proof boundaries only. It does not make any
source a complete national event index, real-time status source, reservation
system, open-now oracle, or child-safety certifier.

## Launch Coverage Tiers

| Tier | Meaning | Public-copy rule |
| --- | --- | --- |
| `tier0-fixture-only` | Deterministic fixture data proves schema, examples, and safety guardrails only. | Demo-only copy must visibly label fixture mode. |
| `registered-not-production` | Adapter or source registration exists, but the source is outside the current production source set. | Do not use it to justify production responses or breadth. |
| `tier1-source-proven-single-source` | One registered official source can support source-returned listing fields after current proof. | Source-specific copy only. |
| `tier2-multi-source-cross-region` | Multiple registered official sources have current redacted proof across more than one region. | Regional breadth copy only, with caveats. |
| `tier3-market-claim-eligible` | Current multi-source proof, freshness, redaction, and launch scans support broad public claims. | Only this tier may appear in broad public copy. No current source is tier3. |

## Inventory

| source | institution | ingestion auth | freshness | license/terms pointer | allowed claims | unsupported claims | cache TTL | proof command | launch tier | url |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `fixture-family-experience-v1` | Local deterministic fixture dataset | none | Fixture/demo only; deterministic and not live. | Synthetic demo data; no live source license. | schema smoke test; demo candidate shape; raw snapshot audit | live freshness; source-returned availability; complete national coverage; open-now status; reservation availability; child safety certification | 0 seconds | `npm --prefix apps/family-experience-mcp run verify` | `tier0-fixture-only` | https://example.invalid/family-experience/fixture-v1 |
| `seoul-culture-events` | Seoul Metropolitan Government Open Data Plaza | `SEOUL_OPEN_DATA_KEY`; optional `SEOUL_OPEN_DATA_BASE_URL` | Event listings refreshed within 6 to 24 hours when the live adapter is enabled. | Seoul Open Data Plaza public API terms. | registered adapter fields after an HTTPS proof | production availability before HTTPS transport proof; complete national coverage; real-time freshness; open-now status; reservation availability; child safety certification | 21600 seconds | `npm --prefix apps/family-experience-mcp run scan:sources` | `registered-not-production` | https://data.seoul.go.kr/ |
| `culture-portal-oneview` | Korea Culture Information Service Agency Culture Portal | `CULTURE_PORTAL_SERVICE_KEY`; optional `CULTURE_PORTAL_BASE_URL` | Nationwide culture portal event listings refreshed by the official API provider. | Public Data Portal OpenAPI terms. | event listing presence; event date; venue; source URL; source freshness; raw snapshot audit | current production responses; complete national coverage; real-time freshness; open-now status; reservation availability; child safety certification | 86400 seconds | `npm --prefix apps/family-experience-mcp run scan:sources` | `registered-not-production` | https://www.culture.go.kr/portal/main/contents.do?menuNo=200155 |
| `kto-tourapi-events` | Korea Tourism Organization TourAPI | `KTO_TOURAPI_SERVICE_KEY`; optional `KTO_TOURAPI_BASE_URL` | Nationwide tourism and event listings refreshed by the official TourAPI provider. | Public Data Portal OpenAPI terms. | `searchFestival2` listing presence/date/place/source fields; `detailIntro2` source-stated age text when `agelimit` is parseable; source freshness; raw snapshot audit | complete national coverage; real-time freshness; indoor/weather/booking status; open-now status; guaranteed age suitability; child safety certification | 86400 seconds | `npm --prefix apps/family-experience-mcp run scan:sources` | `tier1-source-proven-single-source` | https://www.data.go.kr/data/15101578/openapi.do |
| `national-culture-festival-standard` | Ministry of Culture, Sports and Tourism national culture festival standard data | `NATIONAL_CULTURE_FESTIVAL_CSV_PATH`; `PUBLIC_DATA_STANDARD_SERVICE_KEY` only for confirmed live endpoint mode | Quarterly standard dataset refresh published through the Public Data Portal. | Public Data Portal standard data terms. | event listing presence; event date; venue; source URL; source freshness; raw snapshot audit | current production responses; complete national coverage; same-day freshness; active event status after publication date; open-now status; reservation availability; child safety certification | 86400 seconds | `npm --prefix apps/family-experience-mcp run scan:sources` | `registered-not-production` | https://www.data.go.kr/data/15013104/standard.do |

## Current Coverage Decision

- Fixture rows remain `tier0-fixture-only`.
- KTO TourAPI is the only production source and remains bounded to
  `tier1-source-proven-single-source`; current proof status is canonical in
  `docs/QA_REPORT.md`.
- Seoul, Culture Portal, and national festival routes are
  `registered-not-production`. Seoul remains excluded until HTTPS transport is
  confirmed without weakening the requester policy.
- `tier2-multi-source-cross-region` is a future cache/proof state, not a
  per-source completeness claim.
- `tier3-market-claim-eligible` is not assigned. Broad public copy must not use
  complete national coverage, real-time status, open-now status, reservation
  availability, or child-safety certification language.
