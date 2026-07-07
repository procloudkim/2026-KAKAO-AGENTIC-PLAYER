# Wave 1 Librarian: External Official Context

## Worker
- Agent: `019f1d3c-4ca6-74b3-af67-993e23d274fc`
- Axis: external official guide and live official sources

## Access Results
- `https://playmcp.kakao.com/`: live, `200 OK`, title `PlayMCP | 새로운 AI 경험의 시작`.
- `https://playmcp.kakao.com/llms.txt`: live, `200 OK`, official agent-guide index.
- `https://kko.to/player10`: resolves to a Notion page; fetch path exposes only Notion app shell/title, not guide body.
- `https://kko.to/x2bmeS6t1w`: submission CTA short URL, live/reachable.
- `https://kko.to/agentic_player10`: mobile submission alias, redirecting in worker fetch.

## Official Platform Facts From `llms.txt`
- PlayMCP is Kakao's MCP-based tool integration platform/playground.
- Users can explore Kakao MCP servers, connect them to external AI agents such as Claude/ChatGPT, or test tools in PlayMCP AI Chat.
- Developers can register MCP servers for exposure to PlayMCP users.
- Approved MCP servers are exposed in public lists; each server has an `id`, name, description, tool list, and starter messages.
- Toolbox holds up to 10 MCP servers.
- AI Chat is useful for testing server behavior before connecting external agents.
- MCP gateway endpoint is `https://playmcp.kakao.com/mcp` and requires Bearer access token.
- Developer Console is `https://playmcp.kakao.com/console`, login required, and handles new MCP registration, modification, and review status.
- Official help links include guide, notice, review policy, Discord, privacy.

## Local Snapshot Consistency
- `HTML.txt` competition snapshot points to PlayMCP registration CTA `https://playmcp.kakao.com/`, matching the live homepage.
- `HTML.txt` guide link `https://kko.to/player10` still resolves, but body is not readable through basic fetch.
- `HTML.txt` submission CTA `https://kko.to/x2bmeS6t1w` is live/reachable.

## Additional Orchestrator Checks
- Direct `curl -L -sS -o /tmp/kko-player10.html -w ... https://kko.to/player10` resolved to `https://www.notion.so/3749b97b4888803bb90bef3ddbcfbcfb?v=4739b97b488883b3a439089fe7dfba63&p=3749b97b4888806b8564ee264e2fafde&pm=s`, status 200, content-type HTML.
- Direct `curl -L` of `https://kko.kakao.com/playmcp_review` and `https://kko.kakao.com/playmcp_guide` also returned Notion app shells. Effective review-policy URL was `https://www.notion.so/21b9b97b48888024922ec3dfcacf97e5`.
- Direct `curl` of `https://playmcp.kakao.com/llms/mcp-connection-guide.md` returned a readable external-agent gateway guide, including login, OTT, `mcporter`, OAuth token exchange, and gateway verification. This is useful for user-side agent connection, not for contest server registration.

## EXPAND Verbatim
- LEAD: `playmcp.kakao.com` homepage — WHY: current official platform entrypoint and title confirm the live site — ANGLE: direct fetch + title extraction
- LEAD: `playmcp.kakao.com/llms.txt` — WHY: official agent guide index with link map and platform description — ANGLE: fetch full text
- LEAD: `kko.to/player10` — WHY: official guide short URL from the competition page — ANGLE: direct fetch and redirect trace
- LEAD: `kko.to/x2bmeS6t1w` — WHY: current submission CTA destination on the official page — ANGLE: direct fetch and compare with page CTA
- LEAD: `kko.to/agentic_player10` — WHY: mobile submission alias from the official page — ANGLE: redirect-header check
- LEAD: local `HTML.txt` — WHY: conflict baseline for snapshot-vs-live comparison — ANGLE: line-level metadata and CTA extraction

## Lead Disposition
- Homepage: resolved.
- `llms.txt`: resolved.
- `kko.to/player10`: resolved only to Notion shell; body unresolved.
- Submission CTA: resolved as reachable/login-gated path.
- Mobile alias: redirect observed; final target not needed for current strategy.
- Local HTML conflict baseline: no conflict found for registration/submission URLs.

