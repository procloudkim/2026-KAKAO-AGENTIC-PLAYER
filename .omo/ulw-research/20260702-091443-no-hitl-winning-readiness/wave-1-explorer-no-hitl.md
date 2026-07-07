# Wave 1 - No-HITL Execution / QA Gaps

Worker: `019f202e-b9e6-76f2-ab35-b6fed6606151`

## Key Findings

- External Kakao/PlayMCP gates cannot be automated away: registration, review, visibility switch, one-time preliminary submission, Kakao final judging, and user voting.
- Internal manual placeholders are removable: manual demo, review checklist, parent-user advocate actionability, and devil's-advocate checks can be converted to scripted smoke/e2e/linter gates.
- Recommended additions: fixture-first contract test, overclaim linter, Top-3 shape test, provenance receipt generator, no-scrape gate, external-gate marker, server lifecycle smoke, readiness matrix.

## Key Local Evidence

- `HTML.txt:214-229`, `:234-257`, `:291-337`
- `schema/AGENTS.md:52-66`, `:85-90`
- `PLANS.md:32-40`
- `concept/DATA_PIPELINE_ARCHITECTURE.md:13-23`, `:34-43`, `:45-55`, `:64-69`, `:91-99`
- `concept/family-experience-mcp/DEBATE.md:20-23`
- `concept/family-experience-mcp/MECE_RESEARCH.md:27-83`
- `concept/family-experience-mcp/DATA_PIPELINE.md:44-49`

## EXPAND

- Pending explicit EXPAND tail follow-up from worker because the initial reply ended with an empty header.
