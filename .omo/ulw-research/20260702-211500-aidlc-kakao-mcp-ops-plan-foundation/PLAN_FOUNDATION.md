# Plan Foundation - Awaiting Approval

Status: `awaiting-approval`

This is not the execution plan. It is the research-grounded basis for the next `.omo/plans/...` file.

## Problem Definition
- Goal: prepare a cold, evidence-based plan for building and operating a Kakao PlayMCP entry using AIDLC lifecycle discipline.
- Context: the repo already contains a stronger `family-experience-mcp` app than the other concepts, but it is mostly private/fixture/proof oriented.
- Constraints: Kakao contest timeline, PlayMCP review/publication flow, MCP HTTP/security expectations, source-data credibility, and no unsupported claims.
- Success criteria: a plan can be approved that moves from live data proof to hosted endpoint proof to PlayMCP review readiness.
- Done when: the approved plan has clear gates, commands, artifacts, kill rules, and review/publication stop lines.

## Evidence Brief
- Authoritative sources: Kakao contest page, Kakao corporate notice, PlayMCP `llms.txt`, official MCP spec/security docs, awslabs/aidlc-workflows, local repo docs/source/tests.
- Verified facts: captured in `claim-ledger.md`.
- Inferences: source-packaged action cards are the practical edge; family-experience should remain primary unless live data fails.
- Unknowns: Kakao Tools widget spec, exact review-policy details, live API payload reliability, final public endpoint constraints.
- Assumptions: user wants a competition-grade implementation but still wants approval before execution planning becomes implementation.
- Main risk: shipping a polished local demo that cannot pass live data, public endpoint, or Kakao review constraints.

## Method Selection
- Chosen method: repo-native ULW/AIDLC hybrid.
- Why: it preserves the current working app and adds missing lifecycle discipline without copying irrelevant AIDLC mechanics.
- Fallback method: holiday pharmacy MCP if family-experience live data is not reliable enough.
- Rejected methods:
  - direct AIDLC clone: too AWS/IDE-specific;
  - three-product parallel sprint: too much operations and review risk;
  - Kakao checklist only: weak source/evaluation discipline.

## Execution Plan Skeleton
- Baseline: current `apps/family-experience-mcp` fixture-verified MCP.
- Controllable variables: source adapters, cache TTL, endpoint host, output copy, golden prompts, review metadata, claim boundaries.
- Fixed variables: one public tool first, top-3 answer contract, source/freshness/confidence fields, no unsupported claims.
- Budget ladder:
  - B0: docs/plan approval only.
  - B1: live adapter smoke and redacted sample.
  - B2: hosted endpoint smoke and PlayMCP temporary registration.
  - B3: review/public readiness package.
  - B4: Kakao Tools finalist backlog.
- Promotion rule: promote only if tests/scans/smokes pass and the claim ledger has no unsupported public claim.
- Kill rule: stop source expansion if official/open data cannot support freshness, child-age fit, or rights to use.
- Stop rule: do not request public review until hosted endpoint, metadata, source ledger, representative image, and rollback plan are ready.
- Final evaluation rule: judge against Kakao criteria: creativity, convenience, stability, plus this repo's source-governance gates.
- Wall-clock estimate: 1 day for plan + live source proof, 1 day for hosted endpoint proof, 0.5 day for PlayMCP temporary registration package, unknown for Kakao review.
- RAM estimate: low; Node MCP service and tests are lightweight.
- CPU/GPU/NPU split: CPU only; no model training or local GPU/NPU dependency required.
- Reboot-required resources: none known.

## Approval Gate
Recommended approved next plan title:

`aidlc-kakao-family-experience-mcp-live-to-playmcp-ops.md`

Approval should authorize creating the real `.omo/plans/` execution plan and then implementing the first wave only: live data proof plus hosted endpoint readiness checks.
