# Feasibility Edge Debate

Date: 2026-07-02
Skill route: oml:debate

## Agenda

Test whether the three MCP ideas are defensible against competing MCPs:

1. Can family experience data be sorted by child age, date, region, and parent conditions?
2. Does a holiday pharmacy finder already exist, and if so what remains valuable?
3. Does the baby product safety story justify a Kakao-facing MCP?

## Source Inventory

- Seoul Open Data cultural event data exposes category, district, title, venue, date, organizer, target audience, fee, program, homepage, contact, lat/lon, start/end date, free/paid, and event time.
- Korea Tourism Organization TourAPI exposes national tourism/event content including location, keyword, event, image, and common/detail information.
- NMC/data.go.kr exposes national pharmacy lookup data; E-Gen and Pharm114 already provide public pharmacy finding surfaces.
- SafetyKorea/KATS exposes KC certification, domestic recall, and overseas recall data through Open API; data.go.kr lists product certification/recall information with real-time update.
- Consumer/government product comparison information can add domestic test results and safety-context evidence.
- Philips published a 2026-05-28 statement saying its Avent pacifier ranges are BPA-free and that additional DEKRA tests found no detectable BPA after news about SCF085/60.
- Public reports in 2025-10 describe dTest/Guardian claims that BPA was detected in some pacifiers, while manufacturers disputed or contextualized the results.

## Round 0 Moderator

The goal is not to prove our tools have unique raw data. The goal is to prove they package scattered, time-sensitive, trust-sensitive information into a small action card that a normal KakaoTalk user can act on without searching multiple sites.

## Role Debate

### PM

Vote: conditional pass for all three.

- Family experience: viable if positioned as "Top 3 age/date/location fit" rather than a generic event search.
- Holiday pharmacy: viable even with existing services because the user pain is mobile urgency, not data nonexistence.
- Parent trust: strongest differentiated story, but must avoid claiming "safe/unsafe".

### Tech Lead

Vote: family and pharmacy pass; parent trust passes only with strict evidence lanes.

- Family sorting is technically feasible for date, region, fee, venue, contact, and event period. Child-age matching must use source-provided target audience first and confidence-labeled text inference second.
- Pharmacy is technically straightforward if NMC/E-Gen source semantics are preserved and Kakao/map enrichment is only destination help.
- Parent trust needs identity normalization before evidence lookup: product name, model, KC/cert number, importer/manufacturer, batch/lot, purchase channel, and child age.

### User Advocate

Vote: parent trust is the strongest emotional product; pharmacy is the clearest emergency product; family is the broadest everyday product.

- Parents do not need another long search result. They need a short, credible "what should I do now" card.
- The Philips Avent BPA story is exactly the trust gap: old certification, later controversy, manufacturer response, and no simple consumer conclusion.
- KakaoTalk fit is high because parents already ask family, friends, and group chats before buying or using baby items.

### Devil's Advocate

Vote: no unconditional pass.

- Family experience can overclaim age-fit if event sources only say "all ages" or omit target age.
- Pharmacy can be misread as "currently open" when sources are stale or self-reported.
- Parent trust can create liability if it compresses conflicting evidence into a false safety verdict.

### CEO Visionary

Vote: choose the product whose one-line story survives public judging.

- Family: "이번 주말 우리 아이랑 갈 곳 3개" is easy to understand and demo.
- Pharmacy: "지금 전화해볼 휴일약국 3개" is immediately useful.
- Parent trust: "국민템도 불안할 때 공식 근거와 시간차를 정리해주는 부모 신뢰 카드" is the most original and mission-driven.

## Moderator Synthesis

### Family Experience MCP

Feasibility: yes, with confidence labels.

What can be sorted directly:

- date range
- region/district
- venue/address/location
- fee/free status
- event category
- official URL/contact

What requires careful inference:

- exact child age fit
- indoor/outdoor
- stroller-friendly
- reservation friction
- parent convenience

Decision: buildable, but the answer must say why each result matches and label weak matches. Do not imply perfect personalization.

### Holiday Pharmacy MCP

Feasibility: yes, but not unique as a raw finder.

Existing surfaces do exist: Pharm114, E-Gen, public data APIs, and the emergency medical information app. The gap is that urgent mobile use still requires too much searching, filtering, and uncertainty management.

Decision: valuable if framed as "phone-first candidate pack", not "new official pharmacy database". Always include call-before-visit copy.

### Parent Trust MCP

Feasibility: yes, but only as an evidence-routing and decision-support tool.

The Philips Avent example proves the product need:

- an item can have prior certification or marketplace trust
- a later external test/news event can create doubt
- a manufacturer can publish a conflicting reassurance
- a parent still needs an action card, not a verdict

Decision: strongest differentiated story, highest care requirement. The MVP must produce a Trust Ledger: product identity, claim timeline, official lanes, manufacturer claims, evidence gaps, and parent actions.

## Final Ranking

1. Best hackathon implementation speed: family experience MCP.
2. Best immediate utility with existing codebase: holiday pharmacy MCP.
3. Best differentiated mission and Kakao public-good story: parent trust MCP.

## Carry-Forward Decision

If the goal is a fast demo with broad appeal, keep family experience first.

If the goal is a memorable, defensible, mission-driven entry that can stand out from generic MCPs, elevate parent trust as the flagship and keep family/pharmacy as evidence of a broader "parent daily decision pack" direction.

## Unresolved Risks

- Family age-fit needs source-level confidence labels.
- Pharmacy must not claim real-time opening unless the source actually supports it.
- Parent trust must avoid medical/legal safety verdicts and preserve disagreement among official, manufacturer, and independent evidence.
