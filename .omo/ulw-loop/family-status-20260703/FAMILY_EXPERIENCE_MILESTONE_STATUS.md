# Family Experience MCP: A-to-Z Milestone Status

Date: 2026-07-03

## Executive Status

`Family-experience-MCP` is around **N/O out of A-Z**.

Meaning: the local MCP product is implemented, tested, security-hardened, documented for PlayMCP temporary/private registration, and has local HTTP evidence. It is **not yet at submission-ready Z**, because the official external release chain still needs a public HTTPS deployment, PlayMCP temporary registration, final review request, public visibility switch, representative image, and AGENTIC PLAYER 10 submission.

## A-to-Z Milestone Map

| Step | Milestone | Status | Evidence / Note |
| --- | --- | --- | --- |
| A | Problem and user pain defined | Done | Parent needs age/date/location-based family activity answers. |
| B | Topic selected against other MCP ideas | Done | Family-experience-first decision exists in research docs. |
| C | Official Kakao/PlayMCP flow understood | Done | `.omo/ulw-research/20260703-135226-kakao-mcp-docs-design/SYNTHESIS.md`. |
| D | MVP scope narrowed | Done | Seoul-first, Top 3, no nationwide overclaim. |
| E | MCP package scaffolded | Done | `apps/family-experience-mcp/package.json`. |
| F | One public tool selected | Done | `find_family_experiences`. |
| G | MCP HTTP surface implemented | Done | `/mcp` and `/health` exist. |
| H | Input/output schema implemented | Done | Location, date range, child age/stage, structured success/failure. |
| I | Fixture source and deterministic QA data | Done | Fixture records and golden smoke tests. |
| J | Seoul Open Data adapter | Partly done | Adapter exists; live key-dependent freshness proof still limited. |
| K | Source governance | Done | Registered fixture and Seoul official source, allowed claims, confidence labels. |
| L | Claim guardrails | Done | No unsupported nationwide/freshness/reservation/operation/suitability claims. |
| M | Secret and API-key policy | Done | `.env` ignored, `.env.example` safe, server-side key policy. |
| N | Local verification and scans | Done | `npm run verify`, secret/claim/source scans passed in evidence. |
| O | Local real HTTP surface proof | Done | `/health` and `/mcp` status 200 proof with cleanup. |
| P | PlayMCP temporary metadata | Done | `PLAYMCP_TEMP_REGISTRATION.md`, `SUBMISSION_COPY_DRAFT.md`. |
| Q | Representative image | Not done | Rights-cleared image still TODO. |
| R | Public HTTPS deployment | Not done | Need Kakao Cloud or acceptable fallback endpoint. |
| S | Deployment secret manager mapping | Planned | Local policy exists; real platform secrets still need configuration. |
| T | Deployed `/health` and `/mcp` proof | Not done | Current proof is local only. |
| U | PlayMCP temporary/private registration | Not done | Docs prepared; operator action not executed. |
| V | PlayMCP private tool discovery and chat smoke | Not done | Requires temporary registered endpoint. |
| W | Final review request | Not done | Must happen after deployed private smoke passes. |
| X | Review approved and visibility switched to 전체 공개 | Not done | Official contest requires public switch after review. |
| Y | AGENTIC PLAYER 10 preliminary submission | Not done | One-time submission must be deliberate. |
| Z | Kakao Tools/finals readiness | Not done | Widget spec and stricter MCP standard remain post-prelim/finals work. |

## Current Position

Current state is **post-local-MVP / pre-public-deployment**.

Practical interpretation:

- For engineering: MVP is locally runnable and guarded.
- For PlayMCP: ready to attempt temporary/private registration only after a public HTTPS endpoint exists.
- For contest submission: not ready until PlayMCP review, public visibility, and final submission are completed.
- For finals: Kakao Tools widget and stricter MCP compliance are still future work.

## Already Complete

- One clear MCP tool: `find_family_experiences`.
- `/mcp` endpoint and `/health` endpoint.
- Korean parent-facing response shape.
- Fixture/demo mode with explicit labeling.
- Optional live Seoul Open Data path.
- Source registry with authority tiers and allowed claims.
- Confidence labels: source-stated, api-returned, computed, inferred, stale, unknown.
- Parent-check fields instead of unsupported guarantees.
- Secret redaction for diagnostics and keyed URLs.
- Secret, claim, and source scanners.
- PlayMCP temporary registration copy and starter messages.
- Local HTTP evidence with cleanup.

## Remaining Product / Engineering Needs

Must do before public submission:

