# MCP Data-Pipeline Architecture and Failure Modes

Date: 2026-07-01 KST
Scope: Cross-concept MECE architecture for MCP tools with official/public APIs

## Problem Definition

- Goal: Derive a reusable data-pipeline architecture for MCP tools that covers source registry, adapter contracts, raw snapshotting, normalization, confidence/provenance, cache and stale policy, secret redaction, and user-facing failure modes.
- Context: The repo currently has three MCP concept branches that share the same response contract and a common pipeline sketch. The primary question is what must be true for the architecture to be robust across pharmacy, parent-trust, and family-experience concepts.
- Constraints:
  - Use official MCP docs and public/official API references only where needed.
  - Keep the result MECE and applicable across all three concepts.
  - Preserve branch-specific differences where the source risk, safety risk, or freshness requirements differ.
- Success criteria:
  - One shared architecture checklist exists.
  - Each checklist item has a failure mode and safe fallback.
  - Branch-specific differences are explicitly separated.
- Done-when:
  - The repo has a concise evidence-backed architecture note that can be reused during implementation.

## Evidence Brief

### Authoritative Source Map

- MCP architecture overview, tools, resources, prompts, and client-server model:
  - https://modelcontextprotocol.io/docs/learn/architecture
  - https://modelcontextprotocol.io/specification/2025-11-25/server/tools
  - https://modelcontextprotocol.io/specification/2025-06-18/server/resources
  - https://modelcontextprotocol.io/specification/2025-06-18/server/prompts
- MCP security and sensitive interaction handling:
  - https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices
  - https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation
- Repo-local concept artifacts:
  - `PLANS.md`
  - `concept/README.md`
  - `concept/*/DATA_PIPELINE.md`
  - `research/briefs/2026-07-01-three-mcp-idea-branches.md`

### Prior-Art Summary

- MCP is a client-server protocol with tools, resources, and prompts as distinct primitives.
- Resources are application-driven context objects identified by URI.
- Prompts are user-controlled structured templates.
- Tools are model-controlled operations with metadata and schemas.
- Sensitive information must not be requested through form-mode elicitation; URL mode is required for sensitive interactions.

### Verified Facts

- MCP uses a client-server architecture and separates data and transport layers.
- MCP servers expose tools, resources, and prompts.
- Tools are model-controlled and should expose a schema.
- Resources are context objects identified by URI.
- Prompts are user-controlled templates.
- MCP security guidance stresses user consent, data privacy, tool safety, and authorization hardening.
- MCP elicitation forbids form-mode collection of sensitive secrets such as passwords and API keys.

### Inferences

- A reusable MCP data pipeline should treat source selection, normalization, provenance, and user-facing actionability as separate stages.
- The safest common answer shape is a short action card with a freshness/provenance note and an explicit verification step when evidence is incomplete.
- The same architecture can support all three concepts, but the risk policy differs by domain.

### Unknowns

- Whether each upstream API supports stable IDs, freshness timestamps, and jurisdiction-specific fields.
- Whether each concept will need caching beyond a short TTL.
- Whether all branch-specific APIs can be called without exposing secrets in URLs or logs.

### Assumptions

- The MCP server is a thin orchestration layer, not the place for broad scraping or offline warehousing.
- Public APIs may be stale or partial; the server must not silently upgrade weak evidence into certainty.

### Risks

- Overclaiming availability, safety, or suitability.
- Leaking API keys, keyed URLs, raw payloads, or internal traces.
- Mixing authoritative lookup with enrichment in a way that confuses provenance.

## Method Selection

### Candidate Methods

1. One monolithic adapter that returns final answers directly.
2. Separate source registry, adapters, normalization, provenance, and response rendering.
3. Batch ETL first, then expose MCP over the derived dataset.
4. Scrape everything and reconcile after the fact.

### Chosen Method

- Method 2: separate registry, adapters, normalization, provenance, and response rendering.

### Fallback Method

- If live APIs are unavailable, use deterministic demo data behind the same contracts and mark all outputs as non-authoritative.

### Rejection Reasons

- Monolithic adapters obscure provenance and make failure modes hard to classify.
- Batch ETL first is too slow and too broad for an MCP-first hackathon target.
- Broad scraping is not permission-safe and weakens source trust.

## Execution Plan

### Baseline

- Build one shared pipeline contract and then specialize per branch.

### Controllable Variables

- Source priority order
- Cache TTL
- Freshness threshold
- Confidence labeling rules
- Fallback behavior for missing fields

### Fixed Variables

- One short response card
- No secret leakage
- No unsupported certainty
- Source provenance always shown

### Budget Ladder

1. Minimal live lookup against one authoritative source.
2. Add a second official source only for cross-check or enrichment.
3. Add short-lived cache and stale labeling.
4. Add branch-specific scoring and action copy.

### Promotion Rule

- Promote only when the tool returns a correct Top 3 answer, provenance, and a safe fallback on missing input.

### Kill Rule

- Kill a branch if it cannot produce authoritative, field-level evidence without overclaiming.

### Stop Rule

- Stop expanding the pipeline once one branch can pass a PlayMCP-style smoke test with deterministic failures.

### Final Evaluation Rule

- Evaluate on correctness, provenance visibility, stale-data handling, secret safety, and user-actionability.

