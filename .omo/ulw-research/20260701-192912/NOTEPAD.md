# ULW Research Notepad: Kakao AGENTIC PLAYER 10

## Mode / Tier
- Mode: ULW-RESEARCH under Ultrawork.
- Tier: HEAVY. Justification: hackathon strategy plus MCP service architecture, external platform constraints, submission/legal constraints, and current official information.

## Skills surveyed
- `omo:ulw-research`: active because user explicitly invoked `$omo:ulw-research`; use session journal, saturation axes, EXPAND loop, cited synthesis.
- `omo:teammode`: relevant by ulw-research default, but Codex app team-thread tools are not exposed in this session; fallback to `multi_agent_v1` workers.
- `context7`: only if current library/framework/API documentation becomes necessary; current corpus analysis is not yet a library-doc question.

## Problem Definition
- Goal: Analyze repo-local `.txt` files for Kakao AGENTIC PLAYER 10 and produce a practical participation strategy that can guide concrete Codex-assisted implementation once the user's idea is specified.
- Context: Current workspace has `HTML.txt` and empty `Agentic-Play.txt`; `HTML.txt` is an HTML dump of Kakao's AGENTIC PLAYER 10 promotion page.
- Constraints: Must prioritize official page text and official links; external facts may be stale and need current-session verification before being called current; no implementation until method/risk gate is satisfied.
- Success criteria:
  1. Extract official deadlines, eligibility/submission flow, review criteria, technical obligations, and legal constraints from repo text with line citations.
  2. Identify actionable strategy for idea shaping and MVP scope under PlayMCP/Kakao Tools constraints.
  3. Record unknowns and risky claims separately from verified facts.
  4. Produce a cited synthesis and a next-build plan the user can use immediately.
- Done-when: Session journal contains wave digests, expansion log, claim ledger if needed, `SYNTHESIS.md`, and final answer summarizes the strategy and next smallest safe move.

## Phase 0 Decomposition
- Core question: What does the local hackathon material require, and how should the user turn an existing idea into a competitive, feasible Kakao PlayMCP/Kakao Tools entry?
- Axes:
  1. Official rules and timeline: extract deadlines, rewards, submission mechanics, review duration, hard gates from `HTML.txt`.
  2. Technical platform constraints: infer PlayMCP/MCP endpoint, temporary registration, review request, public status, Kakao Tools widget/more-strict-spec implications.
  3. Judging/product strategy: map judging criteria to product requirements and idea evaluation rubric.
  4. Legal/submission risk: rights, data/IP, false information, tax/reward, one-shot submission, purpose-limited cloud usage.
  5. External official context: verify live official page/guide and prior winner interview where possible.
  6. Implementation route: define smallest credible MVP architecture and validation plan without knowing the user's private idea yet.
- Codebase relevant: yes. External: yes. Browsing: yes. Verification likely: yes for URL freshness and extraction completeness. Final material format: markdown synthesis, because user asked for help and no PDF/report format was requested.

## Method Selection
- Candidate methods:
  1. Direct extraction only from `HTML.txt`.
  2. Repo extraction plus official live-link freshness check.
  3. Repo extraction plus broad web/OSS PlayMCP research.
  4. Full implementation scaffold before idea disclosure.
- Chosen method: #2 now, with bounded expansion into #3 only for official guide/prior-winner/public platform facts.
- Fallback method: If live external access is blocked, rely on `HTML.txt` and mark official-guide details as unknown.
- Rejections:
  - #1 misses freshness and linked guide details.
  - #3 can waste time before the user's actual idea is known.
  - #4 is premature and risks building the wrong MCP service.

## Execution Plan
- Baseline: Parse `HTML.txt`, cite line evidence, build a submission readiness matrix.
- Controllable variables: idea scope, tool count, data sources, UI/widget investment, privacy/security posture, fallback responses.
- Fixed variables: official deadlines, submission flow, review criteria, one-shot submission, Kakao Cloud/PlayMCP public status gates.
- Budget ladder:
  1. 1-hour idea fit and risk scoring.
  2. 1-day MCP skeleton and one killer tool.
  3. 2-3-day reliable MVP with logging, safety, and demo cases.
  4. Pre-7/7 review request target to avoid deadline risk.
- Promotion rule: Advance only when the previous layer has a working endpoint, deterministic demo case, and submission-risk checklist clear.
- Kill rule: Drop any feature that cannot prove creative/convenient/stable value in one KakaoTalk-style interaction.
- Stop rule: Stop research when repo facts, live official facts, and strategy implications converge; do not continue into implementation without user idea details.
- Final evaluation rule: Score candidate idea against creativity, convenience, stability, data rights, MCP feasibility, Kakao Tools upgrade path, and public-vote appeal.
- Wall-clock estimate: 0.5-1 day for submission-ready thin MCP if idea/data are simple; 2-4 days for credible differentiated MVP.
- RAM estimate: Low for typical MCP HTTP service; depends on model/API use. Avoid local heavy inference unless essential.
- CPU/GPU/NPU role split: CPU/web API first; no GPU/NPU dependency unless user's idea explicitly needs local ML.
- Reboot-required resources: none known.

## Manual QA / Evidence Scenarios
- Scenario A, repo extraction completeness: `rg -n "<rule keywords>" HTML.txt`; PASS if all rule areas have line evidence.
- Scenario B, freshness check: open official URL(s) from HTML; PASS if current official page/redirect content matches local corpus or differences are recorded.
- Scenario C, deliverable check: read `SYNTHESIS.md`; PASS if every major recommendation cites repo lines, live source, or explicit inference.

