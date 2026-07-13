# Operator Runbook

This runbook is the operator handoff for `아이랑 어디가`. It covers local verification, provider keys, cache-first ETL operation, temporary PlayMCP registration, and rollback. It is not proof of public release or contest submission.

## Canonical References

| Truth | Canonical home |
| --- | --- |
| Product PRD, users, output contract, and launch criteria | `docs/PRODUCT_PRD_SOT.md` |
| Environment variable names and safe defaults | `.env.example` |
| Source, claim, cache, and release policy | `docs/DECISIONS.md` |
| Host/organizer deployment and PlayMCP-in-KC requirements | `docs/HOST_REQUIREMENTS_SOT.md` |
| Verification status and residual risks | `docs/QA_REPORT.md` |
| Golden MCP response scenarios | `docs/GOLDEN_RESULTS.md` |
| Temporary PlayMCP field copy | `docs/PLAYMCP_TEMP_REGISTRATION.md` |
| Representative image candidate and rights boundary | `docs/DEMO_PACK.md` |

## Preconditions

- Package path: `apps/family-experience-mcp`.
- Runtime: Node.js `>=20.19.0` and npm. From `apps/family-experience-mcp`, run `npm install` before the verification or ETL commands if `node_modules` is absent.
- Command examples use Bash/Git Bash syntax (`VAR=value command`, `mkdir -p`, `tee`). On PowerShell, use equivalent commands without changing the environment variables or arguments.
- Public tool count: one tool, `find_family_experiences`.
- MCP path: `/mcp`.
- Current recommended auth mode: no auth for temporary private validation. The static-cache serving runtime needs no provider credential.
- Fixture fallback is allowed only when `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true`.
- Production operation is cache-first with `FAMILY_EXPERIENCE_SOURCE_SET=kto_tourapi`. The image serves a static bundled cache; live provider calls and cache generation happen outside the serving container, followed by a gate, image rebuild, and redeploy.
- Every tool request requires `location`, `date_range`, and exactly one of `child_age` or `child_stage`. There are no implicit Seoul/weekend defaults and no date-range widening. Missing fields return typed `invalid_input` with exact `missing_fields` and zero source access.

## Local Verification

Run from `apps/family-experience-mcp`:

```bash
npm test -- --run test/playmcpMetadata.test.ts
npm run verify
npm run scan:claims
npm run scan:sources
npm run scan:secrets
npm run build
```

Production launch uses compiled JavaScript only:

```bash
npm run start
```

This executes `dist/src/server.js`. Use `dev:http` only for local development.

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

Use `/health` as the non-sensitive diagnostics surface for public-beta launch checks. It must never reveal cache filesystem paths, provider URLs, refresh commands, credentials, stack traces, or deployment topology. It includes:

| Field | Meaning | Launch check |
| --- | --- | --- |
| `cache.status` | Current cache state: `fresh`, `stale_servable`, `expired`, `missing`, `refreshing`, or `invalid` | `fresh` for broad-beta smoke; `stale_servable` is private degraded continuity only. |
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
| `seoul` | `seoul-culture-events` | Seoul Open Data Plaza | `SEOUL_OPEN_DATA_KEY` | `SEOUL_OPEN_DATA_BASE_URL` | Registered adapter only; excluded from production until HTTPS transport is confirmed. |
| `culture_portal` | `culture-portal-oneview` | KCISA/Culture Portal via Public Data Portal | `CULTURE_PORTAL_SERVICE_KEY` | `CULTURE_PORTAL_BASE_URL` | Registered non-production culture-event source. |
| `kto_tourapi` | `kto-tourapi-events` | Korea Tourism Organization via Public Data Portal | `KTO_TOURAPI_SERVICE_KEY` | `KTO_TOURAPI_BASE_URL` | Current production source: `searchFestival2` listings plus `detailIntro2` source-stated age evidence when parseable. |
| `national_festival` | `national-culture-festival-standard` | Public Data Portal standard dataset | `PUBLIC_DATA_STANDARD_SERVICE_KEY` only for live endpoint mode | `NATIONAL_CULTURE_FESTIVAL_BASE_URL` only for live endpoint mode | Local CSV fallback source when `NATIONAL_CULTURE_FESTIVAL_CSV_PATH` points to the standard CSV. |

All four are official-source routes. Do not add unofficial event pages, scraping pipelines, or browser parsers to this runbook.

## Secret And API Key Handling

External ETL and local source-proof secrets belong only in `.env`. The repository keeps `.env` and `.env.*` ignored, while `.env.example` is the canonical list of variable names and safe defaults. The current serving runtime does not load provider credentials.

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

Credential placement strategy:

