import type { FamilyExperienceSourceRecord, SourceId } from "../src/sources/types.js"

export function smokeRecords(): readonly FamilyExperienceSourceRecord[] {
  return [
    smokeRecord({
      sourceId: "culture-portal-oneview",
      id: "culture-portal-oneview:task-7-busan-weekend",
      title: "Busan Indoor Family Studio",
      city: "Busan",
      date: { start: "2026-07-04", end: "2026-07-05", time_text: "10:00-12:00" },
      venue: { name: "Busan Culture Center", address: "Busan Haeundae-gu indoor hall" },
      childStages: ["preschool"],
      minChildAge: 3,
      maxChildAge: 6,
      indoorOutdoor: "indoor",
      feeText: "Synthetic fixture fee text; confirm with the official source before visiting",
      programText: "Indoor family studio for preschool children.",
      tags: ["busan", "indoor", "preschool", "cache"],
    }),
    smokeRecord({
      sourceId: "kto-tourapi-events",
      id: "kto-tourapi-events:task-7-jeju-school-free",
      title: "Jeju Family Sea Festival",
      city: "Jeju",
      date: { start: "2026-07-04", end: "2026-07-05", time_text: "09:00-17:00" },
      venue: { name: "Jeju Family Sea Festival", address: "Jeju Seogwipo-si family beach plaza" },
      childStages: ["school_age"],
      minChildAge: 7,
      maxChildAge: 12,
      indoorOutdoor: "outdoor",
      feeText: "Synthetic fixture fee text; confirm with the official source before visiting",
      programText: "Family festival listing for elementary school age children.",
      tags: ["jeju", "school_age", "free", "cache"],
    }),
  ]
}

type SmokeRecordInput = {
  readonly sourceId: SourceId
  readonly id: string
  readonly title: string
  readonly city: string
  readonly date: FamilyExperienceSourceRecord["date"]
  readonly venue: FamilyExperienceSourceRecord["venue"]
  readonly childStages: FamilyExperienceSourceRecord["child_stages"]
  readonly minChildAge: number
  readonly maxChildAge: number
  readonly indoorOutdoor: FamilyExperienceSourceRecord["indoor_outdoor"]
  readonly feeText: string
  readonly programText: string
  readonly tags: FamilyExperienceSourceRecord["tags"]
}

function smokeRecord(input: SmokeRecordInput): FamilyExperienceSourceRecord {
  const rawSnapshotId = `${input.sourceId}:raw:${input.id}`

  return {
    id: input.id,
    raw_snapshot_id: rawSnapshotId,
    mode: "fixture",
    title: input.title,
    city: input.city,
    date: input.date,
    venue: input.venue,
    source: {
      id: input.sourceId,
      mode: "fixture",
      url: `https://example.invalid/${input.sourceId}/${input.id}`,
      raw_snapshot_id: rawSnapshotId,
    },
    retrieved_at: new Date().toISOString(),
    confidence: { date: "source-stated", venue: "source-stated", age_fit: "source-stated", reservation: "unknown" },
    parent_check: {
      age_fit: "Synthetic cache text marks family child suitability.",
      reservation: "confirmation_needed",
      live_status: "fixture_not_live",
    },
    child_stages: input.childStages,
    min_child_age: input.minChildAge,
    max_child_age: input.maxChildAge,
    indoor_outdoor: input.indoorOutdoor,
    target_age_text: "family child program",
    program_text: input.programText,
    reservation_url: null,
    contact: null,
    fee_text: input.feeText,
    tags: input.tags,
    suitability: "happy_prompt_match",
    fixture_notice: "Cache smoke record; verify official source before visiting.",
  }
}
