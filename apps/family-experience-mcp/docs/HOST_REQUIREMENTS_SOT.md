# Host Requirements SOT

Purpose: single source of truth for host, organizer, and PlayMCP-in-KC requirements before submitting `아이랑 어디가`. This document records only deployment and submission constraints. It is not proof that deployment, review, public release, or contest submission has happened.

Last checked: 2026-07-09.

## Canonical Responsibilities

| Truth | Canonical home |
| --- | --- |
| Product PRD, users, output contract, and product launch criteria | `docs/PRODUCT_PRD_SOT.md` |
| Kakao / PlayMCP / MCP protocol / deployment requirements applied to this project | This document |
| Local extracted Kakao / PlayMCP guide corpus map | `docs/KAKAO_PLAYMCP_GUIDE_SOT.md` |
| Current PASS/BLOCKED/NOT CLAIMED status | `docs/QA_REPORT.md` |
| PlayMCP console field values | `docs/PLAYMCP_TEMP_REGISTRATION.md` |

## Evidence Boundary

| Evidence level | Source | What it supports | Boundary |
| --- | --- | --- | --- |
| Official public | `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10` | AGENTIC PLAYER 10 flow: create KakaoCloud MCP endpoint, register in PlayMCP, use temporary registration for testing, request review when final, switch to all-public after approval, then submit once. | Does not publish the exact `playmcp-endpoint.kakaocloud.io` hostname pattern in fetched text. |
| Official public | `https://modelcontextprotocol.io/` | MCP is the standard protocol for connecting AI applications to external tools, data, and workflows. | Standard-level docs, not Kakao contest ops. |
| Official public | `https://modelcontextprotocol.io/docs/tools/inspector` | MCP Inspector is an interactive tool for testing/debugging MCP servers and inspecting tools, schemas, and execution results. | Inspector proof still requires running it against the deployed endpoint. |
| Official public | `https://docs.kakaocloud.com/en/tutorial/container/k8s-engine-mcp` | KakaoCloud remote MCP deployment is HTTPS/load-balancer oriented; `stdio` is local-process transport and not suitable for remote Kubernetes. | General KakaoCloud MCP tutorial, not the PlayMCP-in-KC managed contest service. |
| Official public | `https://playmcp.kakao.com/` and Kakao Corp/Tech pages | PlayMCP is Kakao's public MCP platform surface. | Public pages do not replace the contest console workflow. |
| Organizer Notion extract | `docs/external/kakao-playmcp-in-kc-notion/` | PlayMCP-in-KC Git source build, container image build, contest participation order, PlayMCP review policy, and server development requirements. | Extracted from public Notion `loadPageChunk` on 2026-07-08; raw snapshots remain local evidence under `.omo/ulw-research/20260708-235718-kakao-playmcp-notion-extraction/`. |
| Organizer notice excerpt | User-provided PlayMCP-in-KC notice in this workspace on 2026-07-07 | Exact endpoint pattern, console update path, outbound egress IP allowlist, and current secret/env-var limitation. | The short links redirected through a page this environment could not fetch; treat the quoted notice as organizer-supplied contest guidance. |

## Current Gaps To Confirm

The contest/deployment text corpus is now locally collected, but these items cannot be finalized from static text:

1. Current PlayMCP-in-KC support for environment variables or Secrets after the 2026-07-07 organizer notice.
2. Actual endpoint URL issued by the PlayMCP-in-KC console after deployment.
3. PlayMCP identifier availability at registration time.
4. Whether `정보 불러오기` succeeds against the deployed endpoint.
5. Whether starter prompts work from PlayMCP temporary/private AI chat.
6. Whether review, all-public switch, and AGENTIC PLAYER 10 preliminary submission have actually been performed.

Do not request more planning text before these checks; request only the missing console/runtime evidence when the operator reaches each step.

## Endpoint Requirement

For AGENTIC PLAYER 10 submission, update the PlayMCP MCP endpoint to the KakaoCloud PlayMCP-in-KC endpoint format provided by the organizer notice:

