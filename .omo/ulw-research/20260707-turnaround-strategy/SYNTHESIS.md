# Family Experience MCP Turnaround Strategy

Date: 2026-07-07

## Executive Verdict

The situation is recoverable. The current package is not market-ready, but it is not a failed project. The fastest path is to stop expanding scope and convert the existing narrow MCP into a judge-trustworthy submission with hard evidence: deployed `/mcp`, PlayMCP information load, official-source cache proof, and bounded claims.

The weak point is not the tool idea. The weak point is that the official contest bar includes stable operation, accurate data, and no security issue, while current proof is still mostly local. A one-off fixture demo may pass a private smoke but is strategically weak for judging.

## Current Truth

| Area | Status | Evidence |
| --- | --- | --- |
| Local implementation | Green | `npm run verify` passed on 2026-07-07: 17 test files / 90 tests. |
| Tool shape | Focused | CodeGraph found the typed result schema, parent action-card fields, source labels, and cache-first query path. |
| Data pipeline | Partially credible | Local docs record Culture Portal API and ETL proof, but this session's local `.env` key probe shows provider keys missing. |
| Deployment | Blocked | Docker daemon is unavailable in this session; KakaoCloud HTTPS endpoint proof is absent. |
| PlayMCP submission | Not complete | Local SOT says review/public/submission are not done. |
| Market readiness | Not ready | No scheduled ETL, no production monitoring, no deployed evidence, no broad coverage guarantee. |

## Official Requirement Read

Kakao's contest page says preliminary participation is by registering and applying with a PlayMCP server, selecting 20 finalists. It also says finalists undergo additional development for Kakao Tools before public voting and final judging.

The official preliminary flow is:

1. Create an MCP endpoint in KakaoCloud.
2. Register it in PlayMCP.
3. Use temporary registration only for testing.
4. Request review when the final server is ready.
5. After approval, switch from private to all-public.
6. Submit the AGENTIC PLAYER 10 preliminary entry once.

The official judging criteria include creativity, convenience, stability, accurate data, and no security issue. Therefore, a disposable MCP is not the correct target if the goal is to win.

## Turnaround Plan

### P0: Stop The Bleeding

Decision: freeze feature scope.

Do not add:

- booking/reservation
- open-now status
- full nationwide guarantee
- safety certification
- user accounts
- Kakao gift integration

Keep:

- one tool: `find_family_experiences`
- max 3 candidates
- child age/stage, date, location
- source, age-fit reason, parent check, next action

Why: this directly maps to daily usefulness while keeping the stability surface small.

### P1: Make It Reviewable

Goal: convert "local MVP" into "remote MCP that Kakao can inspect."

Required evidence:

1. Docker daemon or KakaoCloud build path available.
2. Container image built for `linux/amd64`.
3. KakaoCloud HTTPS endpoint issued.
4. `curl -i https://.../health` passes.
5. MCP initialize request to `https://.../mcp` passes.
6. PlayMCP `정보 불러오기` discovers `find_family_experiences`.

Go/no-go:

- GO if `/mcp` and PlayMCP discovery pass.
- NO-GO if only local smoke passes.

### P2: Make The Data Claim Honest

Goal: be credible without pretending to have perfect coverage.

Minimum acceptable submission claim:

> 공식 출처 또는 검증 캐시 기반으로 조건에 맞는 가족 체험 후보를 정리합니다. 출처가 뒷받침하지 않는 예약 가능 여부, 운영 상태, 전국 완전 커버리지, 안전 인증은 확정하지 않습니다.

Required evidence:

1. Restore provider keys locally or use the current KakaoCloud secret path if available.
2. Run at least Culture Portal live ETL or cache generation with redacted diagnostics.
3. Include generated cache in image or configure startup/predeploy cache refresh.
4. Verify returned candidates expose source URL, retrieved_at, warning, parent_check.

Go/no-go:

- GO if at least one official-source live/cache proof exists and result text is bounded.
- NO-GO if all results are fixture-only and not clearly labelled.

### P3: Make The UX Judge-Friendly

Goal: show why this is better than search.

Test exactly 10 starter prompts:

1. 서울 이번 주말 4살 실내
2. 부산 내일 24개월 비올 때
3. 제주 초등 저학년 주말 행사
4. 서울 6개월 아기 갈 곳
5. 경기 7살 무료 체험
6. 오늘 근처 아이랑 박물관
7. 다음 주말 유아 야외 행사
8. 비오는 날 5살 체험
9. 초등학생 방학 체험
10. 결과 없을 때 대체 안내

Pass rule:

- each response has at most 3 candidates
- each candidate has source, schedule/location, age-fit basis, caveat, next action
- unsupported availability/safety claims do not appear

### P4: Package For Submission

Required assets:

- representative image: `Main-image-KAKAO-MCP-10.png`
- MCP name: `아이랑 어디가`
- identifier: `family`
- description under 500 chars with bounded claims
- 3 starter prompts
- endpoint URL
- smoke screenshots or copied console evidence

Stop line:

- Do not click `등록 및 심사 요청` until `/mcp` remote smoke and PlayMCP information load both pass.

## Ranking Of Actions

| Rank | Action | Why it matters | Owner |
| --- | --- | --- | --- |
| 1 | Start Docker Desktop or use KakaoCloud build path | Without image/deploy proof, no real submission. | Human/operator |
| 2 | Decide secret strategy | Current `.env` keys are missing; live ETL proof depends on keys. | Human/operator |
| 3 | Deploy HTTPS `/mcp` | Official gate. | Human + Codex guidance |
| 4 | Run remote `/health` and `/mcp` smoke | Turns local MVP into inspectable MCP. | Codex/operator |
| 5 | Run PlayMCP `정보 불러오기` | Confirms platform sees the tool. | Human in console |
| 6 | Run 10-prompt UX smoke | Converts technical proof into judge-facing utility proof. | Codex/operator |
| 7 | Request review | Only after evidence chain closes. | Human |

## Bottom Line

The project is not currently market-grade. It can still become a credible hackathon preliminary submission if the next work is operational proof, not new features. The winning angle is: small, honest, parent-ready, source-grounded answers inside KakaoTalk-like chat. The fatal mistake would be claiming full nationwide freshness or adding broad features before the endpoint and data evidence are real.

