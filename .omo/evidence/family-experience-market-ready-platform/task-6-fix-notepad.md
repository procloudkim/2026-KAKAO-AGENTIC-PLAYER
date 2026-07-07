# Todo 6 Gate Fix Notepad

## Verified Facts

- `smoke-golden.ts` previously started only the source-failure server on `3346`; normal golden scenarios used the default `3345` endpoint and therefore required an external fixture server.
- The updated script starts/stops a fixture-mode server on `3345` unless `MCP_ENDPOINT` is explicitly provided.
- The source-failure scenario still starts/stops its isolated no-fixture server on `3346`.
- `mcpCache.test.ts` remains a contract matrix at 320 pure LOC and now carries an accepted `SIZE_OK` marker explaining why it is not split in this scoped fix.

## Inferences

- Keeping the cache hit, stale cache, missing cache, no-match, reservation, and unsafe-copy cases together is acceptable for this gate because the reviewer asked for an accepted exception or a small split, and splitting would broaden risk without weakening the gate blocker.

## Unknowns

- Full verify may still reflect unrelated Todo 4/Todo 7 worktree state. It must be rerun and classified from current output.

## Stop Rule

Todo 6 is gate-ready when focused golden/cache tests, self-contained `smoke:golden`, typecheck, cleanup, and changed-file/no-index evidence are all recorded as fresh artifacts.
