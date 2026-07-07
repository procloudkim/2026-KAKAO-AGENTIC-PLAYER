# Todo 13-15 Code Quality / Slop Coverage Review

Date: 2026-07-08

codeQualityStatus: WATCH
recommendation: APPROVE
finalVerdict: confirmed
blockers: none

## Scope Reviewed

- `apps/family-experience-mcp/Dockerfile`
- `apps/family-experience-mcp/.dockerignore`
- `apps/family-experience-mcp/docs/SLO.md`
- `apps/family-experience-mcp/docs/RUNBOOK.md`
- `.omo/evidence/family-experience-market-ready-platform/task-13-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-14-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-15-doneclaim.md`
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-verify.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-scan-claims.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-scan-sources.txt`
- `.omo/evidence/family-experience-market-ready-platform/task-13-15-scan-secrets.txt`
- `.omo/evidence/family-experience-market-ready-platform-todo-13-15-gate-review.md`

I also checked `.omo/plans/family-experience-market-ready-platform.md` only to re-evaluate the prior gate's plan-status blocker.

## Skill-Perspective Check

PASS. The required skill-perspective check ran before judging maintainability:

- Loaded `omo:remove-ai-slops` from `C:/Users/K/.codex/plugins/cache/sisyphuslabs/omo/4.15.1/skills/remove-ai-slops/SKILL.md`.
- Loaded `omo:programming` from `C:/Users/K/.codex/plugins/cache/sisyphuslabs/omo/4.15.1/skills/programming/SKILL.md`.

No language-specific `programming` reference was loaded because this review did not write or edit `.ts`, `.tsx`, `.py`, `.go`, or `.rs` source. The reviewed production surface is Docker/docs/evidence. I applied the shared `programming` maintenance criteria directly: no untyped escape hatches, no needless abstraction, boundary parsing only where applicable, no over-defensive production code, and no implementation-mirroring tests in the reviewed scope.

Result: the reviewed diff does not violate either skill perspective. The only WATCH item is evidence-boundary related, not a source-code slop defect.

## Findings By Severity

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW

1. LOW - Focused include-mode claim scan reports false positives on negative guardrail wording.
   - Evidence: `npm --prefix apps/family-experience-mcp run scan:claims -- --include <reviewed scope>` exited 1.
   - Reported lines:
     - `apps/family-experience-mcp/docs/RUNBOOK.md:87` says not to add unofficial event pages, scraping pipelines, or browser parsers.
     - `apps/family-experience-mcp/docs/RUNBOOK.md:278` says the cache is not live nationwide completeness proof.
     - `apps/family-experience-mcp/docs/RUNBOOK.md:315` says operators must not imply nationwide completeness.
   - Rationale: these are prohibitions/caveats, not unsupported positive claims. The scanner's default mode allows negative contexts, but include mode does not apply the same line-context allowlist. This should not block Todo 13-15 acceptance, but the focused include scan must not be reported as a clean PASS.

## Required Coverage Matrix

| Item | Result | Rationale |
| --- | --- | --- |
| Excessive/useless tests | N/A | No test files are in the requested review-file scope. `task-13-15-verify.txt:47` and `task-13-15-verify.txt:48` only prove the existing suite passed: 21 files, 150 tests. |
| Deletion-only tests | N/A | No reviewed artifact adds, removes, or changes tests. |
| Tests merely verifying requested removal | N/A | No reviewed test diff exists. |
| Tautological tests | N/A | No reviewed test diff exists. |
| Implementation-mirroring tests | N/A | No reviewed test diff exists. |
| Unnecessary production extraction/parsing/normalization | PASS | The reviewed production file is packaging only. `Dockerfile:1`, `Dockerfile:23`, `Dockerfile:33`, and `Dockerfile:35` define build/runtime/health/CMD behavior without new parsing or normalization logic. RUNBOOK text describes cache operation but does not add production parsing. |
| Maintenance burden | PASS | Dockerfile is 35 lines, `.dockerignore` is 13 lines, `SLO.md` is 147 lines, and `RUNBOOK.md` is 467 lines. The long runbook is operator documentation organized by verification, deployment, cache, rollback, and incident drills; it is not an oversized source module. |
| False confidence from grep-only evidence | PASS with WATCH | I did not accept grep artifacts alone. I directly inspected `SLO.md`, `RUNBOOK.md`, Dockerfile, `.dockerignore`, doneclaims, verify evidence, scan evidence, and reran focused secret/source/claim checks. The focused claim scan false positives are listed under LOW. |
| Scope drift | PASS | Reviewed changes stay in packaging/docs/evidence. `RUNBOOK.md:3`, `SLO.md:4`, and `task-15-doneclaim.md:9` explicitly avoid public release, review, public switch, or contest-submission completion claims. Prior plan drift is resolved: plan lines 228, 238, and 248 now mark Todo 13, 14, and 15 checked. |
| Obvious comments | PASS | No obvious code comments in Dockerfile. The `RUNBOOK.md:379` TODO is a concrete operator blocker for representative-image handling, not a vague or decorative TODO. |
| Over-defensive code | PASS | Docker healthcheck handles HTTP error and timeout paths at the container boundary (`Dockerfile:33`). This is appropriate boundary behavior, not redundant defensive code. |
| Excessive complexity | PASS | Dockerfile has a straightforward two-stage build/runtime shape (`Dockerfile:1`, `Dockerfile:10`) and one healthcheck. Docs are long but structured into operator sections, tables, and drills. |
| Needless abstraction | PASS | No wrapper, factory, interface, or speculative abstraction is introduced in the reviewed scope. |
| Boundary violations | PASS | Secret and runtime boundaries are explicit: `.dockerignore:1`, `.dockerignore:2`, `.dockerignore:3`, `.dockerignore:11`, `Dockerfile:19`, `RUNBOOK.md:335`, and `RUNBOOK.md:378`. |
| Dead code/debug leftovers | PASS | Read-only pattern scan found no `debugger`, `as any`, `@ts-ignore`, `@ts-expect-error`, broad catch, or source-code debug leftovers. `console.log` appears only inside documented `node -e` operator inspection examples at `RUNBOOK.md:160` and `RUNBOOK.md:306`. |
| Duplication | PASS | Repeated scan/smoke commands in `RUNBOOK.md` are scenario-specific operator steps, not duplicated production logic. |
| Performance equivalences | N/A | No algorithmic source change or performance refactor is in scope. |
| Missing tests / behavior proof | PASS with truth boundary | `task-13-15-verify.txt:47` and `task-13-15-verify.txt:48` show 21 test files and 150 tests passed. Docker/container runtime is not proven because Docker daemon was unavailable, and the docs/doneclaim explicitly do not claim it. |
| Oversized modules | N/A | No source module is reviewed. Docs exceed 250 lines but the `remove-ai-slops` oversized-module rule applies to source files, not operator runbooks. |
| Raw secrets/keyed URLs | PASS | Focused `scan:secrets` over the reviewed scope passed with `status=PASS`, `scanned_files=175`. A direct refined token/keyed-URL regex scan over the same scope returned no matches. |

## Direct Review Notes

### Todo 13: Docker/runtime packaging

PASS with Docker-daemon truth boundary.

- `Dockerfile:1` starts a build stage, and `Dockerfile:23` installs runtime dependencies with `npm ci --omit=dev --ignore-scripts`.
- `Dockerfile:17` and `Dockerfile:19` set deploy-safe defaults: `HOST=0.0.0.0` and fixture mode disabled.
- `Dockerfile:26` copies `data`, `Dockerfile:31` switches to the non-root `node` user, `Dockerfile:33` defines `/health` `HEALTHCHECK`, and `Dockerfile:35` runs compiled JavaScript.
- `.dockerignore:1`, `.dockerignore:2`, `.dockerignore:3`, `.dockerignore:4`, `.dockerignore:8`, `.dockerignore:11`, `.dockerignore:12`, and `.dockerignore:13` exclude `.env`, `.env.*`, `.npmrc`, `node_modules`, `dist`, `.omo`, `test`, and `docs`.
- Docker daemon unavailable truth boundary is explicit: `task-13-doneclaim.md:7`, `task-13-doneclaim.md:33`, and `task-13-docker-build.txt:6`.
- No container runtime pass is claimed. Fallback Node/npm proof is correctly scoped: `task-13-doneclaim.md:65`.

### Todo 14: SLOs, alerts, incident response

PASS.

- `SLO.md:4` through `SLO.md:6` define internal beta targets and deny public SLA/release/submission claims.
- SLO rows cover availability, latency, valid-call success, cache freshness, source ETL proof, provider failure, secret scan, and source/claim gates at `SLO.md:28` through `SLO.md:36`.
- Severity and owner-response paths are present at `SLO.md:58`, `SLO.md:59`, `SLO.md:85`, and `SLO.md:135`.

### Todo 15: deploy-to-public-beta runbook

PASS with local-only evidence boundary.

- `RUNBOOK.md:205` states the sequence does not claim deployment, PlayMCP review, public visibility, or contest submission until performed and recorded.
- Ordered steps include Docker blocker fallback, remote `/health`, remote `/mcp`, and PlayMCP `정보 불러오기` at `RUNBOOK.md:223`, `RUNBOOK.md:225`, `RUNBOOK.md:226`, and `RUNBOOK.md:227`.
- Required drills are present: bad cache (`RUNBOOK.md:392`), exposed key (`RUNBOOK.md:405`), provider outage (`RUNBOOK.md:419`), public-copy rollback (`RUNBOOK.md:432`), key rotation (`RUNBOOK.md:444`), and post-release monitoring (`RUNBOOK.md:455`).
- `task-15-doneclaim.md:51` correctly says the local smoke used fixture mode and is not live-provider proof.

## Verification Commands Run In This Review

- `git status --short`
- `git diff -- apps/family-experience-mcp/Dockerfile apps/family-experience-mcp/.dockerignore apps/family-experience-mcp/docs/SLO.md apps/family-experience-mcp/docs/RUNBOOK.md`
- Direct file reads of all scoped files and evidence artifacts.
- `npm --prefix apps/family-experience-mcp run scan:secrets -- --include <reviewed scope>`: PASS, `scanned_files=175`.
- `npm --prefix apps/family-experience-mcp run scan:sources -- --include <reviewed scope>`: PASS, `scanned_files=123`.
- `npm --prefix apps/family-experience-mcp run scan:claims -- --include <reviewed scope>`: FAIL on three semantically negative guardrail lines, treated as LOW false-positive/evidence-boundary issue.
- `rg -n -P "(?<![A-Za-z])sk-[A-Za-z0-9_-]{20,}|Authorization:\s*Bearer|Bearer\s+[A-Za-z0-9._-]{20,}|[?&](?:serviceKey|apikey|api_key|key)=|serviceKey%3D|OPENAI_API_KEY=sk-|x-api-key:\s*[A-Za-z0-9]" <reviewed scope>`: no matches.
- `rg -n "TODO|FIXME|console\.log|debugger|print\(|as any|@ts-ignore|@ts-expect-error|catch \{|catch \(e\)|except Exception|unwrap\(|expect\(" <reviewed scope>`: only documented `node -e` inspection examples and the actionable representative-image TODO.
- `Select-String` plan check: `.omo/plans/family-experience-market-ready-platform.md:228`, `:238`, and `:248` now show Todo 13, 14, and 15 checked.

## Evidence Boundary

- Docker daemon is unavailable on this host. The review confirms the blocker is recorded, and no Docker image build or container runtime pass is claimed.
- Existing local `.env` was not opened or reviewed. The reviewed scope does not contain raw secrets/keyed URLs, and `.dockerignore` excludes `.env` from the image context.
- The reviewed docs/evidence are acceptable for Todo 13-15 code-quality/slop coverage. Remaining risk is operational: a real Docker daemon build/run and remote HTTPS `/health`/`/mcp` smoke still need to happen in the deployment environment before claiming container or public-beta runtime success.
