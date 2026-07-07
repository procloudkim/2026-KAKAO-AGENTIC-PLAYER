# Wave 1 Codebase Digest: Holiday Pharmacy

## Key Findings
- Runtime/data pipeline evidence lives primarily in `D:/KLab/workspace/2026-휴일약국`, while the Kakao contest repo contains concept docs.
- Primary source is data.go.kr NMC national pharmacy lookup.
- HIRA is cross-check only for identity/closure/provider registry context.
- Kakao Local is enrichment only for geocoding/place/navigation convenience.
- E-Gen public website behavior is UX reference only, not an API dependency.
- Cache, fixture, stale, and local ETL outputs must not create a live-open claim.

## Local Evidence
- `D:/KLab/workspace/2026-휴일약국/AGENTS.md:64-72`
- `D:/KLab/workspace/2026-휴일약국/AGENTS.md:95-101`
- `concept/pharmacy-now-mcp/MECE_RESEARCH.md:16-24`
- `concept/pharmacy-now-mcp/MECE_RESEARCH.md:26-58`

## EXPAND Markers
- LEAD: NMC runtime path and batch/ETL boundary.
- LEAD: HIRA deferred cross-check implementation gap.
- LEAD: deployment proof gates for live public release.

