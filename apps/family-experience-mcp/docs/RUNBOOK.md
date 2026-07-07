# Operator Runbook

This runbook is the operator handoff for `아이랑 어디가`. It covers local verification, provider keys, cache-first ETL operation, temporary PlayMCP registration, and rollback. It is not proof of public release or contest submission.

## Canonical References

| Truth | Canonical home |
| --- | --- |
| Environment variable names and safe defaults | `.env.example` |
| Source, claim, cache, and release policy | `docs/DECISIONS.md` |
| Host/organizer deployment and PlayMCP-in-KC requirements | `docs/HOST_REQUIREMENTS_SOT.md` |
| Verification status and residual risks | `docs/QA_REPORT.md` |
| Golden MCP response scenarios | `docs/GOLDEN_RESULTS.md` |
| Temporary PlayMCP field copy | `docs/PLAYMCP_TEMP_REGISTRATION.md` |

## Preconditions

- Package path: `apps/family-experience-mcp`.
- Runtime: Node.js `>=20.19.0` and npm. From `apps/family-experience-mcp`, run `npm install` before the verification or ETL commands if `node_modules` is absent.
- Command examples use Bash/Git Bash syntax (`VAR=value command`, `mkdir -p`, `tee`). On PowerShell, use equivalent commands without changing the environment variables or arguments.
- Public tool count: one tool, `find_family_experiences`.
- MCP path: `/mcp`.
- Current recommended auth mode: no auth for fixture/demo or temporary private validation.
- Fixture fallback is allowed only when `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true`.
- Nationwide operation is cache-first. Live provider calls belong in ETL proof or smoke commands, not in every chat request.

## Local Verification

Run from `apps/family-experience-mcp`:

```bash
npm test -- --run test/playmcpMetadata.test.ts
npm run verify
npm run scan:claims
npm run scan:sources
npm run scan:secrets
```

Optional local surface check:

```bash
FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3345 npm run dev:http
```

Then check `http://127.0.0.1:3345/health` from the same environment. For `/mcp`, use the MCP smoke path rather than a plain browser GET:

```bash
npm run smoke:mcp
```

`npm run smoke:mcp` runs an in-memory MCP client/server smoke by default and does not require `npm run dev:http` to be running. To smoke a deployed HTTP endpoint instead, set `MCP_ENDPOINT` to the full HTTPS `/mcp` URL before running the command.

## Operational Logs And Launch Metrics

Runtime logs are newline-delimited JSON. The server emits `server_start`, `http_request`, and `tool_call` events with `service`, `version`, `timestamp`, `level`, latency in milliseconds, request path, HTTP status, tool outcome, candidate count, and redacted failure diagnostics. Logs do not include raw prompts, child names, raw provider keys, keyed URLs, stack traces, or request bodies.

Use `/health` as the non-sensitive diagnostics surface for public-beta launch checks. It includes:

| Field | Meaning | Launch check |
| --- | --- | --- |
| `cache.status` | Current cache readiness: `fresh`, `stale`, `missing`, `refreshing`, or `invalid` | `fresh` for cache-backed public-beta smoke. |
| `cache.age_seconds` and `cache.ttl_hours` | Cache freshness age and configured TTL | Age must remain within the launch freshness threshold. |
| `cache.source_health` | Source count, successful sources, failed sources, and failure codes from cache provenance | Failed sources require ETL proof review before launch copy broadens. |
| `operations.requests` | In-process HTTP request count, success/failure count, rate-limit count, and latency snapshot | Watch for rising 4xx/5xx and rate-limit spikes. |
| `operations.tool_calls` | In-process tool success/failure, invalid input, no-result, source-failure, and latency snapshot | No-result and source-failure spikes should trigger source/cache triage. |

Manual log redaction probe:

```powershell
$env:FAMILY_EXPERIENCE_ETL_CACHE_DIR='../../.omo/tmp/market-plan/missing-cache'
node --import tsx scripts/smoke-mcp.ts *> ../../.omo/evidence/family-experience-market-ready-platform/task-12-redacted-failure-log.txt
Remove-Item Env:FAMILY_EXPERIENCE_ETL_CACHE_DIR
npm run scan:secrets -- --include ../../.omo/evidence/family-experience-market-ready-platform/task-12-redacted-failure-log.txt
```

The probe passes only if the captured artifact has a bounded failure code and no raw secret, keyed URL, or stack trace.

## Official Source Matrix

