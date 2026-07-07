# Todo 6 Redaction Fix Diff Summary

## Diff Availability

`git diff -- apps/family-experience-mcp/src/sources/seoulCulture.ts apps/family-experience-mcp/test/seoulCulture.test.ts apps/family-experience-mcp/src/sources/types.ts apps/family-experience-mcp/src/sources/registry.ts apps/family-experience-mcp/test/sources.test.ts` returned no textual diff.

This is not proof of no change. The workspace subtree is broadly untracked:

```text
?? .omo/evidence/task-6-redaction-fix-GREEN.txt
?? .omo/evidence/task-6-redaction-fix-RED.txt
?? apps/family-experience-mcp/src/sources/registry.ts
?? apps/family-experience-mcp/src/sources/seoulCulture.ts
?? apps/family-experience-mcp/src/sources/types.ts
?? apps/family-experience-mcp/test/seoulCulture.test.ts
?? apps/family-experience-mcp/test/sources.test.ts
```

Because the relevant app subtree is untracked, git-isolated diff proof is unavailable. This artifact is a usable direct-file summary, not an isolated git diff. It should not be read as overclaiming commit-level provenance.

## Todo 6 Redaction-Fix Files And Responsibilities

| Path | Responsibility |
| --- | --- |
| `apps/family-experience-mcp/src/sources/seoulCulture.ts` | Optional Seoul Open Data cultural-events adapter; builds operational keyed requests, exposes redacted diagnostics, scrubs request-loader error details, parses Seoul payloads through Zod, normalizes source records, and emits typed source failures. |
| `apps/family-experience-mcp/test/seoulCulture.test.ts` | Adapter regression coverage: missing-key typed failure, request-build redaction, request-loader error redaction, malformed-source typed failure, and saved sample normalization. |
| `apps/family-experience-mcp/src/sources/types.ts` | Source-governance and adapter contracts, including source IDs, redaction policies, source record shape, diagnostics shape, and typed failure code union. |
| `apps/family-experience-mcp/src/sources/registry.ts` | Source registry metadata for fixture and Seoul authority source, including `redact_api_key_and_keyed_url` policy. |
| `apps/family-experience-mcp/test/sources.test.ts` | Registry and fixture governance tests, including Seoul source redaction-policy assertion. |
| `.omo/evidence/task-6-redaction-fix-RED.txt` | Prior failing evidence for the real request-loader diagnostic leak: raw sentinel key and keyed URL appeared in diagnostics before the fix. |
| `.omo/evidence/task-6-redaction-fix-GREEN.txt` | Prior green evidence after the redaction fix for the scoped redaction regression and source tests. |

## Current Verification Anchors

- Acceptance/typecheck command rerun in this session: exit 0, 2 test files passed, 9 tests passed, `tsc --noEmit` passed.
- Escape-specific scan: `NO_MATCHES` for TypeScript escape hatches, focused/skipped tests, enum, default export, and non-null assertions.
- LOC: `seoulCulture.ts` 249, `src/sources/types.ts` 165, `test/seoulCulture.test.ts` 146.

## Boundary

No implementation diff was generated or claimed. This file exists to backfill the missing redaction-fix diff artifact with direct responsibilities and the explicit reason a git-isolated diff cannot be produced from the current untracked workspace.
