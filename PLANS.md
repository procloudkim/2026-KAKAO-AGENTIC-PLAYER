# Hackathon MCP Concept Plan

Date: 2026-07-01 KST

## Current Decision

Primary concept branch: `concept/family-experience-mcp`

Fallback: `concept/pharmacy-now-mcp`

Hold: `concept/parent-trust-mcp`

OML debate result: unchanged ranking after three topic-specific debates.

No actual git branches were created in this pass. These are concept worktracks. Create real branches only after the user chooses the first implementation target.

The local folder tree now mirrors the concept branch namespace:

```text
concept/
├── family-experience-mcp/
├── pharmacy-now-mcp/
└── parent-trust-mcp/
```

## Why This Order

1. Family experience finder has the strongest Kakao chat demo: parents ask once and get three usable choices.
2. Holiday pharmacy has the most existing code, but must handle availability uncertainty very carefully.
3. Parent trust/safety is differentiated, but public safety claims require the strictest source and wording controls.

## Next Execution Path

1. Start `concept/family-experience-mcp`.
2. Build one MCP endpoint for `find_family_experiences`.
3. Use deterministic demo data if API keys are not ready.
4. Add one Seoul open-data adapter if keys are available.
5. Test three cases: happy path, missing input, data/API failure.
6. Prepare PlayMCP temporary registration.

## Recommended First Golden Prompt

```text
이번 토요일 서울에서 4살 아이랑 갈 만한 실내 체험 3개만 골라줘. 너무 멀지 않고 예약/문의 링크가 있으면 좋아.
```

## Required Output Contract

Every MCP answer should return:

- Top 3 choices.
- Why each choice fits.
- Source and freshness.
- What the parent should verify.
- One immediate next action.

## Files

- `concept/README.md`
- `concept/family-experience-mcp/`
- `concept/pharmacy-now-mcp/`
- `concept/parent-trust-mcp/`
- `.prd-session/2026-07-01-three-concept-debate/`
- `research/briefs/2026-07-01-three-mcp-idea-branches.md`
- `research/methods/2026-07-01-three-mcp-idea-branches.md`
- `research/decisions/2026-07-01-three-mcp-idea-branches.md`
- `research/experiments/2026-07-01-three-mcp-idea-branches.md`
- `schema/AGENTS.md`
