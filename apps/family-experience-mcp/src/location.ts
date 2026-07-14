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

export const SEOUL_DISTRICT_DEFINITIONS = [
  { value: "Gangnam-gu", korean: "강남구", aliases: ["gangnam-gu", "gangnam", "강남구", "강남"] },
  { value: "Gangdong-gu", korean: "강동구", aliases: ["gangdong-gu", "gangdong", "강동구", "강동"] },
  { value: "Gangbuk-gu", korean: "강북구", aliases: ["gangbuk-gu", "gangbuk", "강북구", "강북"] },
  { value: "Gangseo-gu", korean: "강서구", aliases: ["gangseo-gu", "gangseo", "강서구", "강서"] },
  { value: "Gwanak-gu", korean: "관악구", aliases: ["gwanak-gu", "gwanak", "관악구", "관악"] },
  { value: "Gwangjin-gu", korean: "광진구", aliases: ["gwangjin-gu", "gwangjin", "광진구", "광진"] },
  { value: "Guro-gu", korean: "구로구", aliases: ["guro-gu", "guro", "구로구", "구로"] },
  { value: "Geumcheon-gu", korean: "금천구", aliases: ["geumcheon-gu", "geumcheon", "금천구", "금천"] },
  { value: "Nowon-gu", korean: "노원구", aliases: ["nowon-gu", "nowon", "노원구", "노원"] },
  { value: "Dobong-gu", korean: "도봉구", aliases: ["dobong-gu", "dobong", "도봉구", "도봉"] },
  { value: "Dongdaemun-gu", korean: "동대문구", aliases: ["dongdaemun-gu", "dongdaemun", "동대문구", "동대문"] },
  { value: "Dongjak-gu", korean: "동작구", aliases: ["dongjak-gu", "dongjak", "동작구", "동작"] },
  { value: "Mapo-gu", korean: "마포구", aliases: ["mapo-gu", "mapo", "마포구", "마포"] },
  { value: "Seodaemun-gu", korean: "서대문구", aliases: ["seodaemun-gu", "seodaemun", "서대문구", "서대문"] },
  { value: "Seocho-gu", korean: "서초구", aliases: ["seocho-gu", "seocho", "서초구", "서초"] },
  { value: "Seongdong-gu", korean: "성동구", aliases: ["seongdong-gu", "seongdong", "성동구", "성동"] },
  { value: "Seongbuk-gu", korean: "성북구", aliases: ["seongbuk-gu", "seongbuk", "성북구", "성북"] },
  { value: "Songpa-gu", korean: "송파구", aliases: ["songpa-gu", "songpa", "송파구", "송파"] },
  { value: "Yangcheon-gu", korean: "양천구", aliases: ["yangcheon-gu", "yangcheon", "양천구", "양천"] },
  { value: "Yeongdeungpo-gu", korean: "영등포구", aliases: ["yeongdeungpo-gu", "yeongdeungpo", "영등포구", "영등포"] },
  { value: "Yongsan-gu", korean: "용산구", aliases: ["yongsan-gu", "yongsan", "용산구", "용산"] },
  { value: "Eunpyeong-gu", korean: "은평구", aliases: ["eunpyeong-gu", "eunpyeong", "은평구", "은평"] },
  { value: "Jongno-gu", korean: "종로구", aliases: ["jongno-gu", "jongno", "종로구", "종로"] },
  { value: "Jung-gu", korean: "중구", aliases: ["jung-gu", "jung", "중구"] },
  { value: "Jungnang-gu", korean: "중랑구", aliases: ["jungnang-gu", "jungnang", "중랑구", "중랑"] },
] as const

export type SeoulDistrict = (typeof SEOUL_DISTRICT_DEFINITIONS)[number]["value"]

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
  const explicitRegion = regionAliases[normalized] ??
    preciseRegionPatterns.find(([pattern]) => pattern.test(normalized))?.[1]
  if (explicitRegion !== undefined) return explicitRegion
  return canonicalSeoulDistrict(normalized) === undefined ? undefined : "seoul"
}

