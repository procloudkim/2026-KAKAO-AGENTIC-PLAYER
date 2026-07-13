# Family Experience MCP

`아이랑 어디가` is a cache-first MCP server for recommending up to three source-grounded family experience candidates.

## Tool

```text
find_family_experiences
```

Every request must provide a location, a date or date range, and exactly one child selector (`child_age` or `child_stage`). Indoor/outdoor preference, interests, and other constraints are optional. The server never invents a location/date default and never widens the requested date range. Missing or conflicting required fields return typed `invalid_input` with exact `missing_fields` and zero source access. Valid requests return compact candidates with source, age-fit basis, warnings, parent confirmation, and next action.

## Local Setup

```bash
npm install
npm run verify
npm run scan:secrets
npm run scan:sources
npm run scan:claims
```

Production build and start:

```bash
npm run build
npm run start
```

`npm run start` executes the compiled `dist/src/server.js`; `dev:http` is development-only.

Fixture-mode local HTTP:

```bash
FAMILY_EXPERIENCE_ALLOW_FIXTURE=true PORT=3349 npm run dev:http
```

Health check:

```bash
curl -i http://127.0.0.1:3349/health
```

MCP smoke:

```bash
npm run smoke:mcp
```

## Environment

The production runtime uses the bundled `data/family-experience-cache` with
`FAMILY_EXPERIENCE_SOURCE_SET=kto_tourapi`. It does not call providers or refresh
the cache while serving chat requests. Generate a fresh KTO cache outside the
runtime, run the production-cache gate, then rebuild and redeploy the image. The
serving container therefore needs no provider key.

Copy `.env.example` to `.env` only for external live-source proof or cache
generation. Do not commit `.env`. The production KTO refresh lane requires:

```text
KTO_TOURAPI_SERVICE_KEY
```

The KTO adapter reads festival listings from `searchFestival2` and enriches
them from `detailIntro2`. An age claim is source-stated only when
`detailIntro2` returns a parseable age limit; otherwise age remains unknown.

The following keys are for registered adapter proof only and are not part of
the current production source set:

```text
SEOUL_OPEN_DATA_KEY
CULTURE_PORTAL_SERVICE_KEY
```

Optional for confirmed standard-data live endpoint mode:

```text
PUBLIC_DATA_STANDARD_SERVICE_KEY
```

The national culture festival source currently supports local CSV/cache fallback.
Seoul Open Data remains outside the production path until its HTTPS transport is
confirmed; production does not weaken the HTTPS-only source policy.

## Docker / PlayMCP in KC

Use the repository-root `Dockerfile` for PlayMCP in KC Git source builds.

When registering in PlayMCP in KC:

```text
Dockerfile path: Dockerfile
container_port: 3349
```

The container listens on `PORT`, defaulting to `3349`, and sets `HOST=0.0.0.0`.
It exposes readiness at `/health` and Streamable HTTP MCP at `/mcp`.

The default cache TTL is 24 hours. Provider-specific refresh cadence can be shorter or longer according to `docs/SOURCE_LEDGER.md`, but it does not change the runtime's fail-closed 24-hour default unless an operator explicitly configures the matching refresh schedule.

Public `/health`, MCP errors, and logs expose only bounded status/codes. They do not expose filesystem paths, provider URLs, commands, keys, stack traces, or deployment topology.

Local root-context build:

```bash
docker build --pull --platform linux/amd64 -f Dockerfile -t <tag> .
```

Run that command from the repository root. The container runs as the non-root
`node` user with `node dist/src/server.js` as PID 1; there is no npm wrapper in
the shutdown path.

## Canonical Docs

- Product PRD: `docs/PRODUCT_PRD_SOT.md`
- Source ledger: `docs/SOURCE_LEDGER.md`
- Current QA state: `docs/QA_REPORT.md`
- Host requirements: `docs/HOST_REQUIREMENTS_SOT.md`
- Operator runbook: `docs/RUNBOOK.md`
- Temporary PlayMCP fields: `docs/PLAYMCP_TEMP_REGISTRATION.md`