| CLI source | Source id | Authority | Required env | Base URL env | Operational role |
| --- | --- | --- | --- | --- | --- |
| `seoul` | `seoul-culture-events` | Seoul Open Data Plaza | `SEOUL_OPEN_DATA_KEY` | `SEOUL_OPEN_DATA_BASE_URL` | Seoul city event source. |
| `culture_portal` | `culture-portal-oneview` | KCISA/Culture Portal via Public Data Portal | `CULTURE_PORTAL_SERVICE_KEY` | `CULTURE_PORTAL_BASE_URL` | National culture-event candidate source. |
| `kto_tourapi` | `kto-tourapi-events` | Korea Tourism Organization via Public Data Portal | `KTO_TOURAPI_SERVICE_KEY` | `KTO_TOURAPI_BASE_URL` | National tourism/event breadth candidate source. |
| `national_festival` | `national-culture-festival-standard` | Public Data Portal standard dataset | `PUBLIC_DATA_STANDARD_SERVICE_KEY` only for live endpoint mode | `NATIONAL_CULTURE_FESTIVAL_BASE_URL` only for live endpoint mode | Local CSV fallback source when `NATIONAL_CULTURE_FESTIVAL_CSV_PATH` points to the standard CSV. |

All four are official-source routes. Do not add unofficial event pages, scraping pipelines, or browser parsers to this runbook.

## Secret And API Key Handling

Local secrets belong only in `.env`. The repository keeps `.env` and `.env.*` ignored, while `.env.example` is the canonical list of variable names and safe defaults.

From `apps/family-experience-mcp`, create the local secret file:

```bash
cp .env.example .env
```

Fill only the keys you have. Do not commit `.env`. Provider key slots are:

```bash
# Required only for the corresponding live proof.
SEOUL_OPEN_DATA_KEY=
CULTURE_PORTAL_SERVICE_KEY=
KTO_TOURAPI_SERVICE_KEY=

# Optional in CSV fallback mode. Required only for confirmed national_festival live endpoint mode.
PUBLIC_DATA_STANDARD_SERVICE_KEY=
```

`PUBLIC_DATA_STANDARD_SERVICE_KEY` may remain empty while the national festival source uses the local CSV fallback.

Portable secret strategy:

| Runtime | Where secret values belong | Default? | Operator rule |
| --- | --- | --- | --- |
| Local development | `apps/family-experience-mcp/.env` copied from `.env.example` | Yes for local-only proof | Keep `.env` private; copy variable names from `.env.example`, never real values. |
| KakaoCloud/PlayMCP-in-KC with env or Secret injection | KakaoCloud env/Secret injection using the exact variable names in `.env.example` | Yes when the host supports it | Store provider keys server-side only; do not paste keys into PlayMCP copy fields. |
| Non-Kakao container hosts | Host secret manager mapped to environment variables | Yes for generic deployment | Use the platform's secret reference feature; keep base URLs and cache paths as plain env vars. |
| PlayMCP-in-KC without env or Secret injection | Private image or private registry containing host-specific runtime secrets | No | `HUMAN_APPROVAL_REQUIRED`; see `docs/HOST_REQUIREMENTS_SOT.md` before selecting this path. |

The image-baked path cannot be selected by default. It requires a human operator to record approval, use a private repository or registry, rotate affected provider keys after the temporary deployment/review window, and remove the baked-key path when PlayMCP-in-KC env or Secret injection becomes available.

Key issuance happens outside this runbook. Operators should obtain or approve keys in the relevant official provider portals first, then configure only the issued values locally or in a supported deployment secret manager:

- Seoul Open Data Plaza for `SEOUL_OPEN_DATA_KEY`: `https://data.seoul.go.kr/`.
- Public Data Portal `한국문화정보원_한눈에보는문화정보조회서비스` for `CULTURE_PORTAL_SERVICE_KEY`: `https://www.data.go.kr/data/15138937/openapi.do`.
- Public Data Portal `한국관광공사_국문 관광정보 서비스_GW` for `KTO_TOURAPI_SERVICE_KEY`: `https://www.data.go.kr/data/15101578/openapi.do`.
- Public Data Portal `전국문화축제표준데이터` for CSV fallback download: `https://www.data.go.kr/data/15013104/standard.do`.
- Use `PUBLIC_DATA_STANDARD_SERVICE_KEY` only after the standard-data live endpoint has been confirmed for this app. Do not require it for the local CSV fallback.

Minimum key-acquisition expectation: the operator must log in to the provider portal, open the listed data/service page, complete the portal's use-application or key-request flow, wait for any required approval, and copy the issued key value only after approval. If a provider page is pending approval, record that provider as a live-proof blocker instead of switching to unofficial data.

Provider key format rule: paste the provider-issued key value only, not a full URL or query string. For Public Data Portal services that show both encoded and decoded service keys, use the variant that passes the source-specific dry-run in this environment; never print the attempted value in docs, logs, or tickets.

Current `.env.example` safe defaults:

