# Trusted Family Network PRD vNext

Status: `PROPOSED`
Scope: product, technical, data, trust, privacy, and operating design for the next version of `아이랑 어디가`
Truth boundary: this document describes a future target. It does not claim that the current PlayMCP deployment implements login, GPS, visit proof, reviews, personalization, community aggregation, or a Kakao Tools widget. The current runtime contract remains in `PRODUCT_PRD_SOT.md` until an explicit promotion decision.

This is product-policy design, not legal advice. GPS, public UGC, and production launch require a current legal and platform-policy review.

## 1. Decision Summary

### Product thesis

Official data proves that an event is listed. An accepted onsite QR signal and structured caregiver feedback show what opted-in respondents reported about the experience.

`아이랑 어디가` should become a family outing decision loop:

```text
official facts -> three practical candidates -> family choice/share
     -> visit confirmation -> structured reaction -> next recommendation changes
                                  |
                                  +-> privacy-safe community pattern after thresholds
```

The product must not collapse official facts, visit proof, family fit, and community sentiment into one star or "trust score."

### Architecture decision

Use a two-surface, one-domain design:

1. PlayMCP/Kakao Tools remains the concise recommendation and explanation surface.
2. A first-party companion PWA or approved widget owns login, explicit consent, visit confirmation, feedback, deletion, and reporting.
3. Both surfaces call one modular TypeScript domain backend and one PostgreSQL database.
4. Exact device location never enters the LLM prompt, MCP tool result, analytics event, or durable database.

### Delivery decision

| Lane | Scope | Decision |
| --- | --- | --- |
| P0 submission-safe | Fix schedule eligibility, cache survival, host-visible evidence, diversity, coordinates, Kakao Map/directions CTA, and privacy notice. No account, GPS, or UGC. | `BUILD NOW` |
| P1 private family loop | Caregiver-targeted Kakao account login, signed handoff, device-local preferences, private structured feedback, rotating partner QR scan proof. | `BUILD FOR FINALS` after privacy/auth/partner contracts pass |
| P2 community trust | Delayed accepted-QR aggregate, polarization label, reports, moderation, deletion, and anti-abuse controls. | `GATED` |
| P3 one-shot GPS | Foreground-only nearby convenience or supplementary proximity signal; not a primary visit proof. | `FEATURE FLAG OFF` until legal, Kakao, privacy, and operator gates pass |
| Free text, photos, background tracking | Open-ended UGC, child photos, continuous location, live location sharing. | `NON-GOAL` |

## 2. Current Baseline and Gap

The current product is a read-only official-data shortlist, not a family trust network.

| Capability | Current evidence | Gap |
| --- | --- | --- |
| Public MCP | One read-only `find_family_experiences` tool (`src/mcp.ts`) | No account or write loop |
| Input | Date range, child age/stage, venue preference, keywords, and 17-region leaf matching with explicit broad-region groups (`src/schemas.ts`, `src/location.ts`) | No persistent family preference or visit history |
| Data | Current production set is KTO only; bundled cache has a 24-hour TTL (`PRODUCT_PRD_SOT.md`) | Sparse coverage and expiry risk |
| Ranking | Hard date/day/time/location/age eligibility, base relevance, and deterministic top-nine diversity by activity type, topic, and venue (`src/pipeline/rank.ts`) | No distance, practical-risk, personalized/community lane, or measured real-inventory diversity lift |
| Output | Up to three results; TextContent shows title/date/venue only (`findFamilyExperienceToolResponse.ts`) | Trust evidence and action fields may be invisible to the host answer |
| Account/UGC | Login, booking, and account are current non-goals | Original private and community feedback loop is absent |
| Widget | Mapping note only (`KAKAO_TOOLS_READINESS.md`) | Widget schema and runtime are not implemented or confirmed |

## 3. Users, Jobs, and Product Promise

### Primary user

A parent, guardian, grandparent, babysitter, or caregiver choosing an outing for a child. The service is intended for adult caregivers, but ordinary Kakao Login proves only control of a Kakao account; it does not prove adulthood, guardianship, or legal-representative status. The product does not create child accounts.

### Jobs to be done

| Job | Desired outcome |
| --- | --- |
| Decide | Reduce many listings to at most three realistic choices in under two minutes. |
| Avoid regret | Exclude closed, late, unsuitable, distant, or operationally risky candidates before popularity is considered. |
| Learn | Let the caregiver's own past reactions change future ranking. |
| Trust | Separate official facts, visit confirmation, self-report, inference, and unknowns. |
| Coordinate | Share a minimal candidate card and collect a family vote without exposing child or preference history. |
| Contribute | Leave low-friction structured feedback after a confirmed visit. |

### Product promise

> 같은 행사 목록이라도 우리 가족의 조건과 실제 방문에서 배운 호불호를 반영해, 실패 가능성이 낮은 세 곳만 근거와 함께 보여준다.

### Non-promises

