VERDICT: ITERATE

Findings:
- [high] `.omo/plans/family-experience-mcp-first-build.md:221` - final verification says F1-F4 run in parallel, but F1 and F3 both start an HTTP server on `PORT=3345` at lines 223 and 231. This can create port collisions and false cleanup failures. Fix: make F1 and F3 sequential, or merge them into one server lifecycle; only F2/F4 should run in parallel.
- [medium] `.omo/plans/family-experience-mcp-first-build.md:185` - health checks claim HTTP 200, but the command uses `curl -fsS` plus body grep, not an exact status assertion. Same pattern appears in final checks at lines 231 and 274. Fix: assert `200` explicitly with `curl -w "%{http_code}"` or saved header grep for `HTTP/... 200`.
- [medium] `.omo/plans/family-experience-mcp-first-build.md:213` - no-scraping is a stated guardrail, but final hardening only enforces secret and claim scans. A worker could still add scraper deps or unregistered unofficial URLs. Fix: add `scan:sources` or equivalent tests that enforce registry-only source URLs/adapters and reject scraper/browser-parser deps/imports.

Residual risks:
- MCP SDK surface looks acceptable against current Context7 docs: `new McpServer({ ... })`, `registerTool`, `@modelcontextprotocol/server`, `@modelcontextprotocol/node`, and `@modelcontextprotocol/client` are supported.
- PlayMCP temporary registration, optional `reservation_url`/`contact`, exact one-tool smoke, scoped claim scan, sibling read-only receipts, and Todo 9 server lifecycle regressions appear fixed.