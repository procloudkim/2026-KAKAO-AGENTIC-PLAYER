# Golden Results

Date: 2026-07-14

The golden smoke suite drives the public MCP HTTP surface with fixture mode enabled, except the source-failure case which starts a temporary local server with fixture disabled and no live key. It writes evidence to `.omo/evidence/golden-family-experience-*.json`.

## Scenarios

| Scenario | Expected result |
| --- | --- |
| Happy | Fixture mode, exactly three candidates, and three user-visible action cards. Each card exposes title, date/time, venue, address, age-fit label and reason, indoor/outdoor, fee text, source name and URL, retrieved-at/freshness, confidence, mode, warnings, source summary, parent check, and next action. |
| Missing age | Korean parent-facing clarification, `isError: true`, no candidates, and no English SDK validation message as the main visible response. |
| No result | Safe no-result response, no candidates, no fabricated matches, and one specific relaxation suggestion: widen only the date range. |
| Source failure | `isError: true`, no candidates, safe Korean source/configuration message, and no raw secret or keyed URL. |

## Safety Boundary

- Golden runs do not require live network or real API keys.
- Fixture happy output is demo-only and must not claim current operation, live availability, reservation availability, national coverage, or universal child suitability.
- The domain input schema remains strict; the MCP transport boundary allows missing child selector input to reach the handler so it can return Korean structured clarification.

## Nationwide Prompt Eval Coverage

Date: 2026-07-04

The nationwide prompt eval is a fixture/cache golden coverage gate, not a live completeness claim. It drives 42 nationwide prompt fixtures through:

- the deterministic structured request path for result correctness checks
- the public loose MCP prompt path via `{ prompt: fixture.prompt }` for independent success/no-result result correctness, region/date/child-selector checks, unsupported-claim rejection, and prompt-injection safety

Required coverage buckets are 42 prompts, 12 regions, all child-stage groups, free/paid, indoor/outdoor, no-result, unsupported-claim prompts, and prompt-injection prompts. Evidence is written under `.omo/evidence/family-experience-market-ready-platform/task-11-market-prompt-eval/`.

The eval must fail if the selected nationwide fixture count is not exactly 42. It must also fail if prompt text is replaced with unrelated malicious text while the structured request is preserved, because prompt-path checks require the actual public loose path result to match the fixture's observable result contract.

The evaluator reads fixture mode, configured source set, cache TTL, and reference date from the fixture cache metadata. This keeps relative or yearless date parsing deterministic without weakening the production cache contract. The current fixture run passes 42/42 scenarios across 84 structured and public loose-prompt surfaces.

## Market Prompt Eval Metrics

The nationwide prompt eval also emits `market_scenarios` in `summary.json`. This is the parent-facing market gate for:

- candidate count: at most three candidates per response, with over-limit surfaces counted as failures
- parent decision value: age-fit reason, date/place, fee text, parent check, and next action present on every candidate
- source/trust field completeness: source name, source URL, retrieved-at timestamp, confidence, warnings, and source summary present on every candidate
- unsupported-claim absence: no reservation, open-now, real-time, complete-coverage, or safety-certification claims accepted from prompt text
- no-result behavior: expected no-result prompts return no candidates and a safe no-result failure instead of fabricated matches

The scoring policy explicitly records `answer_volume_score: "not_used"` so the evaluator does not reward long answer volume.

## Verification

Run from `apps/family-experience-mcp`:

```bash
npm run typecheck
npm test -- --run test/mcp.test.ts test/pipeline.test.ts test/golden.test.ts
npm run verify
FAMILY_EXPERIENCE_ALLOW_FIXTURE=true npm run smoke:golden
```

For the current full verification status, see `docs/QA_REPORT.md`.
