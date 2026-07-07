# Wave 2 Expansion: Market, SDK, and Current Implementation State

Date: 2026-07-02 KST

## Leads Opened

1. PlayMCP all-page catalog scrape.
2. MCP package naming/version risk.
3. Current repo implementation-state check.
4. Stronger competitor positioning after direct catalog evidence.

## Findings

### PlayMCP catalog

The public PlayMCP catalog API returned 18 pages and 212 MCP entries. The catalog contains partial or adjacent competitors including `키즈허브`, `한국관광공사 Tour MCP`, `서울 관광`, `Korea Culture MCP`, and `ArtBridge`.

Evidence: `verify-playmcp-catalog-scrape.md`.

### MCP SDK package surface

`@modelcontextprotocol/server`, `@modelcontextprotocol/client`, and `@modelcontextprotocol/node` currently resolve to `2.0.0-beta.1`, while the legacy monolith `@modelcontextprotocol/sdk` is `1.29.0`. The implementation must pin packages and smoke exact tool/list/call behavior.

Evidence: `verify-mcp-package-metadata.md`.

### Repo state

The app directory is still absent and GREEN receipts are absent. The current asset is a high-accuracy reviewed plan, not a completed product.

Evidence: `verify-repo-implementation-state.md`.

## EXPAND

- LEAD: competitor differentiation must be updated from "no direct competitor" to "partial competitors exist; win on narrower parent-action evidence contract" - WHY: catalog evidence found `키즈허브` and culture/tourism MCP overlap - ANGLE: convert into no-HITL quality gate requirements.
- LEAD: SDK beta line may shift before or during execution - WHY: beta package surface can break implementation if not pinned - ANGLE: make version pin/protocol smoke a required execution condition.

