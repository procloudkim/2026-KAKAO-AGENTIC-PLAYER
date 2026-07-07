# Todo 6 post-remediation code review

## Verdict

- codeQualityStatus: WATCH
- recommendation: APPROVE
- reportPath: `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-post-remediation-code-review.md`
- blockers: None
- PASS/FAIL: PASS

`WATCH` is used only for provenance risk: every scoped source/test/evidence file is currently untracked, so the reviewed state cannot be tied to a tracked diff. This review directly verified current on-disk source, evidence, LOC, tests, and typecheck, so the untracked state is not a blocker by itself.

## Scope reviewed

- `apps/family-experience-mcp/src/pipeline/normalize.ts`
- `apps/family-experience-mcp/src/pipeline/sourceRecord.ts`
- `apps/family-experience-mcp/src/pipeline/dedupe.ts`
- `apps/family-experience-mcp/src/pipeline/rank.ts`
- `apps/family-experience-mcp/test/pipeline.test.ts`
- `apps/family-experience-mcp/test/pipelineNationwide.test.ts`
- `apps/family-experience-mcp/test/pipelineTestHelpers.ts`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-loc-remediation.md`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-manual-qa.json`

Notepad path: not provided in the task input.

## Skill-perspective check

- `omo:remove-ai-slops` loaded and applied as a review lens.
- `omo:programming` loaded; TypeScript reference and code-smells reference were also consulted before judging maintainability and tests.
- Result: no blocking violations found. No TS suppressions, no `any`, no focused/skipped tests, no deletion-only tests, no tautological tests, no overbroad production helper extraction, and no hidden unsupported-claim assertions were found in the scoped files.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW

1. Provenance risk: all scoped source/test/evidence files are untracked.
   - `git status --short -- <scoped files>` reports `??` for all reviewed files and scoped evidence.
   - `git diff -- <scoped files>` is empty because the files are untracked.
   - Impact: approval is for the current disk contents only; future staging or edits could change the reviewed payload.
   - Blocking: no, per task instruction, because source/evidence was directly verified.

## Behavior review

- Duplicate merge/source refs: covered by `apps/family-experience-mcp/src/pipeline/dedupe.ts:22`, `apps/family-experience-mcp/src/pipeline/dedupe.ts:55`, and `apps/family-experience-mcp/test/pipelineNationwide.test.ts:11`.
- Distinct same-title preservation: canonical key includes title, dates, venue, address, and city at `apps/family-experience-mcp/src/pipeline/dedupe.ts:36`; regression at `apps/family-experience-mcp/test/pipelineNationwide.test.ts:51`.
- Stale fallback demotion: ranking compares source confidence, authority, and retrieved time at `apps/family-experience-mcp/src/pipeline/rank.ts:56`; regression at `apps/family-experience-mcp/test/pipelineNationwide.test.ts:101`.
- Exact child-stage promotion: child-stage priority favors exact single-stage records at `apps/family-experience-mcp/src/pipeline/rank.ts:129`; regression at `apps/family-experience-mcp/test/pipelineNationwide.test.ts:147`.
- Explicit no-results: fixture and nationwide no-result tests assert `ok: false`, `code: "no_results"`, and no `candidates` field at `apps/family-experience-mcp/test/pipeline.test.ts:63` and `apps/family-experience-mcp/test/pipelineNationwide.test.ts:196`.
- Unsupported claims: age-fit labels are split from source freshness/confidence labels in `apps/family-experience-mcp/src/pipeline/sourceRecord.ts:12`; regression rejects `computed` and `stale` as age-fit labels at `apps/family-experience-mcp/test/pipeline.test.ts:177`.

The scoped tests exercise behavior through the normalizer/ranker/renderer surfaces rather than only checking implementation constants. The shared test builder in `apps/family-experience-mcp/test/pipelineTestHelpers.ts:72` is broad but materially reused across the Todo 6 behavior matrix and typed against `FamilyExperienceSourceRecord`, so I do not consider it overbroad slop for this remediation.

## LOC check

Command used:

```powershell
$files = @(
  'apps/family-experience-mcp/src/pipeline/normalize.ts',
  'apps/family-experience-mcp/src/pipeline/sourceRecord.ts',
  'apps/family-experience-mcp/src/pipeline/dedupe.ts',
  'apps/family-experience-mcp/src/pipeline/rank.ts',
  'apps/family-experience-mcp/test/pipeline.test.ts',
  'apps/family-experience-mcp/test/pipelineNationwide.test.ts',
  'apps/family-experience-mcp/test/pipelineTestHelpers.ts'
)
$rows = foreach ($file in $files) {
  $count = (Get-Content -LiteralPath $file | Where-Object {
    $_ -notmatch '^\s*$' -and $_ -notmatch '^\s*(//|#|--)'
  }).Count
  [pscustomobject]@{ file = $file; pure_loc = $count }
}
$rows | Format-Table -AutoSize
```

Observed:

| File | Pure LOC |
| --- | ---: |
| `apps/family-experience-mcp/src/pipeline/normalize.ts` | 202 |
| `apps/family-experience-mcp/src/pipeline/sourceRecord.ts` | 88 |
| `apps/family-experience-mcp/src/pipeline/dedupe.ts` | 118 |
| `apps/family-experience-mcp/src/pipeline/rank.ts` | 218 |
| `apps/family-experience-mcp/test/pipeline.test.ts` | 163 |
| `apps/family-experience-mcp/test/pipelineNationwide.test.ts` | 194 |
| `apps/family-experience-mcp/test/pipelineTestHelpers.ts` | 117 |

Result: PASS. All split files are below 250 pure LOC.

## Verification commands

```powershell
cd apps/family-experience-mcp
npm test -- pipeline
```

Observed: PASS, 2 test files passed, 12 tests passed.

```powershell
cd apps/family-experience-mcp
npm run typecheck
```

Observed: PASS, `tsc --noEmit` completed.

Additional read-only scan:

```powershell
rg -n "@ts-ignore|@ts-expect-error|\bany\b|\.only\(|\.skip\(|describe\.only|describe\.skip|it\.only|it\.skip|test\.only|test\.skip" <scoped files>
```

Observed: no matches.

## Evidence review

- `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-loc-remediation.md` claims the same post-split LOC values that were independently reproduced.
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-6-manual-qa.json` records successful probes for duplicate merge/source refs, stale fallback demotion, exact child-stage promotion, explicit no-results, and unsupported-claims absence.
- Because the evidence files are untracked, they are treated as supporting context only; the approval rests on direct source inspection and current command outputs above.

Final Status: CLEAN WITH PROVENANCE WATCH
