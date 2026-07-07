# Method Selection: Three MCP Idea Branches

Date: 2026-07-01 KST

## Candidate Methods

1. Create three actual git branches immediately and start coding each.
2. Pick the most mature existing repo, likely Holiday Pharmacy, and convert it to MCP first.
3. Run an OML concept-branch bootstrap: define three parallel branch specs, score them, and only then implement the highest-confidence MVP.
4. Do broad data-source crawling/API exploration for all three ideas before choosing.

## Chosen Method

Method 3: OML concept-branch bootstrap.

Why:

- It respects the user's intent to compare three branches in parallel.
- It avoids touching the dirty pharmacy repo before scope is fixed.
- It keeps the PlayMCP deadline visible.
- It produces implementable tool contracts instead of abstract ideation.

## Fallback Method

If the user needs immediate implementation today, use the family experience branch first because it has the best balance of personal need, public-vote appeal, clean data/API options, and lower safety risk.

## Rejected Alternatives

- Method 1 is rejected because actual git branches across dirty repos would create avoidable merge/state risk before branch specs are stable.
- Method 2 is rejected because pharmacy is implementation-mature but not necessarily the best hackathon fit; it also carries higher availability-liability risk.
- Method 4 is rejected because nationwide/worldwide data acquisition is too broad before the winning interaction is fixed.

## Evaluation Axes

Score each 0-5:

| Axis | Meaning |
|---|---|
| Creativity | Distinctive angle and memorable service shape |
| Convenience | Solves a frequent real user job with low friction |
| Stability | Can return accurate, conservative output with graceful failure |
| Public-vote appeal | Value is obvious in a Kakao Tools demo |
| Kakao Tools fit | Benefits from chat-first output and future Widget surface |
| Data/security rights | Clean source, low privacy/credential/legal risk |

## MAS Profile For Later Debate

Use a short 3-round debate only after one branch is selected:

- Moderator: keeps the branch inside PlayMCP deadline and output contract.
- PM: defines target user, success metric, and MVP cut.
- Tech Lead: turns data/tool plan into endpoint, schemas, and test plan.
- User Advocate: checks whether a parent can act on the answer in 30 seconds.
- Devil's Advocate: attacks overclaiming, stale data, safety, and legal risk.
- Data/Compliance Specialist: source hierarchy, licenses, API limits, redaction.
- Editor: final submission wording and demo prompt polish.

Dynamic max rounds: 3. Source volume is moderate, deadline is tight, and this is concept selection, not a final PRD debate.

