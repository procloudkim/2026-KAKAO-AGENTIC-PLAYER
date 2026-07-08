# Family Experience MCP Deploy Readiness Synthesis

Access date: 2026-07-08

## Core Question

What is needed, and what is still missing, to move the pushed
`family-experience-submission-prep` branch to public HTTPS deployment and
PlayMCP temporary/private information-load validation without claiming review,
public release, or contest submission?

## Verified Local Facts

- Branch is `family-experience-submission-prep`.
- Upstream is `origin/family-experience-submission-prep`.
- HEAD is `a6ad31b add family experience mcp submission package`.
- Worktree was clean before this research artifact was created.
- `apps/family-experience-mcp/Dockerfile` exists and is configured for
  Node 22, `HOST=0.0.0.0`, `PORT=3349`, `/health` healthcheck, and
  `node dist/src/server.js`.
- `apps/family-experience-mcp/.dockerignore` excludes `.env`, `.env.*`,
  `.omo`, `node_modules`, `dist`, `test`, and docs.
- `.env.example` defines the expected secret names and marks local `.env` and
  deployment secret manager as the normal places for provider-issued keys.
- Name-only local `.env` check found `SEOUL_OPEN_DATA_KEY`,
  `CULTURE_PORTAL_SERVICE_KEY`, and `KTO_TOURAPI_SERVICE_KEY` present.
- Name-only local `.env` check found `PUBLIC_DATA_STANDARD_SERVICE_KEY` and
  `FAMILY_EXPERIENCE_PUBLIC_BASE_URL` missing.
- Docker CLI exists, but Docker daemon is unavailable:
  `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`.
- Current app verification passed: `npm run verify`, `scan:secrets`,
  `scan:sources`, and `scan:claims`.

## External Facts

- KakaoCloud's public Kubernetes MCP tutorial describes a container path:
  prepare app, build a Docker image, push to Container Registry, create a
  Kubernetes cluster, expose through a LoadBalancer, then test `/mcp` with curl.
- The same KakaoCloud tutorial lists Docker, Terraform, IAM access key, and uv
  as prerequisites for its example path, and says remote Kubernetes cannot use
  stdio transport.
- The KakaoCloud tutorial specifically shows MCP initialize, tools/list, and
  tools/call curl checks against the deployed `/mcp` endpoint.
- The AGENTIC PLAYER 10 official page says preliminary participation requires
  creating a KakaoCloud MCP server endpoint, registering it in PlayMCP, using
  temporary registration for non-final testing, requesting review only when the
  final MCP is ready, switching to public visibility after review, and finally
  pressing the preliminary participation button.
- The AGENTIC PLAYER 10 official page says the criteria include creativity,
  convenience, stable operation, accurate data, and no security issues.
- The MCP Inspector official docs say Inspector can test connectivity,
  capability negotiation, tools, schemas, tool execution, and edge cases.

## User-Provided Host-Specific FAQ Boundary

The user provided contest guidance saying PlayMCP in KC endpoint format should
be `https://mcp-name.playmcp-endpoint.kakaocloud.io/mcp`, outbound egress IPs
are `210.109.82.101/32` and `210.109.54.0/24`, and current PlayMCP in KC
environment/Secret injection is not supported, requiring private GitHub or
private Docker registry plus image-baked API keys until the prepared environment
variable feature ships.

This was not confirmed in the public KakaoCloud tutorial page fetched in this
session, so treat it as host-specific contest FAQ, not a general KakaoCloud
Kubernetes rule.

## Needed vs Missing

| Area | Needed | Current State | Verdict |
|---|---|---|---|
| GitHub source | Pushed deployable branch | Branch/upstream/HEAD match remote | Ready |
| PR/main | Decide whether deployment can target branch or requires main merge | Not determined from console | Human/UI decision |
| Docker build | `docker build --platform linux/amd64` or equivalent remote build proof | Docker daemon unavailable locally | Blocked locally |
| Runtime proof | Container or hosted process responds on `/health` and `/mcp` | Local tests passed; no public endpoint | Missing |
| Public endpoint | `https://<name>.playmcp-endpoint.kakaocloud.io/mcp` | `FAMILY_EXPERIENCE_PUBLIC_BASE_URL` missing | Missing |
| Secrets | Provider keys available without leaking raw values | Seoul/Culture/KTO present locally by name; deployment injection unresolved | Blocked by host policy |
| National festival | CSV canonical fallback path | API key not required for fallback | Ready |
| PlayMCP temp registration | image, name, id, description, examples, auth, endpoint | Copy/image ready; endpoint missing | Blocked by endpoint |
| Information load | PlayMCP console loads tools from deployed endpoint | Not run | Missing |
| Starter prompt smoke | 3 prompts return bounded sourced answers | Local/golden tests passed; PlayMCP smoke not run | Missing |
| Review/public/submission | Review request, approval, public switch, one-time entry | Explicitly not done | Not ready |

## Immediate Decision

Do not press review/submission yet. The next real work is to choose and execute
the KakaoCloud deployment path, with special attention to the Secret handling
exception. If PlayMCP in KC still cannot inject environment variables, the
operator must explicitly choose one of:

1. wait for env/Secret support,
2. use private registry or private GitHub with a temporary image-baked key
   exception plus rotation/removal plan,
3. deploy cache-only/no-live-key mode if it still satisfies contest and product
   claims,
4. use another allowed KakaoCloud route that provides equivalent public HTTPS
   endpoint and secret handling.

## Next Minimal Tasks

1. Open KakaoCloud/PlayMCP-in-KC console and determine whether deployment can
   use the pushed branch directly or requires main merge/private registry.
2. Restore Docker daemon or use KakaoCloud remote build proof; do not claim
   Docker runtime PASS until build and run smoke are observed.
3. Once endpoint exists, run remote `/health`, MCP initialize/tools/list/tool
   call, then PlayMCP temporary registration and information-load smoke.
