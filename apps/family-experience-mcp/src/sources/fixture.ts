import type {
  FamilyExperienceSourceAdapter,
  FixtureFamilyExperienceRecord,
  RawSourceSnapshot,
} from "./types.js"

const fixtureSourceId = "fixture-family-experience-v1"
const fixtureSourceUrl = "https://example.invalid/family-experience/fixture-v1"
const fixtureRetrievedAt = "2026-01-15T00:00:00.000Z"
const fixtureNotice = "Fixture/demo data for schema and smoke tests only; not live/current."

function createFixtureSourceReference(rawSnapshotId: string): FixtureFamilyExperienceRecord["source"] {
  return {
    id: fixtureSourceId,
    mode: "fixture",
    url: fixtureSourceUrl,
    raw_snapshot_id: rawSnapshotId,
  }
}

export const fixtureRawSnapshots: readonly RawSourceSnapshot[] = [
  {
    snapshot_id: "fixture-family-experience-v1:raw:kids-makers-2026-07-04",
    source_id: fixtureSourceId,
    retrieved_at: fixtureRetrievedAt,
    request_hash: "fixture-request-hash-kids-makers-2026-07-04",
    payload_ref: "fixtureFamilyExperienceRecords:kids-makers-studio",
  },
  {
    snapshot_id: "fixture-family-experience-v1:raw:story-theater-2026-07-04",
    source_id: fixtureSourceId,
    retrieved_at: fixtureRetrievedAt,
    request_hash: "fixture-request-hash-story-theater-2026-07-04",
    payload_ref: "fixtureFamilyExperienceRecords:rainy-day-story-theater",
  },
  {
    snapshot_id: "fixture-family-experience-v1:raw:science-light-lab-2026-07-04",
    source_id: fixtureSourceId,
    retrieved_at: fixtureRetrievedAt,
    request_hash: "fixture-request-hash-science-light-lab-2026-07-04",
    payload_ref: "fixtureFamilyExperienceRecords:family-science-light-lab",
  },
  {
    snapshot_id: "fixture-family-experience-v1:raw:late-night-media-2026-07-04",
    source_id: fixtureSourceId,
    retrieved_at: fixtureRetrievedAt,
    request_hash: "fixture-request-hash-late-night-media-2026-07-04",
    payload_ref: "fixtureFamilyExperienceRecords:late-night-media-edge",
  },
]

