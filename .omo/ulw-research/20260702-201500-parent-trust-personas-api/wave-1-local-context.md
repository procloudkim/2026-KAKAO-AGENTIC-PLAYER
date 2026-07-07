# Wave 1 Local Context Digest

## Findings

- The repository already has three concept tracks and previously ranked `family-experience-mcp` first, `pharmacy-now-mcp` second, and `parent-trust-mcp` on hold because safety claims require strict evidence wording.
- `concept/parent-trust-mcp/README.md` promises an official-source-lane action card, not a safety verdict.
- `concept/parent-trust-mcp/DATA_PIPELINE.md` already sets the core pipeline:
  `product identity intake -> source lane selection -> official lookup or explicit unknown -> Trust Ledger -> evidence completeness -> parent action card`.
- `concept/parent-trust-mcp/MECE_RESEARCH.md` already identifies `intake_baby_product_identity(...)` as the first tool and declares no safety verdict, ranking, or affiliate recommendation.
- `concept/DATA_PIPELINE_ARCHITECTURE.md` provides the reusable source registry, adapter, raw snapshot, normalization, confidence/provenance, cache/stale, redaction, and response-card pattern.
- CodeGraph found that the current family-experience MCP already implements source adapter concepts, source confidence labels, Top 3 rendered candidate output, and source URL/reservation/contact fields. This is a useful implementation reference for parent-trust source lanes.
- `HTML.txt` contains the Kakao Agentic Player page. Relevant local contest facts include:
  - Kakao Tools user public release is a prize/value surface.
  - Judging includes creativity, convenience, stability, accurate data, and security.
  - Kakao Tools can require Widget/spec improvements after preliminary selection.

## Design Implication

Parent Trust should not copy family-experience ranking semantics directly. It should reuse its source adapter and confidence-label architecture, but output "evidence status + parent action" rather than "best recommendation".

## EXPAND
- LEAD: product identity intake schema - WHY: current family-experience schema is not enough for model/lot/cert/barcode matching - ANGLE: define `ProductIdentityInput` and `EvidenceRecord`.
- LEAD: Kakao Tools Widget card shape - WHY: user-visible differentiation may depend on compact visual action card - ANGLE: after source map, design a widget-ready result contract.
