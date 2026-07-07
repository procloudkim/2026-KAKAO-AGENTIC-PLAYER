# family-experience-nationwide-etl-expansion - Work Plan

## TL;DR (For humans)
**What you'll get:** The family-experience MCP will move from a Seoul-first live lookup to a nationwide, official-source ETL cache that can answer by child age, date range, and region across Korea. It will still expose one simple user-facing Kakao MCP tool, but behind it the data layer will rank and package results from multiple public sources.

**Why this approach:** Nationwide coverage should not be a scraper. The winning path is a layered official-source pipeline: keep Seoul Open Data for high-quality Seoul events, add Culture Portal/KCISA for nationwide culture events, add KTO TourAPI for tourism/event breadth, and add the national culture festival standard dataset as a lower-freshness fallback.

**What it will NOT do:** It will not claim true nationwide completeness until live source proofs and cache coverage reports exist. It will not scrape unofficial pages. It will not add extra public MCP tools unless explicitly approved later.

**Effort:** Large
**Risk:** Medium - the main risk is heterogeneous official APIs, not core MCP feasibility.
**Decisions to sanity-check:** official-source-only expansion, cache-first ETL rather than live fan-out on every chat request, and one public MCP tool with richer internal source routing.

Your next move: approve execution with `$omo:start-work .omo/plans/family-experience-nationwide-etl-expansion.md`. Full execution detail follows below.

---

> TL;DR (machine): Large/Medium; deliver official-source nationwide ETL, cache, source registry, evals, docs; no scraping or unsupported coverage claims.

## Problem Definition
- Goal: expand `apps/family-experience-mcp` from Seoul-first data retrieval into a nationwide family-experience recommendation MCP for Korea.
- Context: the current app already has source-adapter boundaries, source confidence labels, Seoul Open Data support, fixture/live modes, redaction, golden tests, and PlayMCP-oriented docs.
- Constraints:
  - Keep one user-facing MCP tool unless a later plan explicitly adds more.
  - Prefer official public APIs and open datasets over scraping.
  - Preserve redaction, claim discipline, and no-secret repo hygiene.
  - Work inside the current branch and dirty tree without reverting unrelated files.
  - Nationwide must be evidence-backed; do not market a source as complete until live proof exists.
- Success criteria:
  - Nationwide source registry and config exist for Seoul, Culture Portal/KCISA, KTO TourAPI, and national culture festival standard data.
  - ETL can extract, normalize, deduplicate, cache, and query official-source event records.
  - User output remains compact, parent-friendly, and source-attributed.
  - Verification covers fixture, live-key smoke, claim scan, secret scan, source scan, and nationwide prompt evals.
- Done when:
  - `npm run verify` passes in `apps/family-experience-mcp`.
  - `npm run scan:secrets`, `npm run scan:claims`, and `npm run scan:sources` pass.
  - ETL dry-run and fixture-backed nationwide smoke pass.
  - Live proofs exist for every configured key that is present; missing keys are reported as blockers, not silent failures.

## Evidence Brief
### Authoritative Source Map
| Source | Role | API/key | Coverage fit | Freshness/limits | Source status |
| --- | --- | --- | --- | --- | --- |
| Seoul Open Data `서울시 문화행사 정보` | Existing high-quality Seoul source | `SEOUL_OPEN_DATA_KEY` | Seoul culture events with place, dates, target, fee, URL, coordinates | Daily update; Seoul only | Already integrated |
| Culture Portal/KCISA `한국문화정보원_한눈에보는문화정보조회서비스` | Primary nationwide culture/performance/exhibition source | `CULTURE_PORTAL_SERVICE_KEY` from data.go.kr | Period/area/realm/detail operations; culture event metadata | Real-time update; XML REST; auto approval | Add |
| KTO TourAPI `한국관광공사_국문 관광정보 서비스_GW` | Primary nationwide tourism/event breadth source | `KTO_TOURAPI_SERVICE_KEY` from data.go.kr | Area, location, keyword, event, image, detail info; about 260k domestic tourism records | Real-time update; dev traffic 1,000; JSON/XML | Add |
| `전국문화축제표준데이터` | National festival fallback and coverage broadener | likely data.go.kr service key or file/API download | Regular local festivals with venue/date/contact/address/lat/lng | Quarterly standard dataset; individual local data merged monthly, lag possible | Add as lower-freshness source |