```bash
SEOUL_OPEN_DATA_BASE_URL=http://openapi.seoul.go.kr:8088
CULTURE_PORTAL_BASE_URL=https://apis.data.go.kr/B553457/cultureinfo
KTO_TOURAPI_BASE_URL=https://apis.data.go.kr/B551011/KorService2
NATIONAL_CULTURE_FESTIVAL_CSV_PATH=공공데이터-관련/전국문화축제표준데이터.csv
FAMILY_EXPERIENCE_SOURCE_SET=seoul,culture_portal,kto_tourapi,national_festival
FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache
FAMILY_EXPERIENCE_ETL_MAX_PAGES=1
FAMILY_EXPERIENCE_ETL_TTL_HOURS=24
FAMILY_EXPERIENCE_ALLOW_FIXTURE=false
HOST=127.0.0.1
PORT=3349
```

PowerShell equivalents for common handoff commands:

```powershell
Copy-Item .env.example .env
New-Item -ItemType Directory -Force ../../.omo/evidence/family-experience-handoff | Out-Null
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source culture_portal | Tee-Object ../../.omo/evidence/family-experience-handoff/culture-portal-etl.json
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --write-cache --cache-dir data/family-experience-cache --source culture_portal
npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed | Tee-Object ../../.omo/evidence/family-experience-handoff/cache-smoke.json
node -e "const fs=require('node:fs'); const p='data/family-experience-cache/metadata.json'; console.log(JSON.parse(fs.readFileSync(p,'utf8')))"
```

Operational rules:

- Put the issued Seoul Open Data key in `.env`, never in `.env.example`, docs, screenshots, raw logs, or evidence files.
- Put Culture Portal, KTO TourAPI, and public-data standard service keys in `.env` or a supported deployment secret manager only.
- Keep all provider keys server-side. Do not introduce browser/public prefixes for provider secrets.
- Use the deployment platform's secret manager for deployed servers when the platform supports it. Copy variable names, not `.env` file contents.
- For PlayMCP-in-KC, follow `docs/HOST_REQUIREMENTS_SOT.md`. As of the organizer notice quoted on 2026-07-07, that host did not support environment variable or Secret injection. Any image-baked API key workaround is a temporary host-specific exception requiring explicit human approval, private repository or registry, no raw-key logs, and a rotation/removal plan once env/Secret injection is available.
- Use separate provider keys for separate MCPs or providers. Do not reuse a single key across family events, pharmacy lookup, and baby-product safety integrations.
- Log only redacted diagnostics. Keyed URLs and authorization headers must be replaced with `<redacted>` before they reach console output, errors, reports, or QA artifacts.
- Before sharing or staging changes, run `npm run scan:secrets`, `npm run scan:sources`, and `npm run scan:claims`, then inspect the staged diff manually.

Secret scanner negative QA:

```bash
npm run scan:secrets -- --include <path>
```

Use `--include` for temporary QA fixtures, generated evidence outside the default scan set, and deployment notes that are not under `docs/`, `src/`, `test/`, or `scripts/`. Malformed includes and missing paths fail closed. A scanner PASS only means no known raw-secret pattern was found; it does not approve image-baked secrets or substitute for manual diff review.

Deployment secret mapping:

| Variable | Local source | Deployment destination | Notes |
| --- | --- | --- | --- |
| `SEOUL_OPEN_DATA_KEY` | `.env` | Secret environment variable | Required for Seoul live adapter. |
| `SEOUL_OPEN_DATA_BASE_URL` | `.env` or default | Plain environment variable | Override only; default is safe. |
| `CULTURE_PORTAL_SERVICE_KEY` | `.env` | Secret environment variable | Required for Culture Portal live ETL proof. |
| `CULTURE_PORTAL_BASE_URL` | `.env` or default | Plain environment variable | Base URL only: `https://apis.data.go.kr/B553457/cultureinfo`. The adapter appends `/period2`. |
| `KTO_TOURAPI_SERVICE_KEY` | `.env` | Secret environment variable | Required for KTO TourAPI live ETL proof. |
| `KTO_TOURAPI_BASE_URL` | `.env` or default | Plain environment variable | Default points to the official TourAPI route. |
| `PUBLIC_DATA_STANDARD_SERVICE_KEY` | `.env` | Secret environment variable | Not required for local CSV fallback. Required only if a live standard-data endpoint is confirmed and configured. |
| `NATIONAL_CULTURE_FESTIVAL_BASE_URL` | `.env` | Plain environment variable | Set only after confirming the official standard-data endpoint for live calls. |
| `NATIONAL_CULTURE_FESTIVAL_CSV_PATH` | `.env` | Plain environment variable | Optional local CSV fallback path (no secret). CSV mode can satisfy data availability without the live API key. |
| `FAMILY_EXPERIENCE_SOURCE_SET` | `.env` or default | Plain environment variable | Default enables Seoul, Culture Portal, KTO, and national festival sources. |
| `FAMILY_EXPERIENCE_ETL_CACHE_DIR` | `.env` or default | Plain environment variable | Local JSONL cache directory. |
| `FAMILY_EXPERIENCE_ETL_MAX_PAGES` | `.env` or default | Plain environment variable | Keep low for proof runs. |
| `FAMILY_EXPERIENCE_ETL_TTL_HOURS` | `.env` or default | Plain environment variable | Cache freshness threshold. |
| `FAMILY_EXPERIENCE_ALLOW_FIXTURE` | `.env` | Plain environment variable | Keep `false` for live-mode proof. |
| `HOST` | `.env` or default | Plain environment variable | Use `127.0.0.1` locally and `0.0.0.0` in containers. |
| `PORT` | `.env` or platform default | Plain environment variable | Local-only unless the platform requires it. |

