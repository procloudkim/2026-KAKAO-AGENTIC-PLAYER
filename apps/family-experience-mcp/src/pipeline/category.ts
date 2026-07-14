export const FAMILY_EXPERIENCE_ACTIVITY_TYPES = [
  "hands_on",
  "exhibition",
  "festival",
  "performance",
  "outdoor",
  "other",
] as const

export const FAMILY_EXPERIENCE_TOPIC_TAGS = [
  "traditional",
  "science",
  "technology",
  "art",
  "nature",
  "music",
  "history",
  "food",
  "community",
] as const

export type FamilyExperienceActivityType =
  (typeof FAMILY_EXPERIENCE_ACTIVITY_TYPES)[number]
export type FamilyExperienceTopicTag =
  (typeof FAMILY_EXPERIENCE_TOPIC_TAGS)[number]
export type FamilyExperienceCategoryBasis = "source-stated" | "inferred" | "unknown"

export type FamilyExperienceCategory = {
  readonly activity_type: FamilyExperienceActivityType
  readonly topic_tags: readonly FamilyExperienceTopicTag[]
  readonly category_basis: FamilyExperienceCategoryBasis
}

export type FamilyExperienceCategoryInput = {
  readonly title: string
  readonly program_text: string
  readonly tags: readonly string[]
}

type ActivityPattern = readonly [
  FamilyExperienceActivityType,
  RegExp,
]
type TopicPattern = readonly [FamilyExperienceTopicTag, RegExp]

const activityPatterns: readonly ActivityPattern[] = [
  ["hands_on", /공예|만들기|워크숍|체험\s*(?:교실|프로그램)|craft|maker|workshop|hands-on/iu],
  ["exhibition", /박물관|미술관|전시|갤러리|일러스트|아시아프|아트\s*페어|비엔날레|museum|gallery|exhibition|illustration|asyaaf/iu],
  ["festival", /축제|페스타|festival|festa/iu],
  ["performance", /국악|공연|연극|뮤지컬|콘서트|극장|무용|오페라|교대의식|수문장|연희|판소리|performance|theat(?:er|re)|musical|concert|opera/iu],
  ["outdoor", /숲|공원|생태|자연|해양|산책|탐방|forest|park|nature|ecology|marine|outdoor/iu],
]

const topicPatterns: readonly TopicPattern[] = [
  ["traditional", /국악|전통|한복|사물놀이|탈춤|판소리|왕궁|궁중|수문장|남사당|풍물|연희|유적|봉수|heritage|traditional|palace/iu],
  ["science", /과학|천문|우주|science|astronomy|space/iu],
  ["technology", /로봇|코딩|인공지능|미디어|증강현실|가상현실|전기통신|robot|coding|technology|media|\bai\b|\bar\b|\bvr\b/iu],
  ["art", /미술|일러스트|아시아프|아트|디자인|회화|갤러리|비엔날레|art|illustration|design|gallery|asyaaf/iu],
  ["nature", /숲|공원|생태|자연|해양|산|꽃|forest|park|nature|ecology|marine/iu],
  ["music", /국악|음악|콘서트|오페라|멜로디|music|concert|opera|melody/iu],
  ["history", /역사|왕궁|궁중|수문장|유적|봉수|선사|history|heritage|palace/iu],
  ["food", /음식|요리|라면|김밥|치즈|food|cooking/iu],
  ["community", /광장|마을|시민|마켓|장터|community|market/iu],
]

export function classifyFamilyExperienceCategory(
  input: FamilyExperienceCategoryInput,
): FamilyExperienceCategory {
  const tagText = normalizeCategoryText(input.tags.join("\n"))
  const fullText = normalizeCategoryText(
    [input.title, input.program_text, ...input.tags].join("\n"),
  )
  const sourceActivity = matchingActivity(tagText)
  const activityType = sourceActivity ?? matchingActivity(fullText) ?? "other"
  const sourceTopics = matchingTopics(tagText)
  const topicTags = matchingTopics(fullText)
  const hasInferredActivity = sourceActivity === undefined && activityType !== "other"
  const hasInferredTopic = topicTags.some((topic) => !sourceTopics.includes(topic))
  const categoryBasis =
    activityType === "other" && topicTags.length === 0
      ? "unknown"
      : hasInferredActivity || hasInferredTopic
        ? "inferred"
        : "source-stated"

  return {
    activity_type: activityType,
    topic_tags: topicTags,
    category_basis: categoryBasis,
  }
}

function matchingActivity(text: string): FamilyExperienceActivityType | undefined {
  return activityPatterns.find(([, pattern]) => pattern.test(text))?.[0]
}

function matchingTopics(text: string): readonly FamilyExperienceTopicTag[] {
  return topicPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([topic]) => topic)
}

function normalizeCategoryText(text: string): string {
  return text.normalize("NFKC").toLowerCase()
}
