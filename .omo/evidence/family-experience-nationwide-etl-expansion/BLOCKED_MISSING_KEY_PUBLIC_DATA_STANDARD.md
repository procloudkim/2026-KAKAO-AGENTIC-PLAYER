# BLOCKED_MISSING_KEY_PUBLIC_DATA_STANDARD

Surface: terminal / environment variable presence check
Criterion: Todo 10 live source proof per present key; blocked evidence per missing key
Env var checked: PUBLIC_DATA_STANDARD_SERVICE_KEY
Presence verdict: ABSENT in current process and absent in apps/family-experience-mcp/.env by name-only check
Skipped live invocation: cd apps/family-experience-mcp; npm run etl:nationwide -- --source national_festival --live --max-pages 1
Expected behavior: local verification must not fail solely because this key is absent; live proof remains blocked until operator supplies the key.
Secret hygiene: no raw key value was printed or stored.