| Execution surface | Where secret values belong | Current release? | Operator rule |
| --- | --- | --- | --- |
| External ETL and source proof | `apps/family-experience-mcp/.env` copied from `.env.example` | Yes | Keep `.env` private; use `KTO_TOURAPI_SERVICE_KEY` only to generate the production cache outside the serving container. |
| Current serving image on PlayMCP-in-KC or another host | No provider secret | Yes | Serve the gated bundled KTO cache. Do not inject keys, copy `.env`, or call providers from chat requests. |
| Future live-provider runtime on a host with env or Secret injection | Platform secret manager using the exact variable names in `.env.example` | No | This requires a new runtime/source decision and release proof; do not paste keys into PlayMCP copy fields. |
| Future live-provider runtime without env or Secret injection | Private image or private registry containing host-specific runtime secrets | No | `HUMAN_APPROVAL_REQUIRED`; see `docs/HOST_REQUIREMENTS_SOT.md` before selecting this path. |

The image-baked path is not part of the current release and cannot be selected by default. It requires a human operator to record approval, use a private repository or registry, rotate affected provider keys after the temporary deployment/review window, and remove the baked-key path when PlayMCP-in-KC env or Secret injection becomes available.

Key issuance happens outside this runbook. Operators should obtain or approve keys in the relevant official provider portals first, then configure only the issued values in the external ETL/proof `.env`. A supported deployment secret manager applies only to a future live-provider runtime after an explicit decision and new release proof:

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
FAMILY_EXPERIENCE_SOURCE_SET=kto_tourapi
FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache
FAMILY_EXPERIENCE_ETL_MAX_PAGES=1
FAMILY_EXPERIENCE_ETL_TTL_HOURS=24
FAMILY_EXPERIENCE_ETL_STALE_GRACE_HOURS=24
FAMILY_EXPERIENCE_ALLOW_FIXTURE=false
FAMILY_EXPERIENCE_OPERATOR_NAME=<real public operator name>
FAMILY_EXPERIENCE_PRIVACY_CONTACT=<real public contact>
HOST=127.0.0.1
PORT=3349
```

PowerShell equivalents for the current KTO production-cache handoff:

```powershell
Copy-Item .env.example .env
New-Item -ItemType Directory -Force ../../.omo/evidence/family-experience-handoff | Out-Null
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --dry-run --source kto_tourapi | Tee-Object ../../.omo/evidence/family-experience-handoff/kto-etl.json
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source kto_tourapi
npm run qa:production-cache
npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed | Tee-Object ../../.omo/evidence/family-experience-handoff/cache-smoke.json
node -e "const fs=require('node:fs'); const p='data/family-experience-cache/metadata.json'; console.log(JSON.parse(fs.readFileSync(p,'utf8')))"
```

Operational rules:

- Put the issued Seoul Open Data key in `.env`, never in `.env.example`, docs, screenshots, raw logs, or evidence files.
- Put Culture Portal, KTO TourAPI, and public-data standard service keys only in the external ETL/proof `.env` for the current release.
- Keep all provider keys inside that private ETL environment. Do not introduce browser/public prefixes for provider secrets.
- A deployment secret manager applies only to a future live-provider runtime with an explicit source/runtime decision and new release proof. Copy variable names, not `.env` file contents.
- For PlayMCP-in-KC, follow `docs/HOST_REQUIREMENTS_SOT.md`. The current serving image needs no provider secret. Any future image-baked API key workaround is a temporary host-specific exception requiring explicit human approval, private repository or registry, no raw-key logs, and a rotation/removal plan once env/Secret injection is available.
- Use separate provider keys for separate MCPs or providers. Do not reuse a single key across family events, pharmacy lookup, and baby-product safety integrations.
- Log only redacted diagnostics. Keyed URLs and authorization headers must be replaced with `<redacted>` before they reach console output, errors, reports, or QA artifacts.
- Before sharing or staging changes, run `npm run scan:secrets`, `npm run scan:sources`, and `npm run scan:claims`, then inspect the staged diff manually.

Secret scanner negative QA:

```bash
npm run scan:secrets -- --include <path>
```

Use `--include` for temporary QA fixtures, generated evidence outside the default scan set, and deployment notes that are not under `docs/`, `src/`, `test/`, or `scripts/`. Malformed includes and missing paths fail closed. A scanner PASS only means no known raw-secret pattern was found; it does not approve image-baked secrets or substitute for manual diff review.

Configuration placement matrix:

| Variable | Local source | Current placement | Notes |
| --- | --- | --- | --- |
| `SEOUL_OPEN_DATA_KEY` | `.env` | External ETL/proof only | Required for Seoul adapter proof; not a current production runtime input. |
| `SEOUL_OPEN_DATA_BASE_URL` | `.env` or default | External ETL/proof only | Override only; default is safe. |
| `CULTURE_PORTAL_SERVICE_KEY` | `.env` | External ETL/proof only | Required for Culture Portal live ETL proof; not a current production runtime input. |
| `CULTURE_PORTAL_BASE_URL` | `.env` or default | External ETL/proof only | Base URL only: `https://apis.data.go.kr/B553457/cultureinfo`. The adapter appends `/period2`. |
| `KTO_TOURAPI_SERVICE_KEY` | `.env` | External production-cache ETL only | Required to generate the KTO cache; never inject it into the current serving image. |
| `KTO_TOURAPI_BASE_URL` | `.env` or default | External production-cache ETL only | Default points to the official TourAPI route. |
| `PUBLIC_DATA_STANDARD_SERVICE_KEY` | `.env` | External ETL/proof only | Not required for local CSV fallback. Required only if a live standard-data endpoint is confirmed and configured. |
| `NATIONAL_CULTURE_FESTIVAL_BASE_URL` | `.env` | External ETL/proof only | Set only after confirming the official standard-data endpoint for live calls. |
| `NATIONAL_CULTURE_FESTIVAL_CSV_PATH` | `.env` | External ETL/proof only | Optional local CSV fallback path (no secret); not part of the KTO production bundle. |
| `FAMILY_EXPERIENCE_SOURCE_SET` | `.env` or default | Build and serving runtime | Current production value is exactly `kto_tourapi`; the bundled cache must declare the same source set. |
| `FAMILY_EXPERIENCE_ETL_CACHE_DIR` | `.env` or default | External ETL write; serving runtime read-only | Current bundled path is `data/family-experience-cache`. |
| `FAMILY_EXPERIENCE_ETL_MAX_PAGES` | `.env` or default | External ETL/proof only | Keep low for proof runs. |
| `FAMILY_EXPERIENCE_ETL_TTL_HOURS` | `.env` or default | External ETL metadata and runtime validation | Freshness window; current default is 24 hours. |
| `FAMILY_EXPERIENCE_ETL_STALE_GRACE_HOURS` | `.env` or default | Serving runtime | Validated live LKG may serve with a visible degraded notice for 24 additional hours by default; hard maximum 168. |
| `FAMILY_EXPERIENCE_ALLOW_FIXTURE` | `.env` | Local test only; serving runtime `false` | Fixture data must never seed the production image. |
| `FAMILY_EXPERIENCE_OPERATOR_NAME` | deployment env | Serving runtime and public notice | Real public operator name. `/privacy` remains 503 until this and the contact are both set. |
| `FAMILY_EXPERIENCE_PRIVACY_CONTACT` | deployment env | Serving runtime and public notice | Real public privacy/contact channel; do not use a placeholder. |
| `HOST` | `.env` or default | Serving runtime | Use `127.0.0.1` locally and `0.0.0.0` in containers. |
| `PORT` | `.env` or platform default | Serving runtime | Defaults to `3349`; use the platform-provided value when required. |

