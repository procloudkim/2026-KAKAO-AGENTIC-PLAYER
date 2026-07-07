# Three MCP Idea Branches Evidence Brief

Date: 2026-07-01 KST
Mode: OML context-map -> bootstrap
Scope: Kakao AGENTIC PLAYER 10 participation strategy

## Problem Definition

- Goal: Turn three personal-use ideas into parallel MCP concept branches that can be compared, narrowed, and built toward PlayMCP review.
- Context: The hackathon favors a PlayMCP/Kakao Tools service with clear tool boundaries, stable results, and immediately useful chat output. Current practical review target is 2026-07-07 because PlayMCP review may take up to 7 business days.
- Constraints:
  - Submission is once-only after PlayMCP review and public visibility change.
  - Data rights, source freshness, security, and non-overclaiming matter because the official criteria include stability, accurate data, and no security issue.
  - Current hackathon repo is mostly empty except `HTML.txt` and ULW research outputs.
  - `D:\KLab\workspace\2026-휴일약국` has useful pharmacy product/data assets but is currently a dirty worktree.
  - `D:\KLab\workspace\2026-06-07-harness` has reusable parent safety decision-support assets and is clean on `main`.
- Success criteria:
  - Each concept has a target user, winning chat interaction, 1-3 MCP tools, data-source plan, failure behavior, and kill rule.
  - One concept can be selected for the first PlayMCP temporary-registration MVP.
  - No concept depends on unverified scraping, unsafe claims, or hidden credentials.
- Done-when for this phase:
  - Three branch plans exist in repo artifacts.
  - One recommended primary branch and one fallback are explicit.
  - The next implementation task can start without another broad ideation pass.

## Source Hierarchy

1. Official hackathon page dump: `HTML.txt`.
2. Current ULW synthesis: `.omo/ulw-research/20260701-192912/SYNTHESIS.md`.
3. Repo-local source-of-truth docs:
   - Pharmacy: `D:\KLab\workspace\2026-휴일약국\AGENTS.md`, `docs/PRD.md`, `docs/llm-wiki/data-pipeline.md`.
   - Baby safety: `D:\KLab\workspace\2026-06-07-harness\AGENTS.md`, `README.md`, plugin `SKILL.md` files.
4. Official public data/API pages verified in this session:
   - NMC pharmacy OpenAPI: https://www.data.go.kr/data/15000576/openapi.do
   - KATS/SafetyKorea product safety certification and recall info: https://www.data.go.kr/data/15116894/openapi.do
   - Korea TourAPI/KTO Korean tourism info: https://www.data.go.kr/data/15101578/openapi.do
   - Seoul cultural events: https://data.seoul.go.kr/dataList/OA-15486/S/1/datasetView.do
   - National cultural festival standard data: https://www.data.go.kr/data/15013104/standard.do
   - Culture arts education resource/program API: https://www.data.go.kr/data/15140200/openapi.do
   - Korea Forest Service forest education programs: https://data.go.kr/data/15158973/openapi.do

## Verified Facts

