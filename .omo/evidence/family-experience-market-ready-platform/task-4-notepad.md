# Task 4 Notepad

Problem restatement: live cache reads accepted metadata missing schema_version, publish_id, file_digests, or source_provenance.

Root cause: cacheMetadataSchema made provenance/integrity fields optional and validateCacheContract returned ok when file_digests or source_provenance were absent.

Fix: current cache metadata now requires schema_version = 2, publish_id, file_digests, and source_provenance. The retained legacy path is restricted to old fixture-only metadata without modern cache fields.

Red proof: task-4-red-metadata-tests.txt shows all four missing-field tests failed because queryNationwideCache returned ok=true.

Green proof: task-4-focused-tests.txt and task-4-verify.txt pass after the contract change.

Manual proof: task-4-manual-cache-query-probes.txt shows missing metadata, stale cache, partial publish marker, and malformed record JSONL all fail closed.

Residual risk: cacheContract.ts is at 246 pure LOC, so the next nontrivial cache-contract change should split schemas/validators before adding more behavior.
