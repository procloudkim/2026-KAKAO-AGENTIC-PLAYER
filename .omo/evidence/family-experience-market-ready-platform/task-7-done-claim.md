# Todo 7 DoneClaim

## Changed Files

- `apps/family-experience-mcp/scripts/scan-secrets.ts`
- `apps/family-experience-mcp/test/scanSecrets.test.ts`
- `apps/family-experience-mcp/test/etlNationwide.test.ts`
- `.omo/evidence/family-experience-market-ready-platform/task-7-*`

## Commands And Results

- RED CLI proof: `npm run scan:secrets -- --include ..\..\.omo\evidence\family-experience-market-ready-platform\task-7-red-mixed-placeholder-real-looking.env` from `apps/family-experience-mcp` returned exit `0` / `PASS` before fix. Artifact: `task-7-red-mixed-placeholder-cli-before-fix.txt`.
- RED focused test: `npm --prefix apps/family-experience-mcp test -- --run test/scanSecrets.test.ts` returned exit `1` before fix with exactly the two new mixed-token failures. Artifact: `task-7-red-focused-scanSecrets-before-fix.txt`.
- Post-fix mixed include: same explicit include command returned exit `1` with `key-assignment`. Artifact: `task-7-mixed-placeholder-cli-after-fix.txt`.
- Required focused test: `npm --prefix apps/family-experience-mcp test -- --run test/scanSecrets.test.ts` returned exit `0`, 10/10 tests passed. Artifact: `task-7-final-focused-scanSecrets.txt`.
- Required secret scan: `npm --prefix apps/family-experience-mcp run scan:secrets` returned exit `0`, PASS, `scanned_files: 148`. Artifact: `task-7-final-scan-secrets.txt`.
- Required full verify: `npm --prefix apps/family-experience-mcp run verify` returned exit `1`; typecheck passed, tests failed outside this Todo 7 scanner fix. Artifact: `task-7-final-verify.txt`.
- Failure classification: focused `scanClaims.test.ts` still has 2 failures; direct `scan:claims` fails on default-scan findings in `src/schemas.ts`, `test/golden.test.ts`, and `test/mcpCache.test.ts`. Artifacts: `task-7-focused-scanClaims-after-fix.txt`, `task-7-scan-claims-direct-after-fix.txt`.

## Review And Cleanup

- Scanner behavior now treats explicit `--include` input as untrusted and scopes placeholder allowance per matched occurrence.
- Pure allowed placeholder fixture remains allowed by test coverage.
- `etlNationwide.test.ts` size exception was reviewed and marked as Todo 4 integration-test refactor scope, with no behavior change.
- Temporary mixed include fixture was removed. Artifact: `task-7-cleanup.txt`.

## Residual Risks

- Full verify is not green. Remaining failures are 3 `test/golden.test.ts` response-shape/text expectations and 2 `test/scanClaims.test.ts` include-caveat status expectations caused by default claim-scan findings.
- Direct `scan:claims` still fails outside this Todo 7 secret-scanner change.
