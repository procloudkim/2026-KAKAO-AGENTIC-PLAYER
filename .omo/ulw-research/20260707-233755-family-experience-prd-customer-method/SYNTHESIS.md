# Family Experience MCP PRD Gap And Customer Method Synthesis

Date: 2026-07-07

## Classification Rules

- Implemented and independently verified: task has implementation evidence plus independent gate/ledger confirmation.
- Implemented but not accepted: task has DoneClaim or behavior evidence, but no independent confirmation or a gate rejected it.
- Not implemented: no confirming DoneClaim, gate review, or evidence artifact found.
- Needed: required for public beta or contest submission according to the current PRD.
- Research needed: method, external proof, user evidence, or deployment facts are insufficient to safely decide or claim.

## Current PRD Status

| Area | Status | Evidence | Note |
| --- | --- | --- | --- |
| Product contract and unsupported-claim boundary | Implemented and independently verified | Plan todos 1, 2; ledger; docs/DECISIONS.md | Product is bounded parent decision support, not complete event search. |
| Source ledger and coverage tiers | Implemented and independently verified | Plan todo 3; docs/SOURCE_LEDGER.md | No source is tier3 market-claim eligible. |
| Cache provenance and atomic publish | Implemented and independently verified | Plan todo 4; ledger | Provenance validation was hardened through multiple gate loops. |
| Public output trust fields | Implemented and independently verified | Plan todo 6; docs/GOLDEN_RESULTS.md | Output exposes source/freshness/confidence/parent checks. |
| Secret policy | Implemented and independently verified | Plan todo 7; docs/RUNBOOK.md; docs/HOST_REQUIREMENTS_SOT.md | PlayMCP-in-KC image-baked secret path remains human-approval-only. |
| API abuse/resource bounds | Implemented and independently verified | Plan todo 10; ledger | Request body, malformed input, timeout, and bounded error behavior covered. |
| Cache refresh and stale-cache behavior | Implemented but not accepted in plan state | task-9-cache-doneclaim.md | DoneClaim is strong, but plan checkbox/independent-verification state still needs ledger reconciliation. |
| Parent-facing market prompt eval | Implemented but not accepted in plan state | task-11-doneclaim.md | 42 prompt eval passed; still needs formal independent gate/plan state update. |
| Structured ops logs and launch metrics | Implemented but not accepted in plan state | task-12-doneclaim.md | In-process metrics/logs work; external alerting remains Todo 14. |
| ETL proof reports | Implemented behavior, rejected acceptance | task-5 gate review | Gate rejected missing review packet, unstable latest proof alias, and weak evidence package. |
| Remote MCP lifecycle proof | Not implemented / no evidence found | none found | Needs deployed HTTPS /health and /mcp proof. |
| Docker/runtime packaging | Not implemented | plan todo 13 unchecked | Docker daemon was previously an external blocker. |
| SLOs/alerts/incident response | Not implemented | plan todo 14 unchecked | Needed before public beta claim. |
| Public-beta deploy runbook | Not implemented | plan todo 15 unchecked | Existing RUNBOOK is useful but not final deploy-to-beta gate. |
| Launch readiness report | Not implemented | plan todo 16 unchecked | Needs PASS/BLOCKED/DEFERRED/NOT CLAIMED status artifact. |
| PlayMCP/Kakao readiness finalization | Not implemented | plan todo 17 unchecked | Temporary registration copy exists; final review/public/submission not claimed. |
| Better-than-search acceptance tests | Not implemented | plan todo 18 unchecked | Todo 11 gives prompt metrics, but baseline comparison and human task proof are not complete. |
| Security/privacy launch review | Not implemented | plan todo 19 unchecked | Needed before market/public beta. |
| Final public-beta launch gate | Not implemented | plan todo 20 unchecked | Must end PUBLIC_BETA_READY or BLOCKED only. |

## What Is Needed Next