### Verified Facts
- The current source registry only includes `fixture-family-experience-v1` and `seoul-culture-events`.
- `FamilyExperienceSourceAdapter`, `SourceRegistration`, `FamilyExperienceSourceRecord`, and `SourceAdapterResult` already give a reasonable extension point.
- Current `FamilyExperienceCandidate.source` schema only allows `fixture` or `seoul_open_data`; nationwide sources require schema/type expansion.
- Existing docs intentionally stopped at Seoul-first scope and explicitly excluded TourAPI, nationwide sources, scrapers, and browser parsers for the previous wave.
- Seoul Open Data culture events include category, district, name, place, date, target users, fee, homepage, contact, coordinates, start/end date, and event time; it is daily-updated and KOGL attribution-compatible.
- Culture Portal/KCISA provides nationwide culture information produced by MCST and affiliated institutions, including performance/exhibition lists, detail info, places, schedules, prices, coordinates, thumbnails, and links.
- KTO TourAPI provides nationwide tourism/event data, area/location/keyword/event/detail/image operations, and broad domestic tourism records.
- The national culture festival standard dataset provides local representative festival data and warns that monthly merged national data can have lag.

### Inferences
- A request-time live fan-out to all APIs would increase chat latency and failure variance; cache-first ETL is the safer MCP UX.
- Culture Portal/KCISA should be the first nationwide adapter because its domain directly matches culture/events.
- KTO TourAPI should be second because it improves geographic breadth and tourism event discovery, but it needs stricter image/license handling.
- National festival standard data is valuable for breadth, but its lower freshness means it should be ranked below fresher sources unless exact date/source confidence is strong.

### Unknowns
- Whether the user's current `.env` already includes `CULTURE_PORTAL_SERVICE_KEY`, `KTO_TOURAPI_SERVICE_KEY`, or a standard dataset key.
- Exact response shape variance for the Culture Portal and TourAPI endpoints in this repo environment.
- Whether PlayMCP hosted runtime storage constraints prefer JSONL cache, SQLite, or an external managed store.

### Assumptions
- The first execution should use local filesystem cache (`data/family-experience-cache/`) and JSONL snapshots before adding any external database.
- Live source proofs can be skipped only when the relevant key is absent; the missing key must be reported in evidence.
- Age-fit is never treated as an official safety certification. It is a source-stated/inferred/unknown convenience label.

### Risks
- API schemas may differ from docs or return XML-only payloads requiring robust parsing.
- Nationwide query quality can degrade if all sources are merged without deduplication and freshness ranking.
- Overclaiming nationwide completeness would weaken hackathon credibility.

## Method Selection
### Candidate Methods
1. Live fan-out on every MCP request.
   - Rejected: simple but high latency, brittle under API failure, and worse for Kakao chat UX.
2. Scrape event websites and normalize pages.
   - Rejected: rights, stability, policy, and maintenance risks; conflicts with current no-scraper guardrail.
3. Official-source cache-first ETL with deterministic normalization.
   - Chosen: best balance of reliability, speed, source traceability, and competition credibility.
4. Manual curated dataset only.
   - Rejected: useful for demo but not defensible as a scalable nationwide product.
5. Vector/RAG over raw event documents first.
   - Deferred: can help semantic matching later, but deterministic structured filtering must come first.

### Chosen Method
- Build a source-adapter ETL layer:
  - Extract raw source snapshots with redacted diagnostics.
  - Normalize into a canonical nationwide event record.
  - Deduplicate by source, title/date/venue/location hashes.
  - Enrich only with deterministic labels: child stage, indoor/outdoor, fee, region, freshness, and confidence.
  - Load into cache.
  - Query cache from the existing MCP tool and render action cards.

### Fallback Method
- If a live source key or endpoint blocks implementation, ship its adapter behind fixtures and mark live proof as BLOCKED. Do not remove the adapter contract if fixture verification passes.

### Rejection Reasons
- No broad scraping.
- No unbounded API exploration.
- No LLM-only classification for source truth.
- No new public tool surface during this plan.

## Execution Plan
### Baseline
- Current baseline: Seoul Open Data live adapter + fixture adapter + MCP result rendering.

### Controllable Variables
- Enabled sources.
- Cache TTL per source.
- ETL page limits.
- Deduplication threshold.
- Ranking weights for date, region, child stage, fee, and source freshness.
- Fixture vs live proof mode.