- No guarantee of safety, suitability, operating status, reservation availability, or complete nationwide coverage.
- A `visit confirmed` badge does not prove that a specific child attended.
- Community sentiment never overrides an official schedule, age, closure, or availability fact.
- The product does not read KakaoTalk chat rooms, scrape the user's friend graph, or automatically obtain GPS from Kakao Login.

## 4. Scope by Phase

### P0: submission-safe recommendation

Required:

- hard eligibility for exact requested date, closed weekdays, operating time, child selector, location, and explicit time-of-day
- automatic or durable cache refresh; stale upstream data degrades by source, not by killing the entire service
- diverse top three when at least two known activity types exist in the bounded top-nine rerank window, while preserving top one and backfilling sparse inventory
- KTO coordinates promoted to typed fields
- Kakao Map place and directions URLs as navigation CTAs, not event-detail evidence
- source, age basis, uncertainty, shortage reason, and next action in TextContent
- one-page privacy notice, operator contact, raw-prompt no-storage statement, and bounded IP rate-key TTL

Not in P0:

- login, child profile, GPS, visit proof, review, public rating, photo, or personalized history

### P1: private family learning loop

Required:

- Kakao Login through the first-party PWA, labeled as account login rather than adult/guardian verification
- first-party account ID; do not expose Kakao tokens to tools or prompts
- short-lived, one-time signed handoff from a recommendation card to the PWA
- private preference profile stored on the user's device by default; server stores no child band in P1
- exact months/age allowed only as transient request data and not logged or stored
- private `liked | mixed | disliked` feedback with a balanced fixed taxonomy
- self-reported visits may improve only that family's private recommendations
- rotating, event/time-bound partner QR can issue `onsite_qr_scan_confirmed`; it does not prove a specific adult or child attended
- account export, consent history, withdrawal, unlink webhook, and deletion
- P1 starts only after privacy notice, data map, Kakao/KakaoCloud role, unlink/deletion, retention, partner-auth, and partner-contract gates pass

### P2: privacy-safe community patterns

Required before launch:

- public aggregation includes accepted partner QR scan responses only and never calls them representative of all visitors
- small cells are fully suppressed: show only `데이터 부족`, with no exact count or count range
- initial public release uses fixed, delayed venue/event windows and a conservative minimum cell of 20 distinct contributors; this is a product threshold, not a legal safe harbor
- eligible public counts use fixed ranges such as `20-49`, `50-99`, and `100+`; no real-time count, arbitrary date filter, or overlapping window
- public child cohort breakdown is disabled in the initial community release
- any later cohort requires a new re-identification test, one broad dimension, at least 20 distinct contributors per published cell, fixed snapshots, and no interactive slicing
- rare combinations, exact child age, health, disability, development, school, and exact location are never published
- report, quarantine, appeal, takedown, moderator audit, and venue-conflict policy are operational
- no public free text or photo until separate moderation and rights gates pass

### P3: one-shot proximity proof

Only after a written gate decision, and not as the primary visit-proof mechanism:

- foreground browser/OS geolocation with just-in-time purpose-specific consent
- a short-lived server nonce bound to account, event occurrence, and time window
- nearby ranking may convert to a coarse district client-side; any server-side proximity evaluation is a separately approved location-processing lane
- exact coordinates used transiently for evaluation and never persisted or logged
- durable result stores only proof type, event occurrence, coarse result bucket, timestamp, and risk state
- location terms, voluntary privacy impact review, filing/registration applicability, location-processing fact-record duties, Kakao/KakaoCloud role, and deletion behavior confirmed

## 5. User Flows

### 5.1 Discover and decide

```text
caregiver prompt
  -> parse structured constraints
  -> official hard eligibility
  -> request fit and practical-risk scoring
  -> optional private family fit
  -> privacy-gated public aggregate support
  -> diversity reranker
  -> up to three evidence cards
```

Each card must answer:

- Why is it eligible for this date, place, and child selector?
- Why is it ranked for this family?
- What is official, inferred, community-reported, or unknown?
- How many visits support the community pattern and over what period?
- What must the caregiver verify before leaving?
- What is the next safe action?

### 5.2 Share and vote

1. User selects `카카오톡으로 후보 공유` in the PWA/widget.
2. KakaoTalk Share opens the user's target picker.
3. Shared payload contains candidate title, date, venue, public landing URL, and no child/profile/history data.
4. Recipients can cast one choice on the public landing page.
5. Votes are planning preferences, not visit verification or trust evidence.

