---
slug: family-experience-winning-sdd-to-submission
status: awaiting-approval
intent: unclear
pending-action: write .omo/plans/family-experience-winning-sdd-to-submission.md
approach: Make Family Experience the single contest-primary MCP and plan SDD work around live data proof, eval harness, parent action-card quality, public HTTPS/PlayMCP proof, and finalist/Kakao Tools readiness.
---

# Draft: family-experience-winning-sdd-to-submission

## Problem Definition

- goal: reach a contest-winning submission posture for `apps/family-experience-mcp`, not merely a locally working MCP.
- context: local MVP exists with one tool, `/mcp`, `/health`, fixture mode, optional Seoul Open Data adapter, scans, and PlayMCP temporary-copy docs. Public HTTPS deployment, PlayMCP registration/review/public switch/submission, representative image, live-source proof, and finalist/Kakao Tools readiness are not complete.
- constraints: keep one public tool; do not overclaim nationwide/live/reservation/child-suitability; do not expose secrets; do not implement during this planning turn; preserve dirty worktree and unrelated artifacts.
- success criteria: the final plan must let a worker execute without new interviews, with RED->GREEN SDD gates, live/deployed/PlayMCP evidence, public-copy guardrails, and final submission readiness.
- done-when: `.omo/plans/family-experience-winning-sdd-to-submission.md` is filled after approval with todos, dependencies, exact QA commands, evidence paths, commit strategy, and final verification wave.

## Evidence Brief

- authoritative source map:
  - Kakao AGENTIC PLAYER 10 official page: preliminary flow, Kakao Cloud endpoint, PlayMCP registration, public visibility requirement, one-time submission, Kakao Tools finalist requirement, review timing, evaluation criteria, rights/false-info cautions.
  - KakaoCloud MCP tutorial: remote MCP should be HTTP/SSE/streamable HTTP, not local stdio; production path requires container/build/deploy/external access proof.
  - repo-local milestone status: `.omo/ulw-loop/family-status-20260703/FAMILY_EXPERIENCE_MILESTONE_STATUS.md`.
  - repo-local winning analysis: `.omo/ulw-research/20260703-151334-family-experience-winning-beyond-submission/SYNTHESIS.md`.
  - app docs: `apps/family-experience-mcp/docs/QA_REPORT.md`, `RUNBOOK.md`, `PLAYMCP_TEMP_REGISTRATION.md`, `SUBMISSION_COPY_DRAFT.md`, `DECISIONS.md`.
- verified facts:
  - current branch is `family-experience-submission-prep`.
  - worktree is broadly dirty/untracked; plan must avoid assumptions from git cleanliness.
  - package version is `0.0.0`, while runtime MCP/health reports `0.1.0`; version alignment is still needed.
  - exactly one public tool is intended: `find_family_experiences`.
  - local tests/scans have passing evidence, but live deployed proof and PlayMCP proof are absent.
- inferences:
  - winning depends less on adding more sources immediately and more on proving the MCP gives parents a better answer package than generic search.
  - evaluation should measure answer usefulness, unsupported-claim absence, source/freshness visibility, and latency, not only test pass/fail.
- unknowns:
  - deployed public HTTPS URL and platform details.
  - whether Seoul live API returns enough current age/date/location-rich rows for a strong demo on submission day.
  - exact Kakao Tools widget spec available after finalist selection.
- assumptions:
  - primary contest track remains Family Experience; Holiday Pharmacy and Baby Product Safety are not included in this execution plan.
  - Seoul-first is honest for submission; nationwide expansion waits until after the core proof.
  - `.env`/secret-manager policy remains as already documented.
- risks:
  - live-source sparsity could weaken demo quality.
  - review timing is tight because PlayMCP review can take business days.
  - rights-cleared image and public copy can create disqualification risk if rushed.

## Method Selection

- candidate methods:
  - A. feature-first expansion: add many sources/features before submission.
  - B. deploy-first checklist: only finish HTTPS/PlayMCP/submission steps.
  - C. SDD winning-gate plan: use failing-first tests and real-surface proof for live data, answer quality, operations, PlayMCP, and finalist readiness.
  - D. pivot/fallback comparison: keep pharmacy/baby-safety in parallel until late.
