# Independent Codex CLI Review Prompt - Pass 3

You are an independent high-accuracy plan reviewer.

Repository snapshot root: the current working directory.

Review target:

- `.omo/plans/family-experience-mcp-first-build.md`

Supporting artifacts:

- `.omo/drafts/family-experience-mcp-first-build.md`
- `.omo/evidence/family-experience-mcp-first-build-plan-self-audit.md`
- `.omo/evidence/family-experience-mcp-first-build-high-accuracy-fix-summary.md`
- `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/quality-gate-2026-07-02.md`
- `PLANS.md`
- `concept/family-experience-mcp/README.md`
- `concept/family-experience-mcp/DATA_PIPELINE.md`
- `concept/family-experience-mcp/MCP_TOOLS.md`
- `concept/family-experience-mcp/GOLDEN_PROMPTS.md`
- `concept/family-experience-mcp/EXPERIMENTS.md`
- `concept/family-experience-mcp/MECE_RESEARCH.md`
- `concept/family-experience-mcp/REFINED_PROPOSAL.md`
- `concept/DATA_PIPELINE_ARCHITECTURE.md`
- `HTML.txt`

Task:

Return one of these verdicts:

- `OKAY`: no blocking issue; the plan is executable by a worker with no further interview.
- `ITERATE`: fixable issues exist; list exact required changes.
- `REJECT`: plan is unsafe, contradictory, or not executable without major redesign.

Review requirements:

1. Check that every todo is startable and has concrete file paths or creation locations.
2. Check that every todo has agent-executable acceptance criteria and RED/GREEN or happy/failure QA evidence paths.
3. Check that final verification proves real MCP behavior, not just grep or self-report.
4. Check that PlayMCP temporary registration is not confused with review request, public switch, or one-time contest submission.
5. Check that age-fit, reservation/contact, live/current, nationwide, and source-freshness claims are constrained safely.
6. Check that dependency order is coherent and does not require a module before it exists.
7. Check that the TypeScript/MCP SDK plan is not over-specific in a way likely to fail under current docs.
8. Check that secret redaction and no-scraping guardrails are enforceable.
9. Check that sibling workspaces are protected with read-only proof.
10. Check that the plan does not require human QA.

Pass-2 regression checks:

- All PowerShell-facing Git Bash invocations use `& 'C:\Program Files\Git\bin\bash.exe' -lc '...'`.
- No corrupted control-character path bytes remain.
- Todo 9 does not run `smoke:golden` without starting/stopping the HTTP server.
- MCP construction text uses `new McpServer({ ... })`.
- `reservation_url` and `contact` are optional/nullable and missing values cannot become reservation/contact claims.
- Exact one-tool exposure is machine-verified by `smoke:mcp -- --assert-tool-count=1`, not grep alone.
- Final health checks are machine-enforced HTTP 200 checks.
- Final cleanup checks only `LISTENING` rows on port 3345.
- Claim scanning does not grep the entire historical `.omo/evidence` directory.
- Sibling workspaces are not modified and have read-only status receipts when present.

Output format:

```text
VERDICT: OKAY|ITERATE|REJECT

Findings:
- [severity] file:line - issue, why it matters, exact required fix

Residual risks:
- ...
```

Do not edit files.
