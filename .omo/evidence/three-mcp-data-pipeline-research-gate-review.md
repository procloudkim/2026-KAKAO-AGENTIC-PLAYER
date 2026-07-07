# Three MCP Data Pipeline Research Gate Review

recommendation: REJECT

## originalIntent

The user wanted Korean, MECE-style research and organization of design and requirements for three hackathon MCP concepts, with special emphasis on data pipelines.

## desiredOutcome

The user-visible deliverable should be Korean-first, topic-by-topic, and non-duplicative across the three concept branches. Each concept should contain product/design requirements, source hierarchy, data-pipeline requirements, normalized schema, confidence/freshness policy, failure modes, high-risk claim boundaries, and the next smallest safe move.

## userOutcomeReview

The substantive research mostly answers the design/data-pipeline problem: each branch has a product design table, source registry, data pipeline, normalized record shape, confidence policy, MVP cut, stop/kill rules, and unresolved items. The three branches are also meaningfully MECE: family activity recommendations, pharmacy candidate lookup, and parent product-evidence routing are distinct user jobs with a shared architecture factored into `concept/DATA_PIPELINE_ARCHITECTURE.md`.

The deliverable does not satisfy the requested user-visible outcome because the main deliverable files are predominantly English, while the original request explicitly asked for Korean. Final-gate evidence is also incomplete: the current-run notepad records planned checks but not executed QA results, no current manual QA matrix was found, and no current code/research review report explicitly covers the `remove-ai-slops` and `programming` criteria.

## blockers

1. Korean-language output contract not met.
   - Evidence: `.omo/ulw-research/20260701-235345/SYNTHESIS.md:1` starts `MECE Synthesis`; `concept/DATA_PIPELINE_ARCHITECTURE.md:1` starts `Shared MCP Data-Pipeline Architecture`; each branch deliverable starts `MECE Research` and uses English-first sections such as `Product Design`, `Source Registry`, `Data Pipeline Requirements`, `Confidence Policy`, and `Unresolved`.
   - Minimal fix: rewrite or add Korean-first versions of `.omo/ulw-research/20260701-235345/SYNTHESIS.md`, `concept/DATA_PIPELINE_ARCHITECTURE.md`, `concept/family-experience-mcp/MECE_RESEARCH.md`, `concept/pharmacy-now-mcp/MECE_RESEARCH.md`, `concept/parent-trust-mcp/MECE_RESEARCH.md`, `concept/README.md`, and the three branch `README.md` files. Preserve source URLs, tool names, schema field names, and confidence labels.

2. Current-run final-gate evidence is absent.
   - Evidence: `.omo/ulw-research/20260701-235345/NOTEPAD.md:46` through `.omo/ulw-research/20260701-235345/NOTEPAD.md:56` lists planned checks only. I found no current `QA.md`, manual QA matrix, executed command transcript, or reviewer report for run `20260701-235345`.
   - Minimal fix: add a current-run QA/review artifact or append an executed evidence section to the notepad with command, result, and pass/fail for artifact presence, citation/unresolved coverage, unsafe-claim grep, README file-list consistency, and whitespace/format checks.

3. Required slop/programming review coverage is not supported by an executor report.
   - Evidence: the only existing `.omo/evidence/kakao-agentic-player-ulw-research-gate-review.md` covers the earlier `20260701-192912` run and explicitly says missing code-review/manual-QA artifacts were treated as non-blocking. It does not cover the current three-concept data-pipeline deliverable.
   - Minimal fix: create a current review report that explicitly states the `remove-ai-slops` pass over docs/tests/production code, confirms no deletion-only/tautological/implementation-mirroring/excessive tests exist, and applies `programming` criteria as N/A for document-only work or to any code if code is added.

4. Branch README file lists are incomplete unless intentionally scoped.
   - Evidence: each branch folder contains `README.md`, `DEBATE.md`, `REFINED_PROPOSAL.md`, `MECE_RESEARCH.md`, `DATA_PIPELINE.md`, `MCP_TOOLS.md`, `GOLDEN_PROMPTS.md`, and `EXPERIMENTS.md`; each branch `README.md` file list only names five files and omits at least `DEBATE.md` and `REFINED_PROPOSAL.md`.
   - Minimal fix: update the three branch `README.md` file lists to include all branch artifacts, or rename the section to `Core Files` and explicitly state that debate/proposal files are supplemental.

## criterionReview

