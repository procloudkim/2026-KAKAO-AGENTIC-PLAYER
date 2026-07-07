---
slug: family-experience-nationwide-etl-expansion
status: awaiting-approval
intent: clear
pending-action: wait for explicit start-work approval
approach: official-source-only nationwide ETL cache behind the existing family-experience MCP tool
---

# Draft: family-experience-nationwide-etl-expansion

## Components (topology ledger)
| id | outcome | status | evidence path |
| --- | --- | --- | --- |
| source-contracts | Nationwide source ids, config, env, diagnostics, and output schema are explicit. | active | `.omo/evidence/family-experience-nationwide-etl-expansion/task-1-contracts.txt` |
| culture-portal-adapter | KCISA/Culture Portal one-view API maps to canonical records from fixtures and live proof when keyed. | active | `.omo/evidence/family-experience-nationwide-etl-expansion/task-2-culture-portal.txt` |
| kto-tourapi-adapter | KTO TourAPI event/tourism data maps to canonical records from fixtures and live proof when keyed. | active | `.omo/evidence/family-experience-nationwide-etl-expansion/task-3-kto-tourapi.txt` |
| national-festival-adapter | National culture festival standard data maps as lower-freshness fallback. | active | `.omo/evidence/family-experience-nationwide-etl-expansion/task-4-national-festival.txt` |
| nationwide-etl-cache | Fixture/live dry-run, snapshot, normalized cache, TTL, page limits, and redacted diagnostics exist. | active | `.omo/evidence/family-experience-nationwide-etl-expansion/task-5-etl-cache.txt` |
| mcp-cache-query | Existing MCP tool queries nationwide cache and renders source-attributed parent action cards. | active | `.omo/evidence/family-experience-nationwide-etl-expansion/task-7-mcp-cache-query.txt` |
| nationwide-evals-docs | Prompt evals, docs, scans, and live/missing-key proof separate real coverage from candidate coverage. | active | `.omo/evidence/family-experience-nationwide-etl-expansion/task-8-nationwide-eval.txt` |

## Open assumptions (announced defaults)
| assumption | adopted default | rationale | reversible? |
| --- | --- | --- | --- |
| Storage | local JSONL cache first | avoids premature external DB and keeps PlayMCP MVP light | yes |
| Source policy | official public APIs/datasets only | stronger contest credibility and lower rights risk | yes, but requires new plan |
| Tool surface | keep one public MCP tool | lower Kakao chat friction and avoids tool discovery complexity | yes |
| Live proof | conditional on keys present | missing public keys should block proof, not local implementation | yes |
| Coverage claim | proven-source coverage only | prevents overclaiming nationwide completeness | yes, only after evidence |

## Findings (cited - path:lines)
- `apps/family-experience-mcp/src/sources/types.ts:3` currently limits `SOURCE_IDS` to fixture and Seoul.
- `apps/family-experience-mcp/src/types.ts:25` currently limits output source enum to fixture and Seoul Open Data.
- `apps/family-experience-mcp/src/config.ts:28` currently only parses host/port/fixture/Seoul key settings.
- `apps/family-experience-mcp/docs/DECISIONS.md` records previous wave boundary excluding nationwide sources and TourAPI.
- Seoul Open Data official page confirms culture event fields and daily update.
- data.go.kr confirms KCISA one-view culture API for nationwide culture/performance/exhibition information.
- data.go.kr confirms KTO TourAPI as nationwide tourism/event information API.
- data.go.kr confirms national culture festival standard dataset and warns national merged data can lag.

## Decisions (with rationale)
- Choose cache-first ETL, not live fan-out: faster and more stable for Kakao chat.
- Choose official-source layering: Seoul precision, Culture Portal domain fit, KTO breadth, national festival fallback.
- Keep child-age suitability as confidence-labeled convenience, not a safety claim.
- Keep the existing public MCP interface while expanding internals.
- Treat missing API keys as explicit blockers with evidence files.

## Scope IN
- Nationwide official-source source registry.
- Config/env and redaction hardening.
- Three new data adapters plus current Seoul source.
- ETL runner, raw snapshots, normalized cache, dedup, ranking.
- Cache-first MCP query.
- Nationwide eval prompts and docs.
- Final verification and source/claim/security scans.

## Scope OUT (Must NOT have)
- Scraping or browser parsing.
- Extra public MCP tool.
- Unsupported nationwide completeness, booking, open-status, or safety claims.
- External paid DB/cloud dependency for local MVP.
- Pushing or publishing.

## Open questions
- Which additional keys are already present locally beyond `SEOUL_OPEN_DATA_KEY`.
- Whether the standard festival API endpoint needs the same public data service key or a separate approval in practice.
- Whether hosted PlayMCP storage should remain filesystem cache or move to a managed store after MVP.

## Approval gate
status: awaiting-approval
Approve with:

```text
$omo:start-work .omo/plans/family-experience-nationwide-etl-expansion.md
```
