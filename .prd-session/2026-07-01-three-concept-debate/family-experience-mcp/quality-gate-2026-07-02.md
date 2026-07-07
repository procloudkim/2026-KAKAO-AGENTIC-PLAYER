# OML Quality Gate - family-experience-mcp

Date: 2026-07-02 KST

## Harness Route

- Requested entrypoint: `$oml:harness`
- Chosen route: `$oml:quality-gate`
- Reason: a MAS debate trace, generated final PRD, risk/editor backstop, and current `ulw-plan` draft already exist. The smallest correct OML step is audit, not bootstrap or another debate.

## Audited Artifacts

- `.prd-session/2026-07-01-three-concept-debate/input.md`
- `.prd-session/2026-07-01-three-concept-debate/TRACE_SUMMARY.md`
- `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/final-prd.md`
- `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/risk-editor-backstop.md`
- `.omo/drafts/family-experience-mcp-first-build.md`
- `schema/AGENTS.md`

## Verdict

REJECT as a standalone shippable PRD.

ACCEPT as implementation intake for the current `ulw-plan` path, provided the detailed execution plan fills the missing acceptance criteria, source citations, schemas, and QA commands before coding.

## Gate 1 - Requirement Traceability

Status: PARTIAL

Evidence:

- The debate input requires three topics, with stop conditions for one narrowed MVP promise, primary MCP tool, source/data policy, golden prompt, dissent/open questions, and implementation next step: `.prd-session/2026-07-01-three-concept-debate/input.md:33`.
- The trace summary converges on family-experience as primary, pharmacy as fallback, and parent-trust as later safety-sensitive branch: `.prd-session/2026-07-01-three-concept-debate/TRACE_SUMMARY.md:7`.
- The final PRD includes the product promise, first MCP tool, MVP scope, output contract, dissent, assumptions, open questions, and next step: `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/final-prd.md:7`.
- The backstop preserves the main risk and public copy boundary: `.prd-session/2026-07-01-three-concept-debate/family-experience-mcp/risk-editor-backstop.md:5`.

Gap:

- The final PRD itself does not cite source references or source-map IDs for research-grounded claims. The current `ulw-plan` draft adds evidence citations, but that evidence is not embedded in the debate PRD.

Required fix:

- In the execution plan or revised PRD, attach citations for source selection, PlayMCP constraints, output contract, and data-risk rules.

## Gate 2 - PRD / Proposal Completeness

Status: FAIL

Passes:

- Product promise is clear.
- First MCP tool is named.
- MVP cut is narrow: Seoul, one date range, one child age/stage, Top 3, fixture fallback.
- Dissent is preserved.

Missing:

- Exact input schema and validation behavior.
- Structured output schema.
- Source registry and field-level provenance contract.
- Cache/stale policy in executable terms.
- Error taxonomy for missing age, no result, source failure, and permission/key failure.
- Agent-executable acceptance criteria.
- Concrete QA commands and evidence paths.
- PlayMCP temporary-registration fields and smoke criteria.
- Explicit non-goals beyond the short MVP scope.

Required fix:

- Do not implement directly from `final-prd.md`. First generate the detailed `.omo/plans/family-experience-mcp-first-build.md` todos from the current draft.

## Gate 3 - Feasibility

Status: PASS WITH CONDITIONS

Evidence:

- The chosen path is fixture-first plus one optional Seoul adapter: `.omo/drafts/family-experience-mcp-first-build.md:57`.
- The first tool and Top 3 output contract are already scoped: `.omo/drafts/family-experience-mcp-first-build.md:116`.
- The plan draft explicitly keeps national expansion deferred until Seoul-first prompts pass: `.omo/drafts/family-experience-mcp-first-build.md:63`.

Conditions:

- Live adapter must degrade to fixture mode when the Seoul API key is absent.
- Age-fit must be `source-stated`, `inferred`, or `unknown`, never silently upgraded.
- No PlayMCP review request or one-time submission should happen until local MCP tool metadata and golden prompt QA pass.

## Gate 4 - Adversarial Risk

Status: PASS WITH CONDITIONS

Risks preserved:

- Age-fit inference can become unsupported if labels are hidden.
- Public copy can overclaim nationwide coverage or reservation availability.
- Sparse official source text can make ranking look more certain than it is.

Required mitigations:

- Every result card must display confidence and source freshness.
- If age/stage is missing, the tool must ask for it or return a clarification state before strong ranking.
- If no confident match exists, the tool must not fabricate events.
- If source/API fails, the tool must return a typed error or fixture-labeled fallback.

## Gate 5 - OML Harness AGENTS / ADR Consistency

Status: PASS / ADR NOT APPLICABLE

Evidence:

- `schema/AGENTS.md` is explicitly non-destructive and not a repo-root rule file: `schema/AGENTS.md:1`.
- It includes role purpose, inputs, outputs, error handling, and removal criteria for each role: `schema/AGENTS.md:18`.
- It includes collaboration protocol and branch-level stop rules: `schema/AGENTS.md:76`.

ADR note:

- No OML harness behavior change is being proposed in this run, so ADR consistency is not applicable. There is no `docs/adr` directory in the current repo.

## RSI Gate

Status: NOT APPLICABLE

No recursive self-improvement default or RSI promotion is claimed.

## Exact Next Required Input

Approve the current `ulw-plan` draft or change the default product name before plan generation:

- Default name: `아이랑 어디가`
- Pending action: append detailed executable todos to `.omo/plans/family-experience-mcp-first-build.md`
- Guardrail: no product-code implementation before the detailed plan is written and approved for execution.
