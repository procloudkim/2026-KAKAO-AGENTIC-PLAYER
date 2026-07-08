# Kakao PlayMCP Guide SOT

Purpose: local source-of-truth index for organizer-provided PlayMCP / PlayMCP-in-KC Notion guidance extracted on 2026-07-08.

This document is not proof that deployment, PlayMCP review, public visibility, or contest submission has happened.

## Local Extracts

| Topic | Canonical local extract |
| --- | --- |
| Contest participation flow | `docs/external/kakao-playmcp-in-kc-notion/url3_detail_page.md` |
| Git source build in PlayMCP-in-KC | `docs/external/kakao-playmcp-in-kc-notion/url1_git_source.md` |
| Container image registration in PlayMCP-in-KC | `docs/external/kakao-playmcp-in-kc-notion/url2_container_image.md` |
| Contest and PlayMCP-in-KC usage cautions | `docs/external/kakao-playmcp-in-kc-notion/required_notice.md` |
| PlayMCP server development requirements | `docs/external/kakao-playmcp-in-kc-notion/server_dev_guide.md` |
| PlayMCP review policy | `docs/external/kakao-playmcp-in-kc-notion/review_policy.md` |
| PlayMCP help hub | `docs/external/kakao-playmcp-in-kc-notion/hello_page.md` |

Raw Notion HTML/JSON snapshots are local evidence under `.omo/ulw-research/20260708-235718-kakao-playmcp-notion-extraction/` and are not the public handoff surface.

## Contest Flow

Organizer Notion states the AGENTIC PLAYER 10 contest is entered by registering a self-developed MCP server in PlayMCP.

Required sequence:

1. Develop the MCP server according to the PlayMCP server development guide.
2. Complete local development and tests.
3. Deploy the MCP server through PlayMCP-in-KC for preliminary contest participation.
4. Use the PlayMCP-in-KC Endpoint URL in PlayMCP.
5. Click `정보 불러오기` and require it to succeed.
6. Save with `임시 등록` first, not final review.
7. Add the temporary MCP to the toolbox from the preview and test through PlayMCP AI chat.
8. After private tests pass, request review.
9. After approval, change visibility from `나에게만 공개` to `전체 공개`.
10. Submit the contest entry from the AGENTIC PLAYER 10 page.

Submission boundary:

- The guide states preliminary entries are accepted from 2026-06-15 to 2026-07-14.
- The guide states the contest form can include up to two MCP servers.
- Do not claim contest entry until the form is actually submitted.

## PlayMCP-in-KC Deployment Choices

PlayMCP-in-KC can create an MCP server from Git source or from a container image.

Git source build:

- Use when the MCP source code is already in a Git repository.
- A Dockerfile must exist at the repository root or selected Dockerfile path.
- Required fields include host-console server name, host-console description, Git URL, branch/ref, and Dockerfile path.
- PAT is only for private repositories.

Container image:

- Use when the MCP server is already built and pushed as a Docker image.
- Image must be built for `linux/amd64`.
- Required fields include registry host, `image_name`, and `image_tag`.
- Registry user/password are only for private registries or private images.

Both modes:

- Status starts as `Starting`.
- Continue only after status becomes `Active`.
- Copy the Endpoint URL from the server detail view.
- The guide states up to two MCP servers can be registered per account.

## PlayMCP Server Requirements

Submission-facing requirements extracted from the server development guide:

- Support MCP spec versions from `2025-03-26` through `2025-11-25`.
- Use Streamable HTTP for the remote server path.
- Use a public URL for the remote MCP server.
- Prefer stateless operation.
- Check standard compliance with MCP Inspector before registration.
- Use or reference actively maintained MCP SDKs.
- Do not include `kakao` in MCP Server Name or Tool Name.
- Tool names are case-sensitive and must be 1 to 128 characters using only English letters, digits, underscore, or hyphen.
- Keep tool count at or under 20; 3 to 10 tools are recommended.
- Tool definitions must include `name`, `description`, `inputSchema`, and `annotations`.
- `annotations` must include `title`, `readOnlyHint`, `destructiveHint`, `openWorldHint`, and `idempotentHint`.
- Tool description should be clear, preferably English, include the service name, and stay within 1,024 characters.
- PlayMCP prefixes tool names with the registered MCP identifier, so local tool names should not repeat the MCP name.
- Keep tool results small and cleaned; do not pass raw upstream API payloads through as-is.
- Response text over 24k can error and may be a rejection reason.
- Operational target: average tool response within 100ms and p99 within 3,000ms.

## Review Policy Risks

Main rejection risks for this project:

- Tool errors, frequent timeouts, excessive redirects, crawl delays, or unnecessary external calls.
- Data source ambiguity or inability to prove source rights/composition.
- A service that only duplicates generic LLM web search without a clear extension.
- Vague MCP name or description.
- Too many tools or unstable tool selection.
- Raw or excessive commercial links, purchase inducement, reward language, harmful downloads, profanity, political/sexual content, or socially inappropriate output.
- Representative image that is animated, low-quality, inappropriate, or not aligned with the service.
- Spec violations or abnormal operation.

## Family Experience Mapping

| Requirement | Current design stance |
| --- | --- |
| Remote Streamable HTTP `/mcp` | Required before PlayMCP information load. Local-only proof is not enough. |
| Tool count | Keep one public tool: `find_family_experiences`. |
| Tool naming | Do not include `kakao`; rely on PlayMCP identifier prefixing. |
| Data source proof | Use `SOURCE_LEDGER.md`, `QA_REPORT.md`, and redacted ETL evidence. |
| Response size | Return at most three curated candidates, not raw provider records. |
| Generic web-search risk | Emphasize structured age/date/region/indoor-outdoor filtering, source/caveat packaging, cache proof, and parent decision support. |
| Review/private testing | Use temporary registration and PlayMCP AI chat smoke before review request. |
| Unsupported claims | Keep the `DECISIONS.md` and `PLAYMCP_TEMP_REGISTRATION.md` guardrails: no nationwide completeness, real-time, reservation, open-now, or child-safety guarantee. |

## Ownership

- `HOST_REQUIREMENTS_SOT.md` owns host, contest, deployment, review, endpoint, and secret strategy requirements.
- `RUNBOOK.md` owns operator execution steps.
- `PLAYMCP_TEMP_REGISTRATION.md` owns console field values for temporary/private registration.
- `QA_REPORT.md` owns current proof status and not-claimed gates.
- `SOURCE_LEDGER.md` owns data source coverage tiers and source claim boundaries.
