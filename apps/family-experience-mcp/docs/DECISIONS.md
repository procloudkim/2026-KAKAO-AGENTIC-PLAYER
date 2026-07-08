# Decisions

Date: 2026-07-08

## Current Policy

- Product contract, target users, output contract, and launch criteria are canonical in `docs/PRODUCT_PRD_SOT.md`.
- Keep chat/runtime operation cache-first. Live provider calls belong in ETL proof, smoke, or cache generation, not in every user chat request.
- Keep fixture rows deterministic and visibly labeled as fixture/demo. Fixture rows prove response shape and safety, not live event freshness.
- Keep official-source boundaries only: Seoul Open Data, Culture Portal, KTO TourAPI, and national culture festival standard data. Do not add unofficial scraping pipelines or browser parsers.
- Keep source diagnostics redacted. Raw keys and keyed URLs must not appear in docs, logs, evidence, or user-visible responses.
- Do not make unsupported public claims. The canonical list is in `docs/PRODUCT_PRD_SOT.md`; source-specific boundaries are in `docs/SOURCE_LEDGER.md`.

## Nationwide ETL Source Matrix

Canonical source inventory and launch coverage tiers are maintained in `docs/SOURCE_LEDGER.md`.

Current ETL proof status is maintained in `docs/QA_REPORT.md`.

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
