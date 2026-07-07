# Gate Review: family-experience-market-ready-platform Todo 2 fix3

recommendation: REJECT
adversarialVerdict: needs-fix
confidence: high

## originalIntent

Independently reverify Todo 2 from `.omo/plans/family-experience-market-ready-platform.md`: convert forbidden-claim scanning into a market-launch gate. The intended user-visible outcome is that unsupported market claims in launch copy, prompts, docs, fixtures, temporary QA files, and generated evidence cannot silently pass, while explicit unsupported-claim caveats remain allowed.

## desiredOutcome

Return `confirmed` only if current code, tests, receipts, fresh commands, adversarial probes, cleanup, and code-quality review all support a launch gate that rejects caveat-smuggled affirmative claims and path-boundary bypasses without weakening scanner rules.

## userOutcomeReview

Fix3 confirms the previously rejected explicit-include bug is repaired. Current `apps/family-experience-mcp/scripts/scan-claims.ts` evaluates forbidden claim occurrences for `surface === "include"`, and fresh CLI probes rejected both requested smuggles:

- `Public copy does not claim live now; live now status is ready.` exited 1 and reported `live now`.
- `이 서비스는 실시간 운영중을 보장하지 않습니다. 실시간 운영중입니다.` exited 1 and reported `실시간`.
- A caveat-only include file exited 0.
- Explicit include paths containing `test/fixtures/eval` and `.omo/evidence` both exited 1 with expected findings.

The original market-launch gate is still not fully confirmed. Default repo scanning still short-circuits English whole-line caveat wording before occurrence-level claim checks. Since default scan covers app `docs`, an English public-copy/doc line can still smuggle an affirmative forbidden claim and produce no finding under `surface === "default"`.

## blockers

1. Default-scanned docs still allow English caveat-smuggling.
   - Code evidence: `scanText` calls `isAllowedLineContext` before occurrence scanning in `apps/family-experience-mcp/scripts/scan-claims.ts:104`; `isAllowedLineContext` returns true for default-scan lines matching English caveat phrases in `apps/family-experience-mcp/scripts/scan-claims.ts:125`.
   - Main path evidence: `main` scans app docs/source/tests/scripts as `surface === "default"` in `apps/family-experience-mcp/scripts/scan-claims.ts:228`.
   - Probe: `scanText("docs/public.md", "Public copy does not claim live now; live now status is ready.", "default")` returned `[]`, while the same text under `surface === "include"` returned a `live now` finding.
   - Impact: the gate is fixed for explicit `--include`, but not for public-copy text that reaches the default app-doc scan surface.

2. The code-quality review covers the requested high-level risks, but not the full required slop criterion set.
   - Present coverage: overfit/slop summary, caveat-smuggling, path-boundary bypass, misleading success output, untrusted external text, exact-string overfit, escape hatches, and file-size smell.
   - Missing explicit report coverage: excessive/useless tests, deletion-only tests, tests that merely verify requested removal, tautological tests, implementation-mirroring tests, and unnecessary production extraction/parsing/normalization.
   - Direct reviewer pass did not find those additional slop categories in the fix3 include-mode code/tests, but the required report coverage is incomplete.

## checkedArtifactPaths

- `.omo/plans/family-experience-market-ready-platform.md`
- `apps/family-experience-mcp/scripts/scan-claims.ts`
- `apps/family-experience-mcp/test/scanClaims.test.ts`
- `apps/family-experience-mcp/package.json`
- `.omo/evidence/family-experience-market-ready-platform/task-2-code-quality-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-red-caveat-smuggle.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-focused-scanClaims.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-manual-english-smuggle.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-manual-korean-smuggle.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-2-fix3-manual-positive-caveat.txt`
- `.omo/evidence/family-experience-market-ready-platform-gate-review.md`

## commandsRun