```text
https://mcp-name.playmcp-endpoint.kakaocloud.io/mcp
```

Rules:

- Endpoint must be the deployed KakaoCloud PlayMCP-in-KC URL, not `localhost`, a fixture URL, or a generic local tunnel.
- Endpoint must end with `/mcp`.
- Do not claim endpoint readiness until `/health` and `/mcp` have been smoke-tested against the deployed HTTPS endpoint.
- If the actual KakaoCloud console issues a different hostname, the console-issued HTTPS `/mcp` endpoint wins. Record the issued URL in private deployment evidence, not in public docs if it contains secrets or private tokens.

## PlayMCP Update Flow

Use this operator flow from the organizer notice and Notion contest guide:

1. Open developer console.
2. Open the registered MCP.
3. Expand MCP information.
4. Click `수정`.
5. Change `MCP Endpoint` to the KakaoCloud PlayMCP-in-KC HTTPS `/mcp` endpoint.
6. Click `정보 불러오기`.
7. Verify tool discovery returns exactly one public tool: `find_family_experiences`.
8. Use `임시 등록` first and test from the PlayMCP preview/toolbox/AI chat flow.
9. Click `등록 및 심사 요청` only after endpoint smoke, PlayMCP private smoke, and copy/claim scans pass.

Stop lines:

- Temporary/private testing is not final review.
- `등록 및 심사 요청` is not complete until the console action is actually performed.
- Contest entry is not complete until the AGENTIC PLAYER 10 `Player 예선 참여` submission is performed. The official page says submission is one time only.

## PlayMCP-in-KC Egress Allowlist

If an upstream provider requires outbound IP allowlisting for requests made by the deployed KakaoCloud container, allow these organizer-provided egress ranges:

```text
210.109.82.101/32
210.109.54.0/24
```

If only one value can be registered, use:

```text
210.109.82.101/32
```

Apply these only in provider consoles that support IP allowlists. Do not put API keys or provider allowlist screenshots into public docs.

## PlayMCP-in-KC Deployment Modes

The organizer Notion guide confirms that PlayMCP-in-KC can create an MCP server from either Git source or a container image.

Git source build requires:

- `https://playmcp.kakaocloud.io` login with the Kakao account registered in PlayMCP.
- `+ 새 MCP 서버 등록` then `Git 소스 빌드`.
- MCP server name and description for the PlayMCP-in-KC console. These are separate from the PlayMCP public registration copy.
- Git URL.
- Branch/ref, usually `main` unless another branch is intentionally selected.
- Dockerfile path, usually `Dockerfile`.
- PAT only when the repository is private.
- A Dockerfile present at the repository root or configured Dockerfile path.
- Wait for `Status: Starting` to become `Active`, then copy the issued Endpoint URL from the server detail page.

Container image registration requires:

- `+ 새 MCP 서버 등록` then `이미지 등록`.
- Image built for `linux/amd64`; `arm64` images can fail activation.
- Registry host such as `docker.io` or `ghcr.io`.
- Registry user/password only when the registry or image is private.
- `image_name` and `image_tag`.
- Wait for `Status: Starting` to become `Active`, then copy the issued Endpoint URL from the server detail page.

PlayMCP-in-KC server count limit from the Notion guide:

- Up to 2 MCP servers can be registered per account for this environment.

Update handling after contest entry:

1. Delete the existing MCP server in PlayMCP-in-KC.
2. Create a new MCP server.
3. Reuse the same MCP server name.
4. In PlayMCP, edit the registered MCP, run `정보 불러오기` again, and request review again.

## PlayMCP Server Development Requirements

The PlayMCP server development guide extracted on 2026-07-08 adds these submission gates:

