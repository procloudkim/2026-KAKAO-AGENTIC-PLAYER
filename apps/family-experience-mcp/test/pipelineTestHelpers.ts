import { FindFamilyExperiencesInputSchema } from "../src/schemas.js"
import { fixtureFamilyExperienceRecords } from "../src/sources/fixture.js"
import type { FamilyExperienceSourceRecord, SourceId } from "../src/sources/types.js"

export { fixtureFamilyExperienceRecords } from "../src/sources/fixture.js"

export const happyPromptInput = FindFamilyExperiencesInputSchema.parse({
  location: "Seoul",
  date_range: {
    start: "2026-07-04",
    end: "2026-07-04",
  },
  child_age: 4,
})

export const nationwidePromptInput = FindFamilyExperiencesInputSchema.parse({
  location: "Busan Haeundae",
  date_range: {
    start: "2026-08-01",
    end: "2026-08-01",
  },
  child_stage: "preschool",
})

type SourceRecordOverride = {
  readonly id?: string
  readonly raw_snapshot_id?: string
  readonly title?: string
  readonly city?: string
  readonly date?: FamilyExperienceSourceRecord["date"]
  readonly venue?: FamilyExperienceSourceRecord["venue"]
  readonly source?: FamilyExperienceSourceRecord["source"]
  readonly retrieved_at?: string
  readonly confidence?: FamilyExperienceSourceRecord["confidence"]
  readonly parent_check?: FamilyExperienceSourceRecord["parent_check"]
  readonly child_stages?: FamilyExperienceSourceRecord["child_stages"]
  readonly min_child_age?: number
  readonly max_child_age?: number
  readonly indoor_outdoor?: FamilyExperienceSourceRecord["indoor_outdoor"]
  readonly target_age_text?: string
  readonly program_text?: string
  readonly reservation_url?: string | null
  readonly contact?: string | null
  readonly fee_text?: string
  readonly tags?: FamilyExperienceSourceRecord["tags"]
  readonly suitability?: FamilyExperienceSourceRecord["suitability"]
  readonly fixture_notice?: string
}

export function fixtureAt(index: number): FamilyExperienceSourceRecord {
  const record = fixtureFamilyExperienceRecords[index]

  if (record === undefined) {
    throw new Error(`Missing fixture record at index ${index}`)
  }

  return record
}

export function sourceReference(
  sourceId: SourceId,
  rawSnapshotId: string,
): FamilyExperienceSourceRecord["source"] {
  return {
    id: sourceId,
    mode: "live",
    url: `https://example.invalid/${sourceId}/${rawSnapshotId}`,
    raw_snapshot_id: rawSnapshotId,
  }
}

export function officialRecord(overrides: SourceRecordOverride = {}): FamilyExperienceSourceRecord {
  const rawSnapshotId = overrides.raw_snapshot_id ?? "culture-portal-oneview:raw:busan-stage"
  const source = overrides.source ?? sourceReference("culture-portal-oneview", rawSnapshotId)

  return {
    id: overrides.id ?? "culture-portal-oneview:busan-child-stage",
    raw_snapshot_id: rawSnapshotId,
    mode: "live",
    title: overrides.title ?? "Busan Child Stage Festival",
    city: overrides.city ?? "Busan",
    date: overrides.date ?? {
      start: "2026-08-01",
      end: "2026-08-01",
      time_text: "10:00-12:00",
    },
    venue: overrides.venue ?? {
      name: "Haeundae Culture Center",
      address: "Busan Haeundae-gu Centum 1-ro",
    },
    source,
    retrieved_at: overrides.retrieved_at ?? "2026-07-01T00:00:00.000Z",
    confidence: overrides.confidence ?? {
      date: "source-stated",
      venue: "source-stated",
      age_fit: "source-stated",
      reservation: "unknown",
    },
    parent_check: overrides.parent_check ?? {
      age_fit: "Official source states preschool family program.",
      reservation: "confirmation_needed",
      live_status: "source_timestamp_required",
    },
    child_stages: overrides.child_stages ?? ["preschool"],
    min_child_age: overrides.min_child_age ?? 3,
    max_child_age: overrides.max_child_age ?? 6,
    indoor_outdoor: overrides.indoor_outdoor ?? "indoor",
    target_age_text: overrides.target_age_text ?? "Preschool family program",
    program_text: overrides.program_text ?? "Family culture program for preschool children.",
    reservation_url: overrides.reservation_url ?? null,
    contact: overrides.contact ?? null,
    fee_text: overrides.fee_text ?? "Confirm fees with the official source.",
    tags: overrides.tags ?? ["busan", "preschool", "official"],
    suitability: overrides.suitability ?? "happy_prompt_match",
    fixture_notice: overrides.fixture_notice ?? "Live official source record; verify current details before visiting.",
  }
}

export async function loadPipeline() {
  const normalize = await import("../src/pipeline/normalize.js")
  const rank = await import("../src/pipeline/rank.js")
  const render = await import("../src/pipeline/render.js")

  return {
    ...normalize,
    ...rank,
    ...render,
  }
}
