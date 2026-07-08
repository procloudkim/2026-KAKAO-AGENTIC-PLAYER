# Graph Report

The artifact graph centers on `PRODUCT_PRD_SOT.md` defining the product promise and single tool. `SOURCE_LEDGER.md` constrains allowed claims, while `QA_REPORT.md` and `HOST_REQUIREMENTS_SOT.md` block public readiness until deployment and PlayMCP evidence exists.

Key dependency path:

`PRODUCT_PRD_SOT.md` -> `find_family_experiences` -> remote `/mcp` smoke -> PlayMCP `정보 불러오기` -> starter prompt private smoke -> review request.

Key constraint path:

`SOURCE_LEDGER.md` -> unsupported claim guardrail -> PlayMCP copy -> candidate response fields.

Optional RSI path:

`AI-DLC implementation map` should be created only if it directly improves deployment handoff clarity.

