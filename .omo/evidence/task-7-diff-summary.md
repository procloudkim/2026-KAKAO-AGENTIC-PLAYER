# Task 7 Diff Summary

Date: 2026-07-02

## changed scope

- `apps/family-experience-mcp/src/mcp.ts`
  - Added MCP transport-boundary schema that allows missing child selector input to reach handler-owned validation.
  - Added Korean structured invalid-input response for missing `child_age` or `child_stage`.
  - Expanded success text into stable parent-facing action-card lines.
  - Added one-constraint no-result relaxation text.
- `apps/family-experience-mcp/scripts/smoke-golden.ts`
  - Strengthened semantic checks for happy action cards, Korean missing-age clarification, exact one-constraint no-result relaxation, source-failure safety, forbidden claims, and keyed URL leakage.
  - Writes parsed `response.action_cards` into golden artifacts.
- `apps/family-experience-mcp/test/mcp.test.ts`
  - Added MCP-surface missing-age regression.
- `apps/family-experience-mcp/test/golden.test.ts`
  - Added generated golden artifact semantic regression coverage.
- `apps/family-experience-mcp/docs/GOLDEN_RESULTS.md`
  - Added lightweight support documentation for golden scenarios and safety boundaries.
- `.omo/evidence/golden-family-experience-*.json`
  - Regenerated all four golden artifacts through local MCP HTTP smoke.
- `.omo/evidence/task-7-*`
  - Added RED/GREEN, review, notepad, diff summary, and updated manual QA evidence.

## untracked-tree limitation

The workspace is broadly untracked, including the app tree and `.omo` evidence. `git diff -- <paths>` cannot provide a useful tracked-file patch for these files. Scope was controlled by the user-provided allowed write list and verified through direct file reads, generated artifacts, tests, and semantic smoke evidence.

## non-goals preserved

- Did not mark the Todo 7 plan checkbox.
- Did not add public MCP tools.
- Did not introduce live API or real key dependency.
- Did not edit Seoul adapter behavior, fixture records, source registry, or final PlayMCP docs.
