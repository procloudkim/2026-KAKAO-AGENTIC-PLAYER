# National Culture Festival Standard Data Recheck

Date: 2026-07-04

## Problem Definition
- Goal: correct the data-pipeline assumption for `전국문화축제표준데이터`.
- Context: the previous nationwide ETL blocker list treated the source as if it required `PUBLIC_DATA_STANDARD_SERVICE_KEY` and `NATIONAL_CULTURE_FESTIVAL_BASE_URL`.
- Constraints: use official-source evidence first; do not invent key-backed live API contracts.
- Success criteria: classify the source correctly and update the next implementation path.
- Done-when: the source is treated as file/download ingest unless a current official OpenAPI contract is separately verified.

## Evidence Brief
### Authoritative source map
- Public Data Portal standard-data page: `https://www.data.go.kr/data/15013104/standard.do`
- Related standard-data source for broader event coverage: `https://www.data.go.kr/data/15013106/standard.do`
- MCST regional festival file data: `https://www.data.go.kr/data/15143175/fileData.do`

### Verified facts
- The official `전국문화축제표준데이터` page lists many local government file-data providers and provides downloads in XLS, XML, JSON, RDF, and CSV formats.
- The page warns that individual institution datasets are merged monthly into nationwide data, so timing lag can exist.
- The page states file download is PC-version only.
- A visible Open API tab exists on the standard-data page, but the current evidence does not establish a stable modern `PUBLIC_DATA_STANDARD_SERVICE_KEY` + base URL contract for this project.
- The local implementation currently assumes a service-key request builder for national festival standard data.

### Inferences
- The safest competition-grade ingestion method is file ingest from the official downloaded export.
- National festival should remain lower-freshness fallback data.
- `PUBLIC_DATA_STANDARD_SERVICE_KEY` should not be a submission blocker unless a current official API endpoint contract is separately confirmed.

### Unknowns
- Which export format is operationally easiest after manual download in the user's environment.
- Whether the standard-data Open API tab exposes a currently supported endpoint behind the logged-in portal for this exact dataset.

## Method Selection
### Candidate methods
1. Keep the existing key-backed API assumption.
   - Rejected: insufficient current official evidence.
2. Treat the dataset as manual/semiautomated official file ingest.
   - Chosen: aligns with visible official CSV/XLS/XML/JSON download flow.
3. Drop the dataset entirely.
   - Rejected: it is still useful as fallback coverage if freshness is labeled.
4. Scrape the portal grid.
   - Rejected: violates official-source/no-scraper guardrails.

## Execution Plan
- Baseline: existing adapter parses normalized standard rows from test payloads but assumes a live service key for operational fetch.
- Controllable variables: input file format, local input path, refresh cadence.
- Fixed variables: official source attribution, lower freshness rank, no booking/open/safety claims.
- Budget ladder:
  1. Add file-path config and parser for downloaded CSV/JSON fixture.
  2. Replace missing-key failure with missing-file failure for `national_festival`.
  3. Keep fixture tests and add file-ingest tests.
  4. Update runbook, decisions, `.env.example`, scanner allowlist, and external blocker plan.
- Promotion rule: file-proven only after a downloaded official export is parsed and cached.
- Kill rule: stop if the source requires browser scraping or the downloaded columns lack date/place/source fields.
- Stop rule: ETL cache contains national festival fallback records from an official file input.
- Final evaluation rule: `npm run verify`, scans, fixture ETL, and file-ingest proof pass.
- Wall-clock estimate: 1-2 hours for local parser/config/docs once a sample export is available.
- RAM estimate: <1 GB for CSV/JSON file ingest.
- CPU/GPU/NPU role split: CPU only.
- Reboot-required resources: none.
