# Task 6 Debug Evidence Ledger
Started: 2026-07-07 Asia/Seoul
Goal: Fix Todo 6 gate blockers only.
Write scope: apps/family-experience-mcp/src/types.ts, apps/family-experience-mcp/src/schemas.ts, apps/family-experience-mcp/src/mcpSourceRecords.ts only if needed, apps/family-experience-mcp/test/golden.test.ts, apps/family-experience-mcp/test/mcpCache.test.ts, .omo/evidence/family-experience-market-ready-platform/task-6-*

## Problem Definition
- goal: public structured output rejects or neutralizes unsupported booking/availability/safety language in user-visible fields, including description and age_fit_reason.
- context: Todo 6 gate blockers report schema/render probe allowed "available to book and safe for children" in description.
- constraints: do not touch Todo 7 secret scanner or Todo 4 ETL cache files unless compile proves necessary.
- success criteria: RED proof, regression tests, smoke:golden source-failure safe Korean message, focused tests, smoke:golden, full verify classification, cleanup receipt, code-quality review.
- done-when: all required command artifacts are present and failures outside Todo 6 are classified exactly.

## Hypotheses
1. [OPEN] Schema publicCopy omits structured fields description and age_fit_reason; distinguishing evidence: schema probe accepts forbidden strings in those fields.
2. [OPEN] Render path passes normalized program_text/age_fit_reason directly; distinguishing evidence: callFindFamilyExperiences or render test returns ok=true with forbidden structured text.
3. [OPEN] smoke:golden source-failure checks a Korean safety phrase absent from failure text; distinguishing evidence: golden test failure name safe_korean_message.

## Artifacts to cleanup
- none yet: no ports, temp servers, or debugger sessions started.
