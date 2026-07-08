# Security Policy

## Secrets

Never commit provider-issued keys, bearer tokens, keyed URLs, cookies, or `.env` files.

Local secrets belong in:

```text
apps/family-experience-mcp/.env
```

Deployment secrets belong in the hosting platform's Secret or environment injection mechanism. If a host lacks secret injection, treat any workaround as `HUMAN_APPROVAL_REQUIRED` and follow `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`.

## Required Scans

Run these before pushing deploy-facing changes:

```bash
npm --prefix apps/family-experience-mcp run scan:secrets
npm --prefix apps/family-experience-mcp run scan:sources
npm --prefix apps/family-experience-mcp run scan:claims
```

## Supported Claims

This MCP returns source-grounded family experience candidates. It must not claim:

- complete nationwide coverage
- real-time freshness
- reservation availability
- current open/operating status
- child safety certification
- guaranteed age suitability
- PlayMCP review, public release, or contest submission before evidence exists

## Reporting

This is a hackathon repository. Report security-sensitive issues privately to the repository owner rather than opening an issue with secrets or exploit details.
