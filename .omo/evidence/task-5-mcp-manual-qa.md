# Task 5 MCP Manual QA

## Surface

- HTTP health: `GET http://127.0.0.1:3345/health`
- MCP endpoint: `http://127.0.0.1:3345/mcp`

## Result

- Health returned HTTP `200`.
- Health body contained `family-experience-mcp`.
- MCP smoke listed exactly one tool: `find_family_experiences`.
- MCP smoke called `find_family_experiences` in fixture mode and received three fixture-labeled candidates.
- Cleanup proof recorded no `LISTENING` process on `:3345`.

## Evidence

- `.omo/evidence/task-5-mcp-RED.txt`
- `.omo/evidence/task-5-mcp-GREEN.txt`
- `.omo/evidence/task-5-health.json`
- `.omo/evidence/task-5-cleanup-listening.txt`
