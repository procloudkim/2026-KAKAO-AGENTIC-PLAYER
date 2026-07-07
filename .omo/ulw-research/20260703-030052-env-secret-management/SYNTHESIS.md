# ULW-Research Synthesis: Local API Key Management With `.env`

Workers: 6 including review lanes · Waves: 1 · Sources: 5 official/authoritative · Verifications: 4 local commands

## Executive Summary

Yes: for this local hackathon MCP repo, managing API keys in a local `.env` file that is ignored by Git is the right lightweight practice. The corrected repo policy is now: commit `.gitignore` and `.env.example`, never commit `.env` or `.env.*` secret files.

No: `.env` is not a production secret manager. For deployment, use the platform's environment injection or a real secret manager, and rotate any key that ever appears in Git history.

## Findings

1. GitHub's official guidance says repository `.gitignore` rules are the shared way to prevent unwanted files from being committed, and already-tracked files must be untracked before ignore rules help. Source: https://docs.github.com/en/get-started/git-basics/ignoring-files
2. GitHub's sensitive-data guidance says leaked credentials should be revoked or rotated first; history rewriting has coordination costs and does not replace rotation. Source: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
3. Twelve-Factor config recommends environment variables for deploy-varying config such as credentials, because they change without code edits and reduce accidental repository inclusion compared with config files. Source: https://12factor.net/config
4. OWASP secrets management recommends centralizing, provisioning, auditing, rotating, and access-controlling secrets; local `.env` is convenience, not enterprise-grade secret management. Source: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
5. OWASP DevSecOps guidance says secrets should not be hardcoded or stored in source code, and recommends pre-commit/pipeline detection. Source: https://owasp.org/www-project-devsecops-guideline/latest/01a-Secrets-Management
6. Node.js supports dotenv-style files and `--env-file-if-exists`, which this local runtime confirmed with `node --help`. Source: https://nodejs.org/api/environment_variables.html

## Codebase Findings

- Before change: root `.gitignore` was absent, and `git check-ignore` did not ignore `.env`.
- After change: `.gitignore` ignores `.env`, `.env.*`, and keeps `.env.example` shareable.
- `apps/family-experience-mcp/.env.example` documents required local variables without values.
- `apps/family-experience-mcp/package.json` now includes `dev:http:env`, an explicit `.env`-loading script that keeps the original `dev:http` unchanged.
- `apps/family-experience-mcp/package.json` and `package-lock.json` now require Node `>=20.19.0`, matching `--env-file-if-exists` usage.
- `apps/family-experience-mcp/scripts/scan-secrets.ts` now includes `.env.example` in the scanned file set.

## Verification

- `git check-ignore -v .env .env.local apps/family-experience-mcp/.env apps/family-experience-mcp/.env.example`: `.env` files ignored; `.env.example` unignored.
- `npm run scan:secrets`: PASS, scanned 77 files.
- `npm run verify`: PASS, 9 test files and 37 tests.
- `node --env-file-if-exists=.env -e ...`: no raw key printed; `SEOUL_OPEN_DATA_KEY` observed as present/redacted from current environment.
- `npm run dev:http:env` health surface: PASS, `/health` returned ok and `seoulOpenDataKey: "redacted"`.
- Cleanup receipt: temporary server on port 3345 stopped.

## Decision

Chosen method: local `.env` for developer secrets, committed `.env.example` for onboarding, committed `.gitignore` for guardrail, platform secret injection for production later.

Rejected alternatives:
- Hardcoding API keys: rejected because it violates OWASP and creates immediate leak risk.
- Committing `.env`: rejected because it stores secrets in source control.
- Only OS-level env vars with no `.env.example`: secure but less reproducible for hackathon onboarding.
- Full secrets manager now: correct for production, but unnecessary overhead for local-only hackathon development.

## Residual Risks

- `.gitignore` does not protect files already tracked in Git history; current `git ls-files` and `git log --all -- .env*` found no tracked/history `.env` evidence.
- Shell-specific environment visibility differs: earlier PowerShell saw `SEOUL_OPEN_DATA_KEY`, Git Bash did not. Use `dev:http:env` or export in the same shell that starts the server.
- Deployment secret handling is still unresolved; decide it before any public hosting.
