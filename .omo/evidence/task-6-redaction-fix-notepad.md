# Todo 6 Redaction Fix Notepad

- Raw API-key and keyed-URL leak in request-loader diagnostics is closed by request-detail redaction.
- No public MCP/server wiring for the Seoul adapter was confirmed by gate review; the adapter remains optional.
- Tests are fixture-only and deterministic: injected loaders, saved sample payload, malformed payload, no live network requirement.
- Remaining risk: `apps/family-experience-mcp/src/sources/seoulCulture.ts` is 249 pure LOC, inside the warning band. Split before the next additive adapter change.
