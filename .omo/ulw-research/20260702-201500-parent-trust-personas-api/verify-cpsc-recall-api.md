# Verification: CPSC Recall API Surface

## Claim
CPSC recall data has a public machine-readable JSON surface that can be used as a global recall side lane.

## Invocation
```powershell
$urls=@(
  'https://www.saferproducts.gov/RestWebServices/Recall?format=json',
  'https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=2026-01-01',
  'https://www.saferproducts.gov/RestWebServices/Recall?format=json&ProductName=pacifier'
)
foreach($url in $urls){
  Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
}
```

## Observed Output
- `https://www.saferproducts.gov/RestWebServices/Recall?format=json`
  - `STATUS=200`
  - `CONTENT_TYPE=application/json; charset=utf-8`
  - Body started with a 2026 recall object containing `RecallID`, `RecallNumber`, `RecallDate`, `Description`.
- `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=2026-01-01`
  - `STATUS=200`
  - `CONTENT_TYPE=application/json; charset=utf-8`
  - Body returned an error-shaped recall object: `Error retrieving Recalls: The underlying provider failed on Open.`
- `https://www.saferproducts.gov/RestWebServices/Recall?format=json&ProductName=pacifier`
  - Request timed out after 20 seconds.

## Verdict
PARTIAL.

The base JSON recall API is reachable, but filtered calls showed reliability and latency risk in this session. Use CPSC as a P2 global recall lane with timeout, cache, and fallback behavior, not as the first MVP-critical source for Korean parent decisions.