### Fixed Variables
- One public MCP tool.
- Official-source-only data ingestion.
- Redacted API diagnostics.
- Source-attributed user output.
- No unsupported booking/current/open/safety claims.

### Budget Ladder
- Step 1: schema/type/config only; no live calls.
- Step 2: fixture adapters and tests for every source.
- Step 3: ETL dry-run against fixtures.
- Step 4: live proof per key with max 1 page/source.
- Step 5: expanded live proof with max 3 pages/source only if Step 4 passes.

### Promotion Rule
- Promote a source from `candidate` to `active` only when fixture tests, config diagnostics, redaction tests, and at least one live proof or explicit missing-key blocker evidence exist.

### Kill Rule
- Stop adding a source in this wave if it requires unofficial scraping, exposes secrets in diagnostics, lacks stable date/location fields, or breaks existing Seoul-first behavior.

### Stop Rule
- Stop implementation when nationwide cache query returns source-attributed fixture-backed results across at least 5 Korean regions and all verification commands pass. Live all-source proof is not required to stop if keys are absent, but blockers must be explicit.

### Final Evaluation Rule
- Final evaluation is pass only if automated tests, scans, ETL dry-run, MCP smoke, and nationwide prompt eval pass, plus docs clearly distinguish proven live coverage from candidate source coverage.

### Estimates
- Wall-clock: 1-2 focused workdays for local MVP; additional time for live keys and PlayMCP deployment proof.
- RAM: <1 GB for JSONL/local cache MVP; <2 GB if SQLite FTS and larger fixtures are added.
- CPU: normal ETL, parsing, dedup, ranking, tests.
- GPU/NPU: none.
- Reboot-required resources: none expected.

## Scope
### Must have
- Source registry expansion:
  - `seoul-culture-events`
  - `culture-portal-oneview`
  - `kto-tourapi-events`
  - `national-culture-festival-standard`
- Config and `.env.example` additions:
  - `CULTURE_PORTAL_SERVICE_KEY=`
  - `CULTURE_PORTAL_BASE_URL=https://apis.data.go.kr/B553457/nopenapi/rest/publicperformancedisplays`
  - `KTO_TOURAPI_SERVICE_KEY=`
  - `KTO_TOURAPI_BASE_URL=https://apis.data.go.kr/B551011/KorService2`
  - `PUBLIC_DATA_STANDARD_SERVICE_KEY=`
  - `NATIONAL_CULTURE_FESTIVAL_BASE_URL=<data.go.kr standard API endpoint after live confirmation>`
  - `FAMILY_EXPERIENCE_SOURCE_SET=seoul,culture_portal,kto_tourapi,national_festival`
  - `FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache`
  - `FAMILY_EXPERIENCE_ETL_MAX_PAGES=1`
  - `FAMILY_EXPERIENCE_ETL_TTL_HOURS=24`
- Canonical nationwide record model with:
  - source id, source URL, retrieved timestamp, raw snapshot id
  - title, region, city/district, date range, time text
  - venue, address, coordinates when provided
  - fee text, contact, reservation/source URL
  - target age/source-stated text, child-stage inference, confidence labels
  - indoor/outdoor inference with `source-stated|inferred|unknown`
  - freshness and license/source attribution fields
- ETL runner:
  - fixture mode
  - dry-run mode
  - one-page live proof mode
  - redacted diagnostics
  - cache write/read
- Deduplication and ranking:
  - exact source id preservation
  - deterministic normalized key
  - freshness-aware source ranking
  - child age/stage filter before final ranking
- User output:
  - compact Kakao-chat-friendly cards
  - source and confidence visible
  - parent next action visible
  - no overclaiming if source says only partial information
- Docs:
  - data source matrix
  - key setup
  - ETL runbook
  - coverage limitations
  - PlayMCP operator notes

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No unofficial scraping.
- No browser parser.
- No hidden raw API keys in logs, fixtures, docs, or test output.
- No unsupported nationwide completeness claim.
- No claim that an event is safe, open, bookable, or age-certified unless the source explicitly states it.
- No extra public MCP tool surface in this plan.
- No external paid database or cloud dependency in local MVP.
- No irreversible changes to previous Seoul-first docs without preserving the old decision history.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD + Vitest and existing scripts.
- Evidence root: `.omo/evidence/family-experience-nationwide-etl-expansion/`
- Required commands:
  - `npm test`
  - `npm run verify`
  - `npm run scan:secrets`
  - `npm run scan:claims`
  - `npm run scan:sources`
  - `npm run etl:nationwide -- --fixture --dry-run`
  - `npm run etl:nationwide -- --fixture --write-cache`
  - `npm run smoke:mcp`
  - `npm run eval:nationwide-prompts`
