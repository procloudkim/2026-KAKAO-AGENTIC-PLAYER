VERDICT: ITERATE

Findings:
- [high] `.omo/plans/family-experience-mcp-first-build.md:214` - Todo 9 runs `npm run smoke:golden` without starting `dev:http`, even though earlier acceptance says golden smoke requires the server running. This can fail from a clean terminal. Fix Todo 9 acceptance/QA by either wrapping it with the same start/wait/kill server block used in F3, or explicitly requiring `smoke:golden` to start and stop the server itself.
- [medium] `.omo/plans/family-experience-mcp-first-build.md:179` - The SDK instruction says `McpServer({ ... })`; current MCP TypeScript SDK docs use `new McpServer({ ... })`. Fix the line to avoid an over-specific TypeScript error.
- [medium] `.omo/plans/family-experience-mcp-first-build.md:41` - `reservation_url` and `contact` are listed as fields every candidate contains, but supporting docs say reservation/contact are only present when sourced. This can pressure the worker to fabricate fields. Fix by specifying these fields as nullable/optional and adding tests that missing reservation/contact does not become a “reservation available” claim.
- [low] `.omo/plans/family-experience-mcp-first-build.md:221` - F1 claims it proves exactly one public tool is registered, but the grep only proves `find_family_experiences` appears somewhere. Fix by making F1 consume `smoke:mcp` JSON/tool-list output or add a script assertion that tool count is exactly 1.

Residual risks:
- Sibling workspace protection is mostly declarative; current commands are repo-root scoped, but there is no independent proof that outside workspaces were untouched.
- Live Seoul API field drift remains a normal implementation risk, but the plan’s adapter-test/update-source-registry rule is adequate after the fixes above.