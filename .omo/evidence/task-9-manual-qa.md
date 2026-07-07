# Todo 9 Manual QA

Final command evidence:

- RED secret scan: `.omo/evidence/task-9-dummy-secret.tmp` contained a dummy `apiKey` value, `scan:secrets` exited 1, and the file was removed. See `.omo/evidence/task-9-secret-scan-RED.txt` and `.omo/evidence/task-9-secret-scan-cleanup.txt`.
- RED source scan: `apps/family-experience-mcp/test/fixtures/unregistered-source.tmp.ts` imported `cheerio` and contained `https://example.com/unregistered`; `scan:sources` exited 1, and the file was removed. See `.omo/evidence/task-9-source-scan-RED.txt` and `.omo/evidence/task-9-source-scan-cleanup.txt`.
- Plain GREEN: `npm run verify && npm run scan:secrets && npm run scan:claims && npm run scan:sources` exited 0. See `.omo/evidence/task-9-plain-verify-GREEN.txt`.
- Server GREEN: local server reached HTTP 200 on `3345`, `smoke:golden` passed, all three scans passed, and cleanup left no `3345` listener. See `.omo/evidence/task-9-final-verify-GREEN.txt`, `.omo/evidence/task-9-health.json`, `.omo/evidence/task-9-preflight-listening.txt`, and `.omo/evidence/task-9-cleanup-listening.txt`.