- chosen method: C. It maps directly to Kakao criteria: creativity via parent-specific packaging, convenience via action cards and bad-input handling, stability via live/deployed/security proof.
- fallback method: B, if time/API/deployment blocks prevent quality-harness work before the deadline.
- rejection reasons:
  - A risks broad but weak proof and new rights/source claims.
  - B reaches submission but not winning differentiation.
  - D wastes tokens and engineering time now; repo evidence says Family Experience is the most complete track.

## Execution Plan

- baseline: current local MVP on `apps/family-experience-mcp`.
- controllable variables: prompt set, ranking/card contract, live/deployed smoke scenarios, public copy, image, evidence packaging, retry/timeout behavior, PlayMCP registration sequence.
- fixed variables: one public tool, Seoul-first source, no unsupported claims, server-side secrets only, no HITL during QA except unavoidable console/operator actions recorded as external gates.
- budget ladder:
  - P0: version alignment, live proof, 20-prompt eval, deployed HTTPS, PlayMCP private smoke, representative image, submission package.
  - P1: loose Korean parser, parent practicality ranking, action hooks, demo pack, monitoring proof.
  - P2: Kakao Tools/widget-readiness branch and nationwide-source feasibility after core passes.
- promotion rule: a wave advances only when local test evidence plus real-surface evidence pass and no secret/claim/source scan regresses.
- kill rule: stop source expansion if it introduces unregistered sources, scraper dependencies, missing rights, or unverifiable freshness.
- stop rule: do not request review/public switch/submission until deployed `/health`, `/mcp`, tool-call, PlayMCP private smoke, scans, and copy/image checks pass.
- final evaluation rule: pass criteria are official-flow readiness plus internal 20-prompt score threshold and reviewer approval, not only `npm run verify`.
- wall-clock estimate: 1-2 focused days for P0 if Kakao Cloud/API access is available; 3-5 days including PlayMCP review latency risk.
- RAM estimate: normal Node/TypeScript build/runtime should fit within 512Mi-1Gi; deployed pod should target at least 256Mi request/512Mi limit if using Kubernetes.
- CPU/GPU/NPU role split: CPU-only; no GPU/NPU needed.
- reboot-required resources: none expected locally; cloud deployment may require container/cluster/restart operations.

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
| C1 | Live data and source-governance proof | active | `.omo/evidence/winning-sdd/live-*` |
| C2 | 20-prompt search-quality/eval harness | active | `.omo/evidence/winning-sdd/eval-*` |
| C3 | Parent action-card answer contract | active | `.omo/evidence/winning-sdd/card-*` |
| C4 | Public HTTPS deployment and reliability proof | active | `.omo/evidence/winning-sdd/deploy-*` |
| C5 | PlayMCP private-to-public submission path | active | `.omo/evidence/winning-sdd/playmcp-*` |
| C6 | Finalist/Kakao Tools readiness pack | active | `.omo/evidence/winning-sdd/finalist-*` |

## Open assumptions (announced defaults)
<!-- Intent is UNCLEAR: research resolves ambiguity, defaults are adopted (not asked), and each is surfaced in the plan's human TL;DR for veto. -->
<!-- assumption | adopted default | rationale | reversible? -->
| Primary topic | Family Experience only | best current completeness and KakaoTalk fit | yes |
| Geography | Seoul-first, no nationwide claim | current official adapter is Seoul Open Data | yes |
| Tool surface | one public tool | stability and clear demo beat tool sprawl | yes |
| SDD unit | evidence-gated waves, not feature checklist | competition criteria require provable convenience/stability | yes |
| Data expansion | defer until live proof/eval passes | prevents rights/freshness overclaim | yes |
| Human input | no HITL for QA; console-only steps recorded as external gates | user asked to avoid HITL and win via quality | partly |
| Finalist prep | include Kakao Tools readiness as branch/prep, not pre-submit blocker | official finalist work is required after selection | yes |

## Findings (cited - path:lines)

