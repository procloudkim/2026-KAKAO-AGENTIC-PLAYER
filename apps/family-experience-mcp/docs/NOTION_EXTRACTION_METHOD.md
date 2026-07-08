# Notion Extraction Method

Purpose: choose a repeatable way to preserve Kakao / PlayMCP / AGENTIC PLAYER guide pages from Notion when copy-paste is unreliable.

This document is a methodology. It is not proof that any specific PlayMCP deployment, review, public switch, or contest submission happened.

## Problem

Organizer guidance is currently distributed through Notion pages. Direct browser copy can miss hidden children, linked pages, callouts, images, or block structure. Plain `curl` against `app.notion.com` can also capture only the Notion JavaScript shell, not the guide body. The local 2026-07-08 extraction showed this exact failure mode: plain HTML snapshots contained the Notion app shell, while useful guide text came from Notion `loadPageChunk` JSON and was then rendered to clean markdown.

## Source Priority

Use this order:

1. **Owner/operator export**: Notion UI export to Markdown & CSV, HTML, or PDF when the operator has sufficient access.
2. **Official Notion API**: `GET /v1/pages/{page_id}/markdown` or recursive `GET /v1/blocks/{block_id}/children` when a Notion token/connection has read access to the page.
3. **Public-page preservation**: Notion app payload extraction such as `loadPageChunk` only when the page is public and the goal is local evidence preservation, not a supported integration.
4. **Browser evidence fallback**: print to PDF, screenshot, or OCR when structured extraction fails.
5. **Manual copy**: last resort for short snippets only; never use it as the only evidence for a full guide.

## Decision Matrix

| Situation | Recommended method | Why | Evidence quality | Main risk |
| --- | --- | --- | --- | --- |
| You own or can access the Notion page with export rights | Notion UI export as Markdown & CSV or HTML | Official non-API path for content portability | High | Export can be disabled by workspace/teamspace policy; guest users may need full access. |
| You have a Notion token/connection with page read access | Official page markdown endpoint | Official API gives enhanced markdown directly | High | Requires read-content capability and page access; output can be truncated or contain unknown blocks. |
| You need structured block fidelity beyond markdown | Official block children API, recursively | Official API exposes Notion block tree | High | More implementation work; page content is paginated and child blocks must be traversed. |
| The page is public but you do not control the workspace | Public-page payload extraction, for example `loadPageChunk` | Can preserve text when copy/export is unavailable | Medium | Unofficial and brittle; must be labeled local evidence, not official API proof. |
| JavaScript or internal payload extraction fails | Browser print/PDF/screenshot/OCR | Captures what a human can see | Medium-low | Lower structure fidelity; OCR needs review. |
| Only one short line is needed | Manual copy with source URL and access date | Fast | Low-medium | Easy to miss context or linked pages. |

## Recommended Workflow

For Kakao / PlayMCP guide pages, use this workflow:

1. Save the original URL list in the session evidence directory.
2. Fetch plain HTML once to prove whether the page is server-rendered or JavaScript shell only.
3. If the operator can export, request a Notion Markdown & CSV or HTML export and store the zip under private evidence.
4. If the operator can provide a Notion API token or page access, prefer official API extraction:
   - `GET /v1/pages/{page_id}/markdown` for markdown-first extraction.
   - `GET /v1/blocks/{block_id}/children` recursively when block-level fidelity is required.
5. If official access is unavailable but the page is public, use public-page payload extraction as a local evidence fallback.
6. Convert raw data to clean markdown.
7. Keep raw snapshots in `.omo/ulw-research/<session>/raw/`.
8. Commit only clean, reviewed markdown under `docs/external/<source-name>/` unless raw artifacts are explicitly safe and necessary.
9. Create or update an SOT file that maps each extracted page to its source, date, and claim boundary.
10. Run source, secret, and claim scans before using the extracted text in submission docs.

## Local Provenance Pattern

The existing Kakao PlayMCP extraction follows this pattern:

- Raw local evidence: `.omo/ulw-research/20260708-235718-kakao-playmcp-notion-extraction/`.
- Clean committed corpus: `apps/family-experience-mcp/docs/external/kakao-playmcp-in-kc-notion/`.
- SOT index: `apps/family-experience-mcp/docs/KAKAO_PLAYMCP_GUIDE_SOT.md`.
- Host/deployment boundary: `apps/family-experience-mcp/docs/HOST_REQUIREMENTS_SOT.md`.

This pattern is correct for contest preparation because it keeps raw extraction evidence local while giving the repo a clean source surface.

## Official Notion Paths

