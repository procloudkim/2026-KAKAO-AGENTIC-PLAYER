---
slug: family-experience-market-ready-platform
status: plan-written
intent: unclear
pending-action: await user start-work approval; do not implement in planner mode
approach: Reframe Family Experience MCP from hackathon demo to a narrow parent-facing public-data decision service. Plan waves will cover product claim boundary, live data pipeline, reliability/observability, security/privacy, deployment/release ops, UX/evaluation, and market launch readiness.
---

# Draft: family-experience-market-ready-platform

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

| id | outcome | status | evidence path |
| --- | --- | --- | --- |
| C1 product-contract | Public value proposition, trust boundaries, supported/unsupported claims, and target persona are market-safe. | active | `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`, `apps/family-experience-mcp/docs/SUBMISSION_COPY_DRAFT.md` |
| C2 data-supply-chain | Official-source ingestion, local CSV fallback, freshness policy, provenance, and source health are production-governed. | active | `apps/family-experience-mcp/src/etl/*`, `apps/family-experience-mcp/src/sources/*`, `apps/family-experience-mcp/docs/QA_REPORT.md` |
| C3 runtime-mcp | `/health`, `/mcp`, tool discovery, tool execution, and fallback behavior are stable under remote deployment. | active | CodeGraph: `src/config.ts`, `src/etl/cacheQuery.ts`, `src/etl/cache.ts`; `apps/family-experience-mcp/package.json` |
| C4 security-privacy | Secrets, logs, scans, supply-chain, API abuse, and no-child-personal-data posture are explicit and verified. | active | `apps/family-experience-mcp/scripts/scan-secrets.ts`, `apps/family-experience-mcp/docs/RUNBOOK.md` |
| C5 operations | Deployment, release, monitoring, alerting, ETL schedule, incident response, rollback, and cost controls are operator-ready. | active | `apps/family-experience-mcp/Dockerfile`, `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md` |
| C6 ux-evaluation | Parent-facing output quality is measured with scenario prompts, freshness checks, failure copy, and human decision value. | active | `apps/family-experience-mcp/test/fixtures/eval-nationwide`, `apps/family-experience-mcp/scripts/eval-prompts.ts` |

## Open assumptions (announced defaults)
<!-- Intent is UNCLEAR: research resolves ambiguity, defaults are adopted (not asked), and each is surfaced in the plan's human TL;DR for veto. -->
<!-- assumption | adopted default | rationale | reversible? -->

| assumption | adopted default | rationale | reversible? |
| --- | --- | --- | --- |
| Launch shape | Market readiness means a public beta, not a full consumer app with accounts/payments. | Current MCP is a tool server; adding accounts/payments would expand risk without proving core value. | yes |
| Product promise | Promise "source-grounded family-experience candidates" only. Do not promise nationwide completeness, open-now, reservation, or safety certification. | Kakao contest warns against false information; repo scanners already protect claim boundaries. | yes |
| Data architecture | Cache-first runtime with scheduled official-source ETL and provenance ledger. Live provider calls are ETL/proof path, not per-chat dependency. | Current architecture already uses cache query and ETL; cache-first reduces latency and provider failure exposure. | yes |
| Initial geography | Korea nationwide aspirationally, but launch readiness is by verified source/region coverage tiers. | Nationwide complete coverage is unsupported; staged coverage is auditable. | yes |
| Reliability target | Define beta SLOs: MCP availability, P95 tool latency, cache freshness, and source freshness. | Google SRE guidance treats SLOs as the basis for alerting and reliability. | yes |
| Observability | Use structured logs, metrics, traces where practical, and redacted evidence artifacts. | OpenTelemetry frames observability as traces, metrics, and logs; current evidence is file/log based. | yes |
| Security baseline | OWASP API risk review, no raw secrets in repo/logs, key rotation, dependency audit, abuse throttles. | Public MCP endpoint is an API surface; current scans are necessary but insufficient. | yes |
| Kakao path | Keep PlayMCP/KakaoCloud as primary near-term distribution, but do not make market-readiness dependent on contest-only hosting. | PlayMCP is near-term channel; market product needs portable deploy and runbook. | yes |

## Findings (cited - path:lines)