- The hackathon page requires a PlayMCP server registration flow, review request, public visibility switch, and one-time preliminary submission. Source: `HTML.txt` and `SYNTHESIS.md`.
- The official judging criteria are creativity, convenience, and stability; stability includes accurate data and no security issue. Source: `HTML.txt` and `SYNTHESIS.md`.
- The pharmacy repo already implements a mobile-first holiday/night pharmacy finder with NMC as primary source, HIRA as cross-check only, server-side keys, conservative availability labels, and local medallion ETL. Source: `D:\KLab\workspace\2026-휴일약국\AGENTS.md`, `docs/PRD.md`, `docs/llm-wiki/data-pipeline.md`.
- NMC pharmacy OpenAPI is REST/XML, free, real-time-updated, and exposes list lookup parameters including `Q0`, `Q1`, `QT`, `QN`, `ORD`, `pageNo`, and `numOfRows`. Verified from the official data.go.kr page on 2026-07-01.
- The baby safety repo is a Codex plugin, not an MCP server. Its strongest reusable asset is the evidence workflow: product identity intake, trust ledger, official source lanes, evidence completeness, and parent action card. Source: `D:\KLab\workspace\2026-06-07-harness\README.md` and plugin `SKILL.md`.
- KATS/SafetyKorea product safety certification and recall info is available as a JSON/XML official linked OpenAPI and covers product names, models, certifications, recall reasons/actions, and announcement dates. Verified from data.go.kr on 2026-07-01.
- Korea TourAPI provides official Korean tourism information including area codes, location-based tourism info, keyword search, event info, images, and related tourism datasets. Verified from data.go.kr on 2026-07-01.
- Seoul cultural event data includes category, district, event title, venue, date, target audience, fee, program, homepage, contact, coordinates, start/end date, free/paid status, and event time; update cycle is daily. Verified from Seoul Open Data Plaza on 2026-07-01.
- National cultural festival standard data includes festival name, place, start/end dates, content, organizers, contacts, homepage, address, and coordinates; update cycle is quarterly. Verified from data.go.kr on 2026-07-01.

## Inferences

- The most Kakao-native value is not "more data"; it is a short chat result that removes a parent decision burden: top 3 choices, why those 3, what to check, and one immediate next action.
- All three ideas can share one architecture: source adapters -> raw evidence snapshot -> normalized candidate records -> confidence/provenance layer -> MCP response card.
- The family experience concept likely has the best public-vote appeal and lowest harm risk because wrong results are less safety-critical than pharmacy availability or infant product safety.
- The pharmacy concept is closest to existing implementation but carries higher risk because availability must not be overstated.
- The baby safety concept is differentiated and personally useful, but it requires very careful wording and source-lane boundaries to avoid unsupported safety or medical claims.

## Unknowns

- Whether the official PlayMCP guide contains stricter MCP requirements not visible in `HTML.txt`.
- Whether Kakao Cloud contest MCP server provisioning is already available in the user's account.
- Which idea the user personally needs first this week.
- Whether required public API keys are already available: data.go.kr service keys, Kakao REST API key, Seoul Open API key, TourAPI key, SafetyKorea access policy.
- Whether family event data has enough age/stage granularity outside Seoul and major institutions.

## Risks

- Deadline: any branch that cannot reach temporary PlayMCP test by 2026-07-06 should not be the first submission candidate.
- Data rights: broad crawling of event pages or product pages must be deferred until robots/terms/source policy is recorded.
- Safety: pharmacy and baby-product outputs must never imply certainty beyond source evidence.
- UX: a concept fails the hackathon shape if it returns a long report instead of a short, action-ready answer.
- Operations: nationwide crawling or scheduled ETL is not needed for preliminary review and can waste the build window.

## OML Context Map

### Top-Down Claims

- EXTRACTED: The contest rewards useful, stable MCP services, not generic chatbots.
- EXTRACTED: Pharmacy repo product goal is fast Top 3 pharmacy candidates with phone/navigation handoff and conservative status labels.
- EXTRACTED: Baby safety repo goal is parent decision support with evidence lanes and no unsupported danger/safety claims.
- INFERRED: Family experiences should use a "parent can decide in 30 seconds" interaction rather than a travel-search interface.
- AMBIGUOUS: The final project may be a new repo or adapted from one of the existing repos.

### Bottom-Up Claims

- Repeated nouns across sources: parent, child, evidence, trust, Top 3, phone, location, public data, source lane, confidence, action card.
- File hubs:
  - Hackathon: `.omo/ulw-research/20260701-192912/SYNTHESIS.md`.
  - Pharmacy: `docs/PRD.md`, `docs/llm-wiki/data-pipeline.md`, `web/src/server/etl`.
  - Baby safety: plugin `SKILL.md`, `docs/AUTHORITY_SOURCE_MAP.md`, templates and examples.
- Contradiction: "data pipeline" suggests large ingestion, but hackathon timing favors a narrow live/API plus cache MVP.
- AGENTS need: current repo needs a concept-branch collaboration contract before actual git branches or implementation.

