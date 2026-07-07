# Data Pipeline

## Source Priority

1. NMC `국립중앙의료원_전국 약국 정보 조회 서비스`.
2. Existing holiday pharmacy repo normalization and conservative status logic.
3. Kakao place/navigation enrichment only for address, destination, and link quality.
4. HIRA cross-check later for phone/address/closure consistency only.

## Pipeline Shape

```text
MCP request
-> location or region normalization
-> NMC/search-service adapter
-> conservative open-status policy
-> Top 3 phone-first answer card
```

## Normalized Candidate Fields

- `name`
- `source_name`
- `source_url`
- `retrieved_at`
- `status_label`
- `status_reason`
- `today_hours`
- `phone`
- `address`
- `lat`
- `lon`
- `distance_text`
- `navigation_url`
- `parent_or_user_checks`

## Safety Rules

- `운영 중` requires API-proven live-open evidence.
- Mock, stale, batch, or inferred data must demote to `확인 필요`.
- Always include "방문 전 전화 확인 권장."
- Do not expose API keys, keyed URLs, raw XML, stack traces, or precise unrounded coordinates.

