# Todo 10 Code-Quality And Slop Review

Date: 2026-07-07

## Scope Reviewed

- `apps/family-experience-mcp/src/server.ts`
- `apps/family-experience-mcp/src/schemas.ts`
- `apps/family-experience-mcp/src/mcpRequestLimits.ts`
- `apps/family-experience-mcp/src/serverLifecycle.ts`
- `apps/family-experience-mcp/test/httpJson.test.ts`
- `apps/family-experience-mcp/test/mcpHttpTestHelpers.ts`

Excluded by task constraint: Todo 2 and Todo 3 scanner/source files, source ledger files, and source type files.

## Current Verdict

Todo 10 focused functionality is PASS for the abuse-control HTTP surface.

Global package verify is not green in the current workspace, so Todo 10 remains globally pending until full `verify` is green. The current failure is external to Todo 10: `test/scanClaims.test.ts` expects no findings for `scripts/eval-prompt-checks.ts`, but the claim scanner returns three findings: `전국 모든 행사`, `live now`, and `suitable for all`.

## Verification Receipts

### Focused Todo 10 Abuse-Control Tests

Scenario: MCP HTTP abuse controls and safe error shapes.

Invocation:

```powershell
npm --prefix apps/family-experience-mcp test -- --run test/httpJson.test.ts
```

Binary observable: exit code 0, 1 test file passed, 8 tests passed.

Artifact: `.omo/evidence/family-experience-market-ready-platform/task-10-fix2-focused.txt`

Covered behaviors:

- malformed JSON returns safe `parse_error`
- oversized body returns `request_body_too_large`
- stalled request body returns `request_timeout`
- unexpected route error returns bounded `internal_error`
- overlong prompt is rejected without echoing the prompt
- rapid repeated MCP requests eventually return 429
- Seoul HTTP JSON requester keeps keyed URL diagnostics redacted

### Full Package Verify

Scenario: current package-wide verification.

Invocation:

```powershell
npm --prefix apps/family-experience-mcp run verify
```

Binary observable: exit code 1.

Artifact: `.omo/evidence/family-experience-market-ready-platform/task-10-fix2-verify.txt`

Classification: external to Todo 10. TypeScript typecheck completed before tests ran. Vitest reported 17 passed test files, 1 failed test file, 108 passed tests, and 1 failed test. The failing file is `test/scanClaims.test.ts`, which belongs to Todo 2 claim-scanner scope and is explicitly out of this task's write scope.

### Static Review

Scenario: scoped static checks for escape hatches, skipped tests, logging/secret-ish terms, bounded controls, and file size.

Invocation: PowerShell `rg` and pure-LOC checks over the six Todo 10 scoped files.

Binary observable: no escape-hatch or skipped-test matches; bounded controls found; pure LOC stayed under the 250-line defect threshold.

Artifact: `.omo/evidence/family-experience-market-ready-platform/task-10-fix2-static-review.txt`

### Cleanup

Scenario: process/listener cleanup after focused tests and failed full verify.

Invocation: PowerShell process and `Get-NetTCPConnection` probes, followed by a re-check.

Binary observable: follow-up receipt shows no remaining `node --import tsx src/server.ts` process and no remaining listener for that process shape.

Artifacts:

- `.omo/evidence/family-experience-market-ready-platform/task-10-fix2-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-10-fix2-cleanup-after-stop.txt`

## Explicit Remove-AI-Slops Criteria

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Overfit behavior | PASS | Tests exercise real HTTP surfaces through a spawned `src/server.ts` server for parse error, oversized body, timeout, overlong prompt, and rate limit. Assertions check status codes and safe response shapes rather than implementation-only internals. |
| Fake seams | REVIEWED | The optional `routeRequest` argument on `createFamilyExperienceHttpServer` is used only to force the otherwise rare unexpected-route-error branch. The production `startFamilyExperienceHttpServer()` path calls `createFamilyExperienceHttpServer()` with no override, so the seam does not alter the listening runtime. |
| Test-only behavior | PASS | Request body limit, timeout, rate limit, prompt length cap, and server timeout headroom are in production source files, not conditional test branches. No `.skip` tests or test-only production flags were found in scoped static review. |
| Broad catch-all errors | PASS | The HTTP boundary catches `unknown` only at the server callback and converts it to a safe JSON-RPC `internal_error`; `readLimitedJsonBody` catches `SyntaxError` specifically for parse errors and rethrows unknown errors. Lifecycle probe fallbacks catch `Error` around OS process probes and do not expose request data. |
| Hidden listener side effects | PASS | `createFamilyExperienceHttpServer()` returns an unstarted server; `startFamilyExperienceHttpServer()` is guarded by `isMainModule()`. Focused tests spawn the server explicitly and cleanup receipts record no remaining `src/server.ts` listener after the run. |
| Unbounded body | PASS | `mcpRequestLimits.ts` enforces `64 * 1_024` bytes by `Content-Length` and streaming byte count; focused test proves 413 and no payload echo. |
| Unbounded prompt | PASS | `schemas.ts` caps loose prompt input at `MAX_FAMILY_EXPERIENCE_PROMPT_LENGTH = 4_096`; focused test proves a 20,000-character prompt is rejected safely. |
| Unbounded rate | PASS | `mcpRequestLimits.ts` enforces 60 requests per 60,000 ms per remote address; focused test sends 65 requests and observes 429. |
| Unbounded time | PASS | `mcpRequestLimits.ts` enforces `MCP_REQUEST_TIMEOUT_MS = 10_000`; `server.ts` sets request/header timeout headroom; focused test proves stalled bodies return 408. |
| Misleading success output | PASS | Abuse-control failures return non-success HTTP statuses and JSON-RPC error codes. No Todo 10 path converts rejected malformed, oversized, timed-out, or rate-limited requests into success output. |
| Stack leakage | PASS | Focused tests assert no `stack`, `SyntaxError`, or `TypeError` appears in parse, body-size, timeout, internal-error, or overlong-prompt responses. |
| Secret leakage | PASS | Scoped static review found no secret/token logging in request handlers. The only logging is startup host/port and lifecycle shutdown/error messages; tests also prove keyed Seoul source URLs are redacted. |
| Cleanup | PASS | Test cleanup closes active servers/processes, and the follow-up cleanup receipt records no remaining `src/server.ts` process or listener. |
| Oversized modules | PASS | Pure LOC counts: `server.ts` 90, `schemas.ts` 146, `mcpRequestLimits.ts` 139, `serverLifecycle.ts` 202, `httpJson.test.ts` 232, `mcpHttpTestHelpers.ts` 82. All are below the 250-line defect threshold. |

## Risks And Follow-Up Boundary

- Current package-wide `verify` is red because of Todo 2 claim-scanner behavior, not Todo 10 request-limit code. I did not touch Todo 2 or Todo 3 files.
- Todo 10 should not be marked globally complete until `npm --prefix apps/family-experience-mcp run verify` exits 0 in the shared workspace.
- The `createFamilyExperienceHttpServer({ routeRequest })` test seam is narrow and currently justified by safe 500-shape coverage. If a future reviewer rejects test injection seams categorically, replace it with an equivalent production-observable failure harness rather than weakening the error-shape test.
