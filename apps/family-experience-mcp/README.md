# Family Experience MCP

`아이랑 어디가` is a cache-first MCP server for recommending up to three source-grounded family experience candidates.

## Tool

```text
find_family_experiences
```

The tool accepts child age, date or date window, region, indoor/outdoor preference, and optional interests or constraints. It returns compact candidates with source, age-fit basis, warnings, parent confirmation, and next action.

## Local Setup

```bash
npm install
npm run verify
npm run scan:secrets
npm run scan:sources
npm run scan:claims
```

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

Copy `.env.example` to `.env` only for local live-source proof. Do not commit `.env`.

Required only for the matching live provider:

```text
SEOUL_OPEN_DATA_KEY
CULTURE_PORTAL_SERVICE_KEY
KTO_TOURAPI_SERVICE_KEY
```

Optional for confirmed standard-data live endpoint mode:

```text
PUBLIC_DATA_STANDARD_SERVICE_KEY
```

The national culture festival source currently supports local CSV/cache fallback.

## Docker / PlayMCP in KC

Use the repository-root `Dockerfile` for PlayMCP in KC Git source builds.

When registering in PlayMCP in KC:

```text
Dockerfile path: Dockerfile
container_port: 3349
```

The container listens on `PORT`, defaulting to `3349`, and sets `HOST=0.0.0.0`.

Local root-context build:

```bash
docker build -f Dockerfile .
```

## Canonical Docs

- Product PRD: `docs/PRODUCT_PRD_SOT.md`
- Source ledger: `docs/SOURCE_LEDGER.md`
- Current QA state: `docs/QA_REPORT.md`
- Host requirements: `docs/HOST_REQUIREMENTS_SOT.md`
- Operator runbook: `docs/RUNBOOK.md`
- Temporary PlayMCP fields: `docs/PLAYMCP_TEMP_REGISTRATION.md`