- `.omo/ulw-loop/family-status-20260703/FAMILY_EXPERIENCE_MILESTONE_STATUS.md`: local MVP is around N/O of A-Z; Q-Z remain representative image, public HTTPS, secret-manager mapping, deployed proof, PlayMCP private smoke, review/public switch/submission, Kakao Tools readiness.
- `.omo/ulw-research/20260703-151334-family-experience-winning-beyond-submission/SYNTHESIS.md`: winning beyond submission requires live data proof, 20-prompt evaluation, parent action-card polish, reliability proof, and demo/public-vote/finalist package.
- `apps/family-experience-mcp/docs/QA_REPORT.md`: local verify/scans/server-backed proof passed, but live `SEOUL_OPEN_DATA_KEY` smoke, final PlayMCP review/public switch/image/submission are absent.
- `apps/family-experience-mcp/docs/RUNBOOK.md`: `.env` is local-only; deployed secrets must use platform secret manager; `SEOUL_OPEN_DATA_KEY` must remain server-side and redacted.
- `apps/family-experience-mcp/package.json`: package version is `0.0.0`; runtime code reports `0.1.0`.
- CodeGraph: `createFamilyExperienceMcpServer` registers `find_family_experiences`; `loadSourceRecords` uses fixture when allowed and Seoul adapter when key exists; config diagnostics redact the key.
- Kakao official contest page, current-session web check: requires Kakao Cloud endpoint unless support is exhausted, PlayMCP registration, review, visibility switch to `전체 공개`, one-time preliminary submission; evaluation criteria are creativity, convenience, stability; finalist Kakao Tools work is mandatory.
- KakaoCloud official tutorial, current-session web check: remote MCP deployment uses HTTP/SSE/streamable HTTP and not stdio; the deployment path includes container image, cluster/service, external access, probes.

## Decisions (with rationale)

1. Plan the next work as `winning SDD`, not `MVP build`, because MVP/local proof already exists.
2. Keep the first public product as `아이랑 어디가` with one tool; no pharmacy/baby-safety branching inside this plan.
3. Put live-source proof before PlayMCP review; fixture-only proof is not enough for “accurate data” under the stability criterion.
4. Add a 20-prompt eval harness before broad source expansion; this is the cheapest way to prove “개떡같이 채팅해도 찰떡같이 결과” quality.
5. Use response-contract/card tests to protect parent usefulness: source, date, address, age-fit reason, confidence/freshness, parent check, next action.
6. Treat PlayMCP console actions as external gates with evidence receipts; do not claim them complete until observed.
7. Prepare Kakao Tools/card-widget readiness after P0, but do not block preliminary submission on unknown finalist-only specs.

## Scope IN

- Align runtime/package version.
- Live Seoul Open Data smoke and safe failure evidence.
- 20-prompt eval set with metrics and threshold.
- Korean loose-prompt parsing sufficient for age/date/location/condition extraction or concise clarification.
- Parent action-card answer contract hardening.
- Public HTTPS deployment plan/proof with redacted env.
- PlayMCP temporary/private registration, smoke, review request, public switch, one-time submission checklist.
- Rights-cleared representative image and public demo pack.
- Kakao Tools/widget-readiness prep after preliminary submission readiness.

## Scope OUT (Must NOT have)

- No nationwide, real-time, reservation, operation, or child-suitability guarantee without source fields.
- No unofficial scraping or unregistered source.
- No extra public tools before the core tool passes winning gates.
- No raw `.env`, keyed URL, bearer token, cookies, or private logs in artifacts.
- No claim that PlayMCP review/public switch/submission is done until it is actually done.
- No edits to sibling workspaces in this plan.

## Open questions

- None blocking. Deployment URL/platform details are external operator inputs, but the plan can specify exact evidence requirements without asking now.

## Approval gate
status: awaiting-approval
pending action: fill `.omo/plans/family-experience-winning-sdd-to-submission.md` with executable todos, exact QA invocations, evidence paths, dependency matrix, and final verification wave.
approval needed: user says to proceed/write the detailed plan. This approval authorizes plan writing only, not implementation.
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
