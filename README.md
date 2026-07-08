# 아이랑 어디가 MCP

Kakao AGENTIC PLAYER 10 / PlayMCP in KC 배포용 MCP 서버입니다.

아이 나이, 날짜, 지역, 실내외 조건을 바탕으로 공식 출처 또는 검증된 캐시에서 가족 체험 후보를 최대 3개까지 정리합니다. 예약 가능 여부, 현재 운영 중 여부, 모든 지역과 행사의 포함 여부, 아동 적합성 보장은 제공하지 않습니다.

## PlayMCP in KC Git 소스 빌드 입력값

```text
MCP 서버 이름:
airang-where

설명:
아이와 함께 갈 가족 체험 후보를 추천하는 MCP 서버 배포본입니다.

Git URL:
https://github.com/procloudkim/2026-KAKAO-AGENTIC-PLAYER.git

브랜치 / ref:
family-experience-kc-submit-minimal

Dockerfile 경로:
Dockerfile

컨테이너 포트:
3349
```

비공개 GitHub 저장소이므로 PlayMCP in KC의 `PAT` 입력칸에 GitHub Personal Access Token을 넣어야 합니다. PAT는 저장소 clone에 필요한 읽기 권한만 부여하고, 코드나 문서에 커밋하지 않습니다.

루트 `Dockerfile`은 PlayMCP in KC의 Git 소스 빌드처럼 저장소 루트를 빌드 컨텍스트로 사용하는 경로에 맞춰져 있습니다. 로컬에서 같은 조건을 재현할 때는 저장소 루트에서 `docker build -f Dockerfile .` 형식으로 실행합니다.

## 환경변수

일반 환경변수:

```text
HOST=0.0.0.0
PORT=3349
FAMILY_EXPERIENCE_ALLOW_FIXTURE=false
FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache
FAMILY_EXPERIENCE_SOURCE_SET=seoul,culture_portal,kto_tourapi,national_festival
FAMILY_EXPERIENCE_ETL_TTL_HOURS=24
SEOUL_OPEN_DATA_BASE_URL=http://openapi.seoul.go.kr:8088
CULTURE_PORTAL_BASE_URL=https://apis.data.go.kr/B553457/cultureinfo
KTO_TOURAPI_BASE_URL=https://apis.data.go.kr/B551011/KorService2
```

시크릿:

```text
SEOUL_OPEN_DATA_KEY
CULTURE_PORTAL_SERVICE_KEY
KTO_TOURAPI_SERVICE_KEY
```

`PUBLIC_DATA_STANDARD_SERVICE_KEY`는 현재 CSV/cache fallback 기준에서는 필수 입력값이 아닙니다.

## PlayMCP 등록 입력값

```text
팀프로필:
Clouder

대표 이미지:
Main-image-KAKAO-MCP-10.png

MCP 이름:
아이랑 어디가

MCP 식별자:
family

인증 방식:
인증 사용하지 않음
```

MCP 설명:

```text
언제 어디서든 아이와 함께 갈 곳 정보를 큐레이션합니다. 아이 나이, 날짜, 지역, 실내외 조건을 바탕으로 가족 체험 후보를 최대 3개까지 정리해 주는 MCP입니다. 공식 출처 또는 검증된 캐시를 기반으로 장소, 일정, 나이 적합 근거, 출처, 보호자 확인사항, 다음 행동을 함께 제공합니다. 출처가 뒷받침하지 않는 예약 가능 여부, 운영 상태, 전국 모든 행사 포함, 아동 적합성 보장은 제공하지 않습니다.
```

대화 예시:

```text
이번 주말 서울에서 4살 아이와 갈 만한 실내 체험 장소를 추천해줘.
내일 비가 오는데 24개월 아이와 갈 수 있는 키즈 체험이나 박물관을 찾아줘.
초등학교 저학년 아이와 주말에 갈 수 있는 가족 행사 3개를 출처와 함께 정리해줘.
```

## 배포 후 확인 순서

1. PlayMCP in KC에서 서버 상태가 `Active`인지 확인합니다.
2. 서버 상세 화면에서 Endpoint URL을 복사합니다.
3. PlayMCP 등록 콘솔의 MCP Endpoint에 발급된 `/mcp` URL을 입력합니다.
4. `정보 불러오기`를 눌러 `find_family_experiences` tool이 로드되는지 확인합니다.
5. 먼저 `임시 등록`으로 저장하고 private 상태에서 대화 예시 3개를 테스트합니다.
6. remote `/health`, remote `/mcp`, PlayMCP 정보 불러오기, private smoke가 통과한 뒤에만 `등록 및 심사 요청`을 판단합니다.

## 로컬 검증

```bash
npm --prefix apps/family-experience-mcp run verify
npm --prefix apps/family-experience-mcp run scan:secrets
npm --prefix apps/family-experience-mcp run scan:sources
npm --prefix apps/family-experience-mcp run scan:claims
```

## 공개 범위 주의

이 저장소를 public으로 전환하면 GitHub에 push된 브랜치와 커밋 이력도 공개 대상이 됩니다. 현재 권장 경로는 저장소를 private으로 유지하고 PlayMCP in KC Git 소스 빌드에 PAT를 입력하는 방식입니다.

## License

MIT License. See `LICENSE`.
