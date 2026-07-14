export const FAMILY_EXPERIENCE_REGIONS = [
  "seoul",
  "busan",
  "daegu",
  "daejeon",
  "gwangju",
  "incheon",
  "ulsan",
  "sejong",
  "gyeonggi",
  "gangwon",
  "chungcheong",
  "chungbuk",
  "chungnam",
  "jeolla",
  "jeonbuk",
  "jeonnam",
  "gyeongsang",
  "gyeongbuk",
  "gyeongnam",
  "jeju",
] as const

export type FamilyExperienceRegion = (typeof FAMILY_EXPERIENCE_REGIONS)[number]

const regionAliases: Readonly<Record<string, FamilyExperienceRegion>> = {
  seoul: "seoul",
  "서울": "seoul",
  "서울특별시": "seoul",
  "jung-gu": "seoul",
  "jongno-gu": "seoul",
  "nowon-gu": "seoul",
  "중구": "seoul",
  "종로구": "seoul",
  "노원구": "seoul",
  busan: "busan",
  "부산": "busan",
  "부산광역시": "busan",
  "busan haeundae": "busan",
  "부산 해운대": "busan",
  daegu: "daegu",
  "대구": "daegu",
  "대구광역시": "daegu",
  daejeon: "daejeon",
  "대전": "daejeon",
  "대전광역시": "daejeon",
  gwangju: "gwangju",
  "광주": "gwangju",
  "광주광역시": "gwangju",
  incheon: "incheon",
  "인천": "incheon",
  "인천광역시": "incheon",
  ulsan: "ulsan",
  "울산": "ulsan",
  "울산광역시": "ulsan",
  sejong: "sejong",
  "세종": "sejong",
  "세종시": "sejong",
  "세종특별자치시": "sejong",
  gyeonggi: "gyeonggi",
  "경기": "gyeonggi",
  "경기도": "gyeonggi",
  gangwon: "gangwon",
  "강원": "gangwon",
  "강원도": "gangwon",
  "강원특별자치도": "gangwon",
  chungcheong: "chungcheong",
  "충청": "chungcheong",
  chungbuk: "chungbuk",
  "충북": "chungbuk",
  "충청북도": "chungbuk",
  chungnam: "chungnam",
  "충남": "chungnam",
  "충청남도": "chungnam",
  jeolla: "jeolla",
  "전라": "jeolla",
  "전라도": "jeolla",
  jeonbuk: "jeonbuk",
  "전북": "jeonbuk",
  "전라북도": "jeonbuk",
  "전북특별자치도": "jeonbuk",
  jeonnam: "jeonnam",
  "전남": "jeonnam",
  "전라남도": "jeonnam",
  "전남광주통합특별시": "jeonnam",
  gyeongsang: "gyeongsang",
  "경상": "gyeongsang",
  "경상권": "gyeongsang",
  gyeongbuk: "gyeongbuk",
  "경북": "gyeongbuk",
  "경상북도": "gyeongbuk",
  gyeongnam: "gyeongnam",
  "경남": "gyeongnam",
  "경상남도": "gyeongnam",
  jeju: "jeju",
  "제주": "jeju",
  "제주도": "jeju",
  "제주특별자치도": "jeju",
}

const preciseRegionPatterns: readonly (readonly [RegExp, FamilyExperienceRegion])[] = [
  [/^서울(?:특별시)?(?:\s|$)/u, "seoul"],
  [/^부산(?:광역시)?(?:\s|$)/u, "busan"],
  [/^대구(?:광역시)?(?:\s|$)/u, "daegu"],
  [/^대전(?:광역시)?(?:\s|$)/u, "daejeon"],
  [/^광주(?:광역시)?(?:\s|$)/u, "gwangju"],
  [/^인천(?:광역시)?(?:\s|$)/u, "incheon"],
  [/^울산(?:광역시)?(?:\s|$)/u, "ulsan"],
  [/^세종(?:특별자치시|시)?(?:\s|$)/u, "sejong"],
  [/^경기도(?:\s|$)/u, "gyeonggi"],
  [/^강원(?:특별자치도|도)(?:\s|$)/u, "gangwon"],
  [/^(?:충청북도|충북)(?:\s|$)/u, "chungbuk"],
  [/^(?:충청남도|충남)(?:\s|$)/u, "chungnam"],
  [/^(?:전북특별자치도|전라북도|전북)(?:\s|$)/u, "jeonbuk"],
  [/^(?:전남광주통합특별시|전라남도|전남)(?:\s|$)/u, "jeonnam"],
  [/^(?:경상북도|경북)(?:\s|$)/u, "gyeongbuk"],
  [/^(?:경상남도|경남)(?:\s|$)/u, "gyeongnam"],
  [/^제주(?:특별자치도|도)?(?:\s|$)/u, "jeju"],
]

const broadRegionMembers: Readonly<
  Partial<Record<FamilyExperienceRegion, readonly FamilyExperienceRegion[]>>
> = {
  chungcheong: ["chungbuk", "chungnam"],
  jeolla: ["jeonbuk", "jeonnam"],
  gyeongsang: ["gyeongbuk", "gyeongnam"],
}

export function canonicalFamilyExperienceRegion(
  location: string,
): FamilyExperienceRegion | undefined {
  const normalized = location.normalize("NFKC").trim().toLowerCase()
  if (/^전남광주통합특별시(?:\s|$)/u.test(normalized)) {
    const administrativeUnit = normalized.split(/\s+/u)[1]
    return administrativeUnit !== undefined &&
      ["동구", "서구", "남구", "북구", "광산구"].includes(administrativeUnit)
      ? "gwangju"
      : "jeonnam"
  }
  return regionAliases[normalized] ?? preciseRegionPatterns.find(([pattern]) => pattern.test(normalized))?.[1]
}

export function familyExperienceRegionMatches(input: {
  readonly requestedLocation: string
  readonly recordCity: string
  readonly recordAddress?: string
}): boolean {
  const requested = canonicalFamilyExperienceRegion(input.requestedLocation)
  const record = canonicalFamilyExperienceRecordRegion(
    input.recordCity,
    input.recordAddress,
  )
  if (requested === undefined || record === undefined) {
    return false
  }
  return requested === record || broadRegionMembers[requested]?.includes(record) === true
}

function canonicalFamilyExperienceRecordRegion(
  city: string,
  address: string | undefined,
): FamilyExperienceRegion | undefined {
  const cityRegion = canonicalFamilyExperienceRegion(city)
  const addressRegion = address === undefined
    ? undefined
    : canonicalFamilyExperienceRegion(address)
  if (cityRegion === undefined) return addressRegion
  if (addressRegion === undefined || cityRegion === addressRegion) return cityRegion
  if (broadRegionMembers[cityRegion]?.includes(addressRegion) === true) {
    return addressRegion
  }
  if (broadRegionMembers[addressRegion]?.includes(cityRegion) === true) {
    return cityRegion
  }
  return undefined
}