## Public-Beta Deploy-To-Runbook

This is an operator sequence from local validation to temporary PlayMCP information load. It does not claim deployment, PlayMCP review, public visibility, or contest submission until the operator performs and records those actions.

Set these shell variables before starting. Use the real deployment URL only in private evidence if it is not meant for public docs.

```bash
APP_DIR=apps/family-experience-mcp
EVIDENCE_DIR=.omo/evidence/family-experience-market-ready-platform
DEPLOY_BASE_URL=https://mcp-name.playmcp-endpoint.kakaocloud.io
MCP_ENDPOINT="$DEPLOY_BASE_URL/mcp"
```

| Step | Scenario | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- | --- |
| 1 | Local validation gate | `npm --prefix "$APP_DIR" run verify` | Tests and checks exit 0. No deployment claim is made. | `$EVIDENCE_DIR/task-15-local-verify.txt` |
| 2 | Source, claim, and secret gates | `npm --prefix "$APP_DIR" run scan:claims`; `npm --prefix "$APP_DIR" run scan:sources`; `npm --prefix "$APP_DIR" run scan:secrets` | All scanners exit 0 before public copy or PlayMCP information load. | `$EVIDENCE_DIR/task-15-scan-claims.txt`, `$EVIDENCE_DIR/task-15-scan-sources.txt`, `$EVIDENCE_DIR/task-15-scan-secrets.txt` |
| 3 | Source-specific cache generation | From `apps/family-experience-mcp`: `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source <configured_source>` | `ok=true`, source-specific record count greater than zero, redacted diagnostics only, and cache files written under `data/family-experience-cache`. Missing provider keys are recorded as blockers, not worked around with unofficial sources. | `$EVIDENCE_DIR/task-15-cache-generation-<source>.txt` |
| 4 | Cache-backed local MCP smoke | `npm --prefix "$APP_DIR" run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed` | `called=find_family_experiences`, candidate count is bounded, no raw key or keyed URL appears, and cache mode matches the generated cache. | `$EVIDENCE_DIR/task-15-runbook-local.txt` |
| 5 | Docker build | From `apps/family-experience-mcp`: `docker build --platform linux/amd64 -t family-experience-mcp:public-beta .` | Image builds from compiled JavaScript, production dependencies, non-root runtime, and the Dockerfile `/health` healthcheck. | `$EVIDENCE_DIR/task-15-docker-build.txt` |
| 6 | Docker daemon blocker fallback | If Docker returns a daemon or pipe error, capture `docker version`, the failed `docker build` output, then rerun `npm --prefix "$APP_DIR" run verify` and local MCP smoke. | The blocker text is exact. The fallback proves only Node/npm package behavior; it is not a Docker runtime pass. | `$EVIDENCE_DIR/task-15-docker-daemon-blocker.txt`, `$EVIDENCE_DIR/task-15-docker-fallback-verify.txt`, `$EVIDENCE_DIR/task-15-docker-fallback-smoke.txt` |
| 7 | Deploy image to HTTPS host | Use the selected host's build, push, and deploy command with server-side secrets or the human-approved private-image exception from `docs/HOST_REQUIREMENTS_SOT.md`. Configure `HOST=0.0.0.0`, `PORT=3349`, `FAMILY_EXPERIENCE_ALLOW_FIXTURE=false`, cache path, TTL, and provider keys through the host's supported secret path. | Host reports a running revision and an HTTPS base URL. Raw secrets are absent from command output and logs. | `$EVIDENCE_DIR/task-15-deploy-host.txt` |
| 8 | Remote `/health` smoke | `curl -fsS "$DEPLOY_BASE_URL/health" | tee "$EVIDENCE_DIR/task-15-remote-health.json"` | HTTP 200. JSON identifies the service, cache status is `fresh` before broad beta copy, source failures are understood, and no raw key appears. | `$EVIDENCE_DIR/task-15-remote-health.json` |
| 9 | Remote `/mcp` smoke | `MCP_ENDPOINT="$MCP_ENDPOINT" npm --prefix "$APP_DIR" run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed | tee "$EVIDENCE_DIR/task-15-remote-mcp.txt"` | Smoke exits 0 against the HTTPS `/mcp` endpoint and discovers or calls exactly `find_family_experiences`. | `$EVIDENCE_DIR/task-15-remote-mcp.txt` |
| 10 | PlayMCP `정보 불러오기` flow | In the PlayMCP console: open the registered MCP, expand MCP information, click `수정`, set `MCP Endpoint` to `$MCP_ENDPOINT`, click `정보 불러오기`, and inspect the loaded tool list. | Console loads exactly one public tool, `find_family_experiences`. Keep visibility private/operator-only. Do not click `등록 및 심사 요청` in this step. | `$EVIDENCE_DIR/task-15-playmcp-info-load.md` |
| 11 | Starter-message private smoke | Run the registered starter prompts in private/operator-only mode after `정보 불러오기`. | Responses stay source-grounded, do not expose secrets, do not promise nationwide completeness, and reflect cache/source limits. | `$EVIDENCE_DIR/task-15-playmcp-starter-smoke.md` |
| 12 | Post-release monitoring | During beta smoke, follow `docs/SLO.md`: check `/health` every 15 minutes, MCP smoke after deploy/cache changes, P95 every 30 minutes, cache freshness hourly, source ETL proof once per launch day, no-result/provider alerts, and all scan gates before handoff. | SLO observables remain within beta targets or an incident drill below is opened. | `$EVIDENCE_DIR/task-15-post-release-monitoring.md` |

