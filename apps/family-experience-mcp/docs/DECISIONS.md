# Decisions

Date: 2026-07-14

## Current Policy

- Product contract, target users, output contract, and launch criteria are canonical in `docs/PRODUCT_PRD_SOT.md`.
- Keep chat/runtime operation cache-first. Live provider calls belong in ETL proof, smoke, or cache generation, not in every user chat request.
- Keep fixture rows deterministic and visibly labeled as fixture/demo. Fixture rows prove response shape and safety, not live event freshness.
- Keep official-source boundaries only: Seoul Open Data, Culture Portal, KTO TourAPI, and national culture festival standard data. Do not add unofficial scraping pipelines or browser parsers.
- Keep source diagnostics redacted. Raw keys and keyed URLs must not appear in docs, logs, evidence, or user-visible responses.
- Require location, date/date range, and exactly one child selector on every tool call. Never default Seoul/weekend, widen the requested date range, or access sources before typed input validation succeeds.
- Preserve 17 first-level regions as leaf identities. Expand only explicit `충청`, `전라`, or `경상` requests; never cross-match their north/south provinces, and fail closed on conflicting city/address evidence.
- Keep the runtime cache TTL default at 24 hours. Source-specific refresh cadence is operational metadata, not an implicit runtime override.
- Keep public health, MCP error, and log surfaces bounded: no filesystem paths, provider URLs, refresh commands, credentials, stack traces, or deployment topology.
- Build production artifacts with `npm run build` and launch only compiled JavaScript with `npm run start`.
- Keep the production source set fixed to `kto_tourapi`. KTO `searchFestival2` supplies listings and `detailIntro2` supplies source-stated age evidence only when its age limit is parseable.
- Keep Seoul Open Data registered for future proof work but outside production until an HTTPS transport is confirmed. Do not relax the HTTPS-only requester policy to make the provider fit.
- Ship a static bundled production cache. Refresh is an external KTO ETL, production-cache gate, repository-root image rebuild, and redeploy lane; the serving container does not mutate or refresh its cache.
- Publish a production ETL source set only when every configured source succeeds. Any partial or total source failure preserves the last-known-good cache.
- Build the canonical container from the repository root and run `node dist/src/server.js` directly as non-root PID 1.
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
