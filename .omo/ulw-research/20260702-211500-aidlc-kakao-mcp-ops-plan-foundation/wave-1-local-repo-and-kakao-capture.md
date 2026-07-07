# Wave 1 - Local Repo And Kakao Capture Evidence

## Sources
- Local Kakao capture: `참고문서-카카오/MCP카카오홈페이지요소.txt`
- Repo plan: `PLANS.md`
- Concept docs:
  - `concept/README.md`
  - `concept/DATA_PIPELINE_ARCHITECTURE.md`
  - `concept/family-experience-mcp/DATA_PIPELINE.md`
  - `concept/family-experience-mcp/REFINED_PROPOSAL.md`
  - `concept/family-experience-mcp/GOLDEN_PROMPTS.md`
- App docs:
  - `apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md`
  - `apps/family-experience-mcp/docs/RUNBOOK.md`
  - `apps/family-experience-mcp/docs/DECISIONS.md`
  - `apps/family-experience-mcp/docs/QA_REPORT.md`
- App source:
  - `apps/family-experience-mcp/src/mcp.ts`
  - `apps/family-experience-mcp/src/pipeline/render.ts`
  - `apps/family-experience-mcp/src/sources/types.ts`
  - `apps/family-experience-mcp/src/sources/registry.ts`

## Verified Local Facts
- The current repo plan selects `concept/family-experience-mcp` as the primary branch, with holiday pharmacy as fallback and parent-trust as hold.
- The current family-experience app has one public tool: `find_family_experiences`.
- The response contract is a top-3 recommendation package: fit reason, source/freshness, what the parent should verify, and next action.
- The source model already separates fixture, authority source, confidence labels, allowed claims, failure codes, and adapter output.
- The implementation already has a Seoul culture adapter, but fixture/demo mode is still the strongest verified path.
- The app docs intentionally limit current registration to temporary/private PlayMCP testing and prohibit unsupported public claims.
- The QA report records passing local tests/scans/smokes, but also records residual risks around live source proof, final PlayMCP review/public switch, representative image, and contest submission.

## Strong Patterns To Preserve
- One MCP service, one user-facing tool, one clear answer shape.
- Source registry before source expansion.
- Raw snapshot IDs and retrieved timestamps before ranking/rendering.
- Strict schema validation and safe Korean failure responses.
- Golden prompts that represent messy parent chat, not ideal API calls.
- Scanners for secrets, claims, and sources.
- Operator docs that clearly separate temporary/private testing from public release.

## Gaps To Close Before A Public Kakao Entry
- Live API proof: the Seoul adapter needs a real-key smoke and recorded sample redacted payload.
- Remote endpoint proof: local `/mcp` smoke is not the same as Kakao Cloud or public HTTPS endpoint readiness.
- Review policy proof: the local capture is useful, but official review policy/Notion guide details are still unresolved.
- Kakao Tools proof: finalist-stage widget/standard requirements are not yet translated into implementation tasks.
- Operations proof: health checks, logs, uptime, error budget, cache TTL, rollback, and incident handling are not yet implemented as a release gate.
