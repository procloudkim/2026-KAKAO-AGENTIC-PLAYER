# Todo 6 LOC guardrail remediation

## Problem

F1 blocker rejected Todo 6 because these files exceeded the 250 pure-LOC guardrail without a valid exception:

| File | Before pure LOC |
| --- | ---: |
| `apps/family-experience-mcp/src/pipeline/normalize.ts` | 283 |
| `apps/family-experience-mcp/test/pipeline.test.ts` | 457 |

Before command:

```bash
awk 'BEGIN{print "file\tpure_loc"} !/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|#|--)/ {c[FILENAME]++} END{for (f in c) print f "\t" c[f]}' apps/family-experience-mcp/src/pipeline/normalize.ts apps/family-experience-mcp/src/pipeline/dedupe.ts apps/family-experience-mcp/src/pipeline/rank.ts apps/family-experience-mcp/test/pipeline.test.ts
```

## Remediation

- Extracted source-record Zod parsing and age-fit label schema from `normalize.ts` into `apps/family-experience-mcp/src/pipeline/sourceRecord.ts`.
- Split shared pipeline test fixtures into `apps/family-experience-mcp/test/pipelineTestHelpers.ts`.
- Moved Todo 6 nationwide normalize/rank regression tests into `apps/family-experience-mcp/test/pipelineNationwide.test.ts`.
- Kept Todo 6 behavior assertions intact: duplicate merge with retained source refs, stale fallback demotion, exact child-stage promotion, distinct same-title events, explicit no-result, and unsupported-claim rejection.
- No exception is requested; the oversized files were remediated by splitting cohesive responsibilities.

## After LOC Proof

| File | After pure LOC |
| --- | ---: |
| `apps/family-experience-mcp/src/pipeline/normalize.ts` | 202 |
| `apps/family-experience-mcp/src/pipeline/sourceRecord.ts` | 88 |
| `apps/family-experience-mcp/src/pipeline/dedupe.ts` | 118 |
| `apps/family-experience-mcp/src/pipeline/rank.ts` | 218 |
| `apps/family-experience-mcp/test/pipeline.test.ts` | 163 |
| `apps/family-experience-mcp/test/pipelineNationwide.test.ts` | 194 |
| `apps/family-experience-mcp/test/pipelineTestHelpers.ts` | 117 |

After command:

```bash
cd apps/family-experience-mcp
awk 'BEGIN{print "file\tpure_loc"} !/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|#|--)/ {c[FILENAME]++} END{for (f in c) print f "\t" c[f]}' src/pipeline/normalize.ts src/pipeline/sourceRecord.ts src/pipeline/dedupe.ts src/pipeline/rank.ts test/pipeline.test.ts test/pipelineNationwide.test.ts test/pipelineTestHelpers.ts
```

Captured artifact: `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-loc-after-remediation.tsv`

## Verification

| Scenario | Invocation | Binary observable | Captured artifact |
| --- | --- | --- | --- |
| Pipeline acceptance after split | `cd apps/family-experience-mcp && npm test -- pipeline` | exit 0, 2 test files passed, 12 tests passed | `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-green-pipeline-after-loc-split.txt` |
| Pipeline flaky-test rerun | `cd apps/family-experience-mcp && npm test -- pipeline` | exit 0, 2 test files passed, 12 tests passed | `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-green-pipeline-after-loc-split-rerun.txt` |
| TypeScript gate | `cd apps/family-experience-mcp && npm run typecheck` | exit 0, `tsc --noEmit` completed | `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-typecheck-after-loc-split.txt` |
| Manual Todo 6 probe | `cd apps/family-experience-mcp && node --import tsx --input-type=module -e <probe>` | exit 0; duplicate count 1; source refs retained; stale fallback demoted; exact child-stage promoted; no-result explicit; unsupported claims absent | `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-manual-qa.json` |

## Guardrail Result

All touched Todo 6 source and test files are below 250 pure LOC. No SIZE_OK exception is needed.
