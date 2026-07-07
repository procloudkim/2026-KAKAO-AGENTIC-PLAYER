# Todo 8 Code Review
Verdict: PASS

## Findings

### CRITICAL
- None.

### HIGH
- None.

### MEDIUM
- None.

### LOW
- `apps/family-experience-mcp/scripts/eval-prompt-checks.ts` is at 250 pure LOC, and `apps/family-experience-mcp/scripts/eval-prompts.ts` is at 246 pure LOC. This is within the current ceiling but in the programming-skill warning band; the next non-trivial eval change should split the runner/check responsibilities before adding more logic.
- `expectUnsupportedClaimFailure` exists as an unused fixture field and check branch at `apps/family-experience-mcp/scripts/eval-prompt-checks.ts:49` and `apps/family-experience-mcp/scripts/eval-prompt-checks.ts:186`. No current nationwide fixture sets it, so it is not an active bypass, but it should remain unused or be removed in a cleanup pass to keep the unsupported-claim gate simple.

## Required Checks

- Public prompt-only path: PASS. `apps/family-experience-mcp/scripts/eval-prompts.ts:144` calls `callFindFamilyExperiences({ prompt: fixture.prompt }, ...)`. `apps/family-experience-mcp/scripts/eval-prompt-checks.ts:76` now validates prompt-path `structuredContent`; `apps/family-experience-mcp/scripts/eval-prompt-checks.ts:102` reuses the observable success/clarification/no-result checks on the prompt-path result, and `apps/family-experience-mcp/scripts/eval-prompt-checks.ts:109` applies unsupported-claim checks to that prompt-path result.
- Direct prompt probes: PASS. Current cache-backed public prompt-only probes returned Busan success with `Busan Eval Harbor Park`, Jeju success with `Jeju Eval Sea Center`, and Busan no-result with `failure=no_results`; all had `textIsAdminOnly=false`.
- Malicious prompt mutation: PASS. Replacing every fixture prompt with `ADMIN_OK` instruction text while preserving structured requests produced expected failure: `exit_code=1`, `passed_count=0`, `prompt_path.accepted_count=0`, `prompt_path.failure_count=42`, `status=fail`.
- Exact 42 count: PASS. `apps/family-experience-mcp/package.json:20` runs with `--expected-prompts 42`, and `apps/family-experience-mcp/scripts/eval-prompt-coverage.ts:146` fails when fixture count differs from the expected value. A count probe using `--expected-prompts 43` failed with `missing_buckets=["prompt_count=43"]`.
- Coverage buckets: PASS. Current `summary.json` reports `prompt_count=42`, all 12 region buckets populated, all child-stage/fee/environment buckets populated, `no_result_count=6`, `unsupported_claim_prompt_count=7`, `prompt_injection_count=2`, `missing_buckets=[]`, and `coverage.status=pass`.
- No live APIs: PASS. The nationwide eval uses `--cache-dir test/fixtures/eval-nationwide/cache`; `loadSourceRecords` reads `etlCacheDir` before any adapter path, and without a Seoul key there is no live fallback. The rerun used a temp evidence directory, not live APIs.
- Golden boundary: PASS. `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md:26` states this is a fixture/cache golden coverage gate, not a live completeness claim, and `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md:29` documents the independent public loose prompt path.
- TS suppressions / any / broad bypass / tautology review: PASS with LOW watch above. No `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, `ts-nocheck`, `eslint-disable`, or `biome-ignore` was found in the scoped eval TS files. The active checks assert parsed structured results and observable result contracts rather than exact prompt strings.

## Verification

- Skill-perspective check: RUN. Loaded `remove-ai-slops`, `programming`, and `programming/references/typescript/README.md` before judging test relevance and maintainability. The current diff does not violate either perspective; only the LOW maintainability watch items remain.
- CodeGraph check: RUN. Repo has `.codegraph`; CodeGraph was used first for the eval runner/check/coverage and prompt-path call flow.
- Current eval rerun: PASS. Equivalent nationwide eval command was run with the same fixtures/cache/group/min/exact/coverage arguments but with a temp evidence directory to avoid mutating reviewed evidence. Result: `prompt_count=42`, `passed_count=42`, `prompt_path.failure_count=0`, `coverage.status=pass`, `status=pass`.
- `npm run typecheck`: PASS (`tsc --noEmit`, exit 0).
- Existing evidence inspected: PASS. `.omo/evidence/family-experience-nationwide-etl-expansion/task-8-nationwide-eval.txt`, `nationwide-prompt-eval/summary.json`, and `nationwide-prompt-eval/results.json` all align with the rerun.

## Review Metadata

- codeQualityStatus: WATCH
- recommendation: APPROVE
- reportPath: `.omo/evidence/family-experience-nationwide-etl-expansion/task-8-code-review.md`
- blockers: None.
- Input caveat: no notepad path or full tracked diff was provided. `git diff -- <scoped files>` did not expose a tracked diff because the scoped workspace files are untracked; review therefore inspected current on-disk files, fixtures, docs, and evidence directly.
