# Wave 1 - Kakao And MCP Official Evidence

## Sources
- Kakao contest page: https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10?t_src=developers&t_ch=devtalk#process
- Kakao corporate notice: https://www.kakaocorp.com/page/detail/12059
- PlayMCP homepage and machine-readable guide: https://playmcp.kakao.com/ and https://playmcp.kakao.com/llms.txt
- PlayMCP toolbox notice: https://www.kakaocorp.com/page/detail/11865?lang=ENG
- MCP current stable specification inspected on 2026-07-02: https://modelcontextprotocol.io/specification/2025-11-25
- MCP transports: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- MCP authorization/security guidance:
  - https://modelcontextprotocol.io/docs/tutorials/security/authorization
  - https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices

## Verified Contest Facts
- Contest/application period: 2026-06-15 to 2026-07-14.
- Finalists: 20 teams are selected for the next stage.
- Finalist announcement: 2026-07-30.
- Additional development period: 2026-07-30 to 2026-08-27.
- User voting period: 2026-08-31 to 2026-09-28.
- Award date: 2026-10-23.
- Kakao public materials state that finalists can show services to KakaoTalk users through Kakao Tools.
- Review/publication flow matters: create endpoint, register server on PlayMCP, temporary/private registration is possible, final review is required before public release, and the contest submission is one-time.
- The contest page states that review can take up to seven business days and recommends early review request timing.
- Evaluation criteria include creativity, convenience, and stability.
- Finalists must perform additional Kakao Tools development and may face stricter MCP standard and widget requirements.

## Verified PlayMCP/MCP Facts
- PlayMCP is the Kakao MCP platform/playground for registering, discovering, and using MCP servers.
- Public exposure depends on review/approval; private testing and temporary registration are separate from public availability.
- PlayMCP exposes a gateway endpoint at `https://playmcp.kakao.com/mcp` for users' Toolbox-selected servers.
- MCP is a JSON-RPC-based protocol connecting hosts, clients, and servers.
- The current stable MCP transport set includes stdio and Streamable HTTP.
- Streamable HTTP uses a single endpoint such as `/mcp` and requires correct `Accept` and content-type handling.
- Official security guidance emphasizes user consent, origin validation, authorization where user-specific data is involved, and defense against confused deputy/token-passthrough risks.

## Planning Implications
- This project needs a real remote MCP endpoint plan, not only a local demo.
- Temporary PlayMCP registration is an operations milestone, not a final release.
- Final/public release must be gated by review readiness, representative image/copy readiness, source-data rights, and endpoint stability.
- Kakao Tools readiness should be tracked as a finalist-stage backlog until the exact widget/spec details are obtained.
- Claims such as "nationwide", "real-time", "reservation available", "safe for age", or "officially recommended" need direct source support or must be avoided.

## Unresolved Leads
- Kakao Notion guide at `https://kko.to/player10` may contain deployment-specific requirements.
- Kakao review policy at `https://kko.kakao.com/playmcp_review` may contain rejection criteria not visible in the contest page.
- Kakao Tools widget/spec details need direct inspection before finalist-stage planning.
