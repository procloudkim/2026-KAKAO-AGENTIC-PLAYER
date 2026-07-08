# Round 0

Agenda: debate the current PRD and determine what to lock before KakaoCloud deployment and PlayMCP private testing.

Decision needed: keep one coherent, source-grounded parent decision-support product while avoiding unsupported market or contest-readiness claims.

Source hierarchy: `PRODUCT_PRD_SOT.md` > `HOST_REQUIREMENTS_SOT.md` > `QA_REPORT.md` > `SOURCE_LEDGER.md` > supporting runbook, SLO, decisions, and registration docs.

Assumptions:

- One public tool remains the launch surface.
- Cache-first runtime remains the design.
- Deployment and PlayMCP private testing are the next operational gates.

Missing evidence:

- Public HTTPS endpoint.
- Remote `/health` and `/mcp` smoke.
- PlayMCP `정보 불러오기`.
- Private starter-prompt smoke.
- Current secret-injection status in PlayMCP-in-KC console.

Risk surface:

- Product promise becomes ordinary search if it only lists events.
- Product promise becomes unsafe if it implies live availability, safety, or guaranteed suitability.
- Submission process can be misreported as complete before console evidence exists.

