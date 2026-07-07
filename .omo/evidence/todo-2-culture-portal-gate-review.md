recommendation: REJECT

blockers:
- Todo 2 requires valid Culture Portal XML to map title/date/place/price/coords/link/thumbnail only when the source provides them. The fixture provides gpsX=129.0934, gpsY=35.1379, and thumbnail=https://culture.example.test/thumbs/CP-202607-A.jpg, but the normalized record preserves only presence tags (`coordinates_source_provided`, `thumbnail_source_provided`) and drops the coordinate and thumbnail values. The current canonical record type also has no coordinate or thumbnail fields.
- Required code-review-report coverage is absent for this gate. The available task evidence includes no separate code review report that explicitly applies programming plus remove-ai-slops/overfit criteria.

originalIntent:
- Add the Culture Portal/KCISA one-view adapter with fixture-backed XML REST parsing.
- Preserve source-provided fields for title, date, place, price, coordinates, link, and thumbnail without inferring booking or safety.
- Fail closed for missing keys and malformed source XML.
- Redact service keys and keyed URLs.
- Do not add MCP/live fan-out wiring.

desiredOutcome:
- `npm test -- culturePortal` passes reliably with 5/5 tests.
- `npm run typecheck` passes.
- Manual QA demonstrates `missing_key`, `source_invalid_response`, and redacted diagnostics.
- Valid fixture output preserves all required source-provided fields or exposes explicit canonical fields for them.
- Culture Portal adapter remains standalone until later cache/ETL wiring.

userOutcomeReview:
- Partially satisfies the user's expected outcome. The tests and typecheck pass, failure paths are typed, diagnostics are redacted, prompt-injection-like source text remains inert adapter data, and no MCP fan-out wiring was found.
- Does not satisfy Todo 2 completely because coordinate and thumbnail source values are not mapped/preserved, despite being present in the fixture and explicitly named in the todo.

checkedArtifactPaths:
- `.omo/plans/family-experience-nationwide-etl-expansion.md`
- `apps/family-experience-mcp/src/sources/culturePortal.ts`
- `apps/family-experience-mcp/test/culturePortal.test.ts`
- `apps/family-experience-mcp/test/fixtures/culture-portal-period-valid.xml`
- `apps/family-experience-mcp/test/fixtures/culture-portal-malformed.xml`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-2-culture-portal.txt`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-2-culture-portal-final-acceptance.txt`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-2-culture-portal-green-rerun.txt`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-2-culture-portal-typecheck.txt`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-2-culture-portal-manual-qa.txt`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-2-culture-portal-no-excuse.txt`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-2-culture-portal-loc.txt`
- `.omo/evidence/family-experience-nationwide-etl-expansion/task-2-culture-portal-scoped-status.txt`
- `apps/family-experience-mcp/src/sources/types.ts`
- `apps/family-experience-mcp/src/pipeline/normalize.ts`
- `apps/family-experience-mcp/src/pipeline/render.ts`

executedVerification:
- `npm test -- culturePortal` from `apps/family-experience-mcp`: PASS, 1 test file, 5 tests.
- Fresh rerun `npm test -- culturePortal` from `apps/family-experience-mcp`: PASS, 1 test file, 5 tests.
- `npm run typecheck` from `apps/family-experience-mcp`: PASS, `tsc --noEmit`.
- `node --import tsx --input-type=module -e "<print normalized Culture Portal fixture result>"`: confirmed title/date/place/fee/source URL/program text/tags, and confirmed gpsX/gpsY/thumbnail values are absent from output.
- `rg -n "createCulturePortalSourceAdapter|normalizeCulturePortalXml|buildCulturePortalRequest" apps/family-experience-mcp/src`: only `src/sources/culturePortal.ts` contains those exported adapter symbols, supporting no MCP/live fan-out wiring.

slopAndOverfitReview:
- No deletion-only, removal-only, tautological, or implementation-mirroring test pattern was the main issue.
- The test suite is under-specified for the explicit Todo 2 field-preservation requirement: it checks coordinate/thumbnail presence tags but not preservation of coordinate or thumbnail values.
- Production code performs regex-based XML extraction at a boundary. This is acceptable only as a scoped fixture/live adapter risk, but the current issue is simpler: required source values are discarded.
- `culturePortal.ts` is exactly 250 pure LOC per existing evidence, at the ceiling but not over the >250 defect threshold.

evidenceGaps:
- No provided code review report for Todo 2 with explicit programming-skill and remove-ai-slops/overfit coverage.
- No notepad path was provided for Todo 2.
- No git diff artifact for these scoped files because they are untracked in `git status --short`; review used raw inspected artifacts instead.
- Manual QA does not cover preservation of actual coordinate and thumbnail values.

adversarialClasses:
- malformed_input: PASS, malformed fixture returns `source_invalid_response`.
- prompt_injection_untrusted_text: PASS at adapter boundary, fixture text remains plain `program_text` data and no execution path was found.
- stale_state: PASS for current commands; fresh test and typecheck reruns match evidence.
- dirty_worktree: NEEDS_CAUTION, scoped Todo 2 files are untracked and the broader worktree is heavily dirty, but raw artifacts were inspected directly.
- misleading_success_output: FAIL, green test output is real but incomplete because it does not prove coordinate/thumbnail value mapping.
- flaky_tests: PASS, current targeted test passed twice in this gate.

finalGate:
- REJECT until coordinate and thumbnail values are preserved in the canonical adapter output or the plan/schema is explicitly amended to state that Culture Portal only records their presence tags at Todo 2.
