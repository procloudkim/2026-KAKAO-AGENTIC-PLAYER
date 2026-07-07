# AGENTIC PLAYER 10 Requirement Recheck

Date: 2026-07-07

## Verdict

The contest does not ask for a generic local demo MCP. The preliminary path asks for a KakaoCloud-hosted MCP endpoint registered in PlayMCP, reviewed, switched to all-public after approval, and submitted once through the AGENTIC PLAYER 10 preliminary entry flow.

A one-off/static MCP may be enough for a private smoke or temporary registration, but it is not the winning-grade interpretation. The official evaluation includes creativity, convenience, stability, accurate data, and security. Finalists must also perform additional development for Kakao Tools, which has stricter MCP/spec expectations and widget-oriented UX.

## Official Minimum Gates

| Gate | Requirement | Current project status |
| --- | --- | --- |
| KakaoCloud endpoint | Create a KakaoCloud MCP server endpoint. | Not complete. Local Dockerfile and cache are prepared, but deployed HTTPS endpoint proof is absent. |
| PlayMCP registration | Register the KakaoCloud endpoint in PlayMCP. Temporary registration is for testing only. | Form values are prepared; endpoint is still missing. |
| Review request | Click registration/review request only after final server is ready. | Not complete. |
| Public switch | After approval, switch visibility from private to all-public. | Not complete. |
| Preliminary submission | Click AGENTIC PLAYER 10 Player preliminary entry button. Submission is one time only. | Not complete. |

## Winning-Grade Interpretation

| Dimension | Official signal | Practical implication for Family Experience MCP |
| --- | --- | --- |
| Creativity | New idea, problem solving, reach. | Strong if positioned as parent-first "age/date/region/weather-like condition to 3 actionable options" instead of generic event search. |
| Convenience | UI/UX that gives practical daily value. | Strong only if PlayMCP interaction returns concise, parent-ready packages: where, when, why age-fit, source, caveat, next action. |
| Stability | Stable operation, accurate data, no security issue. | Weak if only static fixture; acceptable for temporary smoke, but review should use real official-source cache or a clearly bounded verified cache. |
| Kakao Tools finalist path | Finalists must do additional development; stricter MCP standard and widget capability expected. | Current MCP should be designed as a reliable tool core now, then widget packaging later. |

## Answer To The Core Question

No: the hackathon is not simply asking for a disposable one-shot MCP if the goal is to compete seriously. The minimum workflow is endpoint registration and submission, but the judging bar explicitly rewards stable, accurate, secure, useful services. Therefore the right strategy is:

1. Submit a small, honest, reliable MCP, not a broad overclaiming MCP.
2. Use official-source cache/live ETL evidence where available.
3. Keep unsupported claims out: no nationwide completeness, no real-time guarantee, no reservation/open-now guarantee, no child-safety certification.
4. Treat PlayMCP temporary registration as smoke only.
5. Request review only after KakaoCloud HTTPS `/mcp` and tool discovery pass.

## Next Smallest Safe Move

Deploy the existing package to KakaoCloud PlayMCP-in-KC with the current `find_family_experiences` tool, smoke `/health` and `/mcp`, then run PlayMCP `정보 불러오기`. If live secret injection is unavailable, use the verified cache path with explicitly bounded claims, or wait for env/Secret support before review request.