Notion Help documents page export to PDF, HTML, and Markdown & CSV. It also documents workspace export to HTML, Markdown, or CSV, with PDF workspace export limited by plan. Export availability depends on access and workspace settings.

Notion Developer Docs document two official content APIs:

- `GET /v1/pages/{page_id}/markdown`: returns a `page_markdown` object with enhanced markdown. It requires authorization, `Notion-Version`, and read-content capability. It can return `truncated` and `unknown_block_ids`.
- `GET /v1/blocks/{block_id}/children`: returns paginated child blocks. A complete page may require recursively retrieving children of child blocks.

Notion authorization docs state that a connection must be granted access to a page before it can interact with it. Therefore, a public browser URL is not enough to use the official API unless the token/connection also has access.

## Public-Page Payload Extraction

`loadPageChunk` is useful when a public Notion page is readable in a browser but not exportable by the operator. Treat it as a preservation tactic:

- Use only for public pages or pages the operator is authorized to view.
- Save the raw JSON response.
- Render to markdown with a deterministic script.
- Record page IDs, extraction date, source URLs, and linked pages discovered.
- Label the result as local evidence extracted from Notion app payloads.
- Do not call it official Notion API.
- Do not build production dependencies on it unless the project accepts breakage risk.

The local extraction scripts in `.omo/ulw-research/20260708-235718-kakao-playmcp-notion-extraction/` implement this pattern for the Kakao guide corpus.

## Browser Evidence Fallback

Use browser evidence when structured extraction fails:

1. Open the page in a real browser.
2. Save or print to PDF.
3. Capture full-page screenshots for visual evidence.
4. OCR only if text extraction is impossible.
5. Keep screenshots/PDFs as private evidence unless redistribution is explicitly allowed.
6. Use the screenshot/PDF only to support claims, not as the primary machine-readable corpus if markdown/API extraction is available.

## Validation

Every extraction run should leave these artifacts:

| Artifact | Required | Purpose |
| --- | --- | --- |
| URL manifest | Yes | Shows what was attempted. |
| Raw fetch result | Yes | Proves whether plain HTML contained content. |
| Raw API/export/payload data | Yes | Preserves source evidence. |
| Clean markdown | Yes | Human-reviewable handoff. |
| Page inventory | Yes | Shows linked pages discovered and coverage. |
| SOT index | Yes | Records what the text can and cannot prove. |
| Scanner results | Yes | Prevents leaking secrets or unsupported claims. |

For this repository, use:

```bash
npm --prefix apps/family-experience-mcp run scan:secrets
npm --prefix apps/family-experience-mcp run scan:sources
npm --prefix apps/family-experience-mcp run scan:claims
```

## When To Ask The Operator

Ask the operator only when one of these is true:

1. The Notion page is private or public access was removed.
2. Export is disabled or requires full access.
3. Official API extraction is desired and a Notion token/connection must be created.
4. A console-only value is needed, such as PlayMCP-in-KC endpoint, identifier availability, or secret injection status.
5. A screenshot/PDF contains private content and needs permission before being committed or shared.

Do not ask the operator to paste every Notion element manually. Ask for access, export, or a console result instead.

## Method Decision For Current Kakao MCP Work

Current status:

- The key PlayMCP / PlayMCP-in-KC guide text has already been extracted into `docs/external/kakao-playmcp-in-kc-notion/`.
- `KAKAO_PLAYMCP_GUIDE_SOT.md` is the canonical index for those extracts.
- `HOST_REQUIREMENTS_SOT.md` owns deployment and organizer-notice boundaries.

Use this rule going forward:

- For already extracted guide pages, read the local corpus and SOT. Do not ask the user to paste those elements again.
- For new or changed Notion pages, first try official export/API if the operator can provide access. If not, use public-page payload extraction as local evidence and label it clearly.
- For PlayMCP console state, ask the user for the live result because static Notion text cannot prove endpoint activation, identifier availability, or `정보 불러오기` success.

## Sources

- Notion Help: `https://www.notion.com/help/export-your-content`
- Notion API page markdown: `https://developers.notion.com/reference/retrieve-page-markdown`
- Notion API block children: `https://developers.notion.com/reference/get-block-children`
- Notion API authorization: `https://developers.notion.com/guides/get-started/authorization`
- Notion API key handling: `https://developers.notion.com/guides/get-started/handling-api-keys`
- Unofficial Notion renderer/client evidence: NotionX/react-notion-x repository, consulted as secondary OSS evidence.
- Local Kakao corpus: `docs/external/kakao-playmcp-in-kc-notion/`
