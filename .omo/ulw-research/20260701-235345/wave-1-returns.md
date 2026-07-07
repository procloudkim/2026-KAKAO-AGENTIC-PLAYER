# Wave 1 Returns

Date: 2026-07-01 KST
Task: three Kakao AGENTIC PLAYER MCP concepts, MECE design and data-pipeline research.

## Agents Returned

### Current Repo / Debate State

Agent: `019f1e2c-d3f1-7e01-bd81-482ed93b1d07`

- `concept/family-experience-mcp` is the current primary branch.
- `concept/pharmacy-now-mcp` is the strong fallback.
- `concept/parent-trust-mcp` is the hold/later branch unless the user explicitly chooses it.
- Missing shared artifact: branch-level source ledger and redaction rules materialized in files.
- Main tension: "data pipeline" can imply broad ingestion, but the hackathon needs a narrow MCP-ready live/fixture path.

### Source Repos

Agent: `019f1e2c-f4c8-7041-b621-7ba35476d60e`

- Holiday-pharmacy repo has reusable search orchestration, cache, mock-demotion, and Bronze/Silver/Gold ETL boundaries.
- Pharmacy MCP conversion should expose read-only candidate search, not operator ETL as public runtime.
- Baby-safety repo is strongest as a Trust Ledger / parent action-card policy engine, not as a live safety-verdict engine.
- Baby-safety repo has no MCP server/backend by design, so conversion requires a new runtime layer.

### Family Experience Sources

Agent: `019f1e2d-1c5d-7153-9a46-246fbc1d8a72`

- Best MVP backbone: `전국공연행사정보표준데이터`, because it has age, fee, reservation, date, and coordinate fields.
- Nationwide expansion: KTO TourAPI.
- Seoul layer: Seoul cultural events plus selected Seoul public-service reservation feeds.
- Strong vertical sources: forest education, science museum education, museum education/events.
- Main gap: child/family suitability is often implicit, so age-fit inference must be labeled.

### Pharmacy Sources

Agent: `019f1e2d-44cb-71d2-9217-fb299e21c6af`

- NMC/data.go.kr pharmacy API is the primary official candidate source.
- HIRA pharmacy and opening/closing APIs are registry/cross-check sources, not live-open oracles.
- Kakao Local is enrichment only for geocoding, phone, map/place URL, and destination quality.
- No official source found supports a hard `open now` claim by itself.

### Parent Trust Sources

Agent: `019f1e2d-6f42-7740-aa17-54fe86027137`

- SafetyKorea/KATS is the official KC certification and product recall lane.
- MFDS/Food Safety Korea is the official food recall, nonconformity, and child-food certification lane.
- Imported Food Information Maru is the official imported-food traceability lane.
- KDCA/NHIS are context only, not product-safety evidence.
- "No recall found" is never a safety guarantee.

### PlayMCP / MCP Constraints

Agent: `019f1e2d-9a58-7132-b026-a79828c5e71d`

- PlayMCP contest flow requires Kakao Cloud MCP endpoint, PlayMCP registration, review, public visibility switch, and final submission.
- Temporary registration is for testing, not final review.
- Approved server starts as private; must be changed to public for eligibility.
- MCP tools should be schema-bound and uniquely named. Resources/prompts can support richer context and workflow selection.
- Kakao Tools finalist path may require stricter MCP and widget-level work.

### Shared Pipeline Architecture

Agent: `019f1e2d-c485-7d00-87ad-a05712788f60`

- Recommended shared pipeline:
  source registry -> adapter contract -> raw snapshot -> normalization -> confidence/provenance -> cache/stale policy -> redaction -> user-facing failure modes.
- Branch risk deltas:
  pharmacy availability overclaiming, parent-trust safety certainty, family age-fit inference.
- This was written to `research/briefs/2026-07-01-mcp-data-pipeline-architecture-and-failure-modes.md`.

## Wave 2 Expansion Disposition

No new subagent wave was required. Wave 1 produced enough independent source coverage for synthesis. Wave 2 is a main-thread consolidation pass:

1. Resolve duplicate leads into a single source registry per branch.
2. Freeze source roles: authority, enrichment, cross-check, context, or fixture.
3. Convert EXPAND leads into branch-specific requirements and unresolved blockers.
4. Materialize the shared architecture in `concept/DATA_PIPELINE_ARCHITECTURE.md`.
5. Materialize branch research in `concept/*/MECE_RESEARCH.md`.

## Still Unresolved

- Kakao official Notion guide details behind contest links were not publicly fetched.
- User account readiness for Kakao Cloud, PlayMCP, data.go.kr, Seoul Open Data, TourAPI, and Kakao REST keys is unknown.
- Actual first implementation choice still needs the user to confirm whether to build family-first or pharmacy-first.