1. Reconcile start-work state: record Todo 9, 11, and 12 DoneClaims in the ledger and run independent gate reviews.
2. Fix Todo 5 acceptance package: add code review report, manual QA matrix, notepad, diff/doneclaim artifact, isolate proof-writing tests, and stop using mutable `etl-proof-latest.json` as stable evidence.
3. Prove Todo 8 remote lifecycle: deployed HTTPS `/health`, JSON-RPC initialize, `tools/list`, and `tools/call` against `/mcp`.
4. Complete operational launch layer: Docker packaging, SLO/alert doc, deploy runbook, launch readiness report, PlayMCP readiness, security/privacy review, final launch gate.
5. Add better-than-search proof: task success/time-to-decision/trust-comprehension comparison against current search workflow.

## Research Needed

| Research question | Why it matters | Method |
| --- | --- | --- |
| Which customer strata actually feel repeated planning pain? | Avoid persona fantasy and feature drift. | Recent-behavior JTBD interviews. |
| Do users accept caveated source-grounded answers? | Product cannot claim open-now, booking, complete coverage, or safety certification. | Moderated task test with adversarial prompts. |
| Is Top 3 better than search? | Core market claim needs evidence. | Compare current workflow vs MCP card: success, time, confidence, verification burden. |
| Which fields are must-have for trust? | Determines response card and eval fixtures. | Card comprehension and ranking test. |
| What is minimum viable public-beta operations? | Avoid market launch with fragile infra. | SLO/incident/remote smoke research against host constraints. |

## Six-Customer Methodology

Use six recruitment strata, not fictional personas. Recruit only people who searched for a child outing in the last 30-60 days.

1. Infant/toddler primary caregivers, 0-2 years.
2. Preschool planners, 3-6 years.
3. Elementary enrichment planners, 7-12 years.
4. Working parents with low planning time.
5. Co-caregivers: grandparents, nannies, relatives.
6. Traveling or unfamiliar-area families.

### Stage 1: Discovery Screen

- Sample: 3 interviews per stratum, 18 total.
- Interview: 30 minutes, recent-event JTBD style.
- Evidence: recent search story, sources used, abandoned paths, final decision, trust blockers, unsupported-claim demand.
- Promote only if the stratum has repeated pain, clear switching trigger, and tolerance for source caveats.

### Stage 2: Task Validation

- Sample: 5 usability/task sessions per promoted stratum.
- Task: solve the same outing-planning scenario using current workflow, then MCP-style Top 3 card.
- Adversarial task: ask for “지금 운영 중인 안전한 예약 가능 체험만” and verify whether the caveated response remains useful.
- Share task: co-caregiver sends a card to parent; parent judges whether it is enough for next action.

### Scoring

Score each stratum 0-3 on:

- Pain frequency.
- Decision burden.
- MCP fit.
- Trust tolerance.
- Actionability within 60 seconds.
- Retention signal tied to a real upcoming occasion.
- Risk that demand depends on unsupported claims.

Promote: >= 14/18 and no fatal unsupported-claim dependency.
Hold: 10-13.
Kill: < 10 or dominant demand requires real-time/open-now/booking/safety guarantee.

## Sources

- NN/g, 5-user qualitative usability testing: https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
- NN/g, qualitative vs quantitative caveat: https://www.nngroup.com/articles/5-test-users-qual-quant/
- Steve Blank customer development: https://steveblank.com/tag/customer-development/
- HBR Jobs to Be Done: https://hbr.org/2016/09/know-your-customers-jobs-to-be-done
- MCP official intro: https://modelcontextprotocol.io/docs/getting-started/intro
- MCP Inspector: https://modelcontextprotocol.io/docs/tools/inspector

## Shower Verdict

Needs work. The artifact direction is understandable, but the handoff must define classification buckets, original todo scopes, evidence standard, public-beta gates, source list, and customer strata before a fresh reader can act without guessing.

