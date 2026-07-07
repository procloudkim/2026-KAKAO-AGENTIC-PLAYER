# Kakao Tools Readiness

This note maps the current MCP action-card contract to a future Kakao Tools or widget surface. It is preparation only; no finalist-only API or widget integration is claimed.

## Current MCP Contract

Single public tool: `find_family_experiences`.

Each candidate returns:

| MCP field | Widget role | Source rule |
| --- | --- | --- |
| `title` | Card title | Source title only. |
| `date_time` | Primary time row | Source date plus source time text when available. |
| `venue` | Place label | Source venue field. |
| `address` | Place detail | Source address or district field. |
| `age_fit_label` | Evidence badge | `source-stated`, `inferred`, or `unknown` only. |
| `age_fit_reason` | Parent explanation | Source age text or explicit inference reason. |
| `indoor_outdoor` | Filter chip | Source or deterministic normalized value. |
| `fee_text` | Cost row | Source fee text, never inferred price. |
| `source_name` | Trust label | Registered source display name. |
| `source_url` | External action | Official or registered source URL. |
| `retrieved_at` | Freshness label | Adapter retrieval timestamp or fixture snapshot timestamp. |
| `confidence` | Details drawer | Source confidence labels, not a safety score. |
| `warnings` | Footer notice | Verification reminder and fixture/live boundary. |
| `parent_check` | Checklist item | Age and reservation/fee confirmation wording. |
| `next_action` | Primary CTA text | Open source and confirm date, place, fee, application steps. |

## Widget Guardrails

- Keep one tool until public PlayMCP smoke passes.
- Do not add a safety score.
- Do not hide source, freshness, or parent confirmation fields.
- Do not turn confirmation-needed fields into availability claims.
- Keep `source_url` as the explicit handoff for final user action.

## Deferred Until Spec Access

- Kakao Tools widget manifest.
- Authenticated PlayMCP private entry ID.
- Public HTTPS endpoint.
- Finalist-only UI schema or rendering component.
