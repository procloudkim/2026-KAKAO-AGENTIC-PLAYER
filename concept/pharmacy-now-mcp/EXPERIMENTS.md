# Experiments

## First MVP Experiment

Can one MCP wrapper around the existing pharmacy search path return a safe Top 3 answer without overclaiming availability?

## Fixed Variables

- Output count: 3
- Phone-first action
- Conservative status labels
- No browser-exposed keys

## Controllable Variables

- region-only vs coordinate search
- live provider vs deterministic demo mode
- Kakao enrichment on/off
- stale cache policy

## Promotion Rule

Promote when:

- happy path returns Top 3 with phone/navigation
- missing location asks one concise clarification
- provider failure does not invent results
- status wording passes overclaim check

## Stop Rule

Stop if live key/provider readiness blocks a PlayMCP reviewable demo. Switch to family-experience branch if deadline risk rises.

