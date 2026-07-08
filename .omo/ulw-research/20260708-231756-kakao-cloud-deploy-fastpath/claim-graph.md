# Claim Graph

## verified-claims

Pending.

| claim_id | statement | claim type | risk tier | scope | intent ids | supporting observations | contradicting observations | independent observation groups | convergence status | counter-search result | primary source backing | dependencies | status | final synthesis location |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | Official deployment/test flow requires KakaoCloud/PlayMCP endpoint before PlayMCP information load. | external process | high | deployment | I1,I3 | pending | pending | pending | pending | pending | pending | none | unresolved | pending |
| C2 | Current repo has Docker/runtime/package scripts sufficient to attempt deployment. | repo state | high | repo | I2 | pending | pending | pending | pending | pending | repo files | none | unresolved | pending |
| C3 | The immediate next milestone is public HTTPS `/health` and `/mcp` smoke, not further document cleanup. | synthesis | normal | plan | I1,I2,I3 | pending | pending | pending | pending | pending | docs+repo | C1,C2 | unresolved | pending |
| C4 | Secret strategy is the main human decision before KakaoCloud deployment if env/Secret injection is unavailable. | external process/security | high | deployment | I4 | pending | pending | pending | pending | pending | organizer/host docs | none | unresolved | pending |
