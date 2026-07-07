import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (...parts) => path.join(root, ...parts);

const files = {
  plan: p(".omo/plans/family-experience-winning-sdd-to-submission.md"),
  c001: p(".omo/evidence/winning-sdd-plan/C001-plan-content-check.txt"),
  c002: p(".omo/evidence/winning-sdd-plan/C002-guardrail-scan.txt"),
  c003StatusText: p(".omo/evidence/winning-sdd-plan/C003-loop-status-check.txt"),
  c003StatusJson: p(".omo/evidence/winning-sdd-plan/C003-loop-status.json"),
  c003GitStatus: p(".omo/evidence/winning-sdd-plan/C003-git-status.txt"),
  finalGate: p(".omo/evidence/winning-sdd-plan/final-quality-gate.json"),
  goals: p(".omo/ulw-loop/family-experience-winning-sdd-20260703/goals.json"),
  ledger: p(".omo/ulw-loop/family-experience-winning-sdd-20260703/ledger.jsonl"),
};

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function existsNonEmpty(file) {
  try {
    const st = fs.statSync(file);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
}

function parseJson(file) {
  return JSON.parse(read(file));
}

function flattenCriteria(goalsJson) {
  const goals = Array.isArray(goalsJson) ? goalsJson : goalsJson.goals || [];
  return goals.flatMap((goal) =>
    (goal.successCriteria || goal.criteria || []).map((criterion) => ({
      goalId: goal.id,
      criterionId: criterion.id,
      status: criterion.status,
      title: criterion.title || criterion.description || "",
    })),
  );
}

function ledgerPasses() {
  const text = read(files.ledger);
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    })
    .filter((entry) => JSON.stringify(entry).toLowerCase().includes('"status":"pass"'));
}

function hasUnresolvedPlaceholder(text) {
  return /\b(tbd|placeholder|xxx|fixme)\b/i.test(text) || /<\s*(fill|todo|tbd|placeholder|insert|replace|your|path|url|key|token|secret)[^>\r\n]*>/i.test(text);
}

function report(name, checks) {
  const failed = checks.filter((check) => !check.pass);
  const out = { check: name, verdict: failed.length === 0 ? "PASS" : "FAIL", checks };
  console.log(JSON.stringify(out, null, 2));
  process.exitCode = failed.length === 0 ? 0 : 1;
}

const mode = process.argv[2] || "all";

if (mode === "inventory") {
  report(
    "inventory",
    Object.entries(files).map(([id, file]) => ({
      id,
      path: path.relative(root, file),
      pass: existsNonEmpty(file),
      bytes: existsNonEmpty(file) ? fs.statSync(file).size : 0,
    })),
  );
} else if (mode === "criteria") {
  const goalsJson = parseJson(files.goals);
  const criteria = flattenCriteria(goalsJson);
  const passes = ledgerPasses();
  const statusJson = parseJson(files.c003StatusJson);
  const statusText = JSON.stringify(statusJson).toLowerCase();
  report("criteria", [
    { id: "criteria_exist", pass: criteria.length > 0, count: criteria.length },
    {
      id: "all_goal_criteria_status_pass",
      pass: criteria.length > 0 && criteria.every((c) => String(c.status).toLowerCase() === "pass"),
      criteria,
    },
    { id: "ledger_has_pass_records", pass: passes.length >= criteria.length, passRecords: passes.length },
    {
      id: "cached_status_indicates_completion",
      pass: /complete|completed/.test(statusText) && !/"status":"failed"/.test(statusText),
    },
  ]);
} else if (mode === "c001") {
  const text = read(files.c001);
  const lower = text.toLowerCase();
  const plan = read(files.plan).toLowerCase();
  report("c001", [
    { id: "powershell_literal_script_blocks", pass: /powershell_literal_script_blocks\s*[:=]\s*(true|pass)/i.test(text) },
    { id: "task1_green_writes_evidence", pass: /task1_green_writes_evidence\s*[:=]\s*(true|pass)/i.test(text) },
    {
      id: "browser_invocation_covered",
      pass: lower.includes("browser") && (lower.includes("chrome") || plan.includes("chrome") || plan.includes("browser")),
    },
    {
      id: "browser_cleanup_covered",
      pass: lower.includes("cleanup") && lower.includes("browser"),
    },
    { id: "no_unresolved_placeholders", pass: !hasUnresolvedPlaceholder(text + "\n" + read(files.plan)) },
  ]);
} else if (mode === "guardrails") {
  const scopedText = [files.plan, files.c001, files.c002, files.c003StatusText, files.c003StatusJson, files.finalGate]
    .map((file) => `\n--- ${path.relative(root, file)} ---\n${read(file)}`)
    .join("\n");
  const lower = scopedText.toLowerCase();
  const rawSecretPattern =
    /(sk-[A-Za-z0-9_-]{20,}|authorization:\s*bearer\s+[A-Za-z0-9._-]{20,}|(?:kakao|seoul|openai)?[_-]?(?:api|rest|admin)?[_-]?(?:key|token|secret)\s*[:=]\s*['"]?(?!false\b|true\b|missing\b|blocked\b|redacted\b|present\b|none\b)[A-Za-z0-9_-]{20,})/i;
  report("guardrails", [
    {
      id: "no_fake_deployment_completion",
      pass: !/(deployed\s+to\s+production|production\s+deployment\s+complete|submitted\s+to\s+kakao|playmcp\s+submission\s+complete)/i.test(scopedText),
    },
    {
      id: "plan_only_future_implementation_boundary",
      pass: lower.includes("plan-only") || lower.includes("future start-work") || lower.includes("future implementation"),
    },
    { id: "no_raw_secret_or_key_leak", pass: !rawSecretPattern.test(scopedText) },
    { id: "no_unresolved_placeholders", pass: !hasUnresolvedPlaceholder(scopedText) },
    {
      id: "guardrail_scan_has_pass_signal",
      pass: /no_false_completion_claim=true/i.test(read(files.c002)) && /bad_items=\s*$/im.test(read(files.c002)),
    },
  ]);
} else if (mode === "quality") {
  const gate = parseJson(files.finalGate);
  const manualQa = gate.manualQa || {};
  const refs = manualQa.artifactRefs || [];
  report("quality", [
    { id: "code_review_present", pass: Boolean(gate.codeReview && (gate.codeReview.recommendation || gate.codeReview.status)) },
    { id: "manual_qa_present", pass: Boolean(gate.manualQa && (gate.manualQa.status || gate.manualQa.verdict)) },
    { id: "gate_review_present", pass: Boolean(gate.gateReview && (gate.gateReview.recommendation || gate.gateReview.status)) },
    { id: "criteria_coverage_present", pass: Boolean(gate.criteriaCoverage && typeof gate.criteriaCoverage === "object") },
    { id: "surface_evidence_present", pass: Array.isArray(manualQa.surfaceEvidence) && manualQa.surfaceEvidence.length > 0 },
    { id: "adversarial_cases_present", pass: Array.isArray(manualQa.adversarialCases) && manualQa.adversarialCases.length > 0 },
    { id: "artifact_refs_present", pass: Array.isArray(refs) && refs.length > 0 },
    {
      id: "artifact_ref_paths_nonempty",
      pass: refs.length > 0 && refs.every((ref) => ref.path && existsNonEmpty(p(ref.path))),
      refs,
    },
  ]);
} else {
  report("unknown-mode", [{ id: "mode_supported", pass: false, mode }]);
}