1. Request coverage: PARTIAL. Topic-by-topic design/data-pipeline content is present, but not in Korean.
2. MECE branches: PASS. The branches are non-duplicative by user job and risk profile.
3. High-risk claims: PASS with caveat. Risky claims are generally cited in `claim-ledger.md` or marked unresolved. External source pages were spot-checked for the main source types.
4. Unsafe claims: PASS. Pharmacy avoids hard open-now claims, parent-trust avoids safe/dangerous/no-recall-is-safe claims, and family age-fit inference is labeled.
5. Next smallest safe moves: PASS. `SYNTHESIS.md:78` through `SYNTHESIS.md:80` gives the family-first skeleton plus fixture-first adapter path; each branch MECE file has MVP and stop/kill rules.
6. Blocking issues before final response: YES. Korean output contract and current-run evidence gaps block approval.

## checkedArtifactPaths

- `.omo/ulw-research/20260701-235345/NOTEPAD.md`
- `.omo/ulw-research/20260701-235345/expansion-log.md`
- `.omo/ulw-research/20260701-235345/wave-1-returns.md`
- `.omo/ulw-research/20260701-235345/claim-ledger.md`
- `.omo/ulw-research/20260701-235345/SYNTHESIS.md`
- `concept/DATA_PIPELINE_ARCHITECTURE.md`
- `concept/family-experience-mcp/MECE_RESEARCH.md`
- `concept/pharmacy-now-mcp/MECE_RESEARCH.md`
- `concept/parent-trust-mcp/MECE_RESEARCH.md`
- `concept/README.md`
- `concept/family-experience-mcp/README.md`
- `concept/pharmacy-now-mcp/README.md`
- `concept/parent-trust-mcp/README.md`
- `concept/family-experience-mcp/DATA_PIPELINE.md`
- `concept/pharmacy-now-mcp/DATA_PIPELINE.md`
- `concept/parent-trust-mcp/DATA_PIPELINE.md`
- `.omo/evidence/kakao-agentic-player-ulw-research-gate-review.md`
- `C:\Users\K\.codex\plugins\cache\sisyphuslabs\omo\4.15.0\skills\remove-ai-slops\SKILL.md`
- `C:\Users\K\.codex\plugins\cache\sisyphuslabs\omo\4.15.0\skills\programming\SKILL.md`

## externalSpotChecks

- `https://www.data.go.kr/data/15013106/standard.do`: official performance/event standard data page exposes event fields including fee, age, reservation, address, latitude, and longitude; update cadence is quarterly with monthly aggregation caveat.
- `https://www.data.go.kr/data/15101578/openapi.do`: KTO TourAPI page describes nationwide tourism/event/location/image data and real-time update cycle.
- `https://www.data.go.kr/data/15000576/openapi.do`: NMC pharmacy API page describes pharmacy lookup and real-time update cycle.
- `https://www.data.go.kr/data/15001673/openapi.do`: HIRA pharmacy metadata page describes HIRA-reported pharmacy registry information.
- `https://www.data.go.kr/data/15051043/openapi.do`: HIRA open/close page describes open/close/holiday status by reference month, supporting use as churn/cross-check rather than live-open oracle.
- `https://developers.kakao.com/docs/ko/local/dev-guide`: Kakao Local docs were checked; a search for operating-hours wording did not surface a documented hours field in the inspected response surface.
- `https://www.data.go.kr/data/15116894/openapi.do`: SafetyKorea/KATS page describes KC certification and recall data fields.
- `https://www.foodsafetykorea.go.kr/api/main.do`: MFDS Food Safety Korea API portal was reachable as an official data-service source.

## slopAndProgrammingPass

Direct reviewer pass: no production code diff or tests were in scope, so deletion-only tests, tautological tests, implementation-mirroring tests, unnecessary production extraction, parsing, or normalization were not found in changed production code. The document content does not appear to introduce scope-drifting implementation work or broad crawler commitments; it repeatedly constrains fixture-first, source-registry-first, and no-overclaim behavior.

Executor report coverage: FAIL. The current-run artifacts do not include a supported code/research review report with the same `remove-ai-slops` and `programming` perspective coverage, so this is a gate blocker.

## exactEvidenceGaps

- No current-run manual QA matrix or executed QA transcript was found for `20260701-235345`.
- No current-run reviewer approval report was found.
- No current-run report explicitly covers overfit/slop criteria and `programming` criteria.
- No tracked diff was available for the untracked `.omo/` and `concept/` artifacts; review was performed from artifact contents instead.
- The final user-facing content is not Korean-first despite the original request.