- Live proof commands, conditional on keys:
  - `npm run etl:nationwide -- --source culture_portal --live --max-pages 1`
  - `npm run etl:nationwide -- --source kto_tourapi --live --max-pages 1`
  - `npm run etl:nationwide -- --source national_festival --live --max-pages 1`
- Missing-key handling:
  - If a key is absent, write `BLOCKED_MISSING_KEY_<SOURCE>.md` under the evidence root.
  - The plan can still pass local MVP if fixture, contract, and blocked-key evidence are complete.

## Execution strategy
### Parallel execution waves
- Wave 1: contracts, config, and source registry.
- Wave 2: source fixture adapters in parallel after Wave 1.
- Wave 3: cache/ETL runner/dedup after at least one new fixture adapter works.
- Wave 4: MCP query/ranking/output integration after cache read works.
- Wave 5: docs, evals, live proofs, and hardening.
- Final wave: compliance, code quality, real QA, scope fidelity.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2,3,4,5,6,7 | none |
| 2 | 1 | 5,6 | 3,4 |
| 3 | 1 | 5,6 | 2,4 |
| 4 | 1 | 5,6 | 2,3 |
| 5 | 2 or 3 or 4 | 6,7,8 | none |
| 6 | 5 | 7,8 | none |
| 7 | 6 | 8,9,10 | none |
| 8 | 6 | 10 | 9 |
| 9 | 1 | 10 | 8 |
| 10 | 7,8,9 | final | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Expand source contracts, config, and schema surface for nationwide official sources.
  What to do / Must NOT do: add source ids, source tiers, source roles, redaction policies, config parsing, diagnostics, candidate source enum, and `.env.example` entries. Must not wire live calls yet.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2,3,4,5,6,7
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/src/sources/types.ts:3`, `apps/family-experience-mcp/src/types.ts:25`, `apps/family-experience-mcp/src/schemas.ts:92`, `apps/family-experience-mcp/src/config.ts:28`, `apps/family-experience-mcp/.env.example`
  Acceptance criteria (agent-executable): `npm test -- config sources schemas`
  QA scenarios (name the exact tool + invocation): missing keys report `missing`; present keys report `redacted`; invalid base URL rejected. Evidence `.omo/evidence/family-experience-nationwide-etl-expansion/task-1-contracts.txt`
  Commit: Y | `feat(family-experience): add nationwide source contracts`

- [x] 2. Add Culture Portal/KCISA one-view adapter with fixtures.
  What to do / Must NOT do: implement XML REST fixture parsing for period/area/detail-compatible records; map title/date/place/price/coords/link/thumbnail only when source provides them. Must not infer booking or safety.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 5,6
  References (executor has NO interview context - be exhaustive): Culture Portal guide endpoint `https://apis.data.go.kr/B553457/nopenapi/rest/publicperformancedisplays/period`, `apps/family-experience-mcp/src/sources/seoulCulture.ts` as adapter pattern, `apps/family-experience-mcp/test/seoulCulture.test.ts` as test pattern
  Acceptance criteria (agent-executable): `npm test -- culturePortal`
  QA scenarios (name the exact tool + invocation): valid fixture maps to canonical record; malformed XML returns `source_invalid_response`; missing key returns `missing_key`; diagnostics redact service key. Evidence `.omo/evidence/family-experience-nationwide-etl-expansion/task-2-culture-portal.txt`
  Commit: Y | `feat(family-experience): add culture portal adapter`

- [x] 3. Add KTO TourAPI event adapter with fixtures.
  What to do / Must NOT do: implement JSON/XML tolerant parser for TourAPI event/search/detail data, preserving content id, area, dates, address, map coordinates, event URL fields, and image license caution. Must not use images as primary proof unless license and URL are source-returned.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 5,6
  References (executor has NO interview context - be exhaustive): KTO TourAPI data.go.kr service, `apps/family-experience-mcp/src/sources/seoulCulture.ts`, `apps/family-experience-mcp/test/fixtures/`
  Acceptance criteria (agent-executable): `npm test -- ktoTourApi`
  QA scenarios (name the exact tool + invocation): event fixture maps; empty items returns `no_match`; upstream error maps to retryable source failure; key is redacted. Evidence `.omo/evidence/family-experience-nationwide-etl-expansion/task-3-kto-tourapi.txt`
  Commit: Y | `feat(family-experience): add kto tourapi adapter`

