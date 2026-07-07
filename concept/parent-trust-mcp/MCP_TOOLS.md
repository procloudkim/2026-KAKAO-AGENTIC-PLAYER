# MCP Tools

## Tool 1: `intake_baby_product_identity`

Purpose: Extract or ask for the minimum identity fields needed for a safe lookup.

Inputs:

- product text
- optional image-derived fields if later supported
- jurisdiction
- child age/stage

Output:

- normalized identity
- missing fields
- evidence completeness status

## Tool 2: `lookup_product_safety_lanes`

Purpose: Query or route to official source lanes by product type and jurisdiction.

Inputs:

- product identity
- source lane preferences

Output:

- evidence bundle
- official records found or not found
- unresolved source gaps

## Tool 3: `build_parent_action_card`

Purpose: Convert evidence into do-now/check-next/escalate-if guidance.

Inputs:

- evidence bundle
- usage context

Output:

- action card
- trust ledger rows
- uncertainty and citation gaps

