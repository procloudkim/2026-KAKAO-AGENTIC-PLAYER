# Wave 1 - MCP TypeScript SDK / Protocol Feasibility

Worker: `019f202e-de0f-7231-9aca-747399f30ad2`

## Key Findings

- Official SDK repo at commit `1772473b7603781ca855f2595d885fe52b79bcef` documents split packages: `@modelcontextprotocol/server`, `@modelcontextprotocol/client`, and `@modelcontextprotocol/node`.
- Current documented server API uses `new McpServer(...)` and `server.registerTool(name, config, handler)`.
- `structuredContent` plus `outputSchema` is supported and is suitable for no-HITL smoke assertions.
- Tool-level recoverable errors should be returned as tool results with `isError: true`, not as protocol-level errors.
- Client smoke should use `listTools()` then `callTool()`, with bounded pagination behavior.
- Streamable HTTP/stateless serving is supported; v2 docs distinguish 2025-era and `2026-07-28` protocol behavior.
- Version risk exists because the cited package snapshot is `2.0.0-beta.1`; implementation should pin package versions and test the exact protocol era.

## Sources

- https://github.com/modelcontextprotocol/typescript-sdk/blob/1772473b7603781ca855f2595d885fe52b79bcef/docs/servers/tools.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/1772473b7603781ca855f2595d885fe52b79bcef/docs/servers/errors.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/1772473b7603781ca855f2595d885fe52b79bcef/docs/clients/calling.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/1772473b7603781ca855f2595d885fe52b79bcef/docs/server.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/1772473b7603781ca855f2595d885fe52b79bcef/docs/migration.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/1772473b7603781ca855f2595d885fe52b79bcef/docs/migration/support-2026-07-28.md

## EXPAND

- Pending explicit EXPAND/CLAIMS tail follow-up from worker because the initial reply ended with headers only.
