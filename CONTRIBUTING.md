# Contributing

This repository is currently focused on the `아이랑 어디가` Family Experience MCP submission path.

## Before You Change Anything

1. Read `README.md`.
2. Read `apps/family-experience-mcp/docs/PRODUCT_PRD_SOT.md` for the product contract.
3. Read `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md` before changing PlayMCP, KakaoCloud, MCP protocol, endpoint, or secret handling docs.
4. Keep unsupported claims out of product copy.

## Local Verification

Run from the repository root:

```bash
npm --prefix apps/family-experience-mcp run verify
npm --prefix apps/family-experience-mcp run scan:secrets
npm --prefix apps/family-experience-mcp run scan:sources
npm --prefix apps/family-experience-mcp run scan:claims
```

## Commit Hygiene

- Keep commits atomic and reversible.
- Do not mix generated research artifacts with runtime code changes unless the generated artifact is the intended deliverable.
- Do not commit `.env`, API keys, bearer tokens, keyed URLs, cookies, or private console screenshots.
- Keep PlayMCP review/public/submission claims separate from local readiness claims.

## Deployment Handoff

For PlayMCP in KC Git source build, use:

```text
Dockerfile path: apps/family-experience-mcp/Dockerfile
container_port: 3349
```

The deployed endpoint and PlayMCP `정보 불러오기` result are live console evidence. Static docs cannot prove them.
