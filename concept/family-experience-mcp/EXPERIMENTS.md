# Experiments

## First MVP Experiment

Can one MCP tool return three useful Seoul family-experience candidates for a child age and weekend date?

## Fixed Variables

- Region: Seoul
- Output count: 3
- Response shape: under 8 bullets
- Source policy: official/open data only

## Controllable Variables

- indoor/outdoor filter
- free/paid filter
- age-fit strictness
- source fallback order

## Promotion Rule

Promote when:

- happy path returns Top 3 with source/freshness
- missing age asks a concise clarification
- no-result path does not invent results
- source failure path is safe

## Stop Rule

Stop adding data sources once the first demo prompt is stable enough for PlayMCP temporary registration.

