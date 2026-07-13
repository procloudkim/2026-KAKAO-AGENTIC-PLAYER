import type { SourceClaim, SourceRegistration } from "./types.js"

const commonUnsupportedClaims = [
  "complete national coverage",
  "real-time freshness",
  "open-now status",
  "reservation availability",
  "child safety certification",
] as const

const sourceScanProofCommand = "npm --prefix apps/family-experience-mcp run scan:sources"

export const sourceRegistry: readonly SourceRegistration[] = [
  {
    id: "fixture-family-experience-v1",
    institution: "Local deterministic fixture dataset",
    role: "fixture",
    authority_tier: "fixture_only",
    url: "https://example.invalid/family-experience/fixture-v1",
    license: "Synthetic demo data; no live source license",
    authentication: "none",
    freshness_expectation: "fixture/demo only; deterministic and not live",
    cache_ttl_seconds: 0,
    allowed_claims: ["schema_smoke_test", "demo_candidate_shape", "raw_snapshot_audit"],
    unsupported_claims: [
      "live freshness",
      "source-returned event availability",
      "complete national coverage",
      "open-now status",
      "reservation availability",
      "child safety certification",
    ],
    redaction_policy: "no_secrets_fixture_ids_only",
    proof_command: "npm --prefix apps/family-experience-mcp run verify",
    launch_tier: "tier0-fixture-only",
  },
  {
    id: "seoul-culture-events",
    institution: "Seoul Metropolitan Government Open Data Plaza",
    role: "authority",
    authority_tier: "official_city_api",
    url: "https://data.seoul.go.kr/",
    license: "Seoul Open Data Plaza public API terms",
    authentication: "api_key_required",
    freshness_expectation: "event listings refreshed within 6 to 24 hours when live adapter is enabled",
    cache_ttl_seconds: 21_600,
    allowed_claims: [
      "event_listing_presence",
      "event_date",
      "venue",
      "age_target",
      "source_url",
      "source_freshness",
      "raw_snapshot_audit",
    ],
    unsupported_claims: commonUnsupportedClaims,
    redaction_policy: "redact_api_key_and_keyed_url",
    proof_command: sourceScanProofCommand,
    launch_tier: "tier1-source-proven-single-source",
  },
  {
    id: "culture-portal-oneview",
    institution: "Korea Culture Information Service Agency Culture Portal",
    role: "authority",
    authority_tier: "official_national_api",
    url: "https://www.culture.go.kr/portal/main/contents.do?menuNo=200155",
    license: "Public Data Portal OpenAPI terms",
    authentication: "service_key_required",
    freshness_expectation: "nationwide culture portal event listings refreshed by the official API provider",
    cache_ttl_seconds: 86_400,
    allowed_claims: [
      "event_listing_presence",
      "event_date",
      "venue",
      "source_url",
      "source_freshness",
      "raw_snapshot_audit",
    ],
    unsupported_claims: commonUnsupportedClaims,
    redaction_policy: "redact_service_key_and_keyed_url",
    proof_command: sourceScanProofCommand,
    launch_tier: "tier1-source-proven-single-source",
  },
  {
    id: "kto-tourapi-events",
    institution: "Korea Tourism Organization TourAPI",
    role: "authority",
    authority_tier: "official_national_api",
    url: "https://www.data.go.kr/data/15101578/openapi.do",
    license: "Public Data Portal OpenAPI terms",
    authentication: "service_key_required",
    freshness_expectation: "nationwide tourism and event listings refreshed by the official TourAPI provider",
    cache_ttl_seconds: 86_400,
    allowed_claims: [
      "event_listing_presence",
      "event_date",
      "venue",
      "age_target",
      "source_url",
      "source_freshness",
      "raw_snapshot_audit",
    ],
    unsupported_claims: commonUnsupportedClaims,
    redaction_policy: "redact_service_key_and_keyed_url",
    proof_command: sourceScanProofCommand,
    launch_tier: "tier1-source-proven-single-source",
  },
  {
    id: "national-culture-festival-standard",
    institution: "Ministry of Culture, Sports and Tourism national culture festival standard data",
    role: "authority",
    authority_tier: "official_national_standard_dataset",
    url: "https://www.data.go.kr/data/15013104/standard.do",
    license: "Public Data Portal standard data terms",
    authentication: "service_key_required",
    freshness_expectation: "quarterly standard dataset refresh published through the Public Data Portal",
    cache_ttl_seconds: 86_400,
    allowed_claims: [
      "event_listing_presence",
      "event_date",
      "venue",
      "source_url",
      "source_freshness",
      "raw_snapshot_audit",
    ],
    unsupported_claims: [
      ...commonUnsupportedClaims,
      "same-day freshness",
      "active event status after the dataset publication date",
    ],
    redaction_policy: "redact_service_key_and_keyed_url",
    proof_command: sourceScanProofCommand,
    launch_tier: "tier1-source-proven-single-source",
  },
]

export function getSourceRegistration(sourceId: string): SourceRegistration | undefined {
  return sourceRegistry.find((source) => source.id === sourceId)
}

export function canSourceSupportAuthorityClaim(sourceId: string, claim: SourceClaim): boolean {
  const source = getSourceRegistration(sourceId)

  if (source === undefined) {
    return false
  }

  if (source.role !== "authority") {
    return false
  }

  return source.allowed_claims.some((allowedClaim) => allowedClaim === claim)
}