1. Align package version and runtime version.
   - Current mismatch: `package.json` is `0.0.0`; MCP/health runtime reports `0.1.0`.
2. Decide production mode.
   - Public submission should not rely on fixture/demo as the main value.
   - If live Seoul API is used, prove live freshness and failure behavior with the actual deployed environment.
3. Deploy to public HTTPS.
   - Endpoint must end in `/mcp`.
   - `/health` should remain available for operator verification.
4. Configure secrets through deployment secret manager.
   - `SEOUL_OPEN_DATA_KEY`: secret env var.
   - `SEOUL_OPEN_DATA_BASE_URL`: plain env/default.
   - `FAMILY_EXPERIENCE_ALLOW_FIXTURE`: keep `false` for live proof unless explicitly staging/demo.
5. Run deployed verification.
   - `/health` returns 200 and key diagnostic is `redacted` or `missing`, never raw.
   - `/mcp` tool discovery returns exactly one tool.
   - `find_family_experiences` returns safe result or safe failure with no keyed URL.
6. Re-run local gates after deployment config changes.
   - `npm run verify`
   - `npm run scan:secrets`
   - `npm run scan:claims`
   - `npm run scan:sources`
7. Prepare rights-cleared representative image.
   - Must not use copyrighted or trademark-risk image without rights.
8. Prepare final PlayMCP copy.
   - Do not overclaim nationwide coverage, live status, reservation status, operation status, or child suitability.
9. Run PlayMCP temporary/private registration.
   - Use deployed URL plus `/mcp`.
   - Keep private/operator-only first.
10. Run PlayMCP private smoke.
   - Tool discovery.
   - Starter prompts.
   - Happy path.
   - No-result path.
   - Missing/invalid input path.
   - Source/key failure path.
11. Only then request final PlayMCP review.
12. After approval, switch visibility to `전체 공개`.
13. Submit once through AGENTIC PLAYER 10.

## Submission Preparation Checklist

Official-flow checklist:

- Kakao Cloud endpoint or accepted fallback endpoint exists.
- Endpoint uses HTTPS and ends with `/mcp`.
- Endpoint is stable across restart.
- `/health` works without leaking secrets.
- PlayMCP temporary/private registration completed.
- Private PlayMCP chat smoke passed.
- Final review request submitted.
- Review approved.
- Visibility changed from `나에게만 공개` to `전체 공개`.
- Player preliminary submission submitted once.

Evidence checklist:

- Local `npm run verify` pass.
- Local `scan:secrets` pass.
- Local `scan:claims` pass.
- Local `scan:sources` pass.
- Deployed `/health` HTTP transcript.
- Deployed `/mcp` tool-list transcript.
- Deployed tool-call transcript for at least one successful or safe-failure prompt.
- PlayMCP private test screenshots or transcript.
- Cleanup receipt for any local QA server/port.

Content/checklist:

- Service name: `아이랑 어디가`.
- Identifier: `familyexp`, unless PlayMCP rejects it.
- Short description under console limit.
- Three starter prompts.
- Rights-cleared representative image.
- Privacy/secret-safe operator notes.
- No unsupported public claims.

Risk checklist:

- No raw `.env` values in docs, screenshots, logs, evidence, or console fields.
- No keyed Seoul Open Data URL in diagnostics.
- No unofficial scraping expansion before source policy is updated.
- No statement that review/public switch/submission happened until actually done.
- No claim of Korea-wide coverage until nationwide official source pipeline exists.

## Evidence Used

- `.omo/ulw-loop/token-api-security-20260703/goals.json`: complete token/API security goal.
- `.omo/evidence/token-api-security/final-verify.txt`: 10 test files and 40 tests passed.
- `.omo/evidence/token-api-security/final-scan-secrets.txt`: secret scan PASS.
- `.omo/evidence/token-api-security/final-scan-claims.txt`: claim scan PASS.
- `.omo/evidence/token-api-security/final-scan-sources.txt`: source scan PASS.
- `.omo/evidence/token-api-security/http-surface.txt`: local `/health` and `/mcp` HTTP evidence.
- `apps/family-experience-mcp/docs/QA_REPORT.md`: residual risks and no-submission status.
- `apps/family-experience-mcp/docs/RUNBOOK.md`: operator steps and secret policy.
- `apps/family-experience-mcp/docs/PLAYMCP_TEMP_REGISTRATION.md`: temporary registration fields.
- `.omo/ulw-research/20260703-135226-kakao-mcp-docs-design/SYNTHESIS.md`: official Kakao/PlayMCP flow.

