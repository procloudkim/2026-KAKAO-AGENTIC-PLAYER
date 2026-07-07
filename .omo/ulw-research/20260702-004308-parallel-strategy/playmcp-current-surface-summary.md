# PlayMCP Current Surface Summary

Date: 2026-07-02 KST

## Sources

- Official PlayMCP public page: https://playmcp.kakao.com/?page=0
- Official PlayMCP AI instructions: https://playmcp.kakao.com/llms.txt
- Public list API observed from PlayMCP frontend bundle: `https://playmcp.kakao.com/api/v1/mcps?page=0&sortBy=FEATURED_LEVEL&pageSize=12`
- Raw saved JSON: `raw/playmcp-public-page0-featured.json`
- Search-result raw JSON:
  - `raw/playmcp-keyword_pharmacy.json`
  - `raw/playmcp-keyword_baby.json`
  - `raw/playmcp-keyword_child.json`
  - `raw/playmcp-keyword_event.json`
  - `raw/playmcp-keyword_family.json`
  - `raw/playmcp-keyword_performance.json`

## Verified Facts

- PlayMCP describes itself as Kakao's MCP-based tool integration platform and playground. Users can explore MCP servers, connect them to agents such as Claude or ChatGPT, or test tools directly inside PlayMCP AI chat.
- Public MCP servers have an `id`, name, description, tool list, and starter messages. Only approved servers appear in the public list.
- Toolbox size is limited to 10 selected MCP servers.
- The public list API returned `totalElements=212` and `totalPages=18` for featured page 0 with page size 12.
- Featured page 0 included practical/action tools such as:
  - `찐맛집`: restaurant recommendation and place comparison.
  - `ArtBridge:20만 공연데이터 1초만에 내취향으로`: performance recommendation/search.
  - `네이버 검색 mcp`: Naver search and DataLab.
  - `카카오톡 나챗방`: chat/memo utility.
  - `미국 주식 정보`: stock data.
  - `띵동 - 택배 추적기`: delivery/fraud/convenience-store utility.
  - `아파트 정보`: apartment data.
  - `PlayMCP 방탈출`: game/entertainment.
- Latest page 0 also shows lightweight utility/novelty tools, including phishing detection, gift finder, grocery shopping, lunar calendar conversion, writing, ship terminology, and romance personality testing.

## Idea-Overlap Checks

Searches were run against the observed public list API.

| Search keyword | Result count | Material overlap |
|---|---:|---|
| `약국` | 1 | `병원 · 약국 정보 조회`, with holiday/open pharmacy and hospital lookup tools. Strong direct overlap with holiday pharmacy. |
| `육아` | 0 | No direct keyword overlap found. |
| `아이` | 1 | `KidSafe - 아이를 위한 AI 구명조끼`; child-protection content-safety, not baby-product safety. |
| `체험` | 0 | No direct keyword overlap found. |
| `가족` | 0 | No direct keyword overlap found. |
| `공연` | 1 | `ArtBridge`, strong performance-event overlap but not child-age/family-experience specific. |
| `어린이` | 0 | No direct keyword overlap found. |
| `보육` | 1 | `보육나침반`, childcare administration and guideline support, not family outings or product-safety shopping support. |
| `행사` | 0 | No direct keyword overlap found. |
| `전시` | 0 | No direct keyword overlap found. |
| `박물관` | 0 | No direct keyword overlap found. |
| `체험학습` | 0 | No direct keyword overlap found. |
| `리콜` | 0 | No direct keyword overlap found. |
| `안전` | 0 | No direct keyword overlap found. |
| `유아` | 0 | No direct keyword overlap found. |
| `아기` | 0 | No direct keyword overlap found. |

## Registration/Review Surface

PlayMCP frontend bundle strings show:

- Registration has `임시 등록` and `등록 및 심사 요청`.
- Temporary registration can be used to test privately and then request review later.
- Endpoint validation tries to load MCP server tool information; if tools cannot be found, the UI reports that the MCP server settings should be checked.
- Status values include `CREATED`, `REVIEW_REQUESTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, and `REVIEW_REQUIRED_BY_CHANGE`.
- Form constraints found in the bundle include representative image, MCP name, identifier, description, starter messages, auth method, endpoint, and tool list/response visibility.

## Interpretation

- The user's thesis is supported: the visible PlayMCP surface is not only entertainment. Highly visible entries are practical tools that convert fuzzy chat into a short action or decision.
- Three-way full implementation is strategically risky because the contest flow rewards one reviewable, stable, public MCP more than three half-built prototypes.
- Three-way research/prototype comparison remains useful because the public list has overlap risk:
  - Pharmacy is practical but already crowded by a direct hospital/pharmacy MCP.
  - Family experience has performance-event overlap through ArtBridge, but the child-age, parent constraints, and experience/outdoor/education framing are still meaningfully distinct.
  - Parent-trust product safety appears least directly represented, but carries the highest wording/evidence risk.
