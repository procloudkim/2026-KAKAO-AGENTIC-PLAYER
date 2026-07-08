# Kakao PlayMCP Guide SOT

Purpose: canonical index for the locally extracted Kakao / PlayMCP / PlayMCP-in-KC guide corpus.

This document owns only the guide-corpus map and extraction boundary. It does not own product requirements, deployment requirements, console field values, or current readiness status.

## Canonical Responsibilities

| Truth | Canonical home |
| --- | --- |
| Product PRD and user value | `docs/PRODUCT_PRD_SOT.md` |
| Kakao / PlayMCP / MCP protocol / deployment requirements applied to this project | `docs/HOST_REQUIREMENTS_SOT.md` |
| Current PASS/BLOCKED/NOT CLAIMED status | `docs/QA_REPORT.md` |
| PlayMCP console field values | `docs/PLAYMCP_TEMP_REGISTRATION.md` |
| Operator execution steps | `docs/RUNBOOK.md` |
| Local extracted guide corpus map | This document |

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
| Extract manifest | `docs/external/kakao-playmcp-in-kc-notion/manifest.json` |

Raw Notion HTML/JSON snapshots are local evidence under `.omo/ulw-research/20260708-235718-kakao-playmcp-notion-extraction/`. They are not the operator handoff surface.

## Extraction Boundary

Collected and indexed:

- contest participation order
- PlayMCP-in-KC Git source build flow
- PlayMCP-in-KC container image registration flow
- contest usage cautions
- PlayMCP server development guide
- PlayMCP review policy
- PlayMCP help and registration notice pages linked from the extracted Notion graph

Kept outside this guide corpus because they came from a separate organizer notice or live console state:

- exact endpoint hostname pattern
- outbound egress IP allowlist
- environment variable / Secret injection limitation
- actual issued endpoint URL
- identifier availability
- `정보 불러오기` result
- review, public switch, or contest-submission completion

For those items, use `docs/HOST_REQUIREMENTS_SOT.md` and `docs/QA_REPORT.md`.

## Use Rule

When updating docs, do not copy operational steps or current status out of this extracted corpus. Link to the exact extract when proving source provenance, then apply the project rule through `docs/HOST_REQUIREMENTS_SOT.md`.