- MCP protocol version support must include minimum `2025-03-26` and maximum `2025-11-25`.
- PlayMCP supports Streamable HTTP only for this remote server path.
- Remote MCP servers must be reachable through a public URL.
- Stateless MCP servers are recommended.
- MCP Inspector should be used before registration.
- Use or reference actively maintained MCP SDKs.
- MCP Server Name or Tool Name must not contain `kakao` as prefix, suffix, or middle text, case-insensitively, unless separately agreed.
- Tool names must be 1 to 128 characters and use only English letters, digits, underscore, or hyphen.
- Tool names must be unique and case-sensitive.
- Tool count should not exceed 20; 3 to 10 tools are recommended.
- Tool definitions must include `name`, `description`, `inputSchema`, and `annotations`.
- `annotations` must explicitly set `title`, `readOnlyHint`, `destructiveHint`, `openWorldHint`, and `idempotentHint`.
- Tool description should be English where possible, include the MCP/service name, include Korean and English for proper nouns, and stay within 1,024 characters.
- Kakao Tools automatically prefixes tool names with the PlayMCP identifier, so the local tool name should not repeat the MCP name.
- Tool call result size should be minimal; error and non-widget responses should use cleaned text/Markdown rather than raw upstream API payloads.
- Tool response text over 24k can be treated as an error and become a review rejection reason.
- Operational performance target from the guide: average tool response within 100ms and p99 within 3,000ms.

Family Experience implication:

- Keep the public tool surface narrow: `find_family_experiences` remains a good fit.
- Do not add `kakao` to server/tool names.
- Keep responses capped to the curated top candidates and source/caveat fields, not raw provider records.
- Re-run MCP Inspector or an equivalent initialize/tools/list/tools/call smoke before PlayMCP `정보 불러오기`.

## PlayMCP Review Policy Requirements

The extracted review policy adds these rejection risks:

- MCP Server must include at least one tool.
- Excessive tool count can make tool selection difficult; 3 to 20 tools are recommended by review policy.
- Standard-spec violations or abnormal behavior can cause rejection.
- Third-party auto-generated MCP servers can be rejected if ownership or policy compliance is unclear.
- Repeatedly submitting the same functional MCP with only name/copy/output changes can be limited.
- MCPs that only duplicate what an LLM can already do through ordinary web search can be rejected or restricted unless the MCP clearly extends the LLM.
- Low stability, low creativity, or inconsistent responses can trigger non-public status or improvement requests.
- Names and descriptions must clearly communicate function; abstract or vague copy can trigger revision requests.
- Data source must be clear; operators may ask for data source and composition proof.
- Unauthorized data reports can lead to non-public status until usage rights are proven.
- Tools must be pre-tested and return without errors.
- Slow or timeout-prone tools, excessive redirects, crawling delays, or unnecessary external calls can be rejection reasons.
- Commercial links, purchase inducements, reward offers, harmful file downloads, profanity, political/sexual content, or socially inappropriate content can be rejection reasons.
- If authentication is required and credentials are absent or expired, return HTTP `401`.
- Representative image must not be animated and must match the service; low-quality or inappropriate images can be rejected.
- PlayMCP currently does not handle MCP Resource or Prompt information.

## Secrets And Environment Variables

Organizer notice excerpt says that, as of the notice quoted in this workspace on 2026-07-07, PlayMCP-in-KC does not yet support environment variable or Secret injection. The notice says external environment variable injection is being prepared for July week 2.

This conflicts with the repository's normal security rule: provider keys should be supplied through local `.env` or deployment secret managers and should not be baked into images.

Decision:

- Default security rule remains: do not commit `.env`, raw keys, keyed URLs, cookies, bearer tokens, or provider secrets.
- Local keys belong only in `apps/family-experience-mcp/.env`, copied from `.env.example`.
- For non-KC platforms, use platform secret/environment-variable support.
- For KakaoCloud/PlayMCP-in-KC after env or Secret injection is available, use the same variable names from `.env.example` and inject provider keys as server-side secrets.
- For PlayMCP-in-KC before secret injection exists, image-baked API keys are a host-specific temporary exception, not the default deployment pattern.
- The image-baked exception is `HUMAN_APPROVAL_REQUIRED` and cannot be selected by an agent or automated runbook default.
- That exception requires explicit human approval, private GitHub repository or private Docker registry, no raw-key logs, post-submit key rotation plan, and removal once PlayMCP-in-KC env/Secret injection becomes available.
- Do not edit `.env` or bake keys automatically from this runbook. A human operator must choose the secret strategy.

