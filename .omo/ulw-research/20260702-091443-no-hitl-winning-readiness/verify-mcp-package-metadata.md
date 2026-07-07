# Verification: MCP Package Metadata

Date: 2026-07-02 KST

## Claim Tested

The current MCP TypeScript SDK implementation plan must not assume an unverified package surface.

## Command

```bash
node --version
npm --version
npm view @modelcontextprotocol/server version dist-tags --json
npm view @modelcontextprotocol/client version dist-tags --json
npm view @modelcontextprotocol/node version dist-tags --json
npm view @modelcontextprotocol/sdk version dist-tags --json
```

## Output Summary

- Node: `v24.15.0`
- npm: `11.12.1`
- `@modelcontextprotocol/server`: `2.0.0-beta.1`, `latest=2.0.0-beta.1`
- `@modelcontextprotocol/client`: `2.0.0-beta.1`, `latest=2.0.0-beta.1`
- `@modelcontextprotocol/node`: `2.0.0-beta.1`, `latest=2.0.0-beta.1`
- `@modelcontextprotocol/sdk`: `1.29.0`, `latest=1.29.0`

## Verdict

CONFIRMED. The split-package direction is current, but it is beta-line work and must be pinned with an exact protocol-era smoke test during implementation.

