# NEXT BUILD INTAKE

Paste this back with your idea filled in.

```text
1. Idea one-liner:
2. Target user:
3. Repeated pain point:
4. One KakaoTalk-style winning interaction:
5. Data/API sources and rights:
6. 1-3 MCP tools:
7. What must never go wrong:
8. Existing code/assets/accounts:
9. Preferred stack:
10. Public exposure risk:
```

## Immediate Decision Rule

- Green: clear user, clean data rights, one demo interaction, 1-3 tools, low security risk.
- Amber: useful idea but data/API/auth/legal risk needs narrowing.
- Red: generic assistant, unclear data rights, high harm if wrong, or no public-use case.

## Suggested First Build Milestone

Create the smallest MCP server that can pass a PlayMCP temporary-registration test:

- `health` endpoint or equivalent liveness check.
- 1 core MCP tool.
- deterministic sample response for one golden prompt.
- clear error response for missing input.
- no secrets in logs.
- README/runbook with data source and rights notes.

