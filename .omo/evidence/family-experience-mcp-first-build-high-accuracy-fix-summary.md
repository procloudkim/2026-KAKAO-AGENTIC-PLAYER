# High Accuracy Review Fix Summary

Date: 2026-07-02 KST

## Native Momus Iteration 1

Verdict: ITERATE

Fixes applied:

- Replaced invalid `.omo/drafts/...` line references in Todo 1 and Todo 5 with relevant references to implementation-stack, scope, PlayMCP readiness, and MCP docs evidence.
- Replaced hard-coded `/d/KLab/...` command paths with repo-root-relative Git Bash snippets using `REPO_ROOT="$(pwd)"`.
- Strengthened final verification so F1 checks evidence files and out-of-scope app folders, F2 checks forbidden TypeScript suppressions and skipped tests, and Todo 9 requires failing `scan:secrets` / `scan:claims` scripts rather than `grep ... || true`.

## Independent Codex CLI Iteration 1

Verdict: ITERATE

Fixes applied:

- Removed all developer-specific absolute workspace paths.
- Changed final verification text so user approval is only a post-verification release gate, not a QA dependency.
- Split age-fit labels from confidence/freshness labels. Age-fit is now only `source-stated`, `inferred`, or `unknown`; `computed` and `stale` cannot imply suitability.
- Added exact server start/wait/stop orchestration for Todo 5, Todo 7, and final F3.
- Required smoke scripts to write to `$REPO_ROOT/.omo/evidence` via `EVIDENCE_DIR`.
- Replaced weak secret grep with required `scan:secrets` and claim safety with `scan:claims`.
- Expanded F4 claim-safety checks to docs/src/test/evidence and additional Korean/English variants.

## Local Structure Recheck

- Placeholder / stale absolute path / weak grep scan: PASS.
- Todo count: 9 implementation todos.
- Final verification count: 4.
- Temporary failed review copy under `.omo/evidence/high-accuracy-codex-review-run`: removed after workspace-contained path verification.

## Native Momus Iteration 2

Verdict: ITERATE

Fixes applied:

- Repaired all PowerShell-facing Git Bash invocations to use `& 'C:\Program Files\Git\bin\bash.exe' -lc '...'`.
- Removed corrupted control-character bash path bytes introduced during an earlier mechanical replacement.
- Replaced broad historical `.omo/evidence` claim grep with scoped checks: `scan:claims` covers app docs/src/test, and simple forbidden-phrase grep covers only newly generated golden public-output JSON.
- Strengthened port cleanup checks to match only `LISTENING` rows on `:3345`.
- Changed health checks from `curl -i` observation to `curl -fsS` with saved headers/body and explicit body assertion.

## Independent Codex CLI Iteration 2

Verdict: ITERATE

Fixes applied:

- Wrapped Todo 9 `smoke:golden` in the same server start/wait/stop lifecycle used by Todo 7 and final F3.
- Corrected MCP SDK construction text from `McpServer({ ... })` to `new McpServer({ ... })`.
- Marked `reservation_url` and `contact` as optional/nullable candidate fields and required tests proving missing values do not become reservation/contact claims.
- Required `smoke:mcp -- --assert-tool-count=1` in Todo 5, F1, F3, and final success checks so exactly one public tool is machine-verified.
- Added read-only sibling workspace status receipts for `D:/KLab/workspace/2026-휴일약국` and `D:/KLab/workspace/2026-06-07-harness` when those repos exist.

## Local Structure Recheck 2

- Control-character scan: PASS.
- Developer-specific `/d/KLab` path scan: PASS.
- `wait for the user` QA dependency scan: PASS.
- Whole historical evidence claim grep scan: PASS.

## Native Momus Iteration 3

Verdict: ITERATE

Fixes applied:

- Changed final verification wave from parallel execution to explicit serial F1 -> F2 -> F3 -> F4 execution to remove port 3345 collisions between F1 and F3.
- Replaced health probes that relied on `curl -fsS` with exact `curl -w "%{http_code}"` status assertions equal to `200`.

## Independent Codex CLI Iteration 3

Verdict: ITERATE

Fixes applied:

- Applied the same serial final verification and exact HTTP 200 health assertions requested by Codex CLI.
- Added `scan:sources` to Todo 9 and F4 so no-scraping is enforceable, not only a prose guardrail.
- Required `scan:sources` to fail on unregistered/unofficial event source URLs and scraper/browser-parser dependencies/imports such as `cheerio`, `puppeteer`, `playwright`, `jsdom`, and `got-scraping`.
- Added a source-scan RED scenario and cleanup evidence paths.

## Local Structure Recheck 3

- Final parallel wave wording scan: PASS.
- Weak `curl -fsS http://127.0.0.1:3345/health` scan: PASS.
- Exact `%{http_code}` health assertions present: PASS.
- `scan:sources` references present in Todo 9 and F4: PASS.
- `git diff --check` for modified plan: PASS.

## Native Momus Iteration 4

Verdict: ITERATE

Fixes applied:

- Replaced the remaining top-level observational `curl -i` health proof references in the verification strategy with exact `curl -w "%{http_code}"` assertions equal to `200`.
- Updated primary command and real-surface proof text so health verification saves the response body and asserts the `family-experience-mcp` marker.

## Independent Codex CLI Iteration 4b

Verdict: NOT REVIEWED

Notes:

- The pass4 command was malformed before review.
- The pass4b command used the corrected `model_reasoning_effort="xhigh"` config but exited with a Codex CLI usage-limit error before producing a plan verdict.

## Native Momus Iteration 5

Verdict: ITERATE

Fixes applied:

- Added a fail-fast `LISTENING` preflight check before every command that starts the port 3345 HTTP server.
- Added missing post-kill no-`LISTENING` cleanup receipts for Task 5, Task 7, F1, and final-success.
- Kept existing cleanup receipts for Task 9 and F3 while adding their missing preflight checks.
- Replaced the vague `temporary fixture file` source-scan negative case with exact temp path `apps/family-experience-mcp/test/fixtures/unregistered-source.tmp.ts`, exact creation command, expected non-zero `scan:sources`, and cleanup receipt.

## Independent Codex CLI Iteration 5

Verdict: NOT REVIEWED

Notes:

- The pass5 snapshot command exited before review because Codex CLI required `--skip-git-repo-check` for the isolated temporary directory.

## Native Momus Iteration 6

Verdict: OKAY

Receipt:

- Agent: `019f201f-f17d-7100-88de-2999fd84dcb6`
- Blocking findings: none.
- Residual risk: implementation still depends on npm/network availability and live Seoul API shape, but the plan includes fixture fallback, adapter tests, exact HTTP 200 checks, one-tool MCP smoke, no-scraping/claim scans, port preflight, and post-kill cleanup receipts.

## Independent Codex CLI Iteration 6

Verdict: OKAY

Receipt:

- Prompt: `.omo/evidence/family-experience-mcp-first-build-codex-review-pass6-prompt.md`
- Output: `.omo/evidence/family-experience-mcp-first-build-codex-cli-review-pass6.md`
- Receipt: `.omo/evidence/family-experience-mcp-first-build-codex-cli-review-pass6.receipt`
- Model: `gpt-5.5`
- Reasoning effort: `xhigh`
- Sandbox: `read-only`
- `--skip-git-repo-check`: true
- Blocking findings: none.
- Residual risks: fixture-mode MCP proof is primary; optional Seoul live behavior still depends on key availability; final evidence capture still depends on worker discipline for named evidence files.

## Final High-Accuracy Review Status

- Native momus reviewer: OKAY.
- Independent Codex CLI reviewer: OKAY.
- High-accuracy review gate: PASS.