PowerShell remote smoke equivalents:

```powershell
$env:DEPLOY_BASE_URL='https://mcp-name.playmcp-endpoint.kakaocloud.io'
$env:MCP_ENDPOINT="$env:DEPLOY_BASE_URL/mcp"
Invoke-WebRequest -UseBasicParsing "$env:DEPLOY_BASE_URL/health" | Select-Object -ExpandProperty Content | Tee-Object ../../.omo/evidence/family-experience-market-ready-platform/task-15-remote-health.json
npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed *> .omo/evidence/family-experience-market-ready-platform/task-15-remote-mcp.txt
Remove-Item Env:DEPLOY_BASE_URL
Remove-Item Env:MCP_ENDPOINT
```

## Nationwide ETL Cache Operation

Public-beta runtime is cache-first. Refresh the cache at least every 24 hours for tier3 public copy, and run an extra refresh before a demo, release candidate, or PlayMCP review smoke. The default TTL is `FAMILY_EXPERIENCE_ETL_TTL_HOURS=24`; use a shorter TTL only when the operator also schedules the matching refresh cadence.

The service fails closed when the configured cache is missing, stale, malformed, or mid-publish. It must not serve stale records as live output and must not fabricate candidates. `/health` reports the cache `status` as `fresh`, `stale`, `missing`, `refreshing`, or `invalid`, plus the exact `refreshCommand` for the current runtime mode. `find_family_experiences` returns a bounded error with zero candidates for stale or missing cache.

Fixture dry-run, no cache write:

```bash
npm run etl:nationwide -- --fixture --dry-run
```

Fixture cache write:

```bash
npm run etl:nationwide -- --fixture --write-cache
```

Use fixture cache only when `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true` and the output is explicitly labelled fixture/demo. Public-beta live operation must use source-specific live refresh commands instead of fixture rebuilds:

```bash
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source culture_portal
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source kto_tourapi
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source national_festival
```

Recovery command for stale, missing, or invalid live cache:

```bash
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source <configured_source>
npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed
curl -i http://127.0.0.1:3349/health
```

Record cache refresh and stale-cache recovery evidence under `.omo/evidence/family-experience-market-ready-platform/`, using names such as `task-9-cache-refresh-live.txt`, `task-9-cache-stale-smoke.txt`, and `task-9-cache-health.json`. Run `npm run scan:secrets -- --include <evidence-path>` before sharing any generated ETL proof.

The cache contains normalized records, raw snapshot references, source metadata, and TTL metadata under `FAMILY_EXPERIENCE_ETL_CACHE_DIR`. Treat it as operational evidence, not as live nationwide completeness proof.

Live proof is source-by-source and key-dependent. Run a one-page proof only for keys that are present, capture redacted output, and record absent keys as blockers. The success markers are `ok=true`, `failures=0`, source-specific `records > 0`, and `redaction_verified=true`.

```bash
mkdir -p ../../.omo/evidence/family-experience-handoff
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source seoul
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source culture_portal | tee ../../.omo/evidence/family-experience-handoff/culture-portal-etl.json
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source kto_tourapi
```

National festival CSV fallback proof does not need `PUBLIC_DATA_STANDARD_SERVICE_KEY`:

```bash
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source national_festival
```

CSV fallback setup: download the public data portal standard dataset for national culture festivals, save it as `공공데이터-관련/전국문화축제표준데이터.csv`, and keep `NATIONAL_CULTURE_FESTIVAL_CSV_PATH` pointing to that path. If the file is absent, `national_festival` live mode needs both a confirmed endpoint and `PUBLIC_DATA_STANDARD_SERVICE_KEY`.

