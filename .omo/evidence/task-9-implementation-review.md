# Todo 9 Implementation Review

## Programming Review

- Scope: `scan-*.ts`, `package.json`, Todo 9 docs, and evidence notes only.
- TypeScript style: no `as any`, no `@ts-ignore`, no `@ts-expect-error`, no skipped/focused tests added.
- Boundary parsing: scan scripts parse files and URL strings at the script boundary, then report typed `Finding` records.
- File size: scan scripts are intended to stay below the 250 pure-LOC cap and are single-purpose.
- Runtime behavior: no MCP runtime behavior or source adapter behavior was changed.
- LOC check: `scan-secrets.ts` 64 pure LOC, `scan-claims.ts` 77 pure LOC, `scan-sources.ts` 93 pure LOC.
- Verification: `npm run typecheck`, plain verify/scans, and server-backed GREEN verification passed.

## Remove-AI-Slops Review

- Deletion ladder: no existing runtime code was duplicated or replaced; new scripts are necessary plan gates.
- Over-defensive code: scanners intentionally scope `.omo/evidence` to golden JSON and `task-9-*` artifacts to avoid historical false positives.
- Needless abstraction: no shared scan framework was introduced; duplication across three short scripts keeps behavior obvious and reviewable.
- Hidden-cost check: scripts walk bounded app/evidence targets and skip `node_modules`.
- Missing-test risk: RED/GREEN scanner evidence is the primary behavior proof; `npm run verify` remains the regression gate for app behavior.
- Slop check: no shared framework, no broad historical evidence scan, no browser parser dependency, and no source expansion.
