# Host Requirements SOT

Purpose: single source of truth for host, organizer, and PlayMCP-in-KC requirements before submitting `아이랑 어디가`. This document records only deployment and submission constraints. It is not proof that deployment, review, public release, or contest submission has happened.

Last checked: 2026-07-08.

## Evidence Boundary

| Evidence level | Source | What it supports | Boundary |
| --- | --- | --- | --- |
| Official public | `https://b.kakao.com/views/PlayMCP/AGENTIC_PlAYER_10` | AGENTIC PLAYER 10 flow: create KakaoCloud MCP endpoint, register in PlayMCP, use temporary registration for testing, request review when final, switch to all-public after approval, then submit once. | Does not publish the exact `playmcp-endpoint.kakaocloud.io` hostname pattern in fetched text. |
| Official public | `https://modelcontextprotocol.io/` | MCP is the standard protocol for connecting AI applications to external tools, data, and workflows. | Standard-level docs, not Kakao contest ops. |
| Official public | `https://modelcontextprotocol.io/docs/tools/inspector` | MCP Inspector is an interactive tool for testing/debugging MCP servers and inspecting tools, schemas, and execution results. | Inspector proof still requires running it against the deployed endpoint. |
| Official public | `https://docs.kakaocloud.com/en/tutorial/container/k8s-engine-mcp` | KakaoCloud remote MCP deployment is HTTPS/load-balancer oriented; `stdio` is local-process transport and not suitable for remote Kubernetes. | General KakaoCloud MCP tutorial, not the PlayMCP-in-KC managed contest service. |
| Official public | `https://playmcp.kakao.com/` and Kakao Corp/Tech pages | PlayMCP is Kakao's public MCP platform surface. | Public pages do not replace the contest console workflow. |
| Organizer notice excerpt | User-provided PlayMCP-in-KC notice in this workspace on 2026-07-07 | Exact endpoint pattern, console update path, outbound egress IP allowlist, and current secret/env-var limitation. | The short links redirected through a page this environment could not fetch; treat the quoted notice as organizer-supplied contest guidance. |

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

Use this exact operator flow from the organizer notice:

1. Open developer console.
2. Open the registered MCP.
3. Expand MCP information.
4. Click `수정`.
5. Change `MCP Endpoint` to the KakaoCloud PlayMCP-in-KC HTTPS `/mcp` endpoint.
6. Click `정보 불러오기`.
7. Verify tool discovery returns exactly one public tool: `find_family_experiences`.
8. Click `등록 및 심사 요청` only after endpoint smoke and copy/claim scans pass.

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