## Public-Beta Deploy-To-Runbook

This is an operator sequence from local validation to temporary PlayMCP information load. It does not claim deployment, PlayMCP review, public visibility, or contest submission until the operator performs and records those actions.

Set these shell variables before starting. Use the endpoint rule in `docs/HOST_REQUIREMENTS_SOT.md`; the value below is only a placeholder shape.

```bash
APP_DIR=apps/family-experience-mcp
EVIDENCE_DIR=.omo/evidence/family-experience-market-ready-platform
DEPLOY_BASE_URL=https://<deployed-host>
MCP_ENDPOINT="$DEPLOY_BASE_URL/mcp"
```

| Step | Scenario | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- | --- |
| 1 | Local validation gate | `npm --prefix "$APP_DIR" run verify` | Tests and checks exit 0. No deployment claim is made. | `$EVIDENCE_DIR/task-15-local-verify.txt` |
| 2 | Source, claim, and secret gates | `npm --prefix "$APP_DIR" run scan:claims`; `npm --prefix "$APP_DIR" run scan:sources`; `npm --prefix "$APP_DIR" run scan:secrets` | All scanners exit 0 before public copy or PlayMCP information load. | `$EVIDENCE_DIR/task-15-scan-claims.txt`, `$EVIDENCE_DIR/task-15-scan-sources.txt`, `$EVIDENCE_DIR/task-15-scan-secrets.txt` |
| 3 | External production-cache generation | From `apps/family-experience-mcp`: `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source kto_tourapi` | KTO `searchFestival2` listings are written with matching `detailIntro2` snapshots, source set is exactly `kto_tourapi`, failures are zero, and diagnostics are redacted. | `$EVIDENCE_DIR/task-15-cache-generation-kto.txt` |
| 4 | Production-cache gate and local MCP smoke | `npm --prefix "$APP_DIR" run qa:production-cache`; then `npm --prefix "$APP_DIR" run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed` | The gate validates the canonical starter document and cache provenance; the smoke calls `find_family_experiences` without raw keys. | `$EVIDENCE_DIR/task-15-runbook-local.txt` |
| 5 | Docker build | From the repository root: `docker build --pull --platform linux/amd64 -f Dockerfile -t <tag> .` | The canonical image contains the gated static cache and compiled JavaScript, runs as non-root, and starts `node dist/src/server.js` directly as PID 1. | `$EVIDENCE_DIR/task-15-docker-build.txt` |
| 6 | Docker daemon blocker fallback | If Docker returns a daemon or pipe error, capture `docker version`, the failed `docker build` output, then rerun `npm --prefix "$APP_DIR" run verify` and local MCP smoke. | The blocker text is exact. The fallback proves only Node/npm package behavior; it is not a Docker runtime pass. | `$EVIDENCE_DIR/task-15-docker-daemon-blocker.txt`, `$EVIDENCE_DIR/task-15-docker-fallback-verify.txt`, `$EVIDENCE_DIR/task-15-docker-fallback-smoke.txt` |
| 7 | Deploy image to HTTPS host | Deploy the image with `HOST=0.0.0.0`, `PORT=3349`, `FAMILY_EXPERIENCE_ALLOW_FIXTURE=false`, source set `kto_tourapi`, bundled cache path, and TTL 24. Provider keys are not runtime inputs for this static-cache release candidate. | Host reports a running revision and an HTTPS base URL. `/health` and `/mcp` are reachable through platform HTTPS. | `$EVIDENCE_DIR/task-15-deploy-host.txt` |
| 8 | Remote `/health` smoke | `curl -fsS "$DEPLOY_BASE_URL/health" | tee "$EVIDENCE_DIR/task-15-remote-health.json"` | HTTP 200. JSON identifies the service, cache status is `fresh` before broad beta copy, source failures are understood, and no raw key appears. | `$EVIDENCE_DIR/task-15-remote-health.json` |
| 9 | Remote `/mcp` smoke | `MCP_ENDPOINT="$MCP_ENDPOINT" npm --prefix "$APP_DIR" run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed | tee "$EVIDENCE_DIR/task-15-remote-mcp.txt"` | Smoke exits 0 against the HTTPS `/mcp` endpoint and discovers or calls exactly `find_family_experiences`. | `$EVIDENCE_DIR/task-15-remote-mcp.txt` |
| 10 | PlayMCP `정보 불러오기` flow | In the PlayMCP console: open the registered MCP, expand MCP information, click `수정`, set `MCP Endpoint` to `$MCP_ENDPOINT`, click `정보 불러오기`, and inspect the loaded tool list. | Console loads exactly one public tool, `find_family_experiences`. Keep visibility private/operator-only. Do not click `등록 및 심사 요청` in this step. | `$EVIDENCE_DIR/task-15-playmcp-info-load.md` |
| 11 | Starter-message private smoke | Run the exact three starters from `docs/PLAYMCP_TEMP_REGISTRATION.md` in private/operator-only mode after `정보 불러오기`. | Responses stay KTO-source-grounded and do not add indoor/weather/booking claims. | `$EVIDENCE_DIR/task-15-playmcp-starter-smoke.md` |
| 12 | Post-deploy private monitoring | During private smoke, follow `docs/SLO.md`: check `/health`, rerun MCP smoke after deploy changes, watch cache freshness, and hold on any incident. | Observables remain within the private-smoke targets; this row is not a public-release claim. | `$EVIDENCE_DIR/task-15-post-release-monitoring.md` |