export const fixtureFamilyExperienceRecords: readonly FixtureFamilyExperienceRecord[] = [
  {
    id: "fixture-family-experience-v1:kids-makers-studio",
    raw_snapshot_id: "fixture-family-experience-v1:raw:kids-makers-2026-07-04",
    mode: "fixture",
    title: "Demo Seoul Kids Makers Studio",
    city: "Seoul",
    date: {
      start: "2026-07-04",
      end: "2026-07-04",
      time_text: "10:30-12:00",
    },
    venue: {
      name: "DDP Design Lab Demo Room",
      address: "281 Eulji-ro, Jung-gu, Seoul",
    },
    source: createFixtureSourceReference("fixture-family-experience-v1:raw:kids-makers-2026-07-04"),
    retrieved_at: fixtureRetrievedAt,
    confidence: {
      date: "source-stated",
      venue: "source-stated",
      age_fit: "source-stated",
      reservation: "unknown",
    },
    parent_check: {
      age_fit: "Demo program text states ages 4-6 and guardian participation.",
      reservation: "confirmation_needed",
      live_status: "fixture_not_live",
    },
    child_stages: ["preschool"],
    min_child_age: 4,
    max_child_age: 6,
    indoor_outdoor: "indoor",
    target_age_text: "Ages 4-6 with guardian participation",
    program_text: "Hands-on block and color activity for preschool children in an indoor demo classroom.",
    reservation_url: null,
    contact: null,
    fee_text: "Demo field; confirm fees with an official source in live mode.",
    tags: ["seoul", "weekend", "indoor", "preschool", "hands-on"],
    suitability: "happy_prompt_match",
    fixture_notice: fixtureNotice,
  },
  {
    id: "fixture-family-experience-v1:rainy-day-story-theater",
    raw_snapshot_id: "fixture-family-experience-v1:raw:story-theater-2026-07-04",
    mode: "fixture",
    title: "Demo Rainy Day Story Theater",
    city: "Seoul",
    date: {
      start: "2026-07-04",
      end: "2026-07-04",
      time_text: "13:00-14:00",
    },
    venue: {
      name: "Seoul Children's Library Demo Hall",
      address: "110 Sajik-ro, Jongno-gu, Seoul",
    },
    source: createFixtureSourceReference("fixture-family-experience-v1:raw:story-theater-2026-07-04"),
    retrieved_at: fixtureRetrievedAt,
    confidence: {
      date: "source-stated",
      venue: "source-stated",
      age_fit: "source-stated",
      reservation: "unknown",
    },
    parent_check: {
      age_fit: "Demo program text states preschool family story play for ages 3-7.",
      reservation: "confirmation_needed",
      live_status: "fixture_not_live",
    },
    child_stages: ["preschool"],
    min_child_age: 3,
    max_child_age: 7,
    indoor_outdoor: "indoor",
    target_age_text: "Ages 3-7, family story play",
    program_text: "Indoor picture-book reading and gentle movement session for preschool families.",
    reservation_url: null,
    contact: null,
    fee_text: "Demo field; confirm fees with an official source in live mode.",
    tags: ["seoul", "weekend", "indoor", "preschool", "story"],
    suitability: "happy_prompt_match",
    fixture_notice: fixtureNotice,
  },
  {
    id: "fixture-family-experience-v1:family-science-light-lab",
    raw_snapshot_id: "fixture-family-experience-v1:raw:science-light-lab-2026-07-04",
    mode: "fixture",
    title: "Demo Family Science Light Lab",
    city: "Seoul",
    date: {
      start: "2026-07-04",
      end: "2026-07-04",
      time_text: "15:30-16:30",
    },
    venue: {
      name: "Seoul Science Center Demo Classroom",
      address: "160 Hwarang-ro, Nowon-gu, Seoul",
    },
    source: createFixtureSourceReference("fixture-family-experience-v1:raw:science-light-lab-2026-07-04"),
    retrieved_at: fixtureRetrievedAt,
    confidence: {
      date: "source-stated",
      venue: "source-stated",
      age_fit: "source-stated",
      reservation: "unknown",
    },
    parent_check: {
      age_fit: "Demo program text states a preschool-friendly guardian lab for ages 4-8.",
      reservation: "confirmation_needed",
      live_status: "fixture_not_live",
    },
    child_stages: ["preschool", "school_age"],
    min_child_age: 4,
    max_child_age: 8,
    indoor_outdoor: "indoor",
    target_age_text: "Ages 4-8 with guardian",
    program_text: "Indoor light-and-shadow activity with simple materials and parent participation.",
    reservation_url: null,
    contact: null,
    fee_text: "Demo field; confirm fees with an official source in live mode.",
    tags: ["seoul", "weekend", "indoor", "preschool", "science"],
    suitability: "happy_prompt_match",
    fixture_notice: fixtureNotice,
  },
  {
    id: "fixture-family-experience-v1:late-night-media-edge",
    raw_snapshot_id: "fixture-family-experience-v1:raw:late-night-media-2026-07-04",
    mode: "fixture",
    title: "Demo Late Night Media Concert Edge Case",
    city: "Seoul",
    date: {
      start: "2026-07-04",
      end: "2026-07-04",
      time_text: "21:30-23:00",
    },
    venue: {
      name: "Seoul Civic Media Hall Demo Stage",
      address: "15 Sejong-daero, Jung-gu, Seoul",
    },
    source: createFixtureSourceReference("fixture-family-experience-v1:raw:late-night-media-2026-07-04"),
    retrieved_at: fixtureRetrievedAt,
    confidence: {
      date: "source-stated",
      venue: "source-stated",
      age_fit: "source-stated",
      reservation: "unknown",
    },
    parent_check: {
      age_fit: "Demo program text states ages 12+ with loud audio and strobe effects.",
      reservation: "confirmation_needed",
      live_status: "fixture_not_live",
    },
    child_stages: ["teen"],
    min_child_age: 12,
    max_child_age: 17,
    indoor_outdoor: "indoor",
    target_age_text: "Ages 12+; loud audio and strobe effects",
    program_text: "Late-night media performance with loud audio, dark room staging, and flashing lights.",
    reservation_url: null,
    contact: null,
    fee_text: "Demo field; confirm fees with an official source in live mode.",
    tags: ["seoul", "weekend", "indoor", "teen", "edge"],
    suitability: "edge_unsuitable",
    fixture_notice: fixtureNotice,
  },
]

export const fixtureSourceAdapter: FamilyExperienceSourceAdapter = {
  source_id: fixtureSourceId,
  mode: "fixture",
  list: () =>
    Promise.resolve({
      ok: true,
      source_id: fixtureSourceId,
      mode: "fixture",
      retrieved_at: fixtureRetrievedAt,
      raw_snapshots: fixtureRawSnapshots,
      records: fixtureFamilyExperienceRecords,
    }),
}
