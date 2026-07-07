# Wave 1 Codebase Digest: Family Experience Events

## Key Findings
- Implemented app source registry currently supports only deterministic fixture and optional Seoul cultural events.
- Seoul cultural-events adapter is real but optional and gated by `SEOUL_OPEN_DATA_KEY`.
- TourAPI, national standard event/festival data, culture/education, and forest education are documented backlog lanes, not implemented adapters.
- The concept docs recommend Seoul-first if API key readiness matters, or national standard event data if nationwide coverage matters.

## Local Evidence
- `apps/family-experience-mcp/src/sources/registry.ts:3-37`
- `apps/family-experience-mcp/docs/DECISIONS.md:7-11`
- `concept/family-experience-mcp/DATA_PIPELINE.md:5-9`
- `concept/family-experience-mcp/MECE_RESEARCH.md:18-25`
- `concept/family-experience-mcp/MECE_RESEARCH.md:75-89`

## EXPAND Markers
- LEAD: Seoul cultural events adapter.
- LEAD: TourAPI and national standard source backlog.
- LEAD: forest education vertical data.

