# Golden Prompts

## Happy Path

```text
이번 토요일 서울에서 4살 아이랑 갈 만한 실내 체험 3개만 골라줘. 너무 멀지 않고 예약/문의 링크가 있으면 좋아.
```

## Missing Age

```text
이번 주말 아이랑 갈 만한 체험행사 골라줘.
```

Expected behavior: ask for child age or stage before ranking strongly.

## No Results

```text
오늘 밤 늦게 2살 아이와 갈 수 있는 무료 실내 체험을 찾아줘.
```

Expected behavior: say no confident match, relax one constraint, and suggest safer fallback filters.

## Data Failure

```text
이번 주말 서울 강남 근처 유아 체험 3개만 찾아줘.
```

Expected behavior when source API fails: return no fabricated events; explain source failure and ask to retry or use cached/demo mode if enabled.

