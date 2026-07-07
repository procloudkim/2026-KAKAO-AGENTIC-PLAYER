# Claim Ledger

Status key: `V` verified, `I` inference, `U` unresolved, `C` corrected.

| ID | Status | Claim | Evidence | Planning Impact |
| --- | --- | --- | --- | --- |
| C01 | V | AIDLC has Inception, Construction, and Operations phases. | https://github.com/awslabs/aidlc-workflows at pinned SHA `e49341dbeb8af82758dd85e96ed7fe9bcf38a447`; inspected `README.md`. | Map MCP work into inception/build/ops gates. |
| C02 | V | AIDLC stresses question-driven, approval-gated, adaptive, context-aware work. | Same repo; inspected `README.md` and `docs/WORKING-WITH-AIDLC.md`. | Keep explicit approval for plan execution and public release. |
| C03 | V | AIDLC evaluator provides run/test/check/report style validation. | Same repo; inspected `scripts/aidlc-evaluator/README.md`. | Use local `verify`, smoke, scans, and PlayMCP checks as equivalent gates. |
| C04 | V | Kakao AGENTIC PLAYER 10 process includes registration, finalist selection, additional development, public voting, and awards. | https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10?t_src=developers&t_ch=devtalk#process and https://www.kakaocorp.com/page/detail/12059 | Plan must include review/public timing, not only code completion. |
| C05 | C | Any 2025 contest dates are wrong for this event. | Official Kakao pages show 2026 dates; current date is 2026-07-02. | Use absolute 2026 dates in all plan artifacts. |
| C06 | V | Review/publication is separate from temporary/private PlayMCP registration. | Contest page, local capture `참고문서-카카오/MCP카카오홈페이지요소.txt`, app docs `PLAYMCP_TEMP_REGISTRATION.md`. | Treat temporary registration as an ops milestone, not finish line. |
| C07 | V | PlayMCP has a gateway endpoint and approved public server concept. | https://playmcp.kakao.com/llms.txt fetched on 2026-07-02. | Design for hosted MCP and user Toolbox flow. |
| C08 | V | Current stable MCP spec includes Streamable HTTP with a single endpoint such as `/mcp`. | https://modelcontextprotocol.io/specification/2025-11-25 and `/basic/transports`. | Public endpoint should implement/verify MCP HTTP expectations. |
| C09 | V | Official MCP guidance highlights security, consent, origin validation, and auth for user-specific data. | MCP authorization/security docs. | Do not ignore auth/origin/logging just because the demo is no-auth. |
| C10 | V | Repo current primary branch is family-experience MCP. | `PLANS.md`, `research/decisions/2026-07-01-three-mcp-idea-branches.md`. | Use family-experience as the main plan unless user overrides. |
| C11 | V | Family-experience app currently exposes one public tool, `find_family_experiences`. | `apps/family-experience-mcp/src/mcp.ts`. | Preserve simple tool surface for Kakao chat usability. |
| C12 | V | Local QA is fixture/demo strong but live-source/public-release incomplete. | `apps/family-experience-mcp/docs/QA_REPORT.md`, `DECISIONS.md`, `RUNBOOK.md`. | Next implementation wave must prove live data and remote operations. |
| C13 | I | The strongest hackathon edge is not novelty alone but reliable chat-to-action packaging with source/freshness/confidence. | Synthesis from Kakao criteria, PlayMCP constraints, local user story, and repo architecture. | Optimize for convenience/stability plus defensible source packaging. |
| C14 | U | Kakao Tools widget and stricter MCP requirements are not fully known from inspected sources. | Contest FAQ mentions additional development; exact spec not yet inspected. | Keep finalist-stage backlog and do not overclaim readiness. |
| C15 | U | Kakao Notion guide/review policy may add mandatory fields or rejection criteria. | Leads: `https://kko.to/player10`, `https://kko.kakao.com/playmcp_review`. | Inspect before final public submission plan. |
