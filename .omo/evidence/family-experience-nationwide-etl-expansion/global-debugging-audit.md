# Global Debugging Audit - Family Experience Nationwide ETL/MCP

recommendation: PASS

blockers:
- None for the requested runtime debugging hypothesis audit.

originalIntent:
- Audit the final family-experience nationwide ETL/MCP state from a debugging perspective.
- Name and test at least three plausible failure hypotheses against actual artifacts.
- Write this report to `.omo/evidence/family-experience-nationwide-etl-expansion/global-debugging-audit.md`.
- Do not edit product files.

desiredOutcome:
- The shipped local/runtime state should not silently fall back to fake data when cache is missing.
- Synthetic or fixture cache must not be presented as live official proof.
- Prompt evaluation must exercise prompt text, including adversarial/wrong-region prompt cases.
- Redaction and scanners must not allow raw provider keys, scraper/browser-parser claims, or unsupported nationwide completeness claims through the reviewed product surface.
- Any caveat must be explicit rather than hidden behind stale PASS prose.

userOutcomeReview:
- PASS. Fresh runtime checks support the user-visible outcome for the cache-first local MVP.
- Missing cache returns an actionable `missing_configuration` error with zero candidates, not fixture fallback.
- Seeded synthetic cache returns `mode: "fixture"` with fixture/cache and not-live wording.
- Nationwide prompt eval passes 42/42 on the intended fixture set, and a temporary wrong-region prompt probe fails as expected, proving the prompt path is not merely replaying the fixture `request`.
- Secret redaction and product-surface scanners pass. A direct target-evidence regex found one old synthetic placeholder command in evidence, not a raw provider key, and the same artifact records `leakedSecrets: false`.
- Scanner scope caveat: built-in scanners do not scan every nested file under this nationwide evidence directory. This audit compensated with direct target-evidence scans. For a future release gate, add an explicit nested-evidence scan command or extend scanner scope.

## Problem Definition

goal:
- Verify final runtime behavior and evidence for the nationwide ETL/MCP expansion by testing plausible failure hypotheses.

context:
- Repo: `D:\KLab\2026-Hackathon\2026-07-KAKAO-AGENTIC-PLAY`
- App: `apps/family-experience-mcp`
- Runtime: Node `v24.15.0`, npm `11.12.1`; `tsx` and `vitest` are installed.
- CodeGraph is present and was used before targeted file inspection.

constraints:
- No product-file edits.
- Use actual artifacts and command output, not stale success prose.
- Treat old reports as untrusted unless the referenced paths and commands are inspected.

success criteria:
- At least three, and here five, hypotheses have distinguishing checks.
- Each hypothesis is marked ruled-out, confirmed, or caveated.
- Direct checks include runtime output or artifact evidence.

done-when:
- This audit artifact exists and the final response returns `PASS: .omo/evidence/family-experience-nationwide-etl-expansion/global-debugging-audit.md` or `FAIL: ...`.

## Evidence Brief

authoritative source map:
- Current source via CodeGraph and targeted file reads:
  - `apps/family-experience-mcp/src/etl/cacheQuery.ts`
  - `apps/family-experience-mcp/src/pipeline/render.ts`
  - `apps/family-experience-mcp/src/mcp.ts`
  - `apps/family-experience-mcp/src/promptParser.ts`
  - `apps/family-experience-mcp/scripts/eval-prompts.ts`
  - `apps/family-experience-mcp/scripts/eval-prompt-checks.ts`
  - `apps/family-experience-mcp/scripts/eval-prompt-coverage.ts`
  - `apps/family-experience-mcp/scripts/scan-secrets.ts`
  - `apps/family-experience-mcp/scripts/scan-claims.ts`
  - `apps/family-experience-mcp/scripts/scan-sources.ts`
- Current tests:
  - `apps/family-experience-mcp/test/mcpCache.test.ts`
  - `apps/family-experience-mcp/test/scanSecrets.test.ts`
  - `apps/family-experience-mcp/test/scanClaims.test.ts`
- Gate/report artifacts:
  - `F2-code-quality.md`
  - `F4-scope-fidelity.md`
  - `F4-post-fix-code-review.md`
  - `family-experience-nationwide-etl-expansion-todo-8-regate-review.md`
  - `final-doneclaim.json`
  - `task-10-secret-hygiene-proof.txt`

verified facts:
- `queryNationwideCache` returns missing/stale/invalid cache as an error result and does not call fixture fallback on those paths.
- `scopeCacheRecords` converts fixture metadata or reserved example-host records to fixture records before rendering.
- `summarizeSuccess` uses fixture/demo wording when the rendered mode is fixture.
- `eval-prompts.ts` calls both the structured `fixture.request` path and the public loose prompt path via `callFindFamilyExperiences({ prompt: fixture.prompt }, ...)`.
- `scan-claims.ts` has explicit forbidden terms for nationwide completeness, scraper integration, browser parser, live/open/booking, and similar unsupported claims.
- `scan-secrets.ts` scans app files and selected evidence patterns, but not all nested nationwide evidence files.

