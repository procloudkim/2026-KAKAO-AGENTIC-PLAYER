# Decision Record: Three MCP Concept Branches

Date: 2026-07-01 KST
Status: Proposed

## Branch Names

These are concept branch names, not actual git branches yet.

1. `concept/pharmacy-now-mcp`
2. `concept/parent-trust-mcp`
3. `concept/family-experience-mcp`

## Score Matrix

| Branch | Creativity | Convenience | Stability | Public vote | Kakao Tools fit | Data/security rights | Total | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `concept/pharmacy-now-mcp` | 3 | 5 | 3 | 4 | 4 | 4 | 23 | Strong fallback |
| `concept/parent-trust-mcp` | 4 | 4 | 3 | 4 | 3 | 3 | 21 | Differentiated but riskier |
| `concept/family-experience-mcp` | 4 | 5 | 4 | 5 | 5 | 4 | 27 | Recommended primary |

## Recommended Primary

Choose `concept/family-experience-mcp` as the first branch to implement.

Reason:

- It matches the user's personal need.
- The chat value is instantly visible: "이번 주말 아이와 갈 곳 3개만 골라줘."
- It is less medically or legally sensitive than baby safety and less availability-critical than pharmacy.
- It has multiple official data sources with usable fields: event date, place, fee, target audience, program, coordinates, homepage/contact.
- It can later expand from Korea to global cities without changing the core interaction model.

## Strong Fallback

Use `concept/pharmacy-now-mcp` if the user wants to leverage the most existing code immediately.

Reason:

- The repo already has Next.js, NMC integration, region validation, conservative status rules, and local ETL.
- It can become an MCP wrapper around an existing search service.
- Risk is higher because the service must avoid "definitely open" claims.

## Hold For Later

Hold `concept/parent-trust-mcp` unless the user strongly prefers baby-product safety as the public story.

Reason:

- It is highly differentiated and personally meaningful.
- It has strong existing evidence architecture.
- However, the first PlayMCP MVP needs current official lookup paths and strict wording to avoid unsafe product claims.

## Final Product Principle

All branches must return this shape:

```text
Top 3 answer
Why these 3
What source says / source confidence
What to check before acting
One immediate next action
```

Reject any feature that turns the service into a long generic report.

