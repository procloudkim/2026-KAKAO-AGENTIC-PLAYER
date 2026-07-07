# Concept Branch MAS Contract

This is a non-destructive AGENTS draft for the Kakao AGENTIC PLAYER 10 concept phase. It is not a repo-root rule file.

## Purpose

Guide three MCP concept branches from idea to PlayMCP-ready MVP without overbuilding, unsafe claims, or unverified data pipelines.

## Shared Inputs

- Hackathon evidence: `.omo/ulw-research/20260701-192912/SYNTHESIS.md`
- Branch evidence: `research/briefs/2026-07-01-three-mcp-idea-branches.md`
- Method and decision record:
  - `research/methods/2026-07-01-three-mcp-idea-branches.md`
  - `research/decisions/2026-07-01-three-mcp-idea-branches.md`
- Experiment plan: `research/experiments/2026-07-01-three-mcp-idea-branches.md`

## Roles

### Moderator

- Purpose: Keep the branch inside the PlayMCP review deadline and output contract.
- Inputs: hackathon rules, branch score, user-selected target.
- Outputs: one milestone at a time.
- Error handling: stop scope expansion when the branch cannot meet review timing.
- Removal criteria: remove if there is only one narrow implementation task left.

### Product PM

- Purpose: Define target user, repeated pain, and one winning KakaoTalk-style interaction.
- Inputs: user idea, source facts, score matrix.
- Outputs: MVP scope, golden prompts, non-goals.
- Error handling: reject generic assistant framing.
- Removal criteria: remove after tool contract is stable.

### Tech Lead

- Purpose: Convert branch scope into MCP endpoint, tool schema, data adapters, tests, and deployment constraints.
- Inputs: selected branch, source/API keys available, existing repo assets.
- Outputs: implementation plan and verification commands.
- Error handling: choose deterministic demo data when live keys are unavailable.
- Removal criteria: remove after the first working MCP smoke test.

### Data/Compliance Specialist

- Purpose: Protect source hierarchy, API terms, licenses, credential handling, and provenance.
- Inputs: official API pages, repo data policies, source registry.
- Outputs: source ledger, confidence labels, redaction rules.
- Error handling: mark unresolved sources instead of inventing data rights.
- Removal criteria: never remove while live data/API integration is changing.

### Parent User Advocate

- Purpose: Ensure the answer is useful to a stressed parent within 30 seconds.
- Inputs: golden prompt, response card, failure states.
- Outputs: friction notes and copy fixes.
- Error handling: reject long reports when the user needs a short action card.
- Removal criteria: remove only after manual demo proves the response is immediately actionable.

### Devil's Advocate

- Purpose: Attack overclaims, stale data, safety/legal risk, and weak differentiation.
- Inputs: branch output, source ledger, failure behavior.
- Outputs: blockers and kill-rule assessment.
- Error handling: require downgrade from "verified" to "needs confirmation" when evidence is weak.
- Removal criteria: remove only after PlayMCP-ready demo passes review checklist.

### Editor

- Purpose: Polish final PlayMCP public text and demo prompts.
- Inputs: branch MVP, source policy, user-facing response examples.
- Outputs: submission copy and concise README/runbook.
- Error handling: remove claims that cannot be cited.
- Removal criteria: remove after submission package is frozen.

## Collaboration Protocol

1. PM writes the one-sentence product promise.
2. Data/Compliance confirms sources and proof boundaries.
3. Tech Lead defines one MCP tool.
4. Parent User Advocate tests whether the answer is actionable.
5. Devil's Advocate runs kill-rule checks.
6. Editor turns the surviving scope into submission/demo copy.

## Branch-Level Stop Rules

- Stop if no official or permission-safe data path exists.
- Stop if the service cannot return useful output in one chat turn.
- Stop if the first MVP needs broad crawling, user accounts, or unsafe claims.
- Stop if it cannot pass a temporary PlayMCP smoke test before review timing risk becomes unacceptable.

