# Claim Ledger

| claim | risk | domains | counter-search | primary? | status |
|---|---|---|---|---|---|
| AGENTIC PLAYER 10 official page is live at `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10` as of 2026-07-01. | high | b.kakao.com | Direct `curl -I -L` returned HTTP 200; no stronger contrary result found. | yes | verified |
| PlayMCP official homepage is live at `https://playmcp.kakao.com/` and titled `PlayMCP | 새로운 AI 경험의 시작` as of 2026-07-01. | normal | playmcp.kakao.com | Direct `curl -I -L` and body fetch returned HTTP 200/title; no contrary result found. | yes | verified |
| `https://playmcp.kakao.com/llms.txt` is an official PlayMCP agent guide index as of 2026-07-01. | normal | playmcp.kakao.com | Direct body fetch returned guide text; homepage advertises `/llms.txt`; no contrary result found. | yes | verified |
| `https://kko.to/player10` is the official guide short link referenced by the competition page and resolves to a Notion URL, but body content was not extractable through basic fetch. | high | b.kakao.com, notion.so | Direct event-page citation plus direct redirect trace; body fetch returned app shell only. | partial | unresolved |
| Prior official Kakao Tech post 818 contains prior MCP Player 10 lessons and winner examples. | normal | tech.kakao.com | One worker saw JS-gated body, but direct fetch exposed Nuxt embedded article data; stronger direct evidence retained. | yes | verified |
| Exact official PlayMCP review-policy body behind `kko.kakao.com/playmcp_review` was available in this session. | high | kko.kakao.com, notion.so | Direct fetch returned Notion app shell only. | partial | unresolved |