PowerShell remote smoke equivalents:

```powershell
$env:DEPLOY_BASE_URL='https://<deployed-host>'
$env:MCP_ENDPOINT="$env:DEPLOY_BASE_URL/mcp"
Invoke-WebRequest -UseBasicParsing "$env:DEPLOY_BASE_URL/health" | Select-Object -ExpandProperty Content | Tee-Object ../../.omo/evidence/family-experience-market-ready-platform/task-15-remote-health.json
npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed *> .omo/evidence/family-experience-market-ready-platform/task-15-remote-mcp.txt
Remove-Item Env:DEPLOY_BASE_URL
Remove-Item Env:MCP_ENDPOINT
```

## Production Cache Build And Redeploy

Production runtime is cache-first with a static KTO bundle. Generate and gate a new cache before the 24-hour TTL expires and before a private PlayMCP smoke. Then rebuild and redeploy the image. The serving container has no cache refresh loop and needs no provider key. If refresh fails, only an integrity-validated live LKG can serve during the configured bounded grace, and every result discloses that degraded state. Source-specific refresh/publication intervals in `docs/SOURCE_LEDGER.md` do not silently override the runtime bounds.

The service fails closed when the configured cache is missing, malformed, incomplete, fixture-only in production, source-mismatched, mid-publish, or beyond stale grace. Within grace, `/health` returns HTTP 200 with `cache.status=stale_servable`, and `find_family_experiences` adds the cache generation time and LKG warning to structured and textual output. Fresh status remains required for broad-beta copy. Public `/health` exposes only bounded status and counts; exact recovery commands and paths remain in this operator runbook.

