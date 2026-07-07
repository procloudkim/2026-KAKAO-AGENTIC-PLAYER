# MCP Tools

## Tool 1: `find_family_experiences`

Purpose: Find candidate events or experiences for a child and caregiver.

Inputs:

- `location`: city, district, or coordinates
- `child_age`: number or stage
- `date_range`: today, weekend, or explicit dates
- `indoor_outdoor`: optional
- `budget`: optional
- `must_have`: optional list such as parking, stroller-friendly, reservation

Output:

- Top 3 normalized candidates
- source and freshness
- missing-field warnings

## Tool 2: `score_child_fit`

Purpose: Rank candidates by child fit and parent practicality.

Inputs:

- candidates
- child age/stage
- constraints

Output:

- fit reason
- friction reason
- confidence label

## Tool 3: `build_family_day_plan`

Purpose: Convert one selected event into a simple action card.

Inputs:

- selected candidate
- travel context

Output:

- what to do now
- what to verify
- fallback if unavailable

