# Final Verification F2 Code Quality Review

## recommendation
REJECT

## verdict
needs-fix

## originalIntent
Run Final Verification F2 for `.omo/plans/family-experience-mcp-first-build.md`: verify typecheck, tests, forbidden patterns, LOC limits, dependency/import scope, MCP public tool count, and secret hygiene for `apps/family-experience-mcp` without live network or real API keys.

## desiredOutcome
User-visible outcome should be an approvable F2 code-quality gate with raw evidence in `.omo/evidence/final-F2-code-quality.txt`, this review report, and a final JSON verdict.

## userOutcomeReview
The main requested automated gates pass: `npm run typecheck && npm test -- --run` succeeds with 9 test files and 32 tests passing; no forbidden `as any`, TS suppressions, skipped/focused tests, banned scraper dependencies/imports, extra MCP tool registrations, or high-confidence raw secrets/keyed URLs were confirmed. However, F2 is not approvable because the direct `remove-ai-slops` pass found stale scaffold-era product/test/script artifacts that are no longer part of the real MCP surface and create false confidence.

## commands
- `cd apps/family-experience-mcp && npm run typecheck && npm test -- --run`
- `rg -n --pcre2 'as\s+any|@ts-ignore|@ts-expect-error|\.skip\s*\(|\.only\s*\(' src test scripts`
- Pure LOC scan over `src`, `test`, and `scripts`
- Package manifest and import scan for `cheerio`, `puppeteer`, `playwright`, `jsdom`, `got-scraping`
- Constant-resolved MCP tool registration scan for `server.registerTool`
- `npm run scan:secrets`
- Independent high-confidence raw secret/keyed URL scan over app source/test/scripts/docs and golden JSON evidence
- TypeScript AST escape-hatch scan for `any`, non-const type assertions, TS suppressions, and non-null assertions
- `npm run scan:sources`
- Slop/dead-artifact search for `getScaffoldHealth`, `scaffoldMetadata`, `todo-1-scaffold`, `http-health`, and `pending-smoke`

## findings
- BLOCKER: `apps/family-experience-mcp/src/index.ts` still exports `scaffoldMetadata` and `getScaffoldHealth` with `phase: "todo-1-scaffold"` after the real MCP HTTP server exists.
- BLOCKER: `apps/family-experience-mcp/src/http-health.ts` imports the scaffold health function but is not referenced by `package.json` scripts or the real server path.
- BLOCKER: `apps/family-experience-mcp/test/scaffold.test.ts` only asserts scaffold marker constants and `getScaffoldHealth()` output. This is implementation-mirroring, low-value coverage rather than behavior evidence for the shipped MCP surface.
- BLOCKER: `apps/family-experience-mcp/scripts/pending-smoke.ts` is an obsolete placeholder now that `smoke:mcp` and `smoke:golden` exist and are wired in `package.json`.

## warnings
- LOC hard gate passes: no source/test/script file is `>=250` pure LOC.
- Warning band files: `src/sources/seoulCulture.ts` 249, `src/server.ts` 248, `src/pipeline/normalize.ts` 248, `scripts/smoke-golden.ts` 238, `src/sources/fixture.ts` 226, `src/mcp.ts` 219.
- Single-responsibility judgment: warning-band files are mostly cohesive, but `src/server.ts`, `src/sources/seoulCulture.ts`, and `src/pipeline/normalize.ts` are one small edit from the hard ceiling and should be split before more behavior is added.
- The first independent MCP/secret scans in the raw log had false positives: constant-backed `registerTool` was initially unresolved, and `task-*` evidence filenames matched an overbroad `sk-` regex. Corrected scans are appended in the raw evidence.

## skillPerspectiveCoverage
- `omo:programming`: typecheck passed; AST scan found no `any` annotations, non-const type assertions, TS suppressions, or non-null assertions. LOC warning-band review was performed.
- `omo:remove-ai-slops`: checked for useless/tautological tests, implementation-mirroring tests, dead scaffold artifacts, forbidden suppressions, oversized modules, and unnecessary leftover production/script artifacts. The stale scaffold artifacts above are unresolved slop and block approval.

## checkedArtifactPaths
- `.omo/plans/family-experience-mcp-first-build.md`
- `.omo/evidence/final-F2-code-quality.txt`
- `.omo/evidence/golden-family-experience-happy.json`
- `.omo/evidence/golden-family-experience-missing-age.json`
- `.omo/evidence/golden-family-experience-no-result.json`
- `.omo/evidence/golden-family-experience-source-failure.json`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/src`
- `apps/family-experience-mcp/test`
- `apps/family-experience-mcp/scripts`
- `apps/family-experience-mcp/docs`

## exactEvidenceGaps
- No live network, real API key, or PlayMCP live registration was used, per user constraint.
- F3 real manual QA was not run; this report only covers F2.
- Product/test/script remediation was not performed because this run was read-only for `apps/family-experience-mcp/**`.

## residualRisks
- The warning-band files may become hard LOC failures with small follow-up changes.
- The stale scaffold files may mislead future maintainers into treating scaffold health as the current server health contract.
