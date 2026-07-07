# Task 5 Manual QA Matrix

Channel: CLI surface.

| Scenario | Invocation | Binary observable | Artifact | Result |
| --- | --- | --- | --- | --- |
| Full verification | `npm --prefix apps/family-experience-mcp run verify` | exit 0, `20` test files and `149` tests passed | `task-5-verify.txt` | PASS |
| Verify proof isolation | same verify invocation with latest hash before/after | `canonical_latest_mutated_by_verify=false` | `task-5-verify-proof-dir-isolation.txt` | PASS |
| Focused ETL tests | `npm --prefix apps/family-experience-mcp test -- --run test/etlNationwide.test.ts` | exit 0, `20` tests passed | `task-5-focused-etl-test.txt` | PASS |
| Culture Portal ETL proof | `node --env-file-if-exists=.env --import tsx scripts/etl-nationwide.ts --dry-run --source culture_portal` from `apps/family-experience-mcp` | exit 0, `ok=true`, normalized records 10, raw snapshots 1, redaction true | `task-5-culture-etl.txt`, `etl/etl-proof-2026-07-07T15-05-03-090Z.json` | PASS |
| Fake-key live failure | same script with synthetic key override and temp proof dir | exit 2, `ok=false`, diagnostic URL redacted, fake-key occurrences 0 in output/temp proofs | `task-5-redaction-negative.txt` | PASS |
| Scoped secret scan | `npm --prefix apps/family-experience-mcp run scan:secrets -- --include ...` | exit 0, `status=PASS`, `scanned_files=176` | `task-5-scan-secrets-proof-artifacts.txt` | PASS |
| Fake-key evidence search | scoped search over output/proofs excluding self-referential receipts | `fake_key_occurrences=0` | `task-5-fake-key-search.txt` | PASS |

Required proof fields:
- Source success/failure: present in `sources[].ok`, `failure_code`, and `source_provenance[]`.
- Normalized record count: present in `counts.normalized_records`.
- Raw snapshot count/presence: present in `counts.raw_snapshots` and `raw_snapshots_present`.
- Cache directory: present in `cache_dir`.
- Diagnostics: present in `diagnostics` and source-specific `sources[].diagnostics` on failure.
- Paths: present in `proof.timestamped_path` and `proof.latest_path`.
- Redaction flag: present in `diagnostics.redaction_verified` and `proof.redaction_verified`.
- No raw key/keyed URL: scoped secret scan PASS; fake-key search PASS.

Stability note:
- `etl-proof-latest.json` is a mutable alias only. Timestamped proof JSON files are the stable evidence.
