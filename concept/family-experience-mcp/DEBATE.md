# Debate Output

Session: `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/`

## Verdict

Primary implementation candidate.

## What Changed

- Narrowed to Seoul-first, weekend/date-range Top 3.
- Promoted `find_family_experiences` as the only public first tool.
- Made age-fit confidence labels mandatory: `source-stated`, `inferred`, `unknown`.
- Deferred TourAPI/global expansion until after first PlayMCP smoke.

## Preserved Dissent

Age-fit and indoor/outdoor tags may be weak if source text is sparse. The response must show confidence labels instead of hiding inference.

## Next Implementation Step

Build a fixture-backed MCP endpoint for `find_family_experiences`, then add a Seoul open-data adapter if keys are available.

