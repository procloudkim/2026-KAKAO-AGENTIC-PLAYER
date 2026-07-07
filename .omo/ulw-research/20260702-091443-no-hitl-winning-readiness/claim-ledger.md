# Claim Ledger

Date: 2026-07-02 KST

| claim | type | risk | evidence | status |
| --- | --- | --- | --- | --- |
| Kakao's official process requires MCP server registration/review, public visibility before participation, and one-time preliminary participation submission. | official process fact | high | Kakao official contest page opened 2026-07-02 | verified from primary source |
| Kakao judging considers creativity, convenience, stability, and the final stage includes internal review plus user voting. | official process fact | high | Kakao official contest page opened 2026-07-02 | verified from primary source |
| PlayMCP review can take up to seven business days. | official process fact | high | Kakao official contest page opened 2026-07-02 | verified from primary source |
| Full HITL elimination is impossible for the external contest process. | inference from official process | high | Primary-source facts above; external review/voting/legal actions are outside repo automation | accepted inference, not an official-source quote |
| Internal product QA can be designed no-HITL. | engineering claim | normal | `.omo/plans/family-experience-mcp-first-build.md` verification strategy and final F1-F4 gates | verified at plan level only |
| The repo is not yet product-complete. | repo state fact | high | `verify-repo-implementation-state.md` | verified by executed command |
| Seoul OA-15486 is an official Seoul cultural-events source with event fields including target audience, daily refresh, and public license metadata. | source fact | normal | Seoul Open Data OA-15486 official page opened 2026-07-02 | verified from primary source |
| Child-age suitability must not be asserted unless source/program text supports it. | source-governance rule | high | `concept/DATA_PIPELINE_ARCHITECTURE.md`; `concept/family-experience-mcp/DATA_PIPELINE.md`; Seoul source field limitations | verified as repo rule; factual source coverage remains source-specific |
| The MCP split packages are current but beta-line: server/client/node at 2.0.0-beta.1, legacy sdk at 1.29.0. | package metadata fact | normal | `verify-mcp-package-metadata.md` | verified by `npm view` |
| The public PlayMCP catalog had 212 entries across 18 pages at scrape time. | market/catalog fact | normal | `verify-playmcp-catalog-scrape.md`; raw JSON under `raw/playmcp-pages.json` | verified by executed fetch |
| There is no exact direct duplicate of the proposed product in the public catalog. | market claim | high | Catalog sweep found no exact duplicate, but found major partial competitors | unresolved; do not assert strongly |
| `키즈허브` is a serious partial direct competitor for parent/child discovery. | market/catalog fact | high | `verify-playmcp-catalog-scrape.md`; `assets/playmcp-neighbor-candidate-matrix.md` | verified from catalog data |

