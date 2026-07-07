# family-experience external blockers resolution

Date: 2026-07-04

## Problem Definition
- Goal: remove the remaining external blockers for `apps/family-experience-mcp` nationwide live proof, file-ingest proof, and container proof.
- Context: local MVP, fixture ETL, MCP smoke, scans, and Seoul live proof have passed. The remaining blockers are external keys and Docker daemon availability.
- Constraints:
  - Do not put provider keys in git, docs, screenshots, logs, or evidence.
  - Keep `.env` local and ignored.
  - Keep provider live proofs source-by-source and redacted.
  - Do not claim nationwide live completeness until all relevant live proofs pass.
- Success criteria:
  - `CULTURE_PORTAL_SERVICE_KEY` and `KTO_TOURAPI_SERVICE_KEY` are present in `apps/family-experience-mcp/.env`.
  - `전국문화축제표준데이터` is handled as a downloaded official standard-data file, not as an assumed key-backed live API.
  - A local file-ingest path exists for the downloaded CSV/XLS/JSON standard-data export.
  - One-page live ETL proof passes for each configured source.
  - Docker build proof passes or an approved public HTTPS deployment path provides an equivalent container/runtime proof.
- Done when:
  - Missing-key blocker files for Culture Portal and KTO are superseded by fresh redacted live-proof artifacts.
  - The national festival blocker is superseded by a file-ingest proof artifact using an official downloaded export.
  - Docker build artifact shows success, or deployment proof documents why Docker is not needed for the chosen host.

## Evidence Brief
### Authoritative source map
| Blocker | Official route | Local env target | Proof command |
| --- | --- | --- | --- |
| Culture Portal key | Public Data Portal: `https://www.data.go.kr/data/15138937/openapi.do` | `CULTURE_PORTAL_SERVICE_KEY` | `npm run etl:nationwide -- --source culture_portal --live --max-pages 1` |
| KTO TourAPI key | Public Data Portal: `https://www.data.go.kr/data/15101578/openapi.do` | `KTO_TOURAPI_SERVICE_KEY` | `npm run etl:nationwide -- --source kto_tourapi --live --max-pages 1` |
| National festival standard file | Public Data Portal: `https://www.data.go.kr/data/15013104/standard.do` | local downloaded CSV/XLS/JSON path, for example `NATIONAL_CULTURE_FESTIVAL_FILE_PATH` after implementation | file-ingest ETL proof, not key-backed live proof |
| Docker daemon | Docker Desktop on Windows, WSL 2 backend/integration | local Docker runtime | `docker build -t family-experience-mcp:local .` |

### Verified facts
- `.env.example` already contains the three missing key names and cache/runtime variables.
- Existing evidence shows `SEOUL_OPEN_DATA_KEY` was present in `.env` and Seoul live smoke passed.
- Existing evidence shows Culture Portal, KTO, and a previously assumed public-data standard key were absent from both process env and `.env`.
- Current source review shows the national festival standard dataset assumption must be corrected: treat it as official standard-data export/download unless a current official OpenAPI contract is separately confirmed.
- Docker CLI exists, but the Docker Desktop Linux engine pipe is unavailable.

### Inferences
- The fastest path is not another code wave. It is operator credential acquisition, local `.env` update, then targeted proof rerun.
- Docker is a runtime-environment blocker. If the final deployment platform builds from source without local Docker, Docker build proof can be replaced by platform build/deploy proof, but the current plan asked for Docker proof.

### Unknowns
- Whether the Public Data Portal applications will be auto-approved immediately for Culture Portal and KTO.
- Which downloaded format is most stable for the national festival standard data in this project: CSV, XLS, JSON, or XML.
- Whether the user's Docker Desktop is installed but stopped, installed without WSL 2 backend, or absent.

## Method Selection
### Candidate methods
1. Add more fallback fixture logic.
   - Rejected: does not solve live proof or submission credibility.
2. Apply for official API keys for API-backed sources and use file ingest for the standard dataset.
   - Chosen: smallest path that converts blockers into evidence without inventing an unverified API contract.
3. Scrape public event pages while waiting for keys.
   - Rejected: violates project source guardrails.
