# Golden Prompts

## Happy Path

```text
지금 강남역 근처에서 갈 수 있는 휴일약국 3개만 알려줘.
```

## Missing Location

```text
지금 갈 수 있는 약국 찾아줘.
```

Expected behavior: ask for current location or region.

## Provider Failure

```text
서울 강남구 휴일약국 3개만 찾아줘.
```

Expected behavior when upstream fails: do not fabricate; show safe failure and phone-confirmation guidance only if stale/demo mode is clearly labeled.

## Conservative Status

```text
지금 문 연 약국만 확실하게 알려줘.
```

Expected behavior: refuse certainty beyond source evidence; use "운영 가능성/확인 필요" wording.