National festival live endpoint proof is intentionally separate. Run it only after an official live endpoint is confirmed and `NATIONAL_CULTURE_FESTIVAL_BASE_URL` plus `PUBLIC_DATA_STANDARD_SERVICE_KEY` are configured.

Current Culture Portal proof snapshot is last-known local evidence, not reusable release proof: direct API probe returned HTTP 200 with `resultCode=00` and item rows; the app ETL dry-run returned `ok=true`, `normalized_records=10`, and `raw_snapshots=1`. See `docs/QA_REPORT.md` for current verification status.

To verify cache-backed MCP behavior, first write a cache for sources with configured keys, then run the smoke against that cache. Do not run a full default-source cache generation when only some keys are present. Use `--source` per available provider or set `FAMILY_EXPERIENCE_SOURCE_SET` to the proven subset.

```bash
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --write-cache --cache-dir data/family-experience-cache --source culture_portal
npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed | tee ../../.omo/evidence/family-experience-handoff/cache-smoke.json
node -e "const fs=require('node:fs'); const p='data/family-experience-cache/metadata.json'; console.log(JSON.parse(fs.readFileSync(p,'utf8')))"
```

Expected ETL cache smoke markers: `called=find_family_experiences`, `mode=live` for a live ETL cache, `candidate_count > 0`, no raw key, and `cache_dir=data/family-experience-cache`. If the cache was generated with `--fixture`, the expected mode is `fixture`; do not mix fixture-mode smoke with live proof claims. If `candidate_count=0`, rerun cache generation for a source/location/date combination that produced records in the ETL proof.

Coverage rules:

- Fixture or cache-backed results prove only local normalization and query behavior.
- Current live coverage is proven only for a source/key pair after the live proof command succeeds in the current environment.
- Missing keys are blockers for live proof; operators must not imply nationwide completeness.
- Missing, expired, malformed, or mid-publish cache is a configuration failure. Refresh the cache and rerun smoke before relying on cache-first MCP responses.
- The national festival standard source is lower-freshness fallback data and must not outrank fresher exact event sources by default.

## Container Deployment

The app includes `Dockerfile` for public HTTPS hosting behind a platform ingress or load balancer.

Build from `apps/family-experience-mcp`:

```bash
docker build -t family-experience-mcp:local .
```

Run locally without secrets only for fixture smoke:

```bash
docker run --rm -p 3349:3349 -e HOST=0.0.0.0 -e PORT=3349 -e FAMILY_EXPERIENCE_ALLOW_FIXTURE=true family-experience-mcp:local
```

For generic live deployment, set provider keys in the platform secret manager, keep `FAMILY_EXPERIENCE_ALLOW_FIXTURE=false`, configure a writable or pre-baked cache path, and expose `/health` plus `/mcp` through HTTPS. Do not bake `.env` or raw keys into the image.

For AGENTIC PLAYER 10 PlayMCP-in-KC deployment, `docs/HOST_REQUIREMENTS_SOT.md` is the canonical host SOT. The required endpoint pattern from the organizer notice is:

```text
https://mcp-name.playmcp-endpoint.kakaocloud.io/mcp
```

If the KakaoCloud console issues a different HTTPS `/mcp` endpoint, use the console-issued endpoint and record that proof privately. Current host-secret handling must be decided by the operator before deployment because the organizer notice says PlayMCP-in-KC env/Secret injection is not yet supported.

## PlayMCP Temporary Entry

1. Open the PlayMCP web console, sign in with a Kakao account that has developer console access, and create or open the form for a new MCP server. Use the official AGENTIC PLAYER / PlayMCP guide as the source for the console URL if the bookmark is unavailable.
2. Use `docs/PLAYMCP_TEMP_REGISTRATION.md` as the canonical copy source. Minimum fields:
   - Service name: `아이랑 어디가`
   - Identifier: `familyexp`
   - Endpoint path: `/mcp`
   - Public tool: `find_family_experiences`
   - Starter messages: `이번 주말 4살 실내 체험 찾아줘`, `오늘 아이랑 갈 곳 3개만 골라줘`, `비 오는 날 가족 체험 추천해줘`
3. Deploy a temporary HTTPS server, then set the PlayMCP endpoint to that deployed URL ending in `/mcp`. For AGENTIC PLAYER 10, use the KakaoCloud PlayMCP-in-KC endpoint described in `docs/HOST_REQUIREMENTS_SOT.md`.
4. Choose no-auth for fixture/private validation. For live provider-backed deployment, provider keys must never be pasted into PlayMCP. If PlayMCP-in-KC still lacks env/Secret injection, stop for the human-approved temporary secret strategy in `docs/HOST_REQUIREMENTS_SOT.md`.
5. Ensure the deployed runtime can read the ETL cache or has a pre-deployment cache generation step.
6. Keep response visibility private/operator-only for this handoff.
7. If the console requires a representative image before saving, stop and prepare a rights-cleared image separately. Do not upload third-party event posters, logos, child faces, screenshots with private data, or generated images that imply official endorsement.
8. Save for temporary testing and stop.

