# Expansion Log

## Phase 0 Decomposition

Core question: create personas and drill down the official/API data pipeline needed for a KakaoTalk MCP that gives fact-grounded baby/child product safety and purchase-decision support.

Axes:
- Local context - existing repo concepts, family-experience MCP source-card pattern, parent-trust concept draft.
- Korea product safety - SafetyKorea/KATS/KC, KIPS, Consumer24, KCA.
- Korea MFDS and adjacent regulated categories - food, imported food, cosmetics, medicine/quasi-drug, medical devices.
- Chemical product lane - 초록누리 생활화학제품 and violation/recall information.
- US/global context - CPSC recalls, SaferProducts incidents, pacifier standards, pediatric/public-health guidance.
- Kakao commerce hook - Kakao Shopping/Gift API availability and boundary.
- Debate/risk - personas, purchase decision fit, source boundary, overclaiming risk.

Codebase relevant: yes. External: yes. Browsing: yes. Verification likely: partial. Final material format: markdown plus lightweight HTML.

## Wave 1

Workers simulated in main thread due tool policy. The following lanes were covered:
- Local codebase/context: `wave-1-local-context.md`
- Official source/API inventory: `wave-1-official-source-map.md`
- CPSC execution check: `verify-cpsc-recall-api.md`

EXPAND markers:
- LEAD: exact SafetyKorea API field behavior after key approval - WHY: live integration requires request/response schema and rate/failure behavior - ANGLE: implement with approved key or official interface spec.
- LEAD: Consumer24 Open API service details - WHY: barcode-centered parent flow may use Consumer24 as aggregation lane - ANGLE: inspect service-specific API docs after account/request access.
- LEAD: Kakao Shopping/Gift API access - WHY: hook is convenient but access appears partner/application based - ANGLE: treat as P3 integration unless official hackathon pathway grants access.
- LEAD: product identity normalization - WHY: exact model/cert/barcode/lot is the real blocker - ANGLE: implement identity intake before live source calls.

Closed as duplicate:
- Broad web crawling of shopping pages. Reason: user stated safety/fact core, not price scraping.
- Influencer/social ranking as proof. Reason: skills explicitly classify these as demand/proxy signals only.

Convergence reason: after two prior project passes plus this current verification wave, new leads converge on implementation prerequisites rather than additional concept research. Open leads are build-phase tasks, not required for the persona/API design artifact.