Secret placement matrix:

| Key | Local `.env` | KakaoCloud/PlayMCP-in-KC preferred path | Non-Kakao preferred path | Image-baked exception |
| --- | --- | --- | --- | --- |
| `SEOUL_OPEN_DATA_KEY` | Yes | Env or Secret injection when available | Secret manager env var | `HUMAN_APPROVAL_REQUIRED` only |
| `CULTURE_PORTAL_SERVICE_KEY` | Yes | Env or Secret injection when available | Secret manager env var | `HUMAN_APPROVAL_REQUIRED` only |
| `KTO_TOURAPI_SERVICE_KEY` | Yes | Env or Secret injection when available | Secret manager env var | `HUMAN_APPROVAL_REQUIRED` only |
| `PUBLIC_DATA_STANDARD_SERVICE_KEY` | Optional for live standard-data endpoint only | Env or Secret injection when available | Secret manager env var | `HUMAN_APPROVAL_REQUIRED` only |

Non-secret runtime values such as `HOST`, `PORT`, base URLs, source set, cache directory, max pages, TTL, and CSV path can be configured as plain environment variables. Keep `HOST=0.0.0.0` for containers when the platform requires external ingress, and keep provider keys out of PlayMCP public copy fields.

Temporary image-baked exception record:

```text
Status: HUMAN_APPROVAL_REQUIRED
Reason: PlayMCP-in-KC env or Secret injection unavailable at deployment time.
Private image/registry: required.
Raw-key logs/screenshots/evidence: prohibited.
Rotation plan: rotate all affected provider keys after the temporary deployment/review window.
Removal plan: remove baked-key path and redeploy with env or Secret injection when available.
Default selectable by agent/runbook: no.
```

## Required Submission Gates

| Gate | Required evidence | Status wording allowed |
| --- | --- | --- |
| Local verification | `npm run verify`, `npm run scan:secrets`, `npm run scan:sources`, `npm run scan:claims` pass. | Local-ready only. |
| Live data proof | Source/key-specific ETL dry-runs pass with redacted diagnostics. | Source-specific live proof only. |
| KakaoCloud deployment | Deployed HTTPS endpoint exists and serves `/health` and `/mcp`. | Deployed endpoint ready. |
| PlayMCP information load | Console `정보 불러오기` succeeds and discovers `find_family_experiences`. | PlayMCP private/temporary smoke ready. |
| Review request | Console `등록 및 심사 요청` has actually been clicked. | Review requested. |
| Public switch | After approval, visibility changed from `나에게만 공개` to `전체 공개`. | Public after approval. |
| Contest entry | AGENTIC PLAYER 10 `Player 예선 참여` submitted once. | Contest entry recorded. |

## Unsupported Claims

Do not claim any of the following from this SOT:

- Deployment to KakaoCloud is complete.
- PlayMCP review request is complete.
- Public visibility is enabled.
- Contest submission is complete.
- Nationwide complete coverage.
- Real-time freshness.
- Reservation availability.
- Currently operating/open status.
- Child suitability or safety certification.

## Operator Checklist

1. Verify local docs and runtime.
2. Confirm the current PlayMCP-in-KC secret injection status in the latest organizer notice or console.
3. Choose the secret strategy. Prefer env/Secret injection if available; otherwise require explicit approval for the temporary private image workaround.
4. Deploy to KakaoCloud PlayMCP-in-KC.
5. Smoke `/health` and `/mcp` on the deployed HTTPS endpoint.
6. Update PlayMCP MCP information with the deployed `/mcp` endpoint.
7. Click `정보 불러오기` and verify the discovered tool.
8. Run starter-prompt smoke in temporary/private mode.
9. Request review only when ready.
10. After approval, switch to all-public and submit the contest entry once.
