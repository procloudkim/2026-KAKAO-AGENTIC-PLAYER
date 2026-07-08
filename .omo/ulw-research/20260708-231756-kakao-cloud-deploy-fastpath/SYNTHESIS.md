# KakaoCloud Deploy Fastpath Synthesis

Date: 2026-07-08

## Decision

Stop document cleanup for now. The next useful milestone is a deployed KakaoCloud HTTPS MCP endpoint that passes `/health`, MCP `initialize`, `tools/list`, and one `tools/call` smoke before PlayMCP temporary registration.

## Verified Facts

- Kakao AGENTIC PLAYER 10 requires creating a KakaoCloud MCP server endpoint, registering it in PlayMCP, using temporary registration for testing, requesting review only when final, switching to all-public after approval, and pressing `Player 예선 참여` once.
- KakaoCloud's public MCP tutorial supports the generic deployment path: containerize MCP server, push image to Container Registry, deploy on Kubernetes Engine, expose through LoadBalancer, associate public IP, and test the `/mcp` endpoint.
- MCP remote server transport should be Streamable HTTP with a single endpoint path such as `/mcp`.
- The repo has the app-side requirements: HTTP server, `/health`, `/mcp`, Dockerfile, `.dockerignore`, cache copied into image, and remote smoke script via `MCP_ENDPOINT`.
- Current local blocker: Docker CLI exists, but Docker daemon is not running at `npipe:////./pipe/dockerDesktopLinuxEngine`.

## Fastest Deployment Path

1. Use PlayMCP-in-KC managed server creation if the console offers it.
   - Build source: GitHub branch `family-experience-submission-prep` or private registry image.
   - Build context: `apps/family-experience-mcp`.
   - Runtime port: `3349`.
   - Health path: `/health`.
   - MCP path: `/mcp`.
   - Non-secret env: `HOST=0.0.0.0`, `PORT=3349`, `FAMILY_EXPERIENCE_ALLOW_FIXTURE=false`, `FAMILY_EXPERIENCE_ETL_CACHE_DIR=data/family-experience-cache`.

2. If PlayMCP-in-KC requires an uploaded image, fix Docker first.
   - Start Docker Desktop or use a remote builder.
   - Build AMD64 image from `apps/family-experience-mcp`.
   - Push to KakaoCloud Container Registry.
   - Deploy via the KakaoCloud MCP/Kubernetes tutorial or the contest console flow.

3. Use cache-first deployment for the first PlayMCP smoke unless the console now supports secrets.
   - This avoids baking provider API keys into an image.
   - Live provider keys can be added later through env/Secret injection if the console now supports it.
   - If env/Secret injection is still unavailable, baking keys into a private image is a human-approved temporary exception only.

## Commands

Local preflight:

```bash
npm --prefix apps/family-experience-mcp run verify
npm --prefix apps/family-experience-mcp run scan:secrets
npm --prefix apps/family-experience-mcp run scan:sources
npm --prefix apps/family-experience-mcp run scan:claims
```

Image build when Docker is running:

```bash
cd apps/family-experience-mcp
docker build --platform linux/amd64 -t family-experience-mcp:playmcp .
```

Remote smoke after endpoint exists:

```bash
curl -i https://<mcp-name>.playmcp-endpoint.kakaocloud.io/health
MCP_ENDPOINT=https://<mcp-name>.playmcp-endpoint.kakaocloud.io/mcp \
  npm --prefix apps/family-experience-mcp run smoke:mcp -- --cache-dir=data/family-experience-cache --skip-seed
```

## Immediate Blockers

| Blocker | Impact | Fast resolution |
| --- | --- | --- |
| Docker daemon unavailable | Cannot local-build or push image | Start Docker Desktop, or use remote KakaoCloud/GitHub build if available |
| Need actual KakaoCloud endpoint | PlayMCP cannot load tools yet | Create MCP server in PlayMCP-in-KC/KakaoCloud console |
| Secret injection status unknown | Determines live ETL vs cache-first | In console, confirm whether env/Secret injection is now available |
| HTTPS endpoint proof missing | Cannot claim deploy-ready | Run `/health` and remote MCP smoke after deployment |

## PlayMCP Fields

- Team: `Clouder`
- Representative image: `Main-image-KAKAO-MCP-10.png`; user confirmed rights.
- Name: `아이랑 어디가`
- Identifier: `family`
- Auth: no auth
- Endpoint: deployed KakaoCloud HTTPS `/mcp`
- Tool expectation: exactly `find_family_experiences`

## Next Smallest Safe Move

Open KakaoCloud/PlayMCP-in-KC console and determine the build input mode:

1. GitHub branch build supported?
2. Private Docker image required?
3. Env/Secret injection now supported?

That answer selects the execution path without more document work.