### Resource Estimate

- Wall clock: low to moderate for MVP wiring.
- RAM: low.
- CPU/GPU/NPU split: CPU for orchestration, no GPU needed.
- Reboot-required resources: none.

## Shared Architecture Recommendations

### Source Registry

- Maintain a registry of official sources with:
  - source name
  - jurisdiction
  - authority tier
  - allowed fields
  - freshness expectation
  - cache policy
  - redaction policy
  - fallback status
- Failure mode: a source without a registry entry becomes an unknown source, not a silent dependency.
- Safe fallback: exclude it from authoritative output and keep it as optional enrichment only.

### Adapter Contract

- Each adapter should expose:
  - input schema
  - normalized request parameters
  - raw fetch result
  - source URL or source identifier
  - retrieval timestamp
  - explicit error categories
- Failure mode: adapter returns partial or malformed data.
- Safe fallback: return a typed failure, not a guessed record.

### Raw Snapshot

- Store raw snapshots separately from normalized records.
- Snapshot must preserve provenance and the exact response shape needed for later auditing.
- Failure mode: raw payload missing or transformed too early.
- Safe fallback: mark record as unverifiable and lower confidence.

### Normalization

- Normalize only stable fields:
  - identity
  - time/date
  - location
  - contact
  - reservation/navigation link
  - source freshness
- Failure mode: field semantics differ across sources.
- Safe fallback: keep the source text and add inferred/unknown labels instead of forcing canonical values.

### Confidence and Provenance

- Confidence should reflect evidence quality, not desirability.
- Provenance should be field-level where possible.
- Failure mode: blended enrichment makes the answer look more certain than it is.
- Safe fallback: separate authoritative facts from enrichment and label inferred values.

### Cache and Stale Policy

- Cache by source and normalized query.
- Attach `retrieved_at` and a stale label.
- If freshness is weak or unverifiable, demote to `needs confirmation`.
- Failure mode: stale cache presented as live.
- Safe fallback: surface the age and a recheck action.

### Secret Redaction

- Never log or emit API keys, bearer tokens, keyed URLs, or raw secrets.
- If user input may contain sensitive data, request it only through allowed interactions and only when needed.
- Failure mode: sensitive data appears in responses, logs, or debug output.
- Safe fallback: redact the value and return a safe failure message.

### User-Facing Failure Modes

- Use distinct messages for:
  - no match
  - ambiguous match
  - stale data
  - partial data
  - source failure
  - permission failure
- Failure mode: a generic error hides the action the user should take.
- Safe fallback: tell the user what to verify next.

## Branch-Specific Differences

### Pharmacy Now MCP

- Highest risk: availability overclaiming.
- Freshness rule: live-open status must be proven, otherwise `확인 필요`.
- Cross-checks are secondary and must not override live evidence.
- User-facing failure mode should emphasize phone-first verification.

### Parent Trust MCP

- Highest risk: unsafe safety certainty.
- Evidence must remain lane-specific and product-specific.
- Do not turn confidence into a safety score.
- User-facing failure mode should preserve unknowns and ask for exact model or batch.

### Family Experience MCP

- Highest risk: age-fit inference without enough program detail.
- More tolerant of enrichment than the other two branches, but still needs explicit inference labels.
- User-facing failure mode should recommend alternative events or a narrower query when age, target, or date are missing.

## MECE Checklist

### 1. Source Registry

- [ ] Official source named
- [ ] Authority tier assigned
- [ ] Jurisdiction noted
- [ ] Allowed fields listed
- [ ] Freshness expectation recorded
- [ ] Cache policy recorded
- [ ] Redaction policy recorded
- [ ] Fallback state defined

### 2. Adapter Contract

- [ ] Input schema defined
- [ ] Output schema defined
- [ ] Raw response preserved
- [ ] Retrieval timestamp captured
- [ ] Source URL or identifier captured
- [ ] Typed error categories defined

### 3. Raw Snapshot

- [ ] Raw payload stored separately
- [ ] Snapshot is auditable
- [ ] Transform happens after capture

### 4. Normalization

- [ ] Stable fields only
- [ ] Source-specific edge cases documented
- [ ] Inferred values labeled
- [ ] Unknown values preserved

### 5. Confidence and Provenance

- [ ] Evidence quality mapped to confidence
- [ ] Confidence is not a certainty claim
- [ ] Field-level provenance available where possible
- [ ] Enrichment is separated from authority

### 6. Cache and Stale Policy

- [ ] Cache TTL defined
- [ ] Stale threshold defined
- [ ] Freshness visible in output
- [ ] Recheck path available

### 7. Secret Redaction

- [ ] Keys and tokens never logged
- [ ] Keyed URLs masked or omitted
- [ ] Debug traces scrubbed
- [ ] Sensitive elicitation uses safe channel

### 8. User-Facing Failure Modes

- [ ] No match message
- [ ] Ambiguous match message
- [ ] Partial data message
- [ ] Stale data message
- [ ] Permission/source failure message
- [ ] Next verification action included

### 9. Branch Policy

- [ ] Pharmacy keeps live status conservative
- [ ] Parent trust keeps safety evidence lane-specific
- [ ] Family experience keeps age-fit inference explicit

