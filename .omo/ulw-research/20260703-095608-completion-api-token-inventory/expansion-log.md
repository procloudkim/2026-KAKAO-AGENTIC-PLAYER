# Expansion Log

## Phase 0

Core question: list all tokens, API keys, and public-data API onboarding requirements needed to complete the three Kakao PlayMCP ideas, with local injection paths.

Axes:

- Current family-experience repo env/config/API surfaces.
- Holiday pharmacy reference repo env/config/API surfaces.
- Baby product safety reference repo env/config/API surfaces.
- Official source verification for Korean public APIs, Kakao APIs, and supplemental international safety APIs.

## Phase 1

Workers spawned:

- `019f257a-1b5c-7b02-b7d8-963415de6ec2`: current repo family-experience inventory.
- `019f257a-3a82-71e0-a223-0055b63c7c50`: holiday pharmacy reference repo inventory.
- `019f257a-5a7d-7d91-be76-96ff5c85dbdb`: BabyGear / ParentPick reference repo inventory.
- `019f257a-8382-7e31-9369-a78763062970`: official API/key source sweep.

Leads integrated:

- Current repo env contract is exactly `SEOUL_OPEN_DATA_KEY`, `SEOUL_OPEN_DATA_BASE_URL`, `FAMILY_EXPERIENCE_ALLOW_FIXTURE`, `PORT`.
- Holiday pharmacy reference repo uses `DATA_GO_NMC_KR_SERVICE_KEY`, `DATA_GO_HIRA_KR_SERVICE_KEY`, `KAKAO_REST_API_KEY`, `PHARMACY_DATA_MODE`, and `NEXT_PUBLIC_APP_NAME`.
- Baby safety reference repo is static and has no runtime key today.
- Official sources confirm Seoul Open Data and SafetyKorea require issued keys.
- Official source sweep did not confirm public API contracts for Pharm114, EU Safety Gate machine API, or Kakao Gift API.

Convergence reason:

- All axes agree on the P0 set.
- Remaining leads are optional expansion/onboarding details, not blockers for current repo completion.

