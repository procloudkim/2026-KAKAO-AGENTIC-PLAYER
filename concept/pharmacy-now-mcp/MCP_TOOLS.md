# MCP Tools

## Tool 1: `find_nearby_pharmacy_candidates`

Purpose: Return three pharmacy candidates near a user location or selected region.

Inputs:

- `location`: coordinates, place text, or region
- `day_time`: optional, defaults to current Asia/Seoul time
- `radius_or_region`: optional

Output:

- Top 3 candidates
- conservative status label
- phone and navigation action
- source freshness

## Tool 2: `explain_pharmacy_availability`

Purpose: Explain why a candidate is marked available, uncertain, or closed-looking.

Inputs:

- `pharmacy_id_or_name`
- `source_snapshot`

Output:

- source-backed explanation
- what cannot be confirmed
- what the user should verify by phone

## Tool 3: `prepare_pharmacy_call_and_navigation`

Purpose: Produce the last-mile action card.

Inputs:

- selected pharmacy candidate

Output:

- tap-to-call text
- navigation link
- short call script

