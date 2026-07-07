# F3 Real Manual QA: family-experience nationwide ETL/MCP

Verdict: APPROVE

Scope lock: manual QA only. Product files were not edited. Fresh rerun evidence was captured under `.omo/evidence/family-experience-nationwide-etl-expansion/F3-real-manual-qa-artifacts/`.

## Verification Summary

- Previous blocker closed: fresh Busan, Jeju, and missing-cache `smoke:mcp` reruns did not return `invalid_input`.
- Synthetic cache output is not presented as live official proof: Busan and Jeju rendered text includes `fixture/demo`, `mode: fixture`, `warnings: fixture/demo data only; not live/current.`, `source_summary: ... fixture/cache candidate only; not live/current`, and `next_action: fixture/cache source_url=...`.
- Public tool exposure remains one tool: each `smoke:mcp` rerun reports only `find_family_experiences`.
- Source attribution remains visible: Busan and Jeju rendered text includes `source_name`, `source_url`, `source_summary`, and `source_refs`.
- Missing-cache behavior is controlled: absent-cache rerun returns `failure_code: missing_configuration`, zero candidates, and cache rebuild guidance.
- Hygiene scans pass: source attribution scan, unsupported-claims scan, and raw-secret scan all returned `PASS`.

## manualQa

### surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| F3-S01 | Busan smoke:mcp, structured fields, rendered text, one public tool | MCP in-memory smoke against nationwide cache | `cd apps/family-experience-mcp; npm run smoke:mcp -- --assert-tool-count=1 --cache-dir=test/fixtures/eval-nationwide/cache --skip-seed "--prompt=부산 7월 5일 3살 야외 유료 체험"` | PASS: `result_ok: true`, `mode: fixture`, `candidate_count: 1`, tool list is only `find_family_experiences`, rendered action card includes source attribution and fixture/cache not-live labels. | A13 |
| F3-S02 | Jeju smoke:mcp, structured fields, rendered text, one public tool | MCP in-memory smoke against nationwide cache | `cd apps/family-experience-mcp; npm run smoke:mcp -- --assert-tool-count=1 --cache-dir=test/fixtures/eval-nationwide/cache --skip-seed "--prompt=제주 7월 13일 2살 무료 바다 이야기 체험"` | PASS: `result_ok: true`, `mode: fixture`, `candidate_count: 1`, tool list is only `find_family_experiences`, rendered action card includes source attribution and fixture/cache not-live labels. | A14 |
| F3-S03 | missing-cache smoke:mcp | MCP in-memory smoke against absent cache directory | `cd apps/family-experience-mcp; npm run smoke:mcp -- --assert-tool-count=1 --cache-dir=D:\KLab\2026-Hackathon\2026-07-KAKAO-AGENTIC-PLAY\.omo\evidence\family-experience-nationwide-etl-expansion\F3-real-manual-qa-artifacts\missing-cache-rerun-20260704-qa --skip-seed --expect-error "--prompt=부산 이번 주말 4살 실내"` | PASS: `result_ok: false`, `candidate_count: 0`, `failure_code: missing_configuration`; no `invalid_input` and no candidates returned. | A15 |
| F3-S04 | source attribution scan | CLI scan | `cd apps/family-experience-mcp; npm run scan:sources` | PASS: `status: PASS`, 87 files scanned. | A16 |
| F3-S05 | unsupported claims scan | CLI scan | `cd apps/family-experience-mcp; npm run scan:claims` | PASS: `status: PASS`, 120 files scanned. | A17 |
| F3-S06 | raw secret hygiene | CLI scan | `cd apps/family-experience-mcp; npm run scan:secrets` | PASS: `status: PASS`, 139 files scanned. | A18 |

### adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| F3-A01 | previous invalid_input blocker | Korean prompt with spaces passed through `smoke:mcp` | Correctly quoted Busan/Jeju prompts should parse and return cache results, not `invalid_input`. | PASS: both reruns produced successful fixture results and no `invalid_input` text. | A13, A14 |
| F3-A02 | missing cache | absent cache directory with `--skip-seed --expect-error` | Return controlled cache-configuration failure; do not fabricate candidates or expose SDK validation noise. | PASS: returned `missing_configuration`, zero candidates, and rebuild guidance. | A15 |
| F3-A03 | synthetic cache labeling | fixture/cache output could be mistaken for live official proof | Public rendered text must label fixture/cache status and require official-source confirmation before visiting. | PASS: Busan/Jeju text includes fixture/demo, fixture/cache, and not-live/current warnings. | A13, A14 |
| F3-A04 | public tool exposure | MCP tool list could expose extra/internal tools | Exactly one public tool should be listed. | PASS: each rerun lists only `find_family_experiences`. | A13, A14, A15 |
| F3-A05 | source attribution | candidates could lack evidence trail | Rendered candidate must expose source name, URL, summary, and source refs. | PASS: Busan/Jeju action cards include `source_name`, `source_url`, `source_summary`, and `source_refs`. | A13, A14 |
| F3-A06 | raw secret hygiene | logs/repo scan could expose raw keys | Secret scan should pass without printing raw service keys. | PASS: scan returned `status: PASS`. | A18 |

### artifactRefs

| id | kind | description | path |
|---|---|---|---|
| A13 | terminal transcript | Fresh Busan `smoke:mcp` rerun against nationwide cache; confirms one tool, structured success, source attribution, and fixture/cache labels. | `.omo/evidence/family-experience-nationwide-etl-expansion/F3-real-manual-qa-artifacts/13-rerun-mcp-busan-nationwide-cache.log` |
| A14 | terminal transcript | Fresh Jeju `smoke:mcp` rerun against nationwide cache; confirms one tool, structured success, source attribution, and fixture/cache labels. | `.omo/evidence/family-experience-nationwide-etl-expansion/F3-real-manual-qa-artifacts/14-rerun-mcp-jeju-nationwide-cache.log` |
| A15 | terminal transcript | Fresh missing-cache `smoke:mcp` rerun; confirms controlled `missing_configuration` response and no `invalid_input`. | `.omo/evidence/family-experience-nationwide-etl-expansion/F3-real-manual-qa-artifacts/15-rerun-mcp-missing-cache.log` |
| A16 | terminal transcript | Fresh source attribution scan. | `.omo/evidence/family-experience-nationwide-etl-expansion/F3-real-manual-qa-artifacts/16-rerun-scan-sources.log` |
| A17 | terminal transcript | Fresh unsupported-claims scan. | `.omo/evidence/family-experience-nationwide-etl-expansion/F3-real-manual-qa-artifacts/17-rerun-scan-claims.log` |
| A18 | terminal transcript | Fresh raw-secret scan. | `.omo/evidence/family-experience-nationwide-etl-expansion/F3-real-manual-qa-artifacts/18-rerun-scan-secrets.log` |
