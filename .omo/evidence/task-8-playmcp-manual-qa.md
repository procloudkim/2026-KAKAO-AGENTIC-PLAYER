# Task 8 Manual QA

Date: 2026-07-02 KST

Surface: docs-backed PlayMCP temporary-registration metadata.

## Checklist

- [x] Name is `아이랑 어디가`.
- [x] Identifier is `familyexp`.
- [x] Endpoint note is `/mcp`.
- [x] Description length is 188 characters, below the 500 character limit.
- [x] Starter message count is exactly 3.
- [x] Starter message lengths are 18, 18, and 17 characters, each below 40.
- [x] `PLAYMCP_TEMP_REGISTRATION.md` includes `임시 등록`.
- [x] Temporary/private registration only; no public switch or final release action is included.
- [x] Blocked Korean review-action phrase is absent from the docs and metadata test.
- [x] Fixture/demo labeling is required in copy and response guardrails.
- [x] Nationwide, live freshness, reservation status, current opening status, and child suitability claims are guarded unless source-backed.
- [x] Representative image is TODO-only.
- [x] No image was generated, uploaded, or submitted.
- [x] Auth recommendation for current build is no-auth fixture/demo testing.
- [x] Response visibility note keeps the entry private/operator-only.

## Evidence

- RED: `.omo/evidence/task-8-playmcp-metadata-RED.txt`
- GREEN: `.omo/evidence/task-8-playmcp-metadata-GREEN.txt`
- Metadata command output:
  - name: `아이랑 어디가`
  - identifier: `familyexp`
  - endpoint: `/mcp`
  - descriptionLength: `188`
  - starterLengths: `18`, `18`, `17`

## Cleanup

No server, browser, image generator, port, or temp GUI resource was started for Todo 8.
