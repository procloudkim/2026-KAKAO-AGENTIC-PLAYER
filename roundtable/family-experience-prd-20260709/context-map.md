# Context Map

## Round 0

Agenda statement: `아이랑 어디가` should help caregivers choose up to three source-grounded family experience candidates by child age, date, region, and practical constraints.

Decision needed: keep the PRD narrow enough to pass PlayMCP review and useful enough to be more than ordinary web search.

Source hierarchy:

1. `PRODUCT_PRD_SOT.md` owns product promise, users, tool contract, output fields, data policy, claim boundaries, and launch criteria.
2. `HOST_REQUIREMENTS_SOT.md` owns KakaoCloud, PlayMCP, MCP protocol, endpoint, deployment, secret, and submission gates.
3. `QA_REPORT.md` owns current PASS, BLOCKED, and NOT CLAIMED status.
4. `SOURCE_LEDGER.md` owns source inventory, coverage tier, and unsupported source claims.
5. `DECISIONS.md`, `RUNBOOK.md`, `SLO.md`, and `PLAYMCP_TEMP_REGISTRATION.md` support operation and console entry.

Assumptions:

- The product will keep a single public tool, `find_family_experiences`, through PlayMCP private smoke.
- Runtime remains cache-first; live source calls are for ETL proof and cache generation.
- The next work should target deployment evidence, not a broader product pivot.

Missing evidence:

- No recorded public KakaoCloud HTTPS `/mcp` endpoint.
- No recorded PlayMCP `정보 불러오기` success.
- No recorded PlayMCP private starter-prompt smoke.
- Docker runtime proof remains locally blocked by unavailable Docker daemon in prior evidence.
- Representative image upload is not claimed.

Risk surface:

- PRD overclaiming: nationwide completeness, real-time freshness, reservation, open-now, child suitability, or safety certification.
- Deployment gap: a polished PRD can hide that Operations is not complete.
- Review rejection: duplicate ordinary web search unless the tool proves structured filtering, source grounding, and compact parent decision packaging.
- Secret strategy: PlayMCP-in-KC secret injection status must be confirmed before choosing deployment mode.
- Product creep: adding tools or unofficial scraping before the one-tool path is stable.