- `codegraph explore "apps/family-experience-mcp/scripts/scan-claims.ts apps/family-experience-mcp/test/scanClaims.test.ts Todo 2 forbidden claim scanning market launch gate"`
- `npm --prefix apps/family-experience-mcp test -- --run test/scanClaims.test.ts`: exit 0; 1 file, 16 tests passed.
- `npm --prefix apps/family-experience-mcp run verify`: exit 0; `tsc --noEmit` passed; 18 files, 115 tests passed.
- `npm --prefix apps/family-experience-mcp run scan:claims`: exit 0; `status: PASS`; 127 files scanned.
- Independent explicit include probes using OS temp files:
  - English smuggle: exit 1; output contained `live now`.
  - Korean smuggle: exit 1; output contained `실시간`.
  - Caveat-only include: exit 0; output contained `status: PASS`.
  - `test/fixtures/eval` path-boundary bypass: exit 1; output contained `nationwide completeness`.
  - `.omo/evidence` path-boundary bypass: exit 1; output contained `final review and contest submission completed`.
- `npm --prefix apps/family-experience-mcp run scan:claims -- --include`: exit 1; usage reports `Missing path for --include`.
- Cleanup check: `.omo/tmp/market-plan-fix3`, `.omo/tmp/market-plan-fix3-red`, and `.omo/tmp/market-plan` absent.
- Direct default-vs-include probe via `node --import tsx --input-type=module`: English smuggle returned a finding under `include` and no finding under `default`.
- Pure LOC check: `scan-claims.ts` 229; `scanClaims.test.ts` 214. Both are below 250 but in the warning band.
- Escape-hatch search: no `as any`, `@ts-ignore`, `@ts-expect-error`, `: any`, `as unknown`, or empty catch in the touched TypeScript files.

## adversarialClasses

- stale_state: PASS. Current files were re-read; submitted receipts were inspected; focused tests, full verify, default scan, and independent probes were rerun in this turn.
- dirty_worktree: NEEDS-HUMAN-REVIEW. The workspace is heavily dirty and the Todo 2 files/evidence are untracked, so git diff is not reliable. Current on-disk code and behavior were verified directly.
- misleading_success_output: FAIL. Explicit include no longer emits false PASS for the smuggles, but default-surface English smuggling still returns no finding.
- malformed_input: PASS. Missing `--include` exits 1 with usage text.
- untrusted_external_text: FAIL. Explicit external include text is handled correctly, but default-scanned public docs remain a false-negative surface for English caveat-smuggling.
- binary_input: N/A. Todo 2 is a text scanner gate and binary handling was not requested.
- network_or_external_service: N/A. The scanner is local CLI/file behavior.
- concurrency_or_flake: N/A. No concurrent runtime surface is involved; tests were run serially to avoid shared temp-path races.
- destructive_cleanup: N/A for product behavior. Temporary probe cleanup was bounded and verified absent.

## slopOverfitPass

Direct `remove-ai-slops` and `programming` pass:

- Excessive or useless tests: not found; the 16 tests cover real scanner behaviors and CLI include paths.
- Deletion-only tests: not found.
- Tests that merely verify requested removal: not found.
- Tautological tests: not found; most risky paths drive the CLI subprocess.
- Implementation-mirroring tests: acceptable for unit-level caveat cases; high-risk include behavior is covered through observable CLI output.
- Unnecessary production extraction/parsing/normalization: occurrence segmentation is justified by the smuggling bug, but the default-surface whole-line English allowance remains too broad.
- Exact-string overfit: not found for include fix3; production logic is occurrence-level and tests construct forbidden substrings instead of matching only the reported full sentence.
- Scope drift: no Todo 3/Todo 10 files were in the claimed changed-file set.
- Escape hatches: none found.
- Size smell: both touched TypeScript files are below the 250 pure LOC ceiling, but future edits should split before adding much more.

## cleanupReceipt

Submitted cleanup receipt says `.omo/tmp/market-plan-fix3` and `.omo/tmp/market-plan-fix3-red` were removed. Fresh cleanup probe confirmed `.omo/tmp/market-plan-fix3`, `.omo/tmp/market-plan-fix3-red`, and `.omo/tmp/market-plan` do not exist.

## exactEvidenceGaps

- No fix3 evidence proves default-scanned app docs reject English caveat-smuggling.
- No notepad path was provided in the user packet.
- No trustworthy git diff is available because the relevant app/evidence files are untracked in this workspace.
- The submitted code-quality review does not explicitly enumerate every required remove-ai-slops overfit/slop subcriterion, even though direct reviewer inspection covered them.

## final

REJECT