Fixture dry-run, no cache write:

```bash
npm run etl:nationwide -- --fixture --dry-run
```

Fixture cache write:

```bash
npm run etl:nationwide -- --fixture --write-cache
```

Use fixture cache only when `FAMILY_EXPERIENCE_ALLOW_FIXTURE=true` and the output is explicitly labelled fixture/demo. The production cache lane is:

```bash
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source kto_tourapi
npm run qa:production-cache
cd ../..
docker build --pull --platform linux/amd64 -f Dockerfile -t <tag> .
```

Recovery for a stale, missing, or invalid production cache repeats that external lane and redeploys the new image. Do not attempt in-container mutation.

```bash
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source kto_tourapi
npm run qa:production-cache
npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed
cd ../..
docker build --pull --platform linux/amd64 -f Dockerfile -t <replacement-tag> .
```

Redeploy the replacement image through the host-specific flow below, then run
remote `/health` and `/mcp` smoke. The old container is not repaired in place.

Record cache refresh and stale-cache recovery evidence under `.omo/evidence/family-experience-market-ready-platform/`, using names such as `task-9-cache-refresh-live.txt`, `task-9-cache-stale-smoke.txt`, and `task-9-cache-health.json`. Run `npm run scan:secrets -- --include <evidence-path>` before sharing any generated ETL proof.

The cache contains normalized records, raw snapshot references, source metadata, and TTL metadata under `FAMILY_EXPERIENCE_ETL_CACHE_DIR`. Treat it as operational evidence, not as live nationwide completeness proof.

Production cache generation proof is KTO-key-dependent; serving the resulting image is not. Capture redacted output and require `ok=true`, `failures=0`, source-specific `records > 0`, `redaction_verified=true`, and a passing production-cache gate.

The following are non-production adapter diagnostics only. They must not be mixed into the production cache. In particular, the Seoul route stays excluded until an HTTPS transport is confirmed:

```bash
mkdir -p ../../.omo/evidence/family-experience-handoff
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source seoul
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source culture_portal | tee ../../.omo/evidence/family-experience-handoff/culture-portal-etl.json
```

National festival CSV fallback proof does not need `PUBLIC_DATA_STANDARD_SERVICE_KEY`:

```bash
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source national_festival
```

CSV fallback setup: download the public data portal standard dataset for national culture festivals, save it as `공공데이터-관련/전국문화축제표준데이터.csv`, and keep `NATIONAL_CULTURE_FESTIVAL_CSV_PATH` pointing to that path. If the file is absent, `national_festival` live mode needs both a confirmed endpoint and `PUBLIC_DATA_STANDARD_SERVICE_KEY`.

National festival live endpoint proof is intentionally separate. Run it only after an official live endpoint is confirmed and `NATIONAL_CULTURE_FESTIVAL_BASE_URL` plus `PUBLIC_DATA_STANDARD_SERVICE_KEY` are configured.

To verify production cache-backed MCP behavior, first write a KTO-only cache, run the production gate, then run the smoke against that cache. Do not generate a multi-source default cache.

```bash
node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --live --write-cache --cache-dir data/family-experience-cache --source kto_tourapi
npm run qa:production-cache
npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed | tee ../../.omo/evidence/family-experience-handoff/cache-smoke.json
node -e "const fs=require('node:fs'); const p='data/family-experience-cache/metadata.json'; console.log(JSON.parse(fs.readFileSync(p,'utf8')))"
```

Expected ETL cache smoke markers: `called=find_family_experiences`, `mode=live` for a live ETL cache, `candidate_count > 0`, no raw key, and `cache_dir=data/family-experience-cache`. If the cache was generated with `--fixture`, the expected mode is `fixture`; do not mix fixture-mode smoke with live proof claims. If `candidate_count=0`, rerun cache generation for a source/location/date combination that produced records in the ETL proof.

Coverage rules:

