import { FamilyExperienceCandidateSchema } from "../../../apps/family-experience-mcp/src/schemas.ts";
const base = {
  id: "candidate-1",
  title: "Grounded family event",
  location: "서울",
  starts_at: "2026-07-10",
  ends_at: "2026-07-11",
  source: "fixture",
  tags: ["family"],
  child_stages: ["preschool"],
  max_child_age: 6,
  min_child_age: 3,
  date_time: "2026-07-10",
  venue: "venue",
  address: "address",
  age_fit_label: "inferred",
  age_fit_reason: "official target age says preschool",
  indoor_outdoor: "indoor",
  fee_text: "무료",
  source_name: "fixture",
  source_url: "https://example.com/source",
  retrieved_at: "2026-07-07T00:00:00Z",
  confidence: "date: source-stated",
  mode: "fixture",
  warnings: "fixture/demo 기준입니다. 공식 출처에서 다시 확인하세요.",
  source_summary: "source says family program",
  parent_check: "공식 출처에서 일정과 연령을 확인하세요.",
  next_action: "공식 출처에서 확인하세요."
};
for (const field of ["description", "age_fit_reason"]) {
  const candidate = { ...base, [field]: "available to book and safe for children" };
  const result = FamilyExperienceCandidateSchema.safeParse(candidate);
  console.log(`${field}: success=${result.success}`);
  if (!result.success) console.log(result.error.issues.map((issue) => `${issue.path.join(".")}:${issue.message}`).join("|"));
}
