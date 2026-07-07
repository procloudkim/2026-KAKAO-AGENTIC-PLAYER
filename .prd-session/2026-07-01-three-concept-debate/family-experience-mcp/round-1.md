# Round 1 - family-experience-mcp

Agenda: independent proposals before critique.

## PM

- Addition: Narrow first MVP to "Seoul weekend indoor/outdoor child experience Top 3."
- Objection: "Newborn to elementary" is too broad for first ranking logic; use age bands.
- Source references: `concept/family-experience-mcp/README.md`, `DATA_PIPELINE.md`.
- Vote: proceed with narrowed MVP.
- Confidence: 0.84.

## Tech Lead

- Addition: First core tool should be `find_family_experiences`; the scorer and day-plan tools stay internal until the first endpoint works.
- Objection: Multi-source national federation is too broad for the first implementation.
- Source references: `MCP_TOOLS.md`, `EXPERIMENTS.md`.
- Vote: proceed with one source lane plus deterministic fixture fallback.
- Confidence: 0.78.

## User Advocate

- Addition: Output must answer "why this fits my child" in one short sentence per option.
- Objection: Too many filters will slow the parent down.
- Source references: `GOLDEN_PROMPTS.md`.
- Vote: proceed if answer stays under 8 bullets.
- Confidence: 0.86.

## Devil's Advocate

- Addition: Age-fit must be labeled as `source-stated`, `program-inferred`, or `unknown`.
- Objection: "실내 체험" can be misclassified if source text is vague.
- Source references: `DATA_PIPELINE.md`.
- Vote: proceed with confidence labels, otherwise block.
- Confidence: 0.72.

## CEO Visionary

- Addition: This is the strongest public-vote story because every parent understands the pain quickly.
- Objection: The name should be more memorable than "family experience finder."
- Source references: `research/decisions/2026-07-01-three-mcp-idea-branches.md`.
- Vote: proceed.
- Confidence: 0.88.

## Moderator Synthesis

Carry forward:

- Seoul-first MVP.
- One public MCP tool: `find_family_experiences`.
- Age-fit confidence labels are mandatory.
- Name and submission copy remain unresolved.

Unresolved disagreement: whether to include TourAPI in first build or keep Seoul-only.