inferences:
- Scanner PASS alone is not enough to prove nested nationwide evidence hygiene, so this audit used direct target-evidence term/secret scans.
- The temporary wrong-region eval probe is a stronger prompt-use discriminator than a happy-path eval rerun, because it would pass if the eval ignored prompt text and used only `fixture.request`.

unknowns:
- No live nationwide API proof is available in this audit; missing-key blockers remain by design.
- Git provenance is not clean: many app/evidence files are untracked, so this audit validates current on-disk state, not a committed branch.

assumptions:
- Cache-first fixture/local MVP can pass if missing live keys are explicit blockers and no live-completeness claim is made.
- Synthetic placeholders in old evidence are acceptable only when clearly not raw provider keys and not surfaced as product configuration.

risks:
- Scanner scope drift could recur if future evidence is stored under new nested directories.
- Several reviewed TypeScript files are near the 250 pure-LOC warning band, so future changes should split before adding behavior.

## Method Selection

candidate methods:
1. Full suite only.
   - Rejected: broad green tests could miss silent fallback, scanner-scope, and prompt-eval overfit.
2. Static code review only.
   - Rejected: runtime truth is required for cache and MCP behavior.
3. Hypothesis-driven runtime probes plus targeted artifact inspection.
   - Chosen: directly distinguishes each requested failure mode with small, fast checks.
4. Live API replay.
   - Rejected for this audit because live keys are missing/blocked and the user requested final-state debugging, not live source enablement.

chosen method:
- Hypothesis-driven runtime audit with five plausible failure hypotheses, fresh command checks, and targeted direct scans.

fallback method:
- When full live proof is unavailable, combine partial runtime evidence with source/artifact inspection and mark residual gaps explicitly.

rejection reasons:
- No broad experimentation or external API fan-out was needed.
- No product-file edits were needed.

## Execution Plan

baseline:
- Current `apps/family-experience-mcp` on-disk state.

controllable variables:
- Cache seeded vs missing.
- Eval fixture prompt text vs request object.
- Scanner CLI vs direct target-evidence scan.
- Fixture ETL dry-run vs cache-backed MCP smoke.

fixed variables:
- One public MCP tool.
- No product-file edits.
- Cache-first local MVP, no live nationwide fan-out.
- Official-source and no-secret guardrails.

budget ladder:
- Run focused tests and smokes first.
- Run prompt adversarial probe in a temporary directory.
- Run direct redaction and target-evidence scans.
- Consult current reports only after direct checks.

promotion rule:
- Mark PASS only if every hypothesis is ruled out or reduced to a non-blocking caveat with compensating evidence.

kill rule:
- Mark FAIL if any fresh runtime check confirms fake fallback, live-proof mislabeling, prompt-ignore behavior, raw secret leakage, or unsupported product claims.

stop rule:
- Stop once five hypotheses have decisive evidence and this artifact is written.

final evaluation rule:
- Recommendation is PASS only if fresh runtime checks, scanner/test checks, direct scans, and slop/programming review all support the outcome.

resource estimate:
- Wall-clock: under 1 hour.
- RAM: normal Node/Vitest usage.
- CPU/GPU/NPU: CPU only.
- Reboot-required resources: none.

## Hypothesis Matrix

### H1 - Cache path or missing cache silently falls back to fake fixture output

claim:
- If the nationwide cache path is missing, MCP might silently fall back to fixture output and return fake candidates.

distinguishing check:
- Command: `npm run smoke:mcp -- --skip-seed --expect-error`
- Fresh result: exit 0, `result_ok: false`, `mode: "live"`, `candidate_count: 0`, `failure_code: "missing_configuration"`.
- Supporting test command: `npm test -- mcpCache scanSecrets scanClaims -- --run`
- Fresh result: 3 test files passed, 10 tests passed. `mcpCache.test.ts` includes missing-cache and stale-cache cases.

status:
- Ruled out. Missing cache fails actionably and does not fabricate fixture candidates.

### H2 - Synthetic cache could still be rendered as live official proof

claim:
- Seeded or example-host cache records could still be displayed as live official data.

distinguishing check:
- Command: `npm run smoke:mcp`
- Fresh result: exit 0, one tool, `result_ok: true`, `mode: "fixture"`, `candidate_count: 1`, text starts with fixture/demo wording and contains `warnings: fixture/demo data only; not live/current.`
- Source URL in smoke output: `https://example.invalid/...`, labelled via fixture/cache next action.
- Supporting current-source behavior:
  - `cacheQuery.ts` scopes fixture metadata and `example.test` / `example.invalid` records to fixture mode.
  - `mcpCache.test.ts` adversarially starts a synthetic record as `mode: "live"` with `example.test`, then asserts fixture output and no official-data banner.