- Kakao official contest page requires KakaoCloud MCP endpoint creation, PlayMCP registration, temporary registration only for testing, review request for final server, all-public switch after approval, and one-time preliminary submission. Source: `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10`.
- Kakao official evaluation includes creativity, convenience, stability, accurate data, and no security issue. Same source.
- Kakao official FAQ says finalists must perform Kakao Tools additional development and that Kakao Tools has widget additions and stricter MCP standard requirements. Same source.
- MCP official intro defines MCP as a standard for connecting AI applications to external systems and improving end-user experience through external data/tools/workflows. Source: `https://modelcontextprotocol.io/docs/getting-started/intro`.
- MCP architecture docs emphasize initialization/capability negotiation, tool discovery, tool metadata, input schema, and tool execution. Source: `https://modelcontextprotocol.io/docs/learn/architecture`.
- MCP Inspector docs support server connectivity, capability negotiation, tool schema inspection, tool testing, edge cases, and error handling. Source: `https://modelcontextprotocol.io/docs/tools/inspector`.
- CodeGraph found a cache-first query path in `apps/family-experience-mcp/src/etl/cacheQuery.ts`, including freshness checks and fixture scoping.
- CodeGraph found cache metadata writing in `apps/family-experience-mcp/src/etl/cache.ts`, including generated time, source IDs, TTL hours, record counts, and raw snapshot file names.
- Previous local QA report records local verification and Culture Portal ETL proof, but residual risks include fixture-only proof limits and no final PlayMCP/public/submission proof. Path: `apps/family-experience-mcp/docs/QA_REPORT.md`.
- This turn's memory pass found repo-specific caution: re-check current provider keys, Docker availability, and `.omo` evidence before reusing completion claims. Memory path: `MEMORY.md:154-157`.

## Decisions (with rationale)

1. Treat this as `intent: unclear` and architecture-scale: "market-ready" is broader than a concrete feature request.
2. Write a market-readiness plan only after approval; current step is the approval brief.
3. Plan will not add broad consumer-app features first. It will first harden product contract, data supply chain, runtime, security, operations, and evaluation.
4. First implementation wave after approval should preserve current one-tool MCP and build production guardrails around it.
5. Every production claim must be supported by source provenance, cache freshness, or explicit unknown/parent-check copy.
6. Market release should be staged: internal alpha -> PlayMCP beta -> public beta -> only then broader commercialization.

## Scope IN

- Family Experience MCP only: `apps/family-experience-mcp`.
- Market-readiness plan for public beta quality.
- Data pipeline design, ETL scheduling, provenance, source-health checks.
- Runtime reliability: `/health`, `/mcp`, MCP initialize/tools/list/tools/call, cache failure behavior.
- Security and privacy: secrets, scan gates, abuse/throttle, logging redaction, dependency/supply-chain checks.
- Operations: Docker/KakaoCloud or portable deployment, release checklist, rollback, incident runbook, SLOs, monitoring.
- UX/evaluation: parent scenarios, no-result behavior, trust copy, output contract, PlayMCP/Kakao Tools readiness.
- Documentation and handoff: runbook, decision log, QA report, launch checklist.

## Scope OUT (Must NOT have)

- No user accounts, profiles, child personal data storage, payments, bookings, reservation integrations, or Kakao gift commerce in the first market-readiness plan.
- No claim of nationwide complete coverage.
- No claim of real-time freshness.
- No claim of open-now/operating-now status unless a source explicitly provides it and the plan adds source-specific validation.
- No claim of child safety certification or medical/safety advice.
- No unreviewed key baking into public images.
- No broad rewrite of the MCP into a new app before proving the existing tool.

## Open questions

None for planning. User approval is required only to write the final decision-complete plan artifact.

## Approval gate
status: approved-and-plan-written
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->

Completed action: wrote and populated `.omo/plans/family-experience-market-ready-platform.md` using the approach above.

Implementation status: not started. User must explicitly invoke start-work or equivalent execution approval before any worker implements the plan.

Review receipts:

- Metis first-pass review: ITERATE. Findings integrated into the plan: human secret gate, public-beta target, coverage tiers, numeric SLO defaults, atomic cache publish, one-tool drift guard, health/source diagnostics, rollback scope, representative image readiness.
- Momus first-pass review: ITERATE. Findings integrated into the plan: repo-root command convention, `npm --prefix apps/family-experience-mcp` commands, concrete negative QA commands, concrete final verification commands.
- Momus second-pass review: ITERATE. Findings integrated into the plan: concrete QA for Todos 8/10/11/13/16/17/18/19, F3 remote tools/list and tools/call, F4 pattern iteration, explicit working directories for Todo 6/12/13.
- Momus final review: OKAY. Verdict: plan is executable by a worker with zero extra interview.
