const fs = require("fs");
const path = require("path");

const dir = process.env.EVIDENCE_DIR;
if (!dir) {
  console.error("EVIDENCE_DIR is required");
  process.exit(2);
}

const requiredFiles = [
  "golden-family-experience-happy.json",
  "golden-family-experience-missing-age.json",
  "golden-family-experience-no-result.json",
  "golden-family-experience-source-failure.json",
  "final-cleanup-family-experience-mcp-first-build.txt",
];

let failures = 0;

for (const file of requiredFiles) {
  const fullPath = path.join(dir, file);
  const exists = fs.existsSync(fullPath);
  const size = exists ? fs.statSync(fullPath).size : 0;
  console.log(`${file}\tsize=${size}`);
  if (!exists || size <= 0) failures += 1;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
}

const happy = readJson("golden-family-experience-happy.json");
const happyText = JSON.stringify(happy);
const mcpText =
  typeof happy.text === "string"
    ? happy.text
    : Array.isArray(happy.content)
      ? happy.content.find((item) => item && item.type === "text")?.text || ""
      : "";
const actionCardLines = (mcpText.match(/action_card:/g) || []).length;
const actionCardJsonWords = (happyText.match(/action_card/g) || []).length;
const candidateCount = happy.candidateCount || happy.candidate_count || null;
const responseActionCards = Array.isArray(happy.response?.action_cards)
  ? happy.response.action_cards.length
  : null;
const structuredCandidates = Array.isArray(happy.response?.structuredContent?.candidates)
  ? happy.response.structuredContent.candidates.length
  : null;

console.log(
  `happy candidateCount=${candidateCount} responseActionCards=${responseActionCards} structuredCandidates=${structuredCandidates} actionCardJsonWords=${actionCardJsonWords} actionCardLines=${actionCardLines}`,
);
if (
  !(
    candidateCount === 3 ||
    responseActionCards === 3 ||
    structuredCandidates === 3 ||
    actionCardLines === 3
  )
) {
  failures += 1;
}

for (const file of [
  "golden-family-experience-missing-age.json",
  "golden-family-experience-no-result.json",
  "golden-family-experience-source-failure.json",
]) {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  const safe = /age|나이|조건|없|not|source|temporar|try|다시|unavailable|안전|safe|empty|failure|missing|no result/i.test(
    raw,
  );
  console.log(`${file}\tsafeText=${safe}`);
  if (!safe) failures += 1;
}

const combined = requiredFiles
  .filter((file) => file.endsWith(".json"))
  .map((file) => fs.readFileSync(path.join(dir, file), "utf8"))
  .join("\n");

const secretPatterns = [
  /SEOUL_OPEN_DATA_KEY/i,
  /[?&](?:key|serviceKey|apiKey|apikey|token|access_token)=/i,
  /https?:\/\/[^\s"]*(?:[?&](?:key|serviceKey|apiKey|apikey|token|access_token)=)/i,
  /sk-[A-Za-z0-9_-]{20,}/,
  /[A-Za-z0-9_-]{48,}/,
];

for (const pattern of secretPatterns) {
  if (pattern.test(combined)) {
    console.log(`secret_or_keyed_url_pattern_hit=${pattern}`);
    failures += 1;
  }
}

const unsupportedClaimPatterns = [
  /guarantee/i,
  /officially certified/i,
  /100%/,
  /always safe/i,
  /완전 보장/,
  /공식 인증/,
];

for (const pattern of unsupportedClaimPatterns) {
  if (pattern.test(combined)) {
    console.log(`unsupported_public_claim_pattern_hit=${pattern}`);
    failures += 1;
  }
}

console.log(`public_output_validation_failures=${failures}`);
process.exit(failures === 0 ? 0 : 1);