- Fixture results prove only local normalization and query behavior; they never prove the current production runtime.
- Current production coverage is proven only by the KTO cache, its `searchFestival2`/`detailIntro2` snapshots, and the production-cache gate.
- A missing KTO key blocks external cache regeneration, not serving a still-fresh gated bundle; operators must not imply nationwide completeness.
- Missing, expired, malformed, or mid-publish cache is a configuration failure. Regenerate and gate it externally, rebuild/redeploy the image, and rerun remote smoke before relying on cache-first MCP responses.
- The national festival standard source is lower-freshness fallback data and must not outrank fresher exact event sources by default.

## Container Deployment

The repository root contains the canonical `Dockerfile` for HTTPS hosting behind a platform ingress or load balancer.

Build from the repository root:

```bash
docker build --pull --platform linux/amd64 -f Dockerfile -t <tag> .
```

The image runs as the non-root `node` user and executes
`node dist/src/server.js` directly as PID 1 so `SIGTERM` reaches the server.
Both build stages pin the same verified `node:22-slim` multi-architecture digest.
To update that base, resolve a new official digest, change both `FROM` lines
together, and accept it only after `npm run qa:submission` rebuilds and passes
the container gate on `linux/amd64`.

Run the release-candidate image locally without provider secrets to smoke the bundled production cache:

```bash
docker run --rm -p 3349:3349 <tag>
```

The release-candidate image uses `FAMILY_EXPERIENCE_ALLOW_FIXTURE=false`, source set `kto_tourapi`, and the read-only bundled cache. Expose `/health` plus `/mcp` through HTTPS. Do not inject provider keys into the serving container or bake `.env` into the image.

For AGENTIC PLAYER 10 PlayMCP-in-KC deployment, `docs/HOST_REQUIREMENTS_SOT.md` is the canonical host SOT for the endpoint pattern, console-issued endpoint precedence, and current host-secret boundary.

PlayMCP-in-KC entry:

1. Open `https://playmcp.kakaocloud.io`.
2. Sign in with the Kakao account registered in PlayMCP.
3. Click `+ 새 MCP 서버 등록`.
4. Choose one deployment mode:

Git source build:

- Select `Git 소스 빌드`.
- Enter a PlayMCP-in-KC server name and description. These are host-console fields and are separate from the PlayMCP public MCP name/description in `docs/PLAYMCP_TEMP_REGISTRATION.md`.
- Enter the Git repository URL.
- Enter branch/ref. Use the deployed branch intentionally; do not assume `main` if the submission package lives on another branch.
- Enter Dockerfile path, usually `Dockerfile`.
- Enter PAT only for a private repository. Do not paste PATs into docs, screenshots, or evidence.
- Confirm the repository path contains a Dockerfile at the selected path.

Container image registration:

- Select `이미지 등록`.
- Build/push a `linux/amd64` image. The Notion guide warns that `arm64` images can fail activation.
- Enter registry host, for example `docker.io` or `ghcr.io`.
- Enter registry user/password only for a private registry or private image. Do not paste registry credentials into docs, screenshots, or evidence.
- Enter `image_name` and `image_tag`.

For both modes:

- Click `등록하기`.
- Wait while status is `Starting`; the Notion guide says this can take from tens of seconds to minutes.
- Continue only when status becomes `Active`.
- Open the server detail view and copy the issued Endpoint URL.
- PlayMCP-in-KC allows up to two MCP servers per account in this guide. Delete old temporary servers only after confirming they are not needed; deletion cannot be reversed.
- If the MCP is updated after contest entry, the Notion guide says to delete the existing PlayMCP-in-KC server, create a new server with the same MCP server name, then return to PlayMCP, run `정보 불러오기`, and request review again.

Before proceeding to PlayMCP `정보 불러오기`, confirm the deployed server still matches `docs/HOST_REQUIREMENTS_SOT.md`: Streamable HTTP remote `/mcp`, no `kakao` in MCP/tool names, one narrow public tool, required tool metadata/annotations, response size under review limits, and p99 within the beta SLO.

## PlayMCP Temporary Entry

1. Open the PlayMCP web console, sign in with a Kakao account that has developer console access, and create or open the form for a new MCP server. Use the official AGENTIC PLAYER / PlayMCP guide as the source for the console URL if the bookmark is unavailable.
2. Use `docs/PLAYMCP_TEMP_REGISTRATION.md` as the canonical copy source for the service name, identifier, description, auth choice, response visibility, starter messages, and endpoint rule. Do not duplicate those field values in this runbook.
3. Deploy a temporary HTTPS server, then set the PlayMCP endpoint to that deployed URL ending in `/mcp`. For AGENTIC PLAYER 10, use the KakaoCloud PlayMCP-in-KC endpoint described in `docs/HOST_REQUIREMENTS_SOT.md`.
4. Choose no-auth for private validation. Provider keys must never be pasted into PlayMCP; the production runtime uses only the gated bundled cache.
5. Ensure the deployed runtime reports the bundled KTO cache as `fresh` at `/health`.
6. Keep response visibility private/operator-only for this handoff.
7. If the console requires a representative image before saving, use the candidate and rights/provenance boundary in `docs/DEMO_PACK.md`. Do not upload third-party event posters, logos, real child faces, screenshots with private data, or generated images that imply official endorsement.
8. Save for temporary testing and stop.