- [x] 4. Add national culture festival standard dataset adapter with fixtures.
  What to do / Must NOT do: map festival standard data into lower-freshness canonical records with explicit freshness warning. Must not rank stale or broad festival data above fresher exact event sources by default.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 5,6
  References (executor has NO interview context - be exhaustive): `전국문화축제표준데이터`, fields festival name/place/start/end/content/org/phone/homepage/address/lat/lng/data reference date
  Acceptance criteria (agent-executable): `npm test -- nationalFestival`
  QA scenarios (name the exact tool + invocation): current date-range fixture maps; old festival receives stale/low-freshness label; missing coordinates allowed; data lag warning rendered. Evidence `.omo/evidence/family-experience-nationwide-etl-expansion/task-4-national-festival.txt`
  Commit: Y | `feat(family-experience): add national festival adapter`

- [x] 5. Build nationwide ETL runner and cache.
  What to do / Must NOT do: add `etl:nationwide` script, raw snapshot JSONL, normalized cache JSONL, cache metadata, source-set selection, dry-run/write-cache modes, max-pages, TTL, and redacted diagnostics. Must not require external database for local MVP.
  Parallelization: Wave 3 | Blocked by: 2 or 3 or 4 | Blocks: 6,7,8
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/package.json`, `apps/family-experience-mcp/scripts/smoke-live.ts`, `apps/family-experience-mcp/src/sources/types.ts`
  Acceptance criteria (agent-executable): `npm run etl:nationwide -- --fixture --dry-run && npm run etl:nationwide -- --fixture --write-cache`
  QA scenarios (name the exact tool + invocation): fixture dry-run writes no cache; write-cache creates metadata and normalized records; invalid source id fails closed; logs redact keys. Evidence `.omo/evidence/family-experience-nationwide-etl-expansion/task-5-etl-cache.txt`
  Commit: Y | `feat(family-experience): add nationwide etl cache`

- [x] 6. Add canonical normalization, deduplication, and source-confidence ranking.
  What to do / Must NOT do: normalize all source records into one canonical model, deduplicate title/date/venue/location collisions, rank fresher exact-location records above broad/stale records, and preserve source references. Must not collapse distinct events with same title but different date/location.
  Parallelization: Wave 3 | Blocked by: 5 | Blocks: 7,8
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/src/pipeline/normalize.ts`, `apps/family-experience-mcp/src/pipeline/rank.ts`, `apps/family-experience-mcp/test/pipeline.test.ts`
  Acceptance criteria (agent-executable): `npm test -- pipeline`
  QA scenarios (name the exact tool + invocation): duplicate records merge with all sources retained; stale fallback demoted; exact child-stage match promoted; no-result remains explicit. Evidence `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-normalize-rank.txt`
  Commit: Y | `feat(family-experience): rank nationwide official sources`

- [x] 7. Wire MCP query to cache-first nationwide source routing.
  What to do / Must NOT do: preserve the existing public tool input, query cache by location/date/child selector, then optionally fall back to existing live Seoul adapter only when configured. Must not fan out live nationwide APIs on every chat request.
  Parallelization: Wave 4 | Blocked by: 6 | Blocks: 8,10
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/src/mcp.ts`, `apps/family-experience-mcp/src/schemas.ts`, `apps/family-experience-mcp/scripts/smoke-mcp.ts`, `apps/family-experience-mcp/test/mcp.test.ts`
  Acceptance criteria (agent-executable): `npm run smoke:mcp`
  QA scenarios (name the exact tool + invocation): "부산 이번 주말 4살 실내" returns cache-backed result; "제주 초등학생 무료" returns source-attributed candidate or no-results; missing cache returns actionable failure. Evidence `.omo/evidence/family-experience-nationwide-etl-expansion/task-7-mcp-cache-query.txt`
  Commit: Y | `feat(family-experience): query nationwide cache from mcp`

- [x] 8. Add nationwide prompt eval set and golden result coverage.
  What to do / Must NOT do: add at least 40 prompts covering Seoul, Busan, Daegu, Daejeon, Gwangju, Incheon, Gyeonggi, Gangwon, Chungcheong, Jeolla, Gyeongsang, Jeju, infant/toddler/preschool/school_age, free/paid/indoor/outdoor/no-result cases. Must not overfit to only happy-path prompts.
  Parallelization: Wave 5 | Blocked by: 6 | Blocks: 10
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/scripts/eval-prompts.ts`, `apps/family-experience-mcp/test/golden.test.ts`, `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md`
  Acceptance criteria (agent-executable): `npm run eval:nationwide-prompts`
  QA scenarios (name the exact tool + invocation): prompt eval asserts source attribution, date range respect, child selector respect, no unsupported safety/open/booking claims. Evidence `.omo/evidence/family-experience-nationwide-etl-expansion/task-8-nationwide-eval.txt`
  Commit: Y | `test(family-experience): add nationwide prompt evals`

