# Todo 8 Nationwide Prompt Eval Re-Gate Review

recommendation: APPROVE

blockers:
- None.

originalIntent:
- Re-gate Todo 8 nationwide prompt evals after the prompt-only fix and current PASS code review.
- Confirm only if prior Todo 8 blockers are closed: prompt text ignored, prompt-only probes wrong/no-result, exact 42 count not enforced, and Todo 8-specific code review missing or failing.

desiredOutcome:
- `npm run eval:nationwide-prompts` passes with 42 prompts and required nationwide coverage buckets.
- `npm run typecheck` passes.
- Direct prompt-only probes pass for success, prompt-injection data, no-result, and malicious-only input.
- Malicious prompt mutation and exact-count probes fail as expected.
- Evidence shows 42 prompts, 12 regions, 4 child stages, unsupported-claim/no-result/prompt-injection coverage, no live APIs, and no live nationwide completeness claim.

userOutcomeReview:
- User-visible outcome is confirmed for the requested Todo 8 gate. The eval runner now calls `callFindFamilyExperiences({ prompt: fixture.prompt }, ...)` for each fixture and applies observable prompt-path result checks.
- Direct prompt-only probes returned expected Busan and Jeju cache-backed candidates, Busan wrong-date `no_results`, and malicious-only `invalid_input`; none emitted `ADMIN_OK`.
- Current `npm run eval:nationwide-prompts` rerun passed: 42 prompts, 42 passed, `prompt_path.accepted_count=42`, `failure_count=0`, exact prompt count 42, and coverage status pass.
- Current `npm run typecheck` passed with `tsc --noEmit`.
- Malicious mutation probe failed as intended: 42 prompts, 0 passed, `prompt_path.accepted_count=0`, `failure_count=42`, status fail.
- Count probe failed as intended: 41 prompts with missing buckets `prompt_count>=42` and `prompt_count=42`.
- Cache metadata is fixture-only and the eval configuration supplies `etlCacheDir`, so the prompt eval does not live fan out to nationwide APIs. Seoul live fallback is only possible when a Seoul key is configured and the cache fails for a Seoul request; this was not used in the verified eval path.
- `GOLDEN_RESULTS.md`, `RUNBOOK.md`, and `DECISIONS.md` describe fixture/cache coverage as not proving live nationwide completeness. `npm run scan:claims` passed with 117 scanned files.

checkedArtifactPaths:
- `.omo/plans/family-experience-nationwide-etl-expansion.md`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-8-code-review.md`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-8-nationwide-eval.txt`
- `.omo/evidence/family-experience-nationwide-etl-expansion/nationwide-prompt-eval/summary.json`
- `.omo/evidence/family-experience-nationwide-etl-expansion/nationwide-prompt-eval/results.json`
- `.omo/evidence/family-experience-nationwide-etl-expansion/mutation-eval/summary.json`
- `.omo/evidence/family-experience-nationwide-etl-expansion/count-eval/summary.json`
- `.omo/evidence/family-experience-nationwide-etl-expansion/direct-prompt-probes.json`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/scripts/eval-prompts.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-checks.ts`
- `apps/family-experience-mcp/scripts/eval-prompt-coverage.ts`
- `apps/family-experience-mcp/src/promptParser.ts`
- `apps/family-experience-mcp/src/mcp.ts`
- `apps/family-experience-mcp/src/mcpSourceRecords.ts`
- `apps/family-experience-mcp/test/fixtures/eval-nationwide/prompts.json`
- `apps/family-experience-mcp/test/fixtures/eval-nationwide/cache/metadata.json`
- `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md`
- `apps/family-experience-mcp/docs/RUNBOOK.md`
- `apps/family-experience-mcp/docs/DECISIONS.md`

directVerification:
- `npm run typecheck`: PASS.
- `npm run eval:nationwide-prompts`: PASS, 42/42, `prompt_path.accepted_count=42`, no missing coverage buckets.
- `npx tsx scripts/eval-prompts.ts --fixtures-dir ../../.omo/evidence/family-experience-nationwide-etl-expansion/mutation-fixtures --cache-dir test/fixtures/eval-nationwide/cache --group nationwide --min-prompts 42 --expected-prompts 42 --require-nationwide-coverage --evidence-dir ../../.omo/evidence/family-experience-nationwide-etl-expansion/mutation-eval`: EXPECTED FAIL, exit 1.
- `npx tsx scripts/eval-prompts.ts --fixtures-dir ../../.omo/evidence/family-experience-nationwide-etl-expansion/count-fixtures --cache-dir test/fixtures/eval-nationwide/cache --group nationwide --min-prompts 42 --expected-prompts 42 --require-nationwide-coverage --evidence-dir ../../.omo/evidence/family-experience-nationwide-etl-expansion/count-eval`: EXPECTED FAIL, exit 1.
- Direct `node --import tsx --input-type=module -e ... callFindFamilyExperiences({ prompt })` probes: Busan success, Jeju injection-data success, Busan no-result, malicious-only invalid input.
- `npm run scan:claims`: PASS, 117 scanned files.
- Results inventory check: 42 results, zero failed checks, zero prompt-path failures, 84 unsupported-claim checks run, zero unsupported-claim failures.
- Fixture inventory check: 42 prompts, all 12 regions, infant/toddler/preschool/school_age, free/paid, indoor/outdoor, 6 no-result, 7 unsupported-claim, 2 prompt-injection.
- Scoped escape-hatch scan: no `as any`, `@ts-ignore`, `@ts-expect-error`, `ts-nocheck`, `eslint-disable`, or `biome-ignore` in scoped eval files. Only `console.log` is CLI summary output.
- Pure LOC: `eval-prompts.ts` 246, `eval-prompt-checks.ts` 250, `eval-prompt-coverage.ts` 195, `promptParser.ts` 107.

remove-ai-slops and programming pass:
- Direct slop pass found no excessive or useless tests, deletion-only tests, tautological tests, implementation-mirroring result assertions, unnecessary production extraction, or live-completeness claim in the scoped Todo 8 surface.
- The eval checks parsed structured content and observable result contracts, not exact prompt strings.
- `task-8-code-review.md` explicitly records `remove-ai-slops`, `programming`, and TypeScript-reference coverage plus public prompt-only path, direct prompt probes, malicious mutation, exact-count, coverage bucket, no-live-API, golden-boundary, and TS escape-hatch checks.
- Programming risk is bounded: `tsc --noEmit` passes and all scoped files are at or below the 250 pure LOC cap. The warning-band files should be split before the next non-trivial eval change.

evidenceGaps:
- No blocking gaps for the listed Todo 8 re-gate criteria.
- Non-blocking maintenance watch: `expectUnsupportedClaimFailure` remains as an unused eval-fixture option and check branch. No fixture sets it, and current unsupported-claim checks pass; remove it before future eval expansion unless a documented negative-fixture workflow needs it.
- Non-blocking bookkeeping watch: Todo 8 remains unchecked in `.omo/plans/family-experience-nationwide-etl-expansion.md`. The user explicitly requested read-only verification, so the plan checkbox was not edited.
