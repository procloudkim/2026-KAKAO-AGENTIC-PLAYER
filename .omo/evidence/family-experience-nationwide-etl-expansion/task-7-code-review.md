# Todo 7 Code Review
Verdict: PASS

## Findings
- CRITICAL: none.
- HIGH: none.
- MEDIUM: none.
- LOW, apps/family-experience-mcp/src/etl/cacheQuery.ts:47, maintainability warning: file is 236 pure LOC. It remains below the 250 LOC hard ceiling, but future cache-query expansion should split parsing/freshness/matching responsibilities before adding more logic. Required fix: none for Todo 7; split before future growth.
- LOW, apps/family-experience-mcp/scripts/smoke-mcp.ts:48, maintainability warning: file is 246 pure LOC. It remains below the 250 LOC hard ceiling, but the smoke harness is close enough that future scenarios should be extracted by responsibility. Required fix: none for Todo 7; split before future growth.

## Checks
- one public tool: PASS. `apps/family-experience-mcp/src/mcp.ts:12` defines `find_family_experiences`, `apps/family-experience-mcp/src/mcp.ts:13` exports that single public tool, and `apps/family-experience-mcp/src/mcp.ts:23` registers only that tool. `test/mcp.test.ts:59` and `scripts/smoke-mcp.ts:121` verify the public tool list.
- no live fan-out: PASS. The MCP request path reaches `loadSourceRecords`; when fixture mode is disabled and `etlCacheDir` exists, `apps/family-experience-mcp/src/mcpSourceRecords.ts:33` queries the cache first and returns cache success before adapter selection. The only default live adapter path in scoped code is Seoul fallback after cache failure for Seoul-like locations (`apps/family-experience-mcp/src/mcpSourceRecords.ts:47`, `apps/family-experience-mcp/src/mcpSourceRecords.ts:83`). No Culture Portal/KTO/National Festival live fan-out is on the chat request path.
- cache query behavior: PASS for Todo 7. `apps/family-experience-mcp/src/etl/cacheQuery.ts:208` requires date overlap, location match, and child selector match. `apps/family-experience-mcp/src/etl/cacheQuery.ts:220` matches location against city/venue/address plus Busan/Jeju/Seoul aliases, and `apps/family-experience-mcp/src/etl/cacheQuery.ts:241` handles child age or stage. `test/mcpCache.test.ts:116` verifies a Busan age-matched cache result bypasses a source adapter that would throw.
- missing cache: PASS. `apps/family-experience-mcp/src/etl/cacheQuery.ts:165` converts cache read failures to a cache-specific failure, and `apps/family-experience-mcp/src/etl/cacheQuery.ts:265` returns `missing_configuration` with an ETL rebuild command. `test/mcpCache.test.ts:158` covers missing cache without fixture fallback; `test/mcpCache.test.ts:187` covers stale cache.
- secret hygiene: PASS. Scoped scan for raw secret patterns found no real secrets. The only `secret` hit is adversarial fixture text in `test/mcpCache.test.ts:83`; no API key/token/password value is logged in scoped evidence.
- unsupported claims: PASS. Scoped code/evidence avoids unsupported safety, open/booking, or nationwide-complete claims. Reservation status stays `unknown` or `confirmation_needed`, and user-facing warnings say to confirm operation, fees, and booking before visiting.
- slop/overfit: PASS. Required `remove-ai-slops` and `programming` TypeScript perspectives were loaded and applied. No `as any`, `as unknown`, `@ts-ignore`, or `@ts-expect-error` appeared in scoped files. Tests are behavior-oriented through the MCP surface and cache routing; they are not deletion-only, tautological, or merely checking requested removal.
- verification commands: PASS.
  - `cd apps/family-experience-mcp && npm test -- mcp`: PASS, 3 files / 10 tests.
  - `cd apps/family-experience-mcp && npm run smoke:mcp`: PASS, in-memory endpoint, tools `[find_family_experiences]`, `result_ok=true`, `mode=live`, `candidate_count=1`, `first_source=culture_portal`.
  - `cd apps/family-experience-mcp && npm run typecheck`: PASS, `tsc --noEmit`.

## Residual Risks
- Cache selector testing covers a positive Busan age match plus missing/stale cache failures, but it does not include negative date/location/stage mismatch cases. The implementation is direct enough for Todo 7, so this is not blocking.
- `etlCacheDir` is treated as trusted configuration, not public request input. The cache file names are fixed, so no request-driven path traversal was found in scoped code.
