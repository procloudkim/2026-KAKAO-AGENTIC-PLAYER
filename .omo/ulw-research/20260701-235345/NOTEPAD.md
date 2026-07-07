# ULW Research Notepad

Task: MECE research and design requirements for three Kakao AGENTIC PLAYER MCP concepts, especially data pipelines.

## Tier

HEAVY.

Justification: three product concepts, external official data/API integrations, safety/privacy/legal risks, and user explicitly invoked `$omo:ulw-research`.

## Skill Survey

- `omo:ulw-research`: used because the user explicitly invoked it and requested research.
- `oml:debate`: not re-run this turn; its prior debate outputs are source artifacts.
- `context7`: not used because no specific programming library/API SDK docs are being requested; data-source docs are official public web sources.
- `omo:git-master`: not used because the user did not request commit/branch creation this turn.

## Phase 0 Decomposition

Core question: For each of three MCP concepts, define MECE product/design requirements and especially data-pipeline requirements grounded in repo evidence and fresh official source checks.

Axes:

1. Repo and debate artifacts: current concept folders, OML debate outputs, hackathon rules.
2. Family experience data pipeline: official event/tourism/culture/education sources, schema, age-fit inference, freshness.
3. Pharmacy data pipeline: NMC/HIRA/Kakao boundaries, live-vs-stale status, phone-first action.
4. Parent trust data pipeline: SafetyKorea/KATS/KIPS/MFDS lanes, product identity, proof boundaries.
5. Cross-concept architecture: MCP tool contracts, source ledger, normalization, confidence, failure modes.
6. Compliance and risk: data rights, scraping exclusion, secret handling, overclaiming.

Codebase relevant: yes.
External: yes.
Browsing: yes.
Verification likely: yes, for official source reachability and artifact presence.
Final material format: markdown.

## Success Criteria

1. Each topic has MECE design requirements and data-pipeline requirements with sources.
2. Each topic has source hierarchy, normalized schema, ingestion/refresh plan, confidence policy, failure modes, and first MVP cut.
3. Shared architecture is explicit and non-duplicative.
4. Every high-risk external claim is cited or marked unresolved.
5. Session journal reconstructs searches, leads, decisions, and verification.
6. Final branch folders contain updated research deliverables.

## Planned Real-Surface Checks

- Data-shaped artifact check:
  - command: `find concept -name '*RESEARCH*.md' -o -name '*REQUIREMENTS*.md' | sort`
  - pass observable: all three concept folders contain new research/requirements files.
- Citation coverage check:
  - command: `rg -n "\\[Source [0-9]+\\]|UNRESOLVED|Source Registry|Data Pipeline" .omo/ulw-research/20260701-235345 concept`
  - pass observable: synthesis and branch files contain source registry/citations or explicit unresolved flags.
- Whitespace check:
  - command: `git diff --check`
  - pass observable: exit code 0.

## Executed QA / Review

Gate reviewer initially returned `REJECT` because the main deliverables were English-first, current-run QA evidence was missing, slop/programming review coverage was not documented, and branch README file lists omitted `DEBATE.md` and `REFINED_PROPOSAL.md`.

Fixes completed:

1. Rewrote main deliverables and README entrypoints to Korean-first.
2. Added `QA_REVIEW.md` with executed command evidence.
3. Documented `programming` as N/A for document-only work and `remove-ai-slops` cleanup workflow as N/A for no-code changes, while still performing manual slop/risk checks.
4. Added missing branch artifacts to README file lists.

Executed checks:

- Artifact presence: pass.
- Korean heading spot check: pass.
- Coverage check for source registry/data pipeline/MVP/unresolved/source identifiers: pass.
- Unsafe-claim grep: pass; risky terms occur in prohibition/boundary context only.
- README file-list consistency: pass.
- `git diff --check`: pass.
