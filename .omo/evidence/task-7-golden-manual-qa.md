# Todo 7 Golden Manual QA

Date: 2026-07-02

Command surface: MCP HTTP endpoint at `http://127.0.0.1:3345/mcp` for fixture scenarios; temporary local MCP HTTP endpoint with fixture disabled for source-failure scenario.

| Scenario | Evidence | Expected condition | Result |
| --- | --- | --- | --- |
| Happy Korean prompt | `golden-family-experience-happy.json` | Fixture mode, exactly 3 candidates, and exactly 3 action cards. Each card exposes title/date_time/venue/address/age_fit_label/age_fit_reason/indoor_outdoor/fee_text/source_name/source_url/retrieved_at/confidence/mode/warnings/source_summary/parent_check/next_action. No unsupported live/current/reservation/national/all-child claim. | PASS |
| Missing age | `golden-family-experience-missing-age.json` | Korean parent-facing clarification asks for child age or stage; `isError: true`; no candidates; no English SDK validation text as the main visible message. | PASS |
| No confident result | `golden-family-experience-no-result.json` | Safe no-result response; zero candidates/action cards; no fabricated matches; suggests relaxing exactly one constraint: date range. | PASS |
| Source failure | `golden-family-experience-source-failure.json` | `isError: true`, no candidates, safe Korean message, no raw secret/keyed URL | PASS |

Cleanup: `task-7-quality-fix-GREEN.txt` confirms no listener remained on `:3345` or `:3346` after QA.
