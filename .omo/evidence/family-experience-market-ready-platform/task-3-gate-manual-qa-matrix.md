# Todo 3 Manual QA Matrix

| Scenario | Invocation | Binary observable | Artifact | Result |
| --- | --- | --- | --- | --- |
| Baseline behavior lock before refactor | `npm --prefix apps/family-experience-mcp test -- --run test/scanSources.test.ts` | Exit 0 | `.omo/evidence/family-experience-market-ready-platform/task-3-gate-baseline-scanSources.txt` | PASS |
| Focused scanner tests after refactor | `npm --prefix apps/family-experience-mcp test -- --run test/scanSources.test.ts` | Exit 0 | `.omo/evidence/family-experience-market-ready-platform/task-3-gate-focused-scanSources.txt` | PASS |
| `scan:sources` happy path | `npm --prefix apps/family-experience-mcp run scan:sources` | Exit 0; JSON `status: PASS`; `scanned_files: 94` | `.omo/evidence/family-experience-market-ready-platform/task-3-gate-scan-sources-happy.txt` | PASS |
| Negative include source ledger | `npm --prefix apps/family-experience-mcp run scan:sources -- --include ../../.omo/tmp/market-plan/bad-source.md` | Exit 1; JSON `status: FAIL`; rule `source-ledger-missing-url` | `.omo/evidence/family-experience-market-ready-platform/task-3-gate-negative-include.txt` | PASS |
| Malformed include | `npm --prefix apps/family-experience-mcp run scan:sources -- --include` | Exit 1; stderr contains `Missing path for --include` | `.omo/evidence/family-experience-market-ready-platform/task-3-gate-malformed-include.txt` | PASS |
| Full package verify | `npm --prefix apps/family-experience-mcp run verify` | Exit 0; typecheck passed; 18 test files and 115 tests passed | `.omo/evidence/family-experience-market-ready-platform/task-3-gate-verify.txt` | PASS |
| Cleanup | `rm -rf .omo/tmp/market-plan` after absolute target check | `.omo/tmp/market-plan` absent | `.omo/evidence/family-experience-market-ready-platform/task-3-gate-cleanup-receipt.txt` | PASS |
| Untracked changed-file receipt | `git status --short -- <Todo 3 scoped paths>` plus `git diff --no-index /dev/null apps/family-experience-mcp/scripts/scan-sources.ts` | Scoped files listed as untracked; normal diff limitation recorded | `.omo/evidence/family-experience-market-ready-platform/task-3-gate-changed-files.txt`; `.omo/evidence/family-experience-market-ready-platform/task-3-gate-scan-sources-untracked.diff` | PASS |

Notepad path: `.omo/evidence/family-experience-market-ready-platform/task-3-gate-manual-qa-matrix.md`.