Post-save check:

- Tool discovery shows exactly `find_family_experiences`.
- Starter messages run without raw secrets, keyed URLs, or unsupported claims.
- The entry remains private/operator-only.
- No review request, public visibility switch, representative image upload, or contest submission is performed by this step. When final-ready, the organizer flow is `정보 불러오기` followed by `등록 및 심사 요청`; that action must be recorded separately.

## Response Visibility

The current package is not a public-release package. Temporary/private visibility lets the operator inspect tool discovery, starter messages, and response shape before any later gate.

## Copy And Claim Guardrails

- Keep fixture/demo labeling visible only when fixture mode is intentionally used; private production smoke must identify the KTO static-cache boundary.
- Do not promise nationwide coverage, live freshness, reservation status, current opening status, or child suitability without source support.
- Distinguish official-source candidate/cache coverage from current key-backed live proof.
- Do not write that a release, public switch, contest entry, or final review action has happened.
- Do not include raw secrets or keyed URLs in docs, console notes, screenshots, or evidence.
- Representative image candidate and rights/provenance boundary are maintained in `docs/DEMO_PACK.md`. Do not treat candidate selection as upload or rights approval.

## Rollback

If tool discovery or starter-message smoke fails:

1. Keep the PlayMCP entry private.
2. Confirm the endpoint ends in `/mcp`.
3. Run `npm run verify`, `npm run scan:secrets`, `npm run scan:sources`, and `npm run scan:claims`.
4. If the failure mentions a missing, malformed, or stale cache, regenerate and gate the KTO cache externally, rebuild/redeploy the image, and rerun remote smoke.
5. Inspect server logs for redacted configuration only.
6. If a raw key or keyed URL was exposed, rotate the affected provider key before retrying.

### Bad Cache Rollback Drill

Use this when `/health.cache.status` is `stale_servable`, `expired`, `missing`, `invalid`, or stuck at `refreshing`, or when MCP smoke reports a cache read failure. `stale_servable` buys bounded continuity but does not cancel the refresh incident.

| Step | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| 1 | `curl -fsS "$DEPLOY_BASE_URL/health" | tee "$EVIDENCE_DIR/task-15-bad-cache-health-before.json"` | Cache status shows the bad state without raw secrets. | `$EVIDENCE_DIR/task-15-bad-cache-health-before.json` |
| 2 | Outside the serving container, regenerate with `--source kto_tourapi`, run `npm run qa:production-cache`, rebuild the root-context image, and redeploy it. | A new gated static cache is present in the replacement image; no in-container mutation occurs. | `$EVIDENCE_DIR/task-15-bad-cache-refresh.txt` |
| 3 | `MCP_ENDPOINT="$MCP_ENDPOINT" npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed | tee "../../$EVIDENCE_DIR/task-15-bad-cache-mcp-after.txt"` | MCP smoke exits 0 and calls `find_family_experiences`. | `$EVIDENCE_DIR/task-15-bad-cache-mcp-after.txt` |
| 4 | `curl -fsS "$DEPLOY_BASE_URL/health" | tee "../../$EVIDENCE_DIR/task-15-bad-cache-health-after.json"` | Cache status returns to `fresh`; cache age is below the SLO threshold in `docs/SLO.md`. | `$EVIDENCE_DIR/task-15-bad-cache-health-after.json` |

Do not broaden public copy until the after-state evidence exists and the cache freshness SLO is back inside target.

### Exposed Key Incident Drill

Use this for any raw key, keyed URL, bearer token, or provider credential found in docs, logs, screenshots, console fields, evidence, or public copy.

