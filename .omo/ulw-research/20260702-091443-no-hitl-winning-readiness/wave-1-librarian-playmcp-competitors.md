# Wave 1 - PlayMCP Public Marketplace Competitor Gap

Worker: `019f202e-d6ab-7240-87cf-2037ab414c0f`

## Key Findings

- Public catalog exists and is paginated; worker observed `totalElements=212` and `totalPages=18`.
- No direct public PlayMCP server was found that is clearly an age-aware family outing recommender.
- Strong adjacent competitors:
  - `키즈허브` (`id=342`) for child/age-aware household and childcare utilities.
  - `ArtBridge` (`id=489`) for performance recommendation and event ranking surface.
  - `한국관광공사 Tour MCP` (`id=192`) for tourism/festival/accessibility discovery.
  - `Korea Culture MCP` (`id=408`) for culture/event recommendation breadth.
  - `서울 관광`, `팝업라이브`, `카카오맵`, and `톡캘린더` as adjacent discovery/planning layers.
- Differentiation should combine explicit age bands, family constraints, indoor/outdoor/weather sensitivity, accessibility, event/culture scoring, transit/time feasibility, and concise Top 3 action cards.

## Sources

- https://playmcp.kakao.com/
- https://playmcp.kakao.com/llms.txt
- https://playmcp.kakao.com/api/v1/mcps?page=0&sortBy=FEATURED_LEVEL&pageSize=12
- https://playmcp.kakao.com/api/v1/mcps?page=0&sortBy=FEATURED_LEVEL&pageSize=12&searchKeyword=%EA%B3%B5%EC%97%B0
- https://playmcp.kakao.com/api/v1/mcps/489
- https://playmcp.kakao.com/api/v1/mcps/342
- https://playmcp.kakao.com/api/v1/mcps/192
- https://playmcp.kakao.com/api/v1/mcps/62
- https://playmcp.kakao.com/api/v1/mcps/60636710119191984

## EXPAND

- LEAD: Page-by-page catalog scrape for all 18 pages with normalized `id/name/identifyName/tools/keywords` — WHY: keyword search alone may miss semantic competitors — ANGLE: run a no-write or journaled API scrape and produce competitor CSV/MD.
- LEAD: Neighbor-competitor matrix against external MCP marketplaces and public family-oriented tools — WHY: winning strategy depends on broader MCP/product wedge, not only PlayMCP — ANGLE: compare known adjacent MCP categories.
- LEAD: Age-band taxonomy draft for a family outing recommender wedge — WHY: this is the main differentiation from existing child and event tools — ANGLE: produce age-stage taxonomy and mapping rules.

## CLAIMS

- CLAIM: No direct age-aware family outing recommender was found in the public PlayMCP catalog sweep — RISK: high — SOURCES: playmcp.kakao.com — COUNTER: direct keyword/API sweep only, semantic/private servers remain possible — PRIMARY: PlayMCP public catalog API.
- CLAIM: `키즈허브`, `ArtBridge`, `Tour MCP`, and `Korea Culture MCP` are closest adjacent competitors — RISK: normal — SOURCES: playmcp.kakao.com — COUNTER: public catalog detail search — PRIMARY: PlayMCP public detail API.
