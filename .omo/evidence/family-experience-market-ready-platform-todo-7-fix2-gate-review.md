# Todo 7 Fix2 Gate Review

recommendation: APPROVE

## originalIntent

Final independent verification for Todo 7 in `.omo/plans/family-experience-market-ready-platform.md`: define portable deployment configuration and secret policy, then verify the embedded-placeholder false-negative fix in the secret scanner. The user-visible outcome is that local `.env`, KakaoCloud/PlayMCP-in-KC, and non-Kakao secret placement rules are clear; committed/raw secrets are not allowed; and `scan-secrets --include` cannot be bypassed by embedding an allowed placeholder inside a longer token.

## desiredOutcome

- Current secret scanner allows only exact full matched placeholder values.
- Pure placeholder values remain allowed.
- Placeholder embedded in a longer token is rejected.
- A mixed line with an allowed placeholder plus a separate real-looking token is rejected.
- No secret regex/rule is weakened.
- Focused scanner tests, default secret scan, and full verify pass in the current workspace.
- Docs/env policy says no committed secrets, image-baked PlayMCP-in-KC path is `HUMAN_APPROVAL_REQUIRED`, and that exception requires private repo/registry, no raw-key logs, rotation, and later removal.

## userOutcomeReview

PASS. The current artifact satisfies the requested outcome. `scan-secrets.ts` checks each regex occurrence independently, extracts the matched secret value for bearer/query/path/assignment shapes, and compares that extracted value to the placeholder allowlist by exact equality. Independent probes confirmed pure placeholders pass while embedded-placeholder and mixed-token cases fail with `key-assignment`.

## blockers

None.

## checked artifact paths

- `.omo/plans/family-experience-market-ready-platform.md`
- `apps/family-experience-mcp/scripts/scan-secrets.ts`
- `apps/family-experience-mcp/test/scanSecrets.test.ts`
- `apps/family-experience-mcp/package.json`
- `apps/family-experience-mcp/.env.example`
- `apps/family-experience-mcp/docs/RUNBOOK.md`
- `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`
- `.gitignore`
- `.omo/evidence/family-experience-market-ready-platform/task-7-code-quality-doc-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-7-doc-secret-review.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-policy-grep.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-include-failclosed.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-negative-secret.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-done-claim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-red-embedded-placeholder.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-focused-scanSecrets.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-scan-secrets.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-full-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-embedded-include-after-fix.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-mixed-include-after-fix.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-implementation-review.md`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-cleanup.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-loc.tsv`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-changed-files.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-diff.patch`
- `.omo/evidence/family-experience-market-ready-platform/task-7-fix2-evidence-integrity.txt`

## implementation evidence

- `scan-secrets.ts:12-20` retains rules for bearer tokens, OpenAI-style keys, Seoul key assignments, provider service keys, generic key assignments, query-keyed URLs, and path-keyed URLs.
- `scan-secrets.ts:104-110` iterates every regex occurrence with `matchAll(globalPattern(pattern))`, so one allowed occurrence cannot suppress another rejected occurrence on the same line.
- `scan-secrets.ts:118-120` allows only `matchedSecretValue(text) === placeholder`.
- `scan-secrets.ts:123-139` extracts the full matched value for bearer, query, path, and assignment match shapes. Longer values containing `CLI_SYNTHETIC_SERVICE_KEY_12345` are not equal to the placeholder.
- `scanSecrets.test.ts:58-90` covers pure placeholder allowance, mixed-token rejection, and embedded-placeholder rejection through `scanText`.
- `scanSecrets.test.ts:143-163` covers mixed-token rejection through the CLI `--include` surface.

## slop and programming review

Skills consulted directly:

- `omo:remove-ai-slops`
- `omo:programming`
- `omo:programming/references/typescript/README.md`

Direct pass:

- No excessive/useless tests, deletion-only tests, requested-removal-only tests, tautological tests, or implementation-mirroring tests found.
- The new embedded-placeholder test is adversarial and would fail if the code reverted to substring allowance.
- The helper extraction is justified by multiple match shapes; it is not an exact-string-only hack or speculative abstraction.
- No secret rule was removed, relaxed, or allowlisted by fixture name.
- No unrelated refactor, scope drift, or broad rewrite found in the two changed TypeScript files.
- No `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`, `.only(`, or `.skip(` was found in the changed TypeScript files.
- LOC receipt reports `scan-secrets.ts` at 179 pure LOC and `scanSecrets.test.ts` at 116 pure LOC, both under the 250 pure LOC defect threshold.

Report coverage:

- `task-7-fix2-implementation-review.md` has an "Overfit And Slop Review" section covering exact-string overfit, scanner weakening, substring allowance closure, untrusted include behavior, broad rewrite avoidance, unrelated cleanup avoidance, escape hatches, and size.
- I did not rely on that report alone; I rechecked code, tests, and behavior directly.

## commands_run

- `codegraph explore "apps/family-experience-mcp/scripts/scan-secrets.ts apps/family-experience-mcp/test/scanSecrets.test.ts secret placeholder scanner"`
- `npm test -- --run test/scanSecrets.test.ts` from `apps/family-experience-mcp`: PASS, 1 file, 11 tests.
- `npm run scan:secrets` from `apps/family-experience-mcp`: PASS, 148 scanned files.
- `npm run verify` from `apps/family-experience-mcp`: PASS, typecheck passed, 18 test files and 139 tests.
- Independent temp include probe batch:
  - `SERVICE_KEY=<redacted-synthetic-secret>`: exit 0, PASS.
  - `API_KEY=<redacted-synthetic-secret>`: exit 1, `key-assignment`.
  - `CLI_SYNTHETIC_SERVICE_KEY_12345 API_KEY=<redacted-synthetic-secret>`: exit 1, `key-assignment`.
- `npm run scan:sources` from `apps/family-experience-mcp`: PASS, 96 scanned files.
- `npm run scan:claims` from `apps/family-experience-mcp`: PASS, 129 scanned files.
- `git check-ignore -v apps/family-experience-mcp/.env apps/family-experience-mcp/.env.local .env .env.local`: PASS, `.gitignore` ignores `.env` and `.env.*` at app and root paths.

## adversarial classes

- `substring_placeholder_bypass`: PASS. Embedded placeholder inside a longer token rejects.
- `mixed_placeholder_plus_secret`: PASS. Separate real-looking token rejects even when a placeholder appears on the same line.
- `pure_placeholder_regression`: PASS. Exact pure placeholder value remains allowed.
- `multiple_occurrences_same_line`: PASS. Scanner evaluates each occurrence independently.
- `include_surface`: PASS. Explicit include paths are scanned through the same rules.
- `malformed_or_missing_include`: PASS from tests and `task-7-include-failclosed.txt`.
- `secret_rule_weakening`: PASS. Current rules still cover all intended token/key URL shapes; no rule was removed or relaxed.
- `docs_env_policy`: PASS. `.env.example`, `RUNBOOK.md`, and `HOST_REQUIREMENTS_SOT.md` preserve no-commit secrets, secret-manager defaults, and approval-gated image-baked exception policy.
- `dirty_worktree`: NEEDS-HUMAN-AWARENESS only. The workspace is broadly untracked, so git diff is not a reliable provenance source. Current on-disk files and behavior were verified directly.

## exact evidence gaps

- The submitted `task-7-fix2-full-verify.txt` reports 135 tests; my fresh rerun reports 139 tests. The fresh rerun is the authoritative result.
- `task-7-fix2-diff.patch` is a full-add patch because the relevant files are untracked in this workspace, not a minimal pre-fix/post-fix hunk diff. This was mitigated by direct current-code inspection and fresh behavior probes.
- No fix2-specific notepad file was provided. The original Todo 7 plan/review artifacts and current fix2 evidence were sufficient for this scanner reverify.
- I did not inspect any local `.env` contents to avoid exposing private secrets; this review verifies commit surface, scanner behavior, and policy text.

## final

APPROVE