| Step | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| 1 | Stop sharing the affected artifact; keep PlayMCP private/operator-only. | Exposure is contained before retrying deployment or `정보 불러오기`. | `$EVIDENCE_DIR/task-15-exposed-key-containment.md` |
| 2 | Redact or remove the artifact, then run `npm run scan:secrets -- --include <redacted-evidence-path>`. | Scanner exits 0 for the redacted artifact. | `$EVIDENCE_DIR/task-15-exposed-key-specific-scan.txt` |
| 3 | Rotate the affected provider key in the official provider portal; update only the external ETL `.env`. | The new key is available only to cache generation. No raw key is written to the image, docs, or evidence. | `$EVIDENCE_DIR/task-15-key-rotation.md` |
| 4 | `npm run scan:secrets && npm run scan:sources && npm run scan:claims` | Full gates exit 0 before retry. | `$EVIDENCE_DIR/task-15-exposed-key-full-gates.txt` |
| 5 | Regenerate/gate the KTO cache, rebuild/redeploy, then rerun remote `/health`, remote `/mcp`, and PlayMCP `정보 불러오기`. | The endpoint works from a replacement image with no runtime secret; no public/review claim is made. | `$EVIDENCE_DIR/task-15-exposed-key-retry.txt` |

This is a SEV1 under `docs/SLO.md`; close it only after rotation, scans, and a clean retry are recorded.

### Provider Outage Response Drill

Use this when ETL proof or `/health.cache.source_health.failure_codes` shows provider quota exhaustion, repeated source failure, or provider outage.

| Step | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| 1 | `curl -fsS "$DEPLOY_BASE_URL/health" | tee "$EVIDENCE_DIR/task-15-provider-outage-health.json"` | Failed source and failure code are visible without raw keyed URLs. | `$EVIDENCE_DIR/task-15-provider-outage-health.json` |
| 2 | From `apps/family-experience-mcp`: `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source kto_tourapi` | The KTO failure is source-scoped and redacted. | `$EVIDENCE_DIR/task-15-provider-outage-etl.txt` |
| 3 | Hold deployment while KTO is unavailable. A different registered source requires an explicit production source-set decision and a new gated cache; it is not an automatic fallback. | No unapproved source-set drift reaches the image. | `$EVIDENCE_DIR/task-15-provider-outage-fallback-source.txt` |
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

### ETL Key Rotation Drill

Use this after any exposed-key incident or on the operator's scheduled KTO ETL-key rotation cadence. The key belongs only in the external cache-generation environment and is never image-baked or injected into the serving container.

| Step | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| 1 | Create or rotate the provider key in the official provider portal. | Provider portal issues a replacement key; do not copy the raw value into evidence. | `$EVIDENCE_DIR/task-15-key-rotation.md` |
| 2 | Update only `.env` in the external ETL environment. | No serving-runtime configuration changes and no raw key is written to docs or evidence. | `$EVIDENCE_DIR/task-15-key-rotation-config.md` |
| 3 | Regenerate the KTO cache, run the production gate, rebuild/redeploy the image, then run remote `/health` plus remote `/mcp` smoke. | The replacement static cache is fresh and MCP smoke exits 0. | `$EVIDENCE_DIR/task-15-key-rotation-smoke.txt` |
| 4 | `npm run scan:secrets` and `npm run scan:secrets -- --include <rotation-evidence-path>` | No raw old or new key remains in docs, logs, or evidence. | `$EVIDENCE_DIR/task-15-key-rotation-secret-scans.txt` |

### Post-Deployment Monitoring Drill

Use this only after the operator has actually deployed a beta endpoint. It is an SLO monitoring loop, not proof that review, public switch, or contest submission is complete.

| Interval | Invocation | Expected output | Evidence path |
| --- | --- | --- | --- |
| Every 15 minutes during private smoke | `curl -fsS "$DEPLOY_BASE_URL/health"` | HTTP 200; cache is `fresh` unless an incident is open. | `$EVIDENCE_DIR/task-15-post-release-health-<timestamp>.json` |
| After deploy or cache changes | `MCP_ENDPOINT="$MCP_ENDPOINT" npm run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed` | Tool call succeeds for `find_family_experiences`; no raw secrets. | `$EVIDENCE_DIR/task-15-post-release-mcp-<timestamp>.txt` |
| Every 30 minutes during beta smoke | `grep '"event":"tool_call"' <log> | jq -s 'map(.latency_ms) | sort | .[(length*0.95|floor)]'` | P95 remains under the beta SLO target in `docs/SLO.md`. | `$EVIDENCE_DIR/task-15-post-release-p95-<timestamp>.txt` |
| Before a replacement image build | `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source kto_tourapi` | Current redacted KTO ETL proof exists before the external cache-generation lane. | `$EVIDENCE_DIR/task-15-post-release-etl-kto-<date>.txt` |
| Before handoff or PlayMCP information load | `npm run scan:secrets && npm run scan:sources && npm run scan:claims` | All gates exit 0. | `$EVIDENCE_DIR/task-15-post-release-gates-<timestamp>.txt` |

If any interval fails, classify severity with `docs/SLO.md`, open the matching drill above, and record the incident before retrying deployment, `정보 불러오기`, review request, public visibility, or contest submission.
