# F2 Code Quality Rerun Review

codeQualityStatus: WATCH
recommendation: APPROVE
reportPath: `.omo/evidence/family-experience-nationwide-etl-expansion/F2-code-quality.md`
blockers: []

## Scope

Reviewed the synthetic-cache labeling fix in:
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`
- `apps/family-experience-mcp/test/mcpCache.test.ts`
- `apps/family-experience-mcp/test/pipeline.test.ts`

The app tree is mostly untracked in this repository snapshot, so review used current on-disk source, CodeGraph exploration, direct file reads, and fresh command outputs. No product files were changed by this review; this artifact and verification logs are the only writes.

## Skill Perspective Check

- `remove-ai-slops`: consulted before judging production/test slop. The fix does not add deletion-only tests, tautological tests, implementation-constant-only tests, or unnecessary production extraction/parsing. The tests exercise observable MCP/pipeline output and specifically guard against synthetic cache being rendered as live official proof.
- `programming`: consulted with the TypeScript reference before judging type safety and maintainability. `tsc --noEmit` passes, no `any`/`@ts-ignore`/`@ts-expect-error` escape hatch was found in the reviewed files, and all reviewed files are under the 250 pure-LOC defect threshold. Residual notes are LOW only.

## CRITICAL

None.

## HIGH

None. The previous blocker is closed.

Evidence:
- `apps/family-experience-mcp/scripts/smoke-mcp.ts:166` builds smoke cache metadata with `fixture: true`.
- `apps/family-experience-mcp/scripts/smoke-mcp.ts:238` and `apps/family-experience-mcp/scripts/smoke-mcp.ts:245` seed record/source mode as `fixture`.
- `apps/family-experience-mcp/scripts/smoke-mcp.ts:246` uses `https://example.invalid/...`, not a live-looking official URL.
- `apps/family-experience-mcp/src/etl/cacheQuery.ts:69` scopes matched cache records before returning.
- `apps/family-experience-mcp/src/etl/cacheQuery.ts:233` downgrades metadata-fixture or reserved example-host records to fixture records.
- `apps/family-experience-mcp/src/pipeline/render.ts:189` through `apps/family-experience-mcp/src/pipeline/render.ts:223` renders fixture candidates as fixture/cache and non-live.
- `apps/family-experience-mcp/test/mcpCache.test.ts:117` exercises the prior failure mode using synthetic `mode: "live"` / `example.test` cache input and asserts fixture output plus absence of `공식 데이터 기준`.

## MEDIUM

None.

## LOW

### Cache read errors still collapse to missing-cache UX

File:
- `apps/family-experience-mcp/src/etl/cacheQuery.ts:145`

`readFileSafely` maps any `Error` from `readFile` to `missingCacheFailure`. This is not a blocker for the synthetic labeling fix because cache path is trusted config and missing/stale/malformed paths are covered, but a later hardening pass should distinguish `ENOENT` from permission or `EISDIR` failures.

### Reviewed files are close to the size warning band

Pure LOC scan for reviewed files:
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`: 238
- `apps/family-experience-mcp/src/pipeline/render.ts`: 218
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`: 246
- `apps/family-experience-mcp/test/mcpCache.test.ts`: 210
- `apps/family-experience-mcp/test/pipeline.test.ts`: 163

No file exceeds the 250 pure-LOC defect threshold, but `smoke-mcp.ts` and `cacheQuery.ts` should be split before substantial new behavior is added.

## Verification

- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-npm-test-mcp.txt`: PASS, 3 files, 10 tests.
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-npm-test-pipeline.txt`: PASS, 2 files, 12 tests.
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-npm-test-run-all.txt`: PASS, 17 files, 87 tests.
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-smoke-mcp.txt`: PASS; output reports `mode: "fixture"`, starts with `fixture/demo 기준`, uses `example.invalid`, and labels warnings/source summary/next action as fixture/cache and non-live.
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-smoke-output-assertions.txt`: PASS; required fixture labels present and forbidden live/official/completeness phrases absent from smoke output.
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-typecheck.txt`: PASS, `tsc --noEmit`.
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-scan-claims.txt`: PASS, 120 files scanned.
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-scan-sources.txt`: PASS, 87 files scanned.
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-scan-secrets.txt`: PASS, 139 files scanned.
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-wording-scan.txt`: reviewed fixed-string hits. Remaining official wording is limited to the live renderer branch or negative tests that assert synthetic cache is not live proof.
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-escape-hatch-scan.txt`: no `any` or TypeScript suppression hits; only reviewed `catch` sites were reported.

## Final Status

APPROVE. The required blocker is closed: `npm run smoke:mcp` no longer renders seeded synthetic/example cache as live official proof, and current tests/typecheck/scans pass.