Post-save check:

- Tool discovery shows exactly `find_family_experiences`.
- Starter messages run without raw secrets, keyed URLs, or unsupported claims.
- The entry remains private/operator-only.
- No review request, public visibility switch, representative image upload, or contest submission is performed by this step. When final-ready, the organizer flow is `정보 불러오기` followed by `등록 및 심사 요청`; that action must be recorded separately.

## Response Visibility

The current package is not a public-release package. Temporary/private visibility lets the operator inspect tool discovery, starter messages, and response shape before any later gate.

## Copy And Claim Guardrails

- Keep fixture/demo labeling visible in operator copy and responses.
- Do not promise nationwide coverage, live freshness, reservation status, current opening status, or child suitability without source support.
- Distinguish official-source candidate/cache coverage from current key-backed live proof.
- Do not write that a release, public switch, contest entry, or final review action has happened.
- Do not include raw secrets or keyed URLs in docs, console notes, screenshots, or evidence.
- TODO: 대표 이미지 is still required by the console workflow. Do not generate or upload one here.

## Rollback

If tool discovery or starter-message smoke fails:

1. Keep the PlayMCP entry private.
2. Confirm the endpoint ends in `/mcp`.
3. Run `npm run verify`, `npm run scan:secrets`, `npm run scan:sources`, and `npm run scan:claims`.
4. Rebuild or regenerate the ETL cache if the failure mentions a missing, malformed, or stale cache.
5. Inspect server logs for redacted configuration only.
6. If a raw key or keyed URL was exposed, rotate the affected provider key before retrying.

### Bad Cache Rollback Drill

Use this when `/health.cache.status` is `stale`, `missing`, `invalid`, or stuck at `refreshing`, or when MCP smoke reports a cache read failure.

| Step | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| 1 | `curl -fsS "$DEPLOY_BASE_URL/health" | tee "$EVIDENCE_DIR/task-15-bad-cache-health-before.json"` | Cache status shows the bad state without raw secrets. | `$EVIDENCE_DIR/task-15-bad-cache-health-before.json` |
| 2 | From `apps/family-experience-mcp`: `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source <configured_source>` | Cache is rebuilt only from a currently proven official source. | `$EVIDENCE_DIR/task-15-bad-cache-refresh.txt` |
| 3 | `MCP_ENDPOINT="$MCP_ENDPOINT" npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed | tee "../../$EVIDENCE_DIR/task-15-bad-cache-mcp-after.txt"` | MCP smoke exits 0 and calls `find_family_experiences`. | `$EVIDENCE_DIR/task-15-bad-cache-mcp-after.txt` |
| 4 | `curl -fsS "$DEPLOY_BASE_URL/health" | tee "../../$EVIDENCE_DIR/task-15-bad-cache-health-after.json"` | Cache status returns to `fresh`; cache age is below the SLO threshold in `docs/SLO.md`. | `$EVIDENCE_DIR/task-15-bad-cache-health-after.json` |

Do not broaden public copy until the after-state evidence exists and the cache freshness SLO is back inside target.

### Exposed Key Incident Drill

Use this for any raw key, keyed URL, bearer token, or provider credential found in docs, logs, screenshots, console fields, evidence, or public copy.

| Step | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| 1 | Stop sharing the affected artifact; keep PlayMCP private/operator-only. | Exposure is contained before retrying deployment or `정보 불러오기`. | `$EVIDENCE_DIR/task-15-exposed-key-containment.md` |
| 2 | Redact or remove the artifact, then run `npm run scan:secrets -- --include <redacted-evidence-path>`. | Scanner exits 0 for the redacted artifact. | `$EVIDENCE_DIR/task-15-exposed-key-specific-scan.txt` |
| 3 | Rotate the affected provider key in the official provider portal; update only `.env` or the host secret manager. | New key is configured server-side. No raw key is written to docs or evidence. | `$EVIDENCE_DIR/task-15-key-rotation.md` |
| 4 | `npm run scan:secrets && npm run scan:sources && npm run scan:claims` | Full gates exit 0 before retry. | `$EVIDENCE_DIR/task-15-exposed-key-full-gates.txt` |
| 5 | Rerun remote `/health`, remote `/mcp`, and PlayMCP `정보 불러오기` only after rotation and scans pass. | Endpoint works with rotated secret path; no public/review claim is made. | `$EVIDENCE_DIR/task-15-exposed-key-retry.txt` |

This is a SEV1 under `docs/SLO.md`; close it only after rotation, scans, and a clean retry are recorded.

