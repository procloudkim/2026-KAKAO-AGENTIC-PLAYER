# Verification: PlayMCP Public Catalog Sweep

Date: 2026-07-02 KST

## Claim Tested

The family-experience MCP should not rely on an unsupported "no competitors exist" assumption.

## Method

Node `fetch` requested:

```text
https://playmcp.kakao.com/api/v1/mcps?page=<0..>&sortBy=FEATURED_LEVEL&pageSize=12
```

Raw API output:

```text
.omo/ulw-research/20260702-091443-no-hitl-winning-readiness/raw/playmcp-pages.json
```

Focused keyword and neighbor matrices:

```text
.omo/ulw-research/20260702-091443-no-hitl-winning-readiness/assets/playmcp-focused-keyword-matches.tsv
.omo/ulw-research/20260702-091443-no-hitl-winning-readiness/assets/playmcp-neighbor-candidate-matrix.md
```

## Executed Output Summary

- Fetched pages: `18`
- API `totalElements`: `212`
- API `totalPages`: `18`
- Flattened rows: `212`
- Focused name/description/tool candidate rows: `44`

## Neighbor / Partial Competitor Findings

- `키즈허브`: broad parenting MCP. It includes emergency rooms, childcare, kindergarten, school schedule, museums/cultural facilities, child growth, vaccination, popular books by age, Seoul kids cafes, welfare, and Kakao routing.
- `한국관광공사 Tour MCP`: tourism/event MCP using KTO official APIs; includes future festivals/events and accessibility search including family/infant-adjacent travel.
- `서울 관광 (Seoul Tourism)`: Visit Seoul data for festivals/events, attractions, restaurants, shopping, lodging, and sync status.
- `Korea Culture MCP`: movie, performance, festival/event, tourist spot, and restaurant search.
- `ArtBridge`: performance recommender using KOPIS performance data.

## Verdict

PARTIAL / STRATEGIC UPDATE.

The prior "no direct competitor" framing is too strong. There is no verified public evidence, from this catalog sweep alone, of an exact duplicate focused specifically on nationwide child-age-banded experiential events from newborn through elementary age with source-level suitability labels. However, `키즈허브` is a serious partial direct competitor and several tourism/culture MCPs overlap the event-discovery surface.

