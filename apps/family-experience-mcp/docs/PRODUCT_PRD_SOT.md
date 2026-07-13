# Product PRD SOT

Purpose: canonical product requirements for `아이랑 어디가` / Family Experience MCP. This document owns the product promise, users, scope, output contract, data policy, and success criteria.

This document does not own KakaoCloud deployment rules, PlayMCP review rules, MCP protocol constraints, current verification status, or data-source proof. See the canonical references below.

## Canonical References

| Truth | Canonical home |
| --- | --- |
| Product PRD and user value | This document |
| Kakao / PlayMCP / MCP protocol / deployment requirements | `docs/HOST_REQUIREMENTS_SOT.md` |
| Current verification and launch state | `docs/QA_REPORT.md` |
| Data source inventory and coverage tiers | `docs/SOURCE_LEDGER.md` |
| Product and claim decisions | `docs/DECISIONS.md` |
| PlayMCP console field values | `docs/PLAYMCP_TEMP_REGISTRATION.md` |
| Operator execution steps | `docs/RUNBOOK.md` |
| Kakao / PlayMCP extracted guide corpus index | `docs/KAKAO_PLAYMCP_GUIDE_SOT.md` |

## Product Summary

`아이랑 어디가` helps caregivers find a small, source-grounded set of family experience candidates for a child by age, date, and region. Optional practical constraints remain warnings or unknowns unless the production source supports them.

The product is not a complete event search engine. It is bounded parent decision support: it narrows the search, shows source and caveat evidence, and tells the caregiver what to confirm before visiting.

## Target Users

| Persona | Job to be done | Product response |
| --- | --- | --- |
| Parent or guardian | Find a realistic place to go with a child under time and weather constraints. | Return up to three candidates with date, place, age-fit basis, caveats, parent checklist, and next action. |
| Gift-giver or relative | Suggest a child-friendly outing without knowing every venue rule. | Return conservative candidates and clearly state what must be confirmed by the parent. |
| Grandparent / babysitter / helper | Choose a manageable activity for the child they are caring for. | Emphasize venue, schedule, fee, age basis, and source confirmation over novelty. |
| New caregiver / first-time parent | Reduce uncertainty from scattered event pages. | Package official-source facts and unknowns in one card. |
| Busy local family | Compare options quickly in chat. | Keep the answer compact, ranked, and action-oriented. |
| Accessibility- or weather-sensitive family | Identify what still needs confirmation before opening source pages. | Surface source-supported fields and mark indoor/outdoor or weather-sensitive needs as unknown/confirmation items when unsupported. |

## Core User Prompts

1. `이번 주말 서울에서 4살 아이와 갈 만한 실내 체험 장소를 추천해줘.`
2. `내일 비가 오는데 24개월 아이와 갈 수 있는 키즈 체험이나 박물관을 찾아줘.`
3. `초등학교 저학년 아이와 주말에 갈 수 있는 가족 행사 3개를 출처와 함께 정리해줘.`

Prompt 1 is the complete happy-path example. Prompts 2 and 3 are intentional negative/clarification examples: each omits `location` and must return typed `invalid_input`, exactly `missing_fields=["location"]`, and zero source access. They must not receive a silent Seoul default. PlayMCP-facing happy-path starter copy is maintained separately in `docs/PLAYMCP_TEMP_REGISTRATION.md`.

## Public Tool Contract

The public MCP surface has one tool:

```text
find_family_experiences
```

The tool accepts a natural-language request or structured constraints. Every request must contain:

- exactly one child selector: child age (`child_age`) or age band/stage (`child_stage`)
- date or explicit/relative date range (`date_range`)
- region or neighborhood (`location`)

It may also contain:

- indoor/outdoor preference
- optional interest, fee, or travel constraints when present

The tool returns at most three candidates. It should prefer fewer high-confidence candidates over many weak candidates.

The tool does not silently default a missing location/date, expand a requested date range, or infer a second child selector. A request missing required information returns typed `invalid_input`, exact `missing_fields` drawn from `location`, `date_range`, and `child_selector`, and zero source access. Supplying both child selectors is also `invalid_input`.

## Candidate Output Contract

Each candidate should expose these fields when known:

| Field | Requirement |
| --- | --- |
| `title` | Source title or normalized source title. |
| `date_time` | Source date/time text or normalized date window. |
| `venue` | Source venue or place name. |
| `address` | Source address, district, or location text. |
| `age_fit_label` | `source-stated`, `inferred`, or `unknown`. |
| `age_fit_reason` | Source age text or explicit inference reason. |
| `indoor_outdoor` | Source or deterministic normalized value when available. |
| `fee_text` | Source fee text; never infer price. |
| `source_name` | Registered source display name. |
| `source_url` | Consumer-safe official or registered detail URL when available. Authenticated provider API endpoints remain internal provenance and must not be exposed as user links. |
| `retrieved_at` | Adapter retrieval timestamp or fixture snapshot timestamp. |
| `confidence` | Source confidence label, not a safety score. |
| `warnings` | Caveats about missing fields, stale cache, fixture/demo mode, or confirmation needs. |
| `parent_check` | What the caregiver must confirm before visiting. |
| `next_action` | Open a consumer-safe source when available; otherwise use the event title and contact or official operator to confirm date/place/fee/application steps. |

## Data Policy

Official and registered sources only:

- Seoul Open Data Plaza culture event data
- Culture Portal / KCISA culture information API
- Korea Tourism Organization TourAPI
- National culture festival standard data, currently via local CSV fallback unless a live endpoint is configured
- Deterministic fixture rows for demo and regression only

The current production source set is only `kto_tourapi`. Its listing path is
KTO TourAPI `searchFestival2`; `detailIntro2` enriches a matching content ID and
supports source-stated age evidence only when `agelimit` is parseable. A blank,
failed, or unparseable detail response remains `unknown`. Seoul Open Data is a
registered future-proof route but is excluded from production until its HTTPS
transport is confirmed.

Do not add unofficial scraping, browser parsing, user-generated event pages, or unregistered event sources to the product without a separate source-ledger update and claim-scan update.

Runtime is cache-first. The production image contains a static bundled KTO
cache. Live provider calls belong in external ETL proof and cache generation,
not chat requests. Refresh means external KTO ETL, production-cache gate, image
rebuild, and redeploy; the serving container does not update cache files.

The runtime cache TTL defaults to 24 hours and fails closed when cache content is missing, stale, malformed, or incomplete. Source-specific publication/refresh intervals in `docs/SOURCE_LEDGER.md` describe provider operations; they do not silently override the runtime TTL.

## Claim Boundaries

The product must not claim any of these:

- must not claim complete nationwide coverage
- must not claim real-time freshness
- must not claim reservation availability
- must not claim current open/operating status
- must not claim child safety certification
- must not claim guaranteed age suitability
- must not claim PlayMCP review, public release, or contest submission completion before evidence exists

When a source does not directly support a field, return `unknown`, `inferred`, or a parent confirmation note rather than filling the gap.

## User Experience Requirements

- Start with the best candidates, not a long explanation.
- Keep response size small enough for chat and PlayMCP tool-result review.
- Show the source and caveats with each candidate.
- Make the parent checklist concrete.
- Prefer practical next action over promotional copy.
- Never hide uncertainty behind confident wording.
- Public health, error, and log surfaces must redact filesystem paths, provider URLs, refresh commands, credentials, stack traces, and deployment topology.

## Non-Goals

- Booking, payment, account login, or reservation management.
- Safety certification or medical/legal advice.
- Open-now oracle.
- Full national event index.
- Kakao Tools widget implementation before finalist-only requirements are available.
- Multi-tool expansion before the one-tool PlayMCP path is stable.

## Launch Readiness Criteria

Product launch readiness requires all of the following:

1. Local package verification and scans pass. Current status is in `docs/QA_REPORT.md`.
2. Source-specific ETL proof exists for the intended launch sources. Source coverage is in `docs/SOURCE_LEDGER.md`.
3. Deployed HTTPS `/health` and `/mcp` are smoke-tested. Host rules are in `docs/HOST_REQUIREMENTS_SOT.md`.
4. PlayMCP `정보 불러오기` discovers the expected public tool.
5. Temporary/private PlayMCP starter-message smoke works or safe-fails with no unsupported claims.
6. Public copy and demo material use this PRD's claim boundaries.

Until those gates pass, the product state is not public-ready.