- [x] 9. Update docs, runbook, and source/claim scanners for nationwide scope.
  What to do / Must NOT do: document the new source matrix, key setup, cache operation, coverage limitations, live-proof requirements, and PlayMCP deployment notes. Must preserve the previous Seoul-first decision history as historical context rather than silently deleting it.
  Parallelization: Wave 5 | Blocked by: 1 | Blocks: 10
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/docs/DECISIONS.md`, `apps/family-experience-mcp/docs/RUNBOOK.md`, `apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md`, `apps/family-experience-mcp/scripts/scan-claims.ts`, `apps/family-experience-mcp/scripts/scan-sources.ts`
  Acceptance criteria (agent-executable): `npm run scan:claims && npm run scan:sources && npm run scan:secrets`
  QA scenarios (name the exact tool + invocation): docs mention official sources only; docs distinguish proven live coverage from candidate/cache coverage; scanners reject scraper/browser-parser claims. Evidence `.omo/evidence/family-experience-nationwide-etl-expansion/task-9-docs-scans.txt`
  Commit: Y | `docs(family-experience): document nationwide etl operation`

- [x] 10. Run final local and conditional live verification.
  What to do / Must NOT do: run the full app verification suite, ETL fixture proof, MCP smoke, scans, and live one-page proofs for any keys present. Must not fail the plan solely because a key is absent; write explicit blocked-key evidence instead.
  Parallelization: Wave 5 | Blocked by: 7,8,9 | Blocks: final
  References (executor has NO interview context - be exhaustive): `apps/family-experience-mcp/package.json`, `apps/family-experience-mcp/docs/RUNBOOK.md`, `.env.example`
  Acceptance criteria (agent-executable): `npm run verify && npm run etl:nationwide -- --fixture --dry-run && npm run smoke:mcp && npm run scan:secrets && npm run scan:claims && npm run scan:sources`
  QA scenarios (name the exact tool + invocation): live source proof per present key; blocked evidence per missing key; Docker build still succeeds if existing deploy path is in scope. Evidence `.omo/evidence/family-experience-nationwide-etl-expansion/task-10-final-local-live.txt`
  Commit: N | verification only

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. Plan compliance audit
  - Verify every todo has evidence, acceptance criteria, and no skipped guardrail.
- [x] F2. Code quality review
  - Review source contracts, adapter boundaries, cache format, parser failure paths, and type/schema drift.
- [x] F3. Real manual QA
  - Run local MCP smoke with nationwide cache and sample Korean parent prompts.
- [x] F4. Scope fidelity
  - Confirm no scraping, no extra public tool, no unsupported nationwide completeness claim, and no leaked secrets.

## Commit strategy
- Prefer one commit per todo when the todo changes code/docs materially.
- Use conventional commits listed in each todo.
- Do not commit verification-only evidence unless the user requests a commit.
- Do not push unless explicitly requested.
- Never revert unrelated existing dirty-tree files.

## Success criteria
- One public MCP tool remains the user-facing entry point.
- Cache-first nationwide query works from fixtures.
- New official-source adapters have fixture tests and redaction tests.
- Live one-page proofs exist for keys that are present; missing keys are explicit blockers.
- Seoul-first behavior remains covered.
- Scans reject secret leaks, scraper claims, and unsupported claim language.
- Docs explain source hierarchy, limitations, key setup, ETL operation, and PlayMCP readiness.