export function familyExperienceRegionMatches(input: {
  readonly requestedLocation: string
  readonly recordCity: string
  readonly recordAddress?: string
  readonly recordVenue?: string
}): boolean {
  const requested = canonicalFamilyExperienceRegion(input.requestedLocation)
  const record = canonicalFamilyExperienceRecordRegion(
    input.recordCity,
    input.recordAddress,
  )
  if (requested === undefined || record === undefined) {
    return false
  }
  const regionMatches = requested === record || broadRegionMembers[requested]?.includes(record) === true
  if (!regionMatches) {
    return false
  }

  const requestedDistrict = requested === "seoul"
    ? canonicalSeoulDistrict(input.requestedLocation)
    : undefined
  return requestedDistrict === undefined || seoulDistrictMatchesText(
    requestedDistrict,
    `${input.recordCity} ${input.recordAddress ?? ""} ${input.recordVenue ?? ""}`,
  )
}

export function canonicalSeoulDistrict(location: string): SeoulDistrict | undefined {
  const normalized = normalizeLocationText(location)
  const exact = SEOUL_DISTRICT_DEFINITIONS.find((definition) =>
    definition.aliases.some((alias) => alias === normalized)
  )?.value
  if (exact !== undefined) return exact

  const embedded = seoulDistrictsInText(normalized)
  return embedded.length === 1 ? embedded[0] : undefined
}

export function seoulDistrictsInText(text: string): readonly SeoulDistrict[] {
  const normalized = normalizeLocationText(text)
  return SEOUL_DISTRICT_DEFINITIONS
    .filter((definition) => definition.aliases.some((alias) => containsAlias(normalized, alias)))
    .map((definition) => definition.value)
}

export function seoulDistrictAliases(location: string): readonly string[] {
  const district = canonicalSeoulDistrict(location)
  return district === undefined
    ? []
    : SEOUL_DISTRICT_DEFINITIONS.find((definition) => definition.value === district)?.aliases ?? []
}

export function seoulDistrictKoreanName(location: string): string | undefined {
  const district = canonicalSeoulDistrict(location)
  return district === undefined
    ? undefined
    : SEOUL_DISTRICT_DEFINITIONS.find((definition) => definition.value === district)?.korean
}

export function familyExperienceLocationLabel(location: string): string | undefined {
  const region = canonicalFamilyExperienceRegion(location)
  const district = region === "seoul" ? seoulDistrictKoreanName(location) : undefined
  if (district !== undefined) return district
  return region === undefined ? undefined : regionLabels[region]
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

const regionLabels: Readonly<Record<FamilyExperienceRegion, string>> = {
  seoul: "서울",
  busan: "부산",
  daegu: "대구",
  daejeon: "대전",
  gwangju: "광주",
  incheon: "인천",
  ulsan: "울산",
  sejong: "세종",
  gyeonggi: "경기",
  gangwon: "강원",
  chungcheong: "충청",
  chungbuk: "충북",
  chungnam: "충남",
  jeolla: "전라",
  jeonbuk: "전북",
  jeonnam: "전남",
  gyeongsang: "경상",
  gyeongbuk: "경북",
  gyeongnam: "경남",
  jeju: "제주",
}

function seoulDistrictMatchesText(district: SeoulDistrict, text: string): boolean {
  const normalized = normalizeLocationText(text)
  const definition = SEOUL_DISTRICT_DEFINITIONS.find((candidate) => candidate.value === district)
  return definition?.aliases.some((alias) => containsAlias(normalized, alias)) === true
}

function containsAlias(text: string, alias: string): boolean {
  if (!/[a-z]/u.test(alias)) {
    return text.includes(alias)
  }
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
  return new RegExp(`(?:^|[^a-z])${escaped}(?=$|[^a-z])`, "u").test(text)
}

function normalizeLocationText(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/gu, " ")
}