KakaoTalk Share is user-initiated and SDK-based. It is not a backend REST broadcast. See the official [KakaoTalk Share guide](https://developers.kakao.com/docs/ko/kakaotalk-share/common).

### 5.3 Visit confirmation and feedback

Preferred QR path:

```text
PWA login -> scan rotating event QR -> redeem one-time nonce
  -> visit attestation created -> 10-second structured feedback
  -> private profile updated -> aggregate job evaluates eligibility
```

Fallback path:

- self-report may update private preference learning
- self-report never receives an onsite QR badge and never enters public accepted-scan aggregates

Future GPS path:

- the browser, not Kakao Login or Kakao Local, obtains device coordinates with explicit permission
- Kakao Local may convert a supplied coordinate or search nearby places; it does not acquire device GPS
- Kakao's own map sample describes using HTML5 Geolocation for current position: [Kakao Map Web samples](https://apis.map.kakao.com/web/sample/)

### 5.4 Deletion

1. User requests account deletion or Kakao unlink occurs.
2. Login link and tokens are revoked.
3. Private profile, recommendation history, feedback attribution, and active handoffs are removed from serving within 24 hours.
4. Public aggregates are recomputed without the user's contributions.
5. Backups expire within the declared retention window; legal holds are separated and disclosed.

Kakao's login policy requires service-side membership handling and destruction of personal data, including the Kakao user ID, on withdrawal. See [Kakao Login concepts and policy](https://developers.kakao.com/docs/ko/kakaologin/common).

## 6. Target Technical Architecture

### 6.1 Logical view

```text
PlayMCP / Kakao Tools                 Companion PWA / approved Widget
        |                                         |
        | MCP Streamable HTTP                     | HTTPS + first-party session
        v                                         v
  MCP adapter module ---------------------> Platform BFF / Auth
        |                                         |
        +-----------------+-----------------------+
                          v
                Modular domain application
        +-----------------+-------------------+
        | Event Catalog / Eligibility         |
        | Recommendation / Explanation        |
        | Family Preference                   |
        | Visit Attestation                   |
        | Feedback / Trust Aggregate          |
        | Share Vote                          |
        | Moderation / Privacy Rights         |
        +-----------------+-------------------+
                          |
                    PostgreSQL
                          |
            scheduled ETL + outbox workers
                          |
       KTO / Seoul / KCISA / registered sources
```

### 6.2 Deployment decision

Start as a modular monolith, not microservices.

- keep the current Node/TypeScript MCP package as an adapter
- add a first-party web/PWA and platform API
- use PostgreSQL first
- add Redis only when measured nonce, rate-limit, or cache load requires it
- use validated Haversine distance for the current catalog; add PostGIS only after a measured scale/latency threshold, such as more than 50,000 active geospatial rows or a failed spatial-query SLO
- use an outbox table and worker for aggregate recomputation, moderation events, and unlink/deletion tasks

This keeps consistency and auditability while the product contract is still changing.

### 6.3 Trust boundaries

| Boundary | Allowed | Forbidden |
| --- | --- | --- |
| LLM/MCP | Query constraints, official event data, anonymized aggregate, explanation | OAuth token, raw GPS, QR material, child identity, private review text |
| PWA/BFF | Login session, explicit consent, one-time proof submission, structured feedback | Background tracking, friend scraping, automatic share |
| Database | Pseudonymous account, proof result, structured tags, consent version | Child band/profile in P1, raw preferences that can reveal a child, raw coordinates, child DOB/name, receipt/photo in MVP, Kakao access token in plaintext |
| Analytics/logs | Route, status, latency, non-identifying counters | Prompt body, exact IP, exact location, token, profile/history payload |

## 7. External API and Platform Matrix

| Capability | API/service | Phase | Exact use | Constraint |
| --- | --- | --- | --- | --- |
| MCP host | PlayMCP / Kakao Tools | P0 | Recommendation tool and action card | Streamable HTTP; current public guide recommends OAuth/custom header for authenticated tools and concise TextContent. |
| Identity | Kakao Login OAuth/OIDC | P1 | Kakao account authentication for a caregiver-targeted service | It does not prove adulthood/guardianship or provide GPS. Request only minimum scopes. Handle unlink and data deletion. |
| Map display | Kakao Maps JS SDK | P0/P1 | Map, markers, venue context | App key/domain registration and current quota apply. |
| Place normalization | Kakao Local REST | P1 | Coordinate/address conversion and venue matching | It processes supplied coordinates; it does not acquire device location. [Local API](https://developers.kakao.com/docs/ko/local/dev-guide) |
| Current location | Browser/OS Geolocation | P3 | Optional nearby convenience; supplementary proximity signal only after a separate gate | Secure context and explicit permission; Kakao Login does not supply GPS. |
| Navigation | Kakao Map link URLs | P0 | Place and directions CTA | Navigation only; not official event schedule or booking evidence. |
| Family sharing | KakaoTalk Share SDK | P1 | User-selected candidate sharing | User initiated; REST API is not supported for Share. |
| Friend messages | KakaoTalk Message | Later | Explicit user-to-user interaction only | Permission and recipient conditions apply; not service push. [Message guide](https://developers.kakao.com/docs/ko/kakaotalk-message/common) |
| Friend graph | KakaoTalk Social | Not planned | None | Friend data has strict provision conditions and purpose limits; unnecessary for the core loop. |
| Event catalog | KTO TourAPI | P0 | Nationwide event listing, detail, coordinates | Source license, quota, freshness, and public detail-link rights tracked. |
| Regional catalog | Seoul Open Data / KCISA | P0+ | Coverage and official-detail enrichment | Promote only after transport, licensing, freshness, and schema gates pass. |
| Venue QR | First-party rotating QR | P1 | Partner-issued onsite scan signal | QR proves one-time token redemption, not physical presence, adult identity, or child attendance. |

Current Kakao API quotas and pricing can change and must be checked before launch; the official quota page is [Kakao Developers quota](https://developers.kakao.com/docs/ko/getting-started/quota).

## 8. First-Party API Contracts

All mutation endpoints require first-party authentication, CSRF protection where applicable, an idempotency key, rate limits, and an audit event that excludes sensitive payloads.

### Recommendation

```http
POST /v1/recommendations
```

```json
{
  "location": "서울",
  "date_range": {"start": "2026-08-01", "end": "2026-08-01"},
  "child_age": 4,
  "time_window": "daytime",
  "preferences": ["quiet", "stroller_friendly"],
  "max_results": 3
}
```

Rules:

- exact age is request-scoped and never persisted; a device-local broad preference may be supplied again as transient input
- return three when at least three eligible candidates exist; otherwise return fewer with a shortage reason
- response includes `official_evidence`, `family_fit_basis`, `visit_evidence`, `community_pattern`, `unknowns`, and `next_action` as separate objects

### Signed handoff

```http
POST /v1/handoffs
```

Creates a random, one-time, 15-minute handoff ID that references the recommendation session server-side. The URL must contain no child age, preference, coordinate, login token, or event history. Handoff proves only that the service recommended a candidate; it is never accepted as a visit proof. Exchange occurs by POST with audience, expiry, nonce/JTI, one-time consumption, and redirect allowlist validation.

### Partner QR challenge and redemption

Partner/staff challenge issuance requires a separate authenticated role, venue authorization, signing-key rotation, clock-skew policy, revocation, and incident process.

```http
POST /v1/partner/checkin-challenges
Authorization: partner-session
```

The QR contains only an opaque challenge ID or signed nonce. It contains no account, child, preference, or feedback data.

```http
POST /v1/visit-challenges/{event_occurrence_id}/redeem
Idempotency-Key: ...
```

```json
{
  "qr_nonce": "opaque-one-time-value"
}
```

Response:

```json
{
  "attestation_id": "uuid",
  "proof_type": "partner_rotating_qr",
  "status": "onsite_qr_scan_confirmed",
  "expires_at": "2026-08-01T15:00:00+09:00"
}
```

Reject expired, replayed, wrong-event, wrong-time, revoked-key, unauthorized-partner, and quarantined venue tokens. A venue partner receives no user identity or individual feedback.

### Structured feedback

```http
POST /v1/feedback
Idempotency-Key: ...
```

```json
{
  "event_occurrence_id": "uuid",
  "attestation_id": "uuid-or-null",
  "reaction": "mixed",
  "positive_tags": ["hands_on", "staff_helpful"],
  "negative_tags": ["loud", "long_wait"],
  "visibility": "private"
}
```

Rules:

- one active feedback version per account and event occurrence
- balanced positive and negative taxonomy; tag count capped
- no child-trait diagnosis; use experience wording such as `소리가 컸음`
- edits create a new version and replace, rather than double-count, the aggregate

### Rights and safety

```http
DELETE /v1/me
GET    /v1/me/export
POST   /v1/reports
POST   /v1/consents/{purpose}/withdraw
```

## 9. Data Model

There is deliberately no `children` table.

| Entity | Key fields | Retention/visibility |
| --- | --- | --- |
| `accounts` | internal UUID, HMAC of Kakao app-scoped subject, state | Until withdrawal; Kakao mapping is personal data and is deleted on unlink |
| `consent_records` | purpose, version, granted/withdrawn timestamps | Policy-defined audit window |
| `family_preferences` | optional server-side preferences are deferred; P1 uses device-local preference settings | No child band/profile in P1; no DOB, name, school, health, or exact location |
| `venues` | canonical ID, official name/address, source coordinates | Public official data |
| `event_occurrences` | event ID, venue, exact schedule, closed rules, source snapshot | Public official data |
| `source_snapshots` | source, retrieved time, license/provenance, raw snapshot ID | Operator evidence, access controlled |
| `recommendation_sessions` | constraints hash, candidate IDs, explanation version | Short retention; no raw prompt |
| `handoffs` | random token hash, session, expiry, used state | 15 minutes, single use |
| `visit_attestations` | account, occurrence, proof type/status, time, risk state | Private QR-scan record; no claim of physical/child attendance and no raw GPS/QR/photo |
| `feedback_versions` | reaction, structured tags, visibility, attestation link | Private by default; public only through aggregate |
| `trust_aggregates` | fixed occurrence/venue window, bucketed accepted-scan response count, tag bands, quality state | Delayed immutable snapshots only after suppression/re-identification gates |
| `share_votes` | public plan ID, anonymous/session vote, expiry | Planning only; never trust evidence |
| `moderation_cases` | reason, state, action, appeal, audit actor | Restricted operator data |
| `outbox_events` | event type, entity ID, processing state | Operational; no sensitive payload |

## 10. Recommendation and Trust Logic

### 10.1 Ranking pipeline

Use ordered gates, not one blended popularity score.

1. `official eligibility`: exact date, closed day, opening time, requested time window, region/distance, child selector, reservation requirement when known
2. `request fit`: activity, budget, indoor/outdoor, travel burden, duration
3. `practical risk`: late finish, uncertain hours, stale source, missing official link, content intensity
4. `private family fit`: explicit preferences and that account's past feedback only
5. `community support`: privacy-gated accepted-QR aggregate used as supporting evidence or tie-breaker, never to override hard facts
6. `diversity rerank`: preserve top one, then prefer distinct activity types, topics, and venues inside the top-nine relevance window; backfill deterministically if inventory is sparse
7. `explanation`: emit the winning reasons and unresolved checks

Initial weights, if needed, are configuration for evaluation and not a public truth score. Promotion requires offline holdout and real PlayMCP/PWA journey tests.

### 10.2 Trust vector

Expose these lanes separately:

| Lane | Example label | Meaning |
| --- | --- | --- |
| Official freshness | `공식정보 7월 31일 확인` | Source fact and retrieval time |
| Visit evidence | `현장 QR 응답 20-49건` | Accounts/devices redeemed accepted rotating QR; not proof of child attendance |
| Private family fit | `우리 기록과 잘 맞음` | Same account's explicit preferences or prior feedback |
| Community pattern | `호불호 갈림` | Aggregate reaction after sample threshold |
| Evidence quality | `표본 부족` / `검토 중 제외` | Statistical or integrity limitation |

Never expose a single `trust=92` or a safety score.

### 10.3 Polarization rule

For decisive reactions attached to accepted partner QR scans only:

- `n = liked + disliked`, deduplicated by account and fixed publication window
- if `n < 20`, suppress count and sentiment and show only `데이터 부족`
- if `n >= 20` and `0.35 <= liked / n <= 0.65`, show `호불호 갈림`
- otherwise show `대체로 긍정` or `대체로 부정`
- show a fixed count range, fixed date window, top positive reasons, top negative reasons, and `QR 스캔 후 선택 응답 표본` limitation
- mixed feedback informs reason counts but does not silently choose the decisive label
- quarantined, duplicate, venue-conflicted, or self-reported public items are excluded
- publish monthly or another fixed delayed cadence; prohibit arbitrary filters, overlapping windows, and before/after differencing queries

The threshold is a product starting rule, not a statistical guarantee. It must be calibrated with holdout data.

### 10.4 Cohort privacy

- public child cohorts are disabled in the initial community release
- a future broad child-stage cohort requires a separate promotion decision and adversarial re-identification test
- one cohort dimension at a time; do not intersect stage, location, accessibility, and time
- require at least 20 distinct contributors per published cell, fixed non-overlapping snapshots, bucketed counts, and rare-tag suppression
- do not publish health, disability, development, sensory diagnosis, school, exact age, or exact neighborhood cohort labels

## 11. Visit Proof and Anti-Abuse

### Proof levels

| Proof | Public aggregate | Label |
| --- | --- | --- |
| Partner rotating QR | Eligible for delayed accepted-scan aggregate after risk/privacy checks | `현장 QR 스캔 확인` |
| Future one-shot GPS proximity | Supplementary signal only after a separate policy gate; not primary public proof | `위치 신호 확인` |
| Ticket/receipt manual proof | Future only; raw artifact immediately deleted after review | `자료 확인` |
| Self-report | Private learning only | `직접 기록` |

### Minimum controls

- nonce bound to event occurrence, venue, account, and short time window
- single redemption and idempotent write
- one aggregate contribution per account per occurrence
- impossible velocity, repeated device/account clusters, venue-staff concentration, and bulk identical tags trigger quarantine
- venue/operator relationship is declared and separated from caregiver feedback
- quarantined items do not change ranking or public aggregates
- editing replaces the previous version
- IP address alone is never proof of identity or visit
- QR/GPS proves at most an account/device signal, not physical presence with certainty or the presence of a particular child

## 12. Service Policies

### 12.1 Account and child policy

- the service is targeted to adult caregivers, but Kakao Login itself is not adulthood, guardian, or legal-representative verification
- no child account and no direct child consent flow in MVP
- no child name, DOB, photo, voice, school, home address, route, contact, health, disability, allergy, or development record
- child stage and exact age/months are transient per request in P1; device-local preference storage is the default and server-side child profile is deferred
- refusal of optional personalization must not block anonymous recommendation

If the service later processes a child user's personal data on consent, the Personal Information Protection Act requires legal-representative consent for children under 14 and child-comprehensible notice. See [PIPA Article 22-2](https://www.law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=02&joNo=0022&lsiSeq=270351&urlMode=lsScJoRltInfoR).

### 12.2 Location policy

- no background location, continuous tracking, live family sharing, or location history
- rotating partner QR is the default onsite-scan lane
- GPS is foreground, one-shot, purpose-specific, optional, separately consented, and feature-flagged off by default
- raw coordinate retention target is zero; application, proxy, analytics, error, and access logs must be tested for leakage
- exact coordinates are never rendered in an MCP answer or share payload
- denial of GPS falls back to manual region or private self-report and does not block basic recommendation
- browser permission is not, by itself, the complete statutory consent/terms process

The Location Information Act prohibits collecting or using personal location without consent and contains separate consent, terms, protection, and destruction duties. Determine business status and filing/registration applicability before enabling GPS. See [Article 15](https://law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0015&lsiSeq=277359&urlMode=lsScJoRltInfoR) and [Article 18](https://www.law.go.kr/LSW/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=900340976).

### 12.3 Feedback and community policy

- private by default; community aggregation is separate opt-in
- no open text, child photos, user profile, follower, or direct messaging in MVP
- experience tags describe the visit, not a child's diagnosis or identity
- official fact correction is a separate source-verification flow, not a review vote
- safety incident reports are private moderation cases and are not converted into an unverified public accusation
- public content must support report, notice, temporary restriction, appeal, restoration, repeat-abuse sanctions, and audit trail

### 12.4 Sharing and messaging policy

- every KakaoTalk share is user initiated
- share payload contains no child age, preference, visit history, private vote, or exact location
- do not retain the user's KakaoTalk friend list
- do not use KakaoTalk Message as a service-originated notification channel
- marketing and service notifications, if added, require separate channel, purpose, consent, and opt-out design

### 12.5 Ranking policy

- official hard constraints always outrank popularity
- sponsored results are absent in MVP; if ever added, they are labeled and cannot alter eligibility
- disclose ranking factor groups and material personalization
- allow users to turn personalization off and compare a non-personalized result
- do not infer protected or sensitive traits from behavior

### 12.6 Rights, retention, and deletion

Proposed product retention, subject to legal and platform confirmation:

| Data | Retention |
| --- | --- |
| Raw prompt/request body | No durable storage; release after request |
| Raw exact coordinate | No durable storage; memory-only evaluation |
| QR/receipt/photo proof material | QR stored only as a one-way token hash; receipt/photo not MVP |
| Handoff | 15 minutes, single use |
| Rate-limit key | Short-lived non-reversible key with code-enforced TTL |
| Operational log | 30 days, no prompt/IP/account/location/token |
| Device-local preference | Controlled by the user on device; not server-synced in P1 |
| Private account feedback | Until deletion or purpose withdrawal, with public-aggregate contribution consent handled separately |
| Moderation case | Defined window after resolution, access controlled |
| Backup | Declared bounded window; deletion propagated on expiry |

Personal data must be destroyed when unnecessary under [PIPA Article 21](https://www.law.go.kr/LSW/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=900078981). Publish a current privacy policy covering purposes, fields, retention, processors/third parties, destruction, rights, security, contact, and automatic collection. The 2026 regulator guide is available from the [Personal Information Protection Commission](https://m.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=D010030000&nttId=12018).

## 13. Security and Privacy Controls

### Authentication

- OAuth/OIDC authorization code flow with state, nonce, PKCE where supported, and exact redirect allowlist
- first-party HttpOnly, Secure, SameSite session cookie
- Kakao subject mapped to an internal UUID; mapping is treated as personal data
- Kakao access and refresh tokens are never tool arguments, prompt text, analytics, or client-readable storage
- handle Kakao unlink webhook and revoke first-party sessions

If PlayMCP personalization is later enabled, expose a first-party standards-compliant OAuth authorization server that federates Kakao Login. PlayMCP receives only an audience-scoped first-party access token; it must not receive or reuse the Kakao access token.

### Application and data

- schema validation and output encoding at every boundary
- CSRF protection for cookie-authenticated mutations
- per-account and per-device risk limits
- encryption in transit and at rest; secrets in a secret manager
- role-based admin access, MFA, audit log, and least privilege
- transactional outbox for deletion, unlink, aggregate recompute, and moderation actions
- no sensitive fields in logs, traces, exception payloads, or MCP TextContent
- automated scan that fails if raw coordinates, tokens, prompt bodies, or child identifiers appear in persisted data or logs

### MCP-specific

- recommendation remains read-only and idempotent
- all rich evidence needed by the host answer is also present in concise TextContent
- mutation remains in explicit PWA/widget UI for P1 and P2
- no tool is named or described as obtaining KakaoTalk GPS
- authenticated tool calls return 401 on missing/expired authorization and never reflect credentials

The local PlayMCP guide requires standard OAuth or custom headers for authenticated MCPs and recommends a third-party provision notice when personal data is relayed to Kakao (`server_dev_guide.md`).

## 14. Reliability and Operations

### SLO candidates

| Surface | Target |
| --- | --- |
| Recommendation | p99 <= 3 seconds; no closed-day false positive in release suite |
| MCP availability | 99.9% during judging/launch window |
| Cache/source freshness | Per-source freshness SLO; one stale source does not kill all healthy sources |
| QR redemption | p95 <= 1 second; replay acceptance = 0 |
| Feedback write | exactly one active version per account/occurrence |
| Deletion | removed from serving and aggregate within 24 hours |
| Privacy | durable raw-coordinate, token, prompt, and child-identifier count = 0 |
| Moderation | critical safety/privacy report triaged within 1 hour; other reports within 24 hours |

### Operational dashboards

- source freshness, raw record coverage, net-new hard-eligible yield, age-evidence coverage, schedule completeness
- no-result and shortage rates by region/date, without raw user queries
- category diversity and duplicate-theme rate
- MCP latency/error/timeout and host-visible answer completeness
- handoff completion, confirmed visit conversion, feedback completion
- replay, quarantine, report, appeal, deletion, and unlink failures
- quota usage and projected cost for Kakao APIs

## 15. Success Metrics and Evaluation

### North-star chain

```text
decision-ready recommendation
  -> candidate selection/share
  -> confirmed or self-recorded visit
  -> feedback completion
  -> measurable next-recommendation improvement
```

### Product metrics

| Metric | Definition |
| --- | --- |
| Decision-ready rate | Sessions ending in a selected candidate or explicit accepted no-fit / completed recommendation sessions |
| Top-three practical-fit | Candidates a caregiver says they could realistically choose / returned candidates |
| Personalization lift | Top-one selection rate of private-family ranking minus non-personalized baseline on holdout sessions |
| Post-visit calibration | Agreement between pre-visit fit explanation and later structured feedback |
| Feedback completion | Accepted QR scans or private self-reports with completed feedback / eligible records |
| Honest shortage | Sparse inventory sessions that return fewer candidates with a reason and no silent relaxation |
| Evidence completeness | Cards that separate official, family, visit, community, and unknown lanes |
| Integrity | Replay rejection, duplicate exclusion, and quarantine precision/recall |
| Privacy | Raw sensitive artifacts found by persistence/log scans |

Do not claim personalization success before a holdout comparison with real caregiver sessions.

## 16. Acceptance Tests

### P0 release gates

1. `2026년 8월 3일 월요일 서울에서 4살...` never returns an event whose source says Monday closed.
2. A morning request never returns a night-only event.
3. If at least two known activity types exist in the top-nine relevance window, top three contain at least two activity types without changing the base-ranked top one.
4. If fewer than three eligible candidates exist, TextContent states the exact shortage and does not fabricate.
5. Every card in TextContent includes age basis, official source/freshness, warning, and safe CTA.
6. KTO coordinates create valid Kakao Map and directions CTAs without exposing an authenticated provider API URL.
7. Cache expiration does not make the entire endpoint unusable when a safe source or last-known-good policy remains available.
8. Logs contain no prompt, age, region, IP, token, or provider secret.
9. A leaf-province request never returns its sibling province; only an explicitly broad regional request expands to both.

### P1 private-loop gates

1. Two devices/accounts with different transient or device-local preferences can receive different ranking with an explanation while official facts remain identical.
2. The same account's private feedback changes only that account's later recommendation.
3. Exact age is absent from DB, analytics, and logs after the request completes.
4. Valid rotating QR creates one `onsite_qr_scan_confirmed` attestation; replay returns a typed duplicate error and count remains unchanged.
5. Self-report affects private learning but never receives `현장 QR 스캔 확인` or enters public aggregate.
6. Kakao share payload contains no child/profile/history data.
7. Kakao unlink and account deletion remove the account mapping and recompute aggregates.

### P2 community gates

1. Fewer than 20 distinct contributors yields only `데이터 부족`; no count, range, sentiment, or cohort is shown.
2. Every public sentiment label shows a fixed count range, fixed date window, and non-representative opt-in sample notice.
3. Initial release exposes no child cohort; any later cohort requires at least 20 contributors per cell and a re-identification test.
4. Quarantined, duplicate, self-reported, or venue-conflicted feedback is excluded.
5. Report, restriction, notification, appeal, and restoration are auditable end to end.

### P3 GPS gates

1. No location request occurs before a complete just-in-time permission, consent, and terms flow.
2. Denial produces a usable fallback, not a broken journey.
3. Exact coordinates are absent from DB, cache, log, trace, analytics, URL, MCP response, and share payload.
4. Expired/replayed/low-accuracy/out-of-fence proof is rejected.
5. Written legal, business-status/filing, processing-fact-record, policy, Kakao/KakaoCloud role, and operator gate decisions are present before production enablement.

## 17. Delivery Plan

### Immediate: P0

1. Correct schedule/time eligibility and add falsifying regression tests.
2. Replace static-expiry failure with a durable ETL/last-known-good freshness policy.
3. Put the full decision evidence in host-visible TextContent.
4. Validate and tune deterministic diversity reranking against real Korean titles, unknown categories, and sparse same-category backfill.
5. Promote KTO coordinates and add Kakao Map/directions CTAs.
6. Publish privacy notice and fix code-enforced IP rate-key TTL.
7. Promote another official source only after transport, provenance, freshness, and net-new hard-eligible-yield gates pass.

### Conditional finals window

| Week | Deliverable | Exit gate |
| --- | --- | --- |
| 1 | After pre-gates pass: PWA, minimal Kakao Login, PostgreSQL schema, signed handoff, deletion/unlink | Privacy, data-role, retention, partner, and auth threat reviews pass before implementation starts |
| 2 | Private preferences, self-report feedback, rotating QR pilot | Replay and cross-account isolation tests pass |
| 3 | Aggregate worker, thresholds, report/moderation console, KakaoTalk Share vote | Moderation owner and SLA are staffed |
| 4 | Kakao Tools widget adaptation after actual spec access, real-family holdout, load/security/privacy QA | End-to-end host journey and deletion receipt pass |

GPS is not on the critical path. It is enabled only if its separate gate passes; otherwise the product ships with QR confirmation and private self-report.

## 18. Contest Demo Slice

### Scene 1: same official facts, different family decision

Two caregiver demo profiles ask the same Seoul/age/date query. One avoids loud/late events; one prefers lively performances. The candidate order changes, while the official schedule and source evidence stay identical. The profiles are user-declared demo context, not verified guardian status.

### Scene 2: a visit changes the next answer

The first user redeems a one-time event QR and records `mixed + loud + late_finish`. The next recommendation explains that the family's own confirmed visit history lowered similar events. A replay of the QR is rejected.

### Scene 3: no fake consensus

A card shows:

```text
현장 QR 응답 20-49건 · 호불호 갈림
좋았음: 참여형 활동, 친절한 진행
아쉬움: 큰 소리, 긴 대기
우리 가족: 큰 소리 비선호 기록과 충돌
```

The closing line is:

> 공식정보는 행사가 등록됐음을 보여주고, 현장 QR 이후 남긴 구조화된 경험은 어떤 조건에서 호불호가 갈렸는지를 보여줍니다.

## 19. Blocking Decisions and Kill Rules

### Must resolve

1. Actual Kakao Tools widget schema, authorization bridge, and allowed deep-link behavior.
2. PlayMCP and KakaoCloud request/access-log fields, retention, processors, and data-role contract.
3. Kakao Login app/business verification and minimum approved scopes.
4. Location-business status, filing/registration, terms, consent, processing-fact records, and destruction duties before GPS.
5. Partner QR pilot owner and venue conflict-of-interest policy.
6. KTO/Seoul/KCISA license, attribution, contact, image, and consumer-detail-link proof.
7. Named moderation, privacy, security, and incident-response owners.

### Kill rules

- Do not enable public UGC without a staffed report/appeal/takedown path.
- Do not enable GPS while exact coordinates can reach durable storage or logs.
- Do not expose small-cell counts or cohort sentiment that can identify a rare child/family context.
- Do not claim `가족 방문 인증` or even certain physical attendance; use `현장 QR 스캔 확인` and disclose replay/delegation limits.
- Do not let community sentiment override a closure, age, schedule, source, or safety boundary.
- Do not claim Kakao Tools widget completion before the actual spec and runtime test exist.

## 20. Source Notes

- Current runtime and product boundary: `PRODUCT_PRD_SOT.md`, `KAKAO_TOOLS_READINESS.md`, `src/mcp.ts`, `src/schemas.ts`, `src/pipeline/rank.ts`, and `src/findFamilyExperienceToolResponse.ts`.
- PlayMCP OAuth, tool, response, and privacy guidance: `docs/external/kakao-playmcp-in-kc-notion/server_dev_guide.md` and `review_policy.md`.
- Contest requirement and judging criteria: [AGENTIC PLAYER 10](https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10).
- Kakao Login: [official guide](https://developers.kakao.com/docs/ko/kakaologin/common).
- KakaoTalk Share and Message: [Share](https://developers.kakao.com/docs/ko/kakaotalk-share/common), [Message](https://developers.kakao.com/docs/ko/kakaotalk-message/common).
- Kakao Local and Maps: [Local REST](https://developers.kakao.com/docs/ko/local/dev-guide), [Map Web](https://apis.map.kakao.com/web/).
- Privacy and location: [Personal Information Protection Act](https://law.go.kr/LSW/lsInfoP.do?lsiSeq=270351), [Location Information Act](https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=277359).
