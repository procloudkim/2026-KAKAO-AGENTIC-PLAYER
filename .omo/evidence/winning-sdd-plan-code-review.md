# Code/Plan Quality Review: winning-sdd-plan

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/winning-sdd-plan-code-review.md

reviewedScope:
- .omo/plans/family-experience-winning-sdd-to-submission.md
- .omo/evidence/winning-sdd-plan/C001-plan-content-check.txt
- .omo/evidence/winning-sdd-plan/C002-guardrail-scan.txt
- .omo/evidence/winning-sdd-plan/C003-loop-status-check.txt
- .omo/ulw-loop/family-experience-winning-sdd-20260703/brief.md
- .omo/ulw-loop/family-experience-winning-sdd-20260703/goals.json
- .omo/ulw-loop/family-experience-winning-sdd-20260703/ledger.jsonl

skillPerspectiveCheck:
- remove-ai-slops: RAN. Applied as an overfit/slop review over plan QA, evidence receipts, secret/claim guardrails, and false-confidence paths. The plan violates this lens because many QA snippets can fail before exercising the intended behavior due shell quoting, and task 1 names a GREEN evidence file without creating it.
- programming: RAN. Applied for strict evidence quality, binary observable checks, non-brittle prompt/browser tests, no implementation-mirroring tests, and no needless production complexity. No production-code diff is in reviewed scope, but the plan violates this lens by relying on brittle, non-executable shell snippets and browser prose instead of exact runnable scenarios.

reviewMethod:
- Treated supplied C001/C002/C003 receipts as untrusted and re-read the plan directly.
- Checked ULW state; `goals.json` reports `status: in_progress`, which matches the user's expected pre-final-checkpoint state and is not a rejection reason.
- Ran a read-only PowerShell quote probe: `powershell -NoProfile -Command "$x=1; if($x -ne 1){ throw 'bad' }; 'ok '+$x"` exits 1 with a parser error, confirming that exact snippets using unescaped `$variables` inside double-quoted `-Command` strings are not reliably executable from this PowerShell workspace.

## CRITICAL

None.

## HIGH

1. The QA commands are not executable as written in the declared PowerShell workspace.
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:117
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:125
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:133
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:141
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:149
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:157
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:165
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:173
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:181
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:189
   - Evidence: the plan writes exact invocations as `powershell -NoProfile -Command "..."` while the inner scripts contain unescaped PowerShell variables such as `$pkg`, `$LASTEXITCODE`, `$env:...`, `$p`, `$base`, and `$txt`. From a PowerShell caller, those variables are expanded before the child `powershell` process receives the script. A read-only quote probe produced `ParserError: ExpectedValueExpression`.
   - Why this blocks: the user explicitly required all 10 todos to be executable with concrete QA commands. These snippets are not faithful copy-paste commands in the current shell surface, so the plan can create false failure or skip the intended binary checks.

2. Task 1 names a GREEN evidence artifact but the happy command does not create it.
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:117
   - Evidence: the happy CLI command prints `'version aligned: '+$pkg` to stdout, then the plan names Evidence `.omo/evidence/winning-sdd/task-1-version-GREEN.txt`; unlike the RED command on the same line, it has no `Set-Content`, redirection, or tee to that file.
   - Why this blocks: an executor could satisfy the local check without producing the required reviewable artifact. This violates the evidence-path and executable-todo requirements.

3. PlayMCP and final-submission browser scenarios are not concrete executable invocations.
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:181
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:189
   - Evidence: the scenarios say "Browser or Chrome opens", "click the visible new-server registration control", and "Browser/Chrome opens the PlayMCP entry" without a concrete Browser/Chrome tool invocation, selectors, or a scriptable action sequence. The binary pass metadata is specified, but the driving steps remain prose.
   - Why this blocks: the user required concrete happy and failure/blocked QA commands. These console gates may correctly allow BLOCKED outcomes, but the happy paths are not independently executable from the artifact.

4. Browser scenarios lack cleanup receipts despite the plan's own cleanup rule covering browser resources.
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:80
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:181
   - File: .omo/plans/family-experience-winning-sdd-to-submission.md:189
   - Evidence: line 80 says every `server/port/browser/temp-file` scenario must include a cleanup receipt before PASS. Tasks 9 and 10 capture screenshots/action logs/metadata but do not require closing the browser context/profile or writing a cleanup receipt.
   - Why this blocks: cleanup is a user-specified review criterion. Missing cleanup receipts can leave runtime state behind and still appear to pass.

## MEDIUM

1. Evidence receipts overstate command quality.
   - File: .omo/evidence/winning-sdd-plan/C001-plan-content-check.txt:6
   - File: .omo/evidence/winning-sdd-plan/C001-plan-content-check.txt:15
   - Evidence: C001 reports `has_qa_scenarios=True` and `failure_paths_binary=True`, but it does not catch the PowerShell quoting issue, task 1's missing GREEN artifact write, or prose-only browser execution steps.
   - Impact: this is not a separate product blocker beyond the HIGH findings, but it means prior success evidence should not be used as approval evidence.

## LOW

1. Scoped status evidence is acceptable but should be read narrowly.
   - File: .omo/evidence/winning-sdd-plan/C003-git-status.txt:1
   - File: .omo/evidence/winning-sdd-plan/C003-git-status.txt:4
   - Evidence: C003 records only the planning-task paths, while the repository has many unrelated dirty/untracked files outside this review scope. This is acceptable for the user's "no sibling workspace clean-state assumption" requirement, but it is not a whole-repo cleanliness proof.

## Passing Checks

- No unresolved `<path>` placeholder found in the current primary plan. The previous stale review blocker for `screenshot=<path>` is resolved at .omo/plans/family-experience-winning-sdd-to-submission.md:189.
- No unscoped process kill found in reviewed plan text. Server cleanup uses captured PIDs with `Stop-Process -Id $p.Id` at .omo/plans/family-experience-winning-sdd-to-submission.md:165.
- No false claim that deployment, PlayMCP review, public switch, or contest submission is complete. The plan explicitly forbids those claims at .omo/plans/family-experience-winning-sdd-to-submission.md:59 and gates them on evidence at .omo/plans/family-experience-winning-sdd-to-submission.md:189.
- Sibling workspace clean-state assumption is avoided. The plan requires before/after scoped status and explicitly says not to require sibling worktrees to be clean at .omo/plans/family-experience-winning-sdd-to-submission.md:54 and .omo/plans/family-experience-winning-sdd-to-submission.md:198.
- Secret redaction is materially addressed in guardrails and scan gates at .omo/plans/family-experience-winning-sdd-to-submission.md:58, .omo/plans/family-experience-winning-sdd-to-submission.md:73, .omo/plans/family-experience-winning-sdd-to-submission.md:125, .omo/plans/family-experience-winning-sdd-to-submission.md:165, and .omo/plans/family-experience-winning-sdd-to-submission.md:181.
- ULW goal state is `in_progress`; per user instruction, this was not treated as a rejection reason.

## Blockers

- Rewrite every `powershell -NoProfile -Command "..."` snippet so it is executable from PowerShell without caller-side `$variable` expansion, or state a different shell surface and make the invocation exact for that surface.
- Make task 1's happy path write `.omo/evidence/winning-sdd/task-1-version-GREEN.txt`.
- Replace task 9 and task 10 browser prose with concrete tool invocations/action scripts/selectors and explicit PASS/BLOCKED artifact creation.
- Add browser cleanup receipts for task 9 and task 10, or narrow the cleanup rule so browser resources are explicitly exempt with justification.

Final verdict: REJECT.
