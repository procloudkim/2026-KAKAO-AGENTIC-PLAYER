# F4 Post-Fix Code Review: Scope Fidelity

Goal: review current post-fix source for F4 scope fidelity without relying on git diff.

Scope reviewed exactly:
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`
- `apps/family-experience-mcp/test/mcpCache.test.ts`
- `apps/family-experience-mcp/test/pipeline.test.ts`

## Review Result

codeQualityStatus: WATCH
recommendation: APPROVE
reportPath: `.omo/evidence/family-experience-nationwide-etl-expansion/F4-post-fix-code-review.md`
blockers: none

PASS. No CRITICAL or HIGH findings remain.

## Skill-Perspective Check

Ran.

- `omo:remove-ai-slops` was loaded and applied as a review perspective for overfit/slop checks.
- `omo:programming` was loaded, and its TypeScript reference was consulted for TS-specific review criteria.

Result:
- No deletion-only tests, tautological tests, implementation-constant-only tests, or requested-removal-only tests found in the scoped tests.
- No needless production data extraction/parsing/normalization found for this goal; Zod parsing is at cache/file/input boundaries and is justified.
- No TS suppressions, explicit `any`, untyped escape hatches, focused/skipped tests, or brittle prompt-string-only tests found in the five scoped files.
- No violation of either skill perspective that blocks F4 approval.

## Current-Source Scope Summary

This review used current source directly. It did not rely on git diff.

- `cacheQuery.ts` reads local cache files only via `readFile` and validates metadata/records with Zod at the file boundary (`apps/family-experience-mcp/src/etl/cacheQuery.ts:1`, `apps/family-experience-mcp/src/etl/cacheQuery.ts:10`, `apps/family-experience-mcp/src/etl/cacheQuery.ts:16`). It filters cache records by date/location/child selector (`apps/family-experience-mcp/src/etl/cacheQuery.ts:66`) and scopes synthetic records to fixture mode when cache metadata is fixture or the source URL uses reserved fixture hosts (`apps/family-experience-mcp/src/etl/cacheQuery.ts:233`, `apps/family-experience-mcp/src/etl/cacheQuery.ts:241`, `apps/family-experience-mcp/src/etl/cacheQuery.ts:245`, `apps/family-experience-mcp/src/etl/cacheQuery.ts:250`).
- `render.ts` renders fixture candidates with explicit non-live language: warnings say fixture/demo data only and not live/current (`apps/family-experience-mcp/src/pipeline/render.ts:189`), source summaries say fixture/cache candidate only (`apps/family-experience-mcp/src/pipeline/render.ts:197`), parent checks require official-source verification (`apps/family-experience-mcp/src/pipeline/render.ts:209`), and next actions prefix fixture/cache before the source URL (`apps/family-experience-mcp/src/pipeline/render.ts:217`). Live-mode text remains cautious and tells users to re-check operation, fees, and reservation at the official source (`apps/family-experience-mcp/src/pipeline/render.ts:194`, `apps/family-experience-mcp/src/pipeline/render.ts:214`, `apps/family-experience-mcp/src/pipeline/render.ts:222`).
- `smoke-mcp.ts` asserts exactly one public MCP tool, `find_family_experiences` (`apps/family-experience-mcp/scripts/smoke-mcp.ts:114`, `apps/family-experience-mcp/scripts/smoke-mcp.ts:121`). Its seeded cache is fixture metadata (`apps/family-experience-mcp/scripts/smoke-mcp.ts:164`) and synthetic records use fixture mode plus `example.invalid` URLs (`apps/family-experience-mcp/scripts/smoke-mcp.ts:181`, `apps/family-experience-mcp/scripts/smoke-mcp.ts:238`, `apps/family-experience-mcp/scripts/smoke-mcp.ts:243`, `apps/family-experience-mcp/scripts/smoke-mcp.ts:246`).
- `mcpCache.test.ts` exercises the important adversarial scope case: a synthetic cache record starts as `mode: "live"` with an `example.test` source URL (`apps/family-experience-mcp/test/mcpCache.test.ts:50`, `apps/family-experience-mcp/test/mcpCache.test.ts:57`, `apps/family-experience-mcp/test/mcpCache.test.ts:67`, `apps/family-experience-mcp/test/mcpCache.test.ts:68`), then the public tool result must be fixture-mode, labelled fixture/demo, not official-data text, and still treat cached prompt-injection-like text as data (`apps/family-experience-mcp/test/mcpCache.test.ts:117`, `apps/family-experience-mcp/test/mcpCache.test.ts:139`, `apps/family-experience-mcp/test/mcpCache.test.ts:145`, `apps/family-experience-mcp/test/mcpCache.test.ts:153`, `apps/family-experience-mcp/test/mcpCache.test.ts:166`, `apps/family-experience-mcp/test/mcpCache.test.ts:167`).
- `pipeline.test.ts` covers no-result behavior, absent reservation/contact fields, action-card fields, and absence of unsupported reservation/open/live/suitability claims (`apps/family-experience-mcp/test/pipeline.test.ts:63`, `apps/family-experience-mcp/test/pipeline.test.ts:122`, `apps/family-experience-mcp/test/pipeline.test.ts:147`, `apps/family-experience-mcp/test/pipeline.test.ts:174`).

## Scope-Fidelity Checks

- Synthetic/example cache records render as fixture/cache candidates, not live official proof: PASS.
  Evidence: `cacheQuery.ts` coerces reserved fixture hosts to fixture mode; `mcpCache.test.ts` verifies synthetic `example.test` records return `mode: "fixture"` with fixture/cache messaging; `smoke:mcp` returned `mode: "fixture"`.
- `example.invalid` / synthetic URLs are not represented as real official live URLs: PASS.
  Evidence: `smoke-mcp.ts` uses `example.invalid` only in fixture smoke records; rendered smoke output prefixes it with `fixture/cache source_url=...` and includes `not live/current`.
- No unsupported nationwide completeness/live/open/booking/safety claims: PASS.
  Evidence: scoped render text avoids availability/safety/completeness claims; tests reject reservation/open/live suitability phrases.
- No extra public MCP tool or live nationwide fan-out: PASS.
  Evidence: scoped source does not add a public tool or network fan-out; `smoke-mcp.ts` asserts a single public tool; runtime smoke returned only `find_family_experiences`.
- Tests cover scope-fidelity behavior: PASS.
  Evidence: `mcpCache.test.ts` covers cache scoping, missing cache, stale cache, no fixture fallback, and synthetic text handling; `pipeline.test.ts` covers no fabrication and unsupported-claim absence.
- No TS suppressions/explicit `any`, focused/skipped tests, or tautological/deletion-only tests: PASS.
  Evidence: scoped static scan found no `@ts-ignore`, `@ts-expect-error`, `any`, `.only`, or `.skip`; tests assert observable public behavior.

## Verification Commands

- `cd apps/family-experience-mcp && npm test -- mcp`: PASS, 3 test files passed, 10 tests passed.
- `cd apps/family-experience-mcp && npm test -- pipeline`: PASS, 2 test files passed, 12 tests passed.
- `cd apps/family-experience-mcp && npm run smoke:mcp`: PASS. Runtime listed only `find_family_experiences`, returned `result_ok: true`, `mode: "fixture"`, `candidate_count: 1`, and fixture/cache text with `example.invalid` explicitly labelled not live/current.
- `cd apps/family-experience-mcp && npm run typecheck`: PASS, `tsc --noEmit` exited 0.
- Scoped static scan for `@ts-ignore`, `@ts-expect-error`, `any`, `.only`, and `.skip`: PASS, no matches.

Pure LOC watch:
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`: 238
- `apps/family-experience-mcp/src/pipeline/render.ts`: 218
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`: 246
- `apps/family-experience-mcp/test/mcpCache.test.ts`: 210
- `apps/family-experience-mcp/test/pipeline.test.ts`: 163

## Findings By Severity

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW

1. Untracked provenance risk.
   - Evidence: `git status --short -- <five scoped files>` reports all five as `??`.
   - Impact: current source and tests pass, but these files lack committed provenance and could be omitted or overwritten outside normal review flow.
   - Disposition: non-blocking per task instruction; explicitly noted.

2. `smoke-mcp.ts` is close to the programming-skill 250 pure-LOC ceiling.
   - Evidence: measured at 246 pure LOC.
   - Impact: not a current violation, but future edits should split responsibilities or justify the size before adding meaningful lines.
   - Disposition: non-blocking watch item.

## Residual Risk

Because all five scoped files are untracked, this approval is for the current on-disk source only. It is not evidence that the same content is present in a committed branch or diff.

Final Status: PASS
