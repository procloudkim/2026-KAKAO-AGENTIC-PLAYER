# Data Pipeline

## Source Priority

1. Seoul cultural events Open API for the first city lane.
2. Korea TourAPI event/tourism/location/image endpoints for national coverage.
3. National cultural festival standard data for baseline festival records.
4. Culture arts education resource/program APIs for education and program enrichment.
5. Forest/science/local institution datasets only when fields include target, fee, date, venue, homepage/contact, and source freshness.

## Pipeline Shape

```text
source adapter
-> raw event snapshot
-> normalized event candidate
-> child-fit scorer
-> source confidence label
-> Top 3 answer card
```

## Normalized Candidate Fields

- `title`
- `source_name`
- `source_url`
- `retrieved_at`
- `date_start`
- `date_end`
- `time_text`
- `venue`
- `address`
- `lat`
- `lon`
- `target_age_text`
- `program_text`
- `indoor_outdoor`
- `fee_text`
- `reservation_url`
- `contact`
- `confidence`
- `parent_checks`

## Safety Rules

- Do not claim an event is suitable for an age unless the source or program text supports it.
- If age fit is inferred from program text, label it as inferred.
- If reservation status is unknown, say "예약/운영 여부 확인 필요."
- Do not scrape event pages until terms and robots policy are recorded.