status:
- Ruled out. Synthetic cache is rendered as fixture/cache evidence, not live official proof.

### H3 - Prompt eval could ignore prompt text or pass wrong-region prompts

claim:
- The nationwide prompt eval might pass by using `fixture.request` while ignoring `fixture.prompt`, or might pass wrong-region prompt text.

distinguishing checks:
- Command: `npm run eval:nationwide-prompts`
- Fresh result: exit 0, `prompt_count: 42`, `passed_count: 42`, `prompt_path.accepted_count: 42`, `prompt_path.failure_count: 0`, coverage status `pass`.
- Temporary wrong-region probe:
  - A temp fixture outside the repo used prompt text for Jeju but a Busan `request`.
  - Command: `npx tsx scripts/eval-prompts.ts --fixtures-dir <temp> --cache-dir test/fixtures/eval-nationwide/cache --group audit --evidence-dir <temp>`
  - Fresh result: expected eval exit code 1, `prompt_count: 1`, `passed_count: 0`, `prompt_path.accepted_count: 0`, failing check `prompt_path_success_result` with detail `failure=no_results`.
  - Interpretation: if eval ignored prompt text and used only the Busan request, this fixture would have passed. It failed because the public prompt path used the wrong-region prompt.
- Supporting artifact:
  - `mutation-eval/summary.json` has `prompt_count: 42`, `passed_count: 0`, `prompt_path.failure_count: 42`, status `fail`.

status:
- Ruled out. Prompt text is exercised by the eval path, and adversarial wrong-region/mutated prompt cases fail as intended.

### H4 - Secret redaction could leak raw provider keys in evidence

claim:
- ETL diagnostics, logs, or evidence could contain raw provider keys or keyed URLs.

distinguishing checks:
- Direct redaction runtime probe:
  - Command: Node/tsx one-liner importing `redactDiagnosticText`.
  - Fresh result: `containsRaw: false`, `containsEncoded: false`; output redacts `serviceKey`, encoded secret, bearer-like token, and `SEOUL_OPEN_DATA_KEY`.
- Command: `npm run etl:nationwide -- --fixture --dry-run`
  - Fresh result: exit 0, `diagnostics.redacted_sample_url: "https://fixture.example.test/etl?serviceKey=<redacted>"`, `redaction_verified: true`.
- Command: `npm run scan:secrets`
  - Fresh result: exit 0, `status: "PASS"`, `scanned_files: 139`.
- Direct target-evidence secret regex:
  - Target: `.omo/evidence/family-experience-nationwide-etl-expansion`
  - Fresh result: one hit in `task-1-contracts.txt`, line 108, containing synthetic placeholder values in an old diagnostic command.
  - Inspection of the same artifact shows the observable output reports service-key diagnostics as `redacted` and `leakedSecrets: false`.
  - Supporting artifact `task-10-secret-hygiene-proof.txt`: `LeakCount: 0`, `Verdict: PASS`.

status:
- Ruled out for raw provider-key leakage in current reviewed artifacts.
- Caveat: built-in `scan:secrets` does not cover every nested nationwide evidence file; this audit used a direct target-evidence scan as compensation.

### H5 - Scanner could miss unsupported completeness/scraper claims

claim:
- Claim/source scanners might miss unsupported nationwide completeness, scraper integration, or browser parser claims.

distinguishing checks:
- Command: `npm test -- mcpCache scanSecrets scanClaims -- --run`
  - Fresh result: 3 files passed, 10 tests passed.
  - `scanClaims.test.ts` verifies a docs line containing `nationwide completeness`, `scraper integration`, and `browser parser` is flagged, and that copied forbidden literals outside eval-check fixtures are rejected.
- Command: `npm run scan:claims`
  - Fresh result: exit 0, `status: "PASS"`, `scanned_files: 120`.
- Command: `npm run scan:sources`
  - Fresh result: exit 0, `status: "PASS"`, `scanned_files: 87`.
- Direct term search over app docs/src/scripts/test:
  - Hits are scanner forbidden tables, eval fixtures, negative assertions, or docs explicitly forbidding/no-claiming scraper/browser-parser/nationwide completeness.
- Direct term search over target evidence:
  - Hits are eval prompt fixtures/results or negative-probe reports, not product claims.

status:
- Ruled out for the reviewed product/app surface.
- Caveat: target evidence intentionally contains adversarial prompt text and negative-probe findings; raw term search is noisy and must be interpreted with scanner/test context.

## Fresh Verification Commands

- `npm run typecheck`
  - PASS, `tsc --noEmit` exited 0.