### Provider Outage Response Drill

Use this when ETL proof or `/health.cache.source_health.failure_codes` shows provider quota exhaustion, repeated source failure, or provider outage.

| Step | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| 1 | `curl -fsS "$DEPLOY_BASE_URL/health" | tee "$EVIDENCE_DIR/task-15-provider-outage-health.json"` | Failed source and failure code are visible without raw keyed URLs. | `$EVIDENCE_DIR/task-15-provider-outage-health.json` |
| 2 | From `apps/family-experience-mcp`: `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source <affected_source>` | Failure is source-scoped and redacted. | `$EVIDENCE_DIR/task-15-provider-outage-etl.txt` |
| 3 | If another official source has current proof, refresh cache with that source only. | Cache uses a currently proven source; copy is narrowed to that proof. | `$EVIDENCE_DIR/task-15-provider-outage-fallback-source.txt` |
| 4 | Run MCP smoke and scans before traffic resumes. | Smoke and scans exit 0, or beta traffic stays held. | `$EVIDENCE_DIR/task-15-provider-outage-smoke-gates.txt` |

Do not switch to scraping, unofficial event pages, or unsupported provider claims.

### Public-Copy Rollback Drill

Use this when public copy overstates coverage, freshness, reservation/open status, child suitability, or any unsupported source claim.

| Step | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| 1 | Remove or narrow the affected public copy; keep PlayMCP private if the copy is in the console. | Unsupported claim is no longer exposed. | `$EVIDENCE_DIR/task-15-public-copy-rollback.md` |
| 2 | `npm run scan:claims -- --include <copy-path>` and `npm run scan:sources -- --include <copy-path>` | Both scans exit 0 for the corrected copy. | `$EVIDENCE_DIR/task-15-public-copy-rollback-scans.txt` |
| 3 | Re-run the starter-message private smoke if the copy came from PlayMCP fields. | Responses and starter copy match current source/cache proof. | `$EVIDENCE_DIR/task-15-public-copy-rollback-starter-smoke.md` |

Do not click `등록 및 심사 요청`, switch to all-public, or submit the contest entry until corrected copy and scans pass.

### Key Rotation Drill

Use this after any exposed-key incident, after a temporary image-baked-key review window, or on the operator's scheduled rotation cadence.

| Step | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| 1 | Create or rotate the provider key in the official provider portal. | Provider portal issues a replacement key; do not copy the raw value into evidence. | `$EVIDENCE_DIR/task-15-key-rotation.md` |
| 2 | Update only `.env` for local proof or the deployment secret manager for remote proof. | Runtime receives the new secret through the approved secret path. | `$EVIDENCE_DIR/task-15-key-rotation-config.md` |
| 3 | Regenerate source-specific cache and run remote `/health` plus remote `/mcp` smoke. | Cache is fresh and MCP smoke exits 0. | `$EVIDENCE_DIR/task-15-key-rotation-smoke.txt` |
| 4 | `npm run scan:secrets` and `npm run scan:secrets -- --include <rotation-evidence-path>` | No raw old or new key remains in docs, logs, or evidence. | `$EVIDENCE_DIR/task-15-key-rotation-secret-scans.txt` |

### Post-Release Monitoring Drill

Use this only after the operator has actually deployed a beta endpoint. It is an SLO monitoring loop, not proof that review, public switch, or contest submission is complete.

| Interval | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| Every 15 minutes during beta smoke | `curl -fsS "$DEPLOY_BASE_URL/health"` | HTTP 200; cache is `fresh` unless an incident is open. | `$EVIDENCE_DIR/task-15-post-release-health-<timestamp>.json` |
| After deploy or cache changes | `MCP_ENDPOINT="$MCP_ENDPOINT" npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed` | Tool call succeeds for `find_family_experiences`; no raw secrets. | `$EVIDENCE_DIR/task-15-post-release-mcp-<timestamp>.txt` |
| Every 30 minutes during beta smoke | `grep '"event":"tool_call"' <log> | jq -s 'map(.latency_ms) | sort | .[(length*0.95|floor)]'` | P95 remains under the beta SLO target in `docs/SLO.md`. | `$EVIDENCE_DIR/task-15-post-release-p95-<timestamp>.txt` |
| Once per launch day | `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source <configured_source>` | Current source ETL proof exists for the launch day. | `$EVIDENCE_DIR/task-15-post-release-etl-<source>-<date>.txt` |
| Before handoff or PlayMCP information load | `npm run scan:secrets && npm run scan:sources && npm run scan:claims` | All gates exit 0. | `$EVIDENCE_DIR/task-15-post-release-gates-<timestamp>.txt` |

If any interval fails, classify severity with `docs/SLO.md`, open the matching drill above, and record the incident before retrying deployment, `정보 불러오기`, review request, public visibility, or contest submission.
