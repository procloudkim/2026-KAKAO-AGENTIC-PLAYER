# BLOCKED_MISSING_KEY_CULTURE_PORTAL

Surface: terminal / environment variable presence check
Criterion: Todo 10 live source proof per present key; blocked evidence per missing key
Env var checked: CULTURE_PORTAL_SERVICE_KEY
Presence verdict: ABSENT in current process and absent in apps/family-experience-mcp/.env by name-only check
Skipped live invocation: cd apps/family-experience-mcp; npm run etl:nationwide -- --source culture_portal --live --max-pages 1
Expected behavior: local verification must not fail solely because this key is absent; live proof remains blocked until operator supplies the key.
Secret hygiene: no raw key value was printed or stored.
