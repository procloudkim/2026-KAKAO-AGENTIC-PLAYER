# Intent Diff

| intent_id | expected truth | observed reality | diff | violated invariant | intent source | supporting observations | status | claim ids |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I1 | There is a fast, official path to deploy the MCP to KakaoCloud/PlayMCP-in-KC and get a public HTTPS `/mcp` endpoint. | Unknown until official docs and console requirements are checked. | TBD | Deployment must use official/accepted host path. | User request and organizer notice | pending | unknown | C1 |
| I2 | Current repo already has enough packaging/runtime material to deploy without new feature work. | Unknown until Docker/package/runbook inspection. | TBD | No unsupported implementation claims. | User request and QA docs | pending | unknown | C2 |
| I3 | PlayMCP can be tested after endpoint deployment via `정보 불러오기` and tool discovery. | Unknown until official flow is checked. | TBD | No review/public/submission claims before proof. | User request and PlayMCP docs | pending | unknown | C3 |
| I4 | API keys/secrets can be handled safely enough for a quick test deployment. | Unknown; organizer notice suggests a host-specific secret injection limitation. | TBD | No raw key leakage or unapproved baked-key path. | User request and HOST_REQUIREMENTS_SOT | pending | unknown | C4 |
