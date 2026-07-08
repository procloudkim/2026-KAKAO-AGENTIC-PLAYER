# Risks

| Risk id | Risk | Current control | Residual action |
| --- | --- | --- | --- |
| r1 | Product sounds like generic search. | Emphasize age/date/region filtering, evidence fields, caveats, parent checklist, and next action. | Demo through starter prompts after PlayMCP load. |
| r2 | Public readiness is overclaimed. | `QA_REPORT.md` separates PASS, BLOCKED, and NOT CLAIMED. | Do not use public-ready wording until remote evidence exists. |
| r3 | PlayMCP flow remains unproven. | `HOST_REQUIREMENTS_SOT.md` lists endpoint and information-load gates. | Deploy, smoke `/mcp`, run `정보 불러오기`, then starter smoke. |
| r4 | Source freshness is misunderstood. | `SOURCE_LEDGER.md` blocks tier3 claims; candidate fields include retrieved/cache evidence. | Keep cache age and parent confirmation visible. |
| r5 | Tool surface expands too early. | PRD and PlayMCP docs keep one public tool. | Revisit only after private smoke and review feedback. |
| r6 | Documentation work delays deployment. | Roundtable decision prioritizes evidence-producing deploy work. | Create AI-DLC map only if it reduces handoff risk. |
| r7 | Secret handling blocks KakaoCloud deployment. | Host SOT requires human approval for image-baked exception. | Confirm current PlayMCP-in-KC env/Secret support in console. |

