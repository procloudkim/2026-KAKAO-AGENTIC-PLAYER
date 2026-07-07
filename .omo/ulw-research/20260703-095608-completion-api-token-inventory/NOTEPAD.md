# ULW Notepad

Tier: HEAVY - external integrations and API/token inventory across multiple MCP product concepts.
Skills: omo:ulw-research for exhaustive research; CodeGraph for repo code surface discovery; Context7 not used because no library/API SDK syntax question.

Session: .omo\ulw-research\20260703-095608-completion-api-token-inventory

## Success Criteria

1. MECE inventory covers current family-experience MCP, holiday pharmacy reference, and baby safety reference.
2. Local injection files are named without exposing secret values.
3. Official/public API evidence is separated into required, recommended, optional, and unconfirmed.

## Evidence

- Current repo CodeGraph and grep confirmed env names.
- Subagent `019f257a-1b5c-7b02-b7d8-963415de6ec2` confirmed current repo config/token surfaces.
- Subagent `019f257a-3a82-71e0-a223-0055b63c7c50` confirmed holiday pharmacy env/API surfaces.
- Subagent `019f257a-5a7d-7d91-be76-96ff5c85dbdb` confirmed BabyGear repo has no runtime secret today.
- Subagent `019f257a-8382-7e31-9369-a78763062970` confirmed official API/key pages as of 2026-07-03.

## Self Review

Tier held as HEAVY because this is external-integration inventory across multiple products. No code behavior changed, so RED/GREEN TDD is not applicable. Real-surface proof is the created research artifacts plus file existence/readback verification.

