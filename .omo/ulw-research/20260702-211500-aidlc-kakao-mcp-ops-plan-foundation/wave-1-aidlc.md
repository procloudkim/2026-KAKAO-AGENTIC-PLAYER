# Wave 1 - AIDLC Workflow Evidence

## Sources
- Official repository: https://github.com/awslabs/aidlc-workflows
- Pinned checkout used for inspection: `e49341dbeb8af82758dd85e96ed7fe9bcf38a447`
- Key local-inspected docs from that checkout:
  - `README.md`
  - `docs/WORKING-WITH-AIDLC.md`
  - `scripts/aidlc-evaluator/README.md`
  - `aidlc-rules/aws-aidlc-rule-details/construction/build-and-test.md`
  - `aidlc-rules/aws-aidlc-rule-details/operations/operations.md`
  - `extensions/security/baseline/security-baseline.md`
  - `extensions/resiliency/baseline/resiliency-baseline.md`

## Verified Facts
- AIDLC describes a three-phase workflow: Inception, Construction, and Operations.
- Inception covers requirements analysis, user stories, design units, and risk/complexity review.
- Construction turns approved units into detailed design, code, build/test, and quality validation.
- Operations is conceptually defined around deployment automation, monitoring/observability, and production readiness, but the current inspected operations rule file is still a placeholder compared with Inception/Construction detail.
- AIDLC emphasizes adaptive workflow selection, context discipline, risk-based gates, question-driven clarification, and user control through explicit approvals.
- The evaluator tooling is built as a multi-stage quality surface: run, post-run tests, quantitative checks, contract tests, qualitative comparison, and report.
- Security/resiliency extensions are opt-in but, once active, behave as blocking constraints.

## Planning Implications For Kakao MCP
- Use AIDLC as a lifecycle control method, not as a codebase template.
- Translate Inception into MCP-specific artifacts: user promise, persona, source authority map, claim boundaries, data rights, Kakao registration fields, and golden prompts.
- Translate Construction into one-tool implementation waves: strict input schema, source adapters, normalized snapshots, confidence labels, transport smoke tests, and claim/secrets scans.
- Translate Operations into Kakao-specific release operations: hosted `/mcp` endpoint, PlayMCP temporary registration, review request, public switch, contest submission, health checks, cache/freshness policy, redacted logs, and incident rollback.
- Keep AIDLC-style approvals for high-risk decisions, but avoid over-gating low-risk document or local test work.

## Do Not Copy Blindly
- Do not copy IDE-specific `.kiro`, `.amazonq`, or `.cursor` workflow assumptions.
- Do not import AWS-only infrastructure assumptions unless the chosen deployment path actually uses them.
- Do not depend on AIDLC Operations detail as complete; fill operations with Kakao/MCP-specific requirements.
- Do not make the hackathon app look like a generic SDLC demonstration. The user-facing value still has to be immediate chat usefulness.