4. Skip Docker and submit local-only proof.
   - Rejected as default; acceptable only if the chosen HTTPS host does not require Docker and has platform build proof.

### Chosen method
- Credential/file-first, proof-second:
  1. Obtain/enable Culture Portal and KTO keys through official portals.
  2. Put API secrets only in `apps/family-experience-mcp/.env`.
  3. Download the national festival standard-data export from the official page and store it as an ignored local data input.
  4. Run source-specific live proofs for API-backed sources and file-ingest proof for national festival.
  5. Refresh full local verification.
  6. Restore Docker daemon or produce equivalent deployment proof.

### Fallback method
- If a provider key is delayed, keep that API-backed source as candidate/cache-backed, leave the blocker artifact explicit, and proceed only with sources whose current live/file proof passed.

## Execution Plan
### Baseline
- Current local proof is green except three missing keys and Docker daemon.

### Controllable variables
- Which API keys are present.
- Which national festival export file is present.
- `FAMILY_EXPERIENCE_ETL_MAX_PAGES`.
- Docker Desktop engine state.
- Whether deployment uses local Docker, platform buildpacks, or remote container build.

### Fixed variables
- Official-source-only ingestion.
- Redacted diagnostics.
- Cache-first MCP query path.
- No raw secret output.

### Budget ladder
1. 10 minutes: add issued API keys to `.env`, do name-only presence check.
2. 10 minutes: place the downloaded national festival export in an ignored local data path.
3. 15 minutes/source: run one-page live proof for API sources or file-ingest proof for national festival.
3. 10 minutes: rerun scans and `npm run verify`.
4. 15-30 minutes: start Docker Desktop and verify WSL 2 integration.
5. 30-60 minutes: if local Docker remains blocked, use platform/remote build proof instead.

### Promotion rule
- Promote Culture Portal and KTO from candidate/cache-backed to live-proven only after current-session live commands succeed with redacted output.
- Promote national festival from fixture-only to file-proven only after an official downloaded export is parsed and cached with a recorded source page/download timestamp.

### Kill rule
- Stop using any source in live mode if diagnostics leak a key, the endpoint requires scraping, or response fields cannot support date/place/source attribution.
- Stop treating national festival as key-backed live API unless a current official OpenAPI contract is confirmed and documented.

### Stop rule
- Stop once all API-backed keys have live proofs, national festival has file-ingest proof, and either Docker build or equivalent HTTPS deployment build proof passes.

### Final evaluation rule
- Run from `apps/family-experience-mcp`:
  - `npm run verify`
  - `npm run etl:nationwide -- --fixture --dry-run`
  - `npm run smoke:mcp`
  - `npm run scan:secrets`
  - `npm run scan:claims`
  - `npm run scan:sources`
  - source-specific live ETL commands for every present API key
  - national festival file-ingest ETL command after implementation

### Resource estimate
- Wall-clock: 1-3 hours if keys are auto-approved and Docker Desktop only needs restart; longer if public-data approval is delayed.
- RAM: normal Node test/runtime memory; Docker Desktop may need several GB available.
- CPU/GPU/NPU: CPU only.
- Reboot-required resources: possible if WSL/Docker Desktop engine repair requires it.

## Operator Checklist
- Apply for/enable Culture Portal one-view service and put the issued value in `.env` as `CULTURE_PORTAL_SERVICE_KEY`.
- Apply for/enable KTO TourAPI GW service and put the issued value in `.env` as `KTO_TOURAPI_SERVICE_KEY`.
- Download the national culture festival standard-data export from the official page. Prefer CSV for simple ETL if column names are preserved; keep the file out of git unless a small fixture sample is intentionally committed.
- Remove `PUBLIC_DATA_STANDARD_SERVICE_KEY` and `NATIONAL_CULTURE_FESTIVAL_BASE_URL` from the blocker list unless a current official API contract is separately confirmed.
- Run `npm run scan:secrets` before sharing logs or committing.
- Start Docker Desktop, confirm Linux container mode, confirm WSL 2 integration, then rerun Docker build.
- Keep the existing dirty worktree untouched until the user explicitly asks for commit/push.
