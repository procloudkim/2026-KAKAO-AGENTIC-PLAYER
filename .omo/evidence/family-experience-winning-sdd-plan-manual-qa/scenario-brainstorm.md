# Manual QA Scenario Brainstorm

Surface: CLI/data/ULW status only. No app runtime, no product server.

S1 inventory-nonempty
- surface: filesystem metadata
- exact invocation: powershell -NoProfile -Command "Get-Item -LiteralPath '<path>' | Select-Object FullName,Length"
- binary observable: every scoped file exists and Length > 0

S2 ulw-status-complete
- surface: ULW CLI stdout JSON
- exact invocation: node C:/Users/K/.codex/plugins/cache/sisyphuslabs/omo/4.15.1/components/ulw-loop/dist/cli.js ulw-loop status --session-id family-experience-winning-sdd-20260703 --json
- binary observable: command exits 0 and JSON indicates completed aggregate/no pending or failed criteria

S3 criteria-pass-counts
- surface: parsed goals.json + ledger.jsonl
- exact invocation: node .omo/evidence/family-experience-winning-sdd-plan-manual-qa/qa-check.mjs criteria
- binary observable: all success criteria in goals.json are represented as pass evidence in ledger/status

S4 c001-plan-booleans
- surface: parsed C001 plan-content-check text
- exact invocation: node .omo/evidence/family-experience-winning-sdd-plan-manual-qa/qa-check.mjs c001
- binary observable: required booleans include powershell_literal_script_blocks, task1_green_writes_evidence, browser cleanup/invocation coverage, and no unresolved placeholders

S5 c002-guardrails-secret-scan
- surface: parsed C002 guardrail scan plus scoped text scan
- exact invocation: node .omo/evidence/family-experience-winning-sdd-plan-manual-qa/qa-check.mjs guardrails
- binary observable: no fake deployment/PlayMCP/submission completion, no raw secret/key leak pattern, no unresolved placeholders

S6 quality-gate-schema
- surface: parsed final-quality-gate.json
- exact invocation: node .omo/evidence/family-experience-winning-sdd-plan-manual-qa/qa-check.mjs quality
- binary observable: manualQa/codeReview/gateReview/criteriaCoverage fields exist and artifact refs are non-empty paths

S7 scoped-git-status
- surface: git status --short for scoped files
- exact invocation: git status --short -- .omo/plans/family-experience-winning-sdd-to-submission.md .omo/evidence/winning-sdd-plan .omo/ulw-loop/family-experience-winning-sdd-20260703
- binary observable: status is captured and no unexpected edits are made by this QA except the new manual QA evidence directory