- `npm test -- mcpCache scanSecrets scanClaims -- --run`
  - PASS, 3 files and 10 tests.
- `npm run smoke:mcp`
  - PASS, fixture/cache success with one public tool.
- `npm run smoke:mcp -- --skip-seed --expect-error`
  - PASS, missing cache error with zero candidates.
- `npm run eval:nationwide-prompts`
  - PASS, 42/42, required coverage present.
- Temporary wrong-region eval probe outside repo
  - EXPECTED FAIL, eval exit 1, prompt path rejected.
- `npm run etl:nationwide -- --fixture --dry-run`
  - PASS, redacted diagnostics and fixture dry-run.
- `npm run scan:secrets`
  - PASS, 139 files.
- `npm run scan:claims`
  - PASS, 120 files.
- `npm run scan:sources`
  - PASS, 87 files.

## Remove-AI-Slops And Programming Pass

direct slop/overfit pass:
- Loaded and applied `omo:remove-ai-slops` and `omo:programming` as review criteria.
- No deletion-only, requested-removal-only, tautological, or implementation-mirroring tests were found in the checked cache/scanner prompt-eval surface.
- Tests assert observable public behavior: missing cache has no candidates, synthetic cache renders fixture/non-live, scanners reject adversarial claims/secrets, and prompt eval exercises public prompt path.
- Zod parsing is at file/input boundaries and is justified; no unnecessary production parser/extraction was identified for the audited behavior.
- No product-file edit was made for this audit.

code review report coverage:
- `F4-post-fix-code-review.md` explicitly records `remove-ai-slops` and `programming` skill-perspective coverage and approves current source with no critical/high/medium blockers.
- `F2-code-quality.md` explicitly records the same skill perspective and closes the prior synthetic-cache labeling blocker.
- This audit independently reran the relevant commands rather than relying on those reports.

programming caveats:
- Current approval is for on-disk state in a dirty/untracked worktree.
- Several files remain in the warning band but below the 250 pure-LOC hard cap in the reviewed reports, especially `smoke-mcp.ts`.

## Checked Artifact Paths

- `.omo/plans/family-experience-nationwide-etl-expansion.md`
- `.omo/evidence/family-experience-nationwide-etl-expansion/F2-code-quality.md`
- `.omo/evidence/family-experience-nationwide-etl-expansion/F4-scope-fidelity.md`
- `.omo/evidence/family-experience-nationwide-etl-expansion/F4-post-fix-code-review.md`
- `.omo/evidence/family-experience-nationwide-etl-expansion/final-doneclaim.json`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-10-secret-hygiene-proof.txt`
- `.omo/evidence/family-experience-nationwide-etl-expansion/nationwide-prompt-eval/summary.json`
- `.omo/evidence/family-experience-nationwide-etl-expansion/mutation-eval/summary.json`
- `.omo/evidence/family-experience-nationwide-etl-expansion/count-eval/summary.json`
- `.omo/evidence/family-experience-nationwide-etl-expansion/direct-prompt-probes.json`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-1-contracts.txt`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/scripts/smoke-mcp.ts`
- `apps/family-experience-mcp/scripts/eval-prompts.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-checks.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-coverage.ts`
- `apps/family-experience-mcp/scripts/scan-secrets.ts`
- `apps/family-experience-mcp/scripts/scan-claims.ts`
- `apps/family-experience-mcp/scripts/scan-sources.ts`
- `apps/family-experience-mcp/src/etl/cacheQuery.ts`
- `apps/family-experience-mcp/src/etl/redaction.ts`
- `apps/family-experience-mcp/src/etl/nationwide.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/src/promptParser.ts`
- `apps/family-experience-mcp/test/mcpCache.test.ts`
- `apps/family-experience-mcp/test/scanSecrets.test.ts`
- `apps/family-experience-mcp/test/scanClaims.test.ts`
- `apps/family-experience-mcp/test/fixtures/eval-nationwide/cache/metadata.json`
- `apps/family-experience-mcp/docs/RUNBOOK.md`
- `apps/family-experience-mcp/docs/DECISIONS.md`
- `apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md`

## Exact Evidence Gaps

- Built-in scanners do not scan every nested file under `.omo/evidence/family-experience-nationwide-etl-expansion`; this audit used direct target-evidence scans to cover the gap.
- The current repo state is dirty and many files are untracked. This audit validates current on-disk state, not committed provenance.
- `final-scoped-diff.patch` is zero bytes in existing evidence. Current-source reviews and fresh runtime checks compensate for this audit, but a release gate should require a real diff or committed tree.
- Live nationwide API proof remains blocked by missing Culture Portal, KTO TourAPI, and Public Data Standard keys. This is documented and does not block cache-first local MVP debugging.
- No notepad path was provided for this audit.

## Final Status

PASS
