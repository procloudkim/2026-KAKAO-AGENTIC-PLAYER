import { describe, expect, it } from "vitest"

import { fixtureFamilyExperienceRecords } from "../src/sources/fixture.js"
import {
  canSourceSupportAuthorityClaim,
  getSourceRegistration,
  sourceRegistry,
} from "../src/sources/registry.js"
import {
  AUTHORITY_TIERS,
  LAUNCH_COVERAGE_TIERS,
  SOURCE_IDS,
  SOURCE_REDACTION_POLICIES,
  SOURCE_ROLES,
} from "../src/sources/types.js"

describe("family experience source registry", () => {
  it("declares fixture and Seoul culture event source governance contracts", () => {
    // Given: Todo 3 requires registered fixture and authority sources.
    const fixtureSource = getSourceRegistration("fixture-family-experience-v1")
    const seoulSource = getSourceRegistration("seoul-culture-events")

    // When: the registry is inspected as the authority boundary.
    const registryIds = sourceRegistry.map((source) => source.id)

    // Then: both sources expose the required source-governance metadata.
    expect(registryIds).toEqual(
      expect.arrayContaining(["fixture-family-experience-v1", "seoul-culture-events"]),
    )
    expect(fixtureSource).toMatchObject({
      role: "fixture",
      authority_tier: "fixture_only",
      url: expect.stringContaining("fixture"),
      freshness_expectation: expect.stringContaining("not live"),
      cache_ttl_seconds: 0,
      allowed_claims: expect.arrayContaining(["schema_smoke_test", "demo_candidate_shape"]),
      redaction_policy: "no_secrets_fixture_ids_only",
      unsupported_claims: expect.arrayContaining(["live freshness", "reservation availability"]),
      proof_command: "npm --prefix apps/family-experience-mcp run verify",
      launch_tier: "tier0-fixture-only",
    })
    expect(seoulSource).toMatchObject({
      role: "authority",
      authority_tier: "official_city_api",
      url: expect.stringContaining("data.seoul.go.kr"),
      cache_ttl_seconds: expect.any(Number),
      allowed_claims: expect.arrayContaining(["event_listing_presence", "event_date", "venue"]),
      redaction_policy: "redact_api_key_and_keyed_url",
      unsupported_claims: expect.arrayContaining(["complete national coverage"]),
      proof_command: "npm --prefix apps/family-experience-mcp run scan:sources",
      launch_tier: "tier1-source-proven-single-source",
    })
  })

  it("rejects authority claims when a source id is unregistered", () => {
    // Given: a source id that does not appear in the registry.
    const unregisteredSourceId = "unregistered-demo-source"

    // When: authority support is checked for an event listing claim.
    const registration = getSourceRegistration(unregisteredSourceId)
    const canSupportClaim = canSourceSupportAuthorityClaim(
      unregisteredSourceId,
      "event_listing_presence",
    )

    // Then: unregistered sources cannot back authoritative claims.
    expect(registration).toBeUndefined()
    expect(canSupportClaim).toBe(false)
  })

  it("declares nationwide official source contract ids, tiers, roles, and redaction policies", () => {
    // Given: nationwide official sources are contract-visible before live adapters are wired.
    const expectedSourceIds = [
      "fixture-family-experience-v1",
      "seoul-culture-events",
      "culture-portal-oneview",
      "kto-tourapi-events",
      "national-culture-festival-standard",
    ]

    // When: the source contract constants are inspected.
    const sourceIds = [...SOURCE_IDS]
    const tiers = [...AUTHORITY_TIERS]
    const roles = [...SOURCE_ROLES]
    const redactionPolicies = [...SOURCE_REDACTION_POLICIES]
    const launchCoverageTiers = [...LAUNCH_COVERAGE_TIERS]

    // Then: candidate source implementations can distinguish authority class and secret handling.
    expect(sourceIds).toEqual(expectedSourceIds)
    expect(tiers).toEqual(
      expect.arrayContaining([
        "fixture_only",
        "official_city_api",
        "official_national_api",
        "official_national_standard_dataset",
      ]),
    )
    expect(roles).toEqual(expect.arrayContaining(["authority", "fixture", "fallback_authority"]))
    expect(redactionPolicies).toEqual(
      expect.arrayContaining([
        "no_secrets_fixture_ids_only",
        "redact_api_key_and_keyed_url",
        "redact_service_key_and_keyed_url",
      ]),
    )
    expect(launchCoverageTiers).toEqual([
      "tier0-fixture-only",
      "tier1-source-proven-single-source",
      "tier2-multi-source-cross-region",
      "tier3-market-claim-eligible",
    ])
  })

  it("returns nationwide official source registrations through getSourceRegistration", () => {
    // Given: Todo 1 requires nationwide source ids to be present in the runtime registry.
    const expectedRegistrations = [
      {
        id: "culture-portal-oneview",
        institution: "Korea Culture Information Service Agency Culture Portal",
        role: "authority",
        authority_tier: "official_national_api",
        authentication: "service_key_required",
        redaction_policy: "redact_service_key_and_keyed_url",
      },
      {
        id: "kto-tourapi-events",
        institution: "Korea Tourism Organization TourAPI",
        role: "authority",
        authority_tier: "official_national_api",
        authentication: "service_key_required",
        redaction_policy: "redact_service_key_and_keyed_url",
      },
      {
        id: "national-culture-festival-standard",
        institution: "Ministry of Culture, Sports and Tourism national culture festival standard data",
        role: "authority",
        authority_tier: "official_national_standard_dataset",
        authentication: "service_key_required",
        redaction_policy: "redact_service_key_and_keyed_url",
      },
    ]

    // When: each contract id is resolved through the registry lookup used by authority checks.
    const registrations = expectedRegistrations.map((expected) => ({
      expected,
      actual: getSourceRegistration(expected.id),
    }))

    // Then: each nationwide source has live registry metadata, not just a SourceId constant.
    for (const { expected, actual } of registrations) {
      expect(actual).toMatchObject({
        id: expected.id,
        institution: expected.institution,
        role: expected.role,
        authority_tier: expected.authority_tier,
        authentication: expected.authentication,
        cache_ttl_seconds: 86_400,
        allowed_claims: expect.arrayContaining([
          "event_listing_presence",
          "event_date",
          "venue",
          "source_url",
          "source_freshness",
          "raw_snapshot_audit",
        ]),
        redaction_policy: expected.redaction_policy,
        unsupported_claims: expect.arrayContaining([
          "complete national coverage",
          "open-now status",
          "child safety certification",
        ]),
        proof_command: "npm --prefix apps/family-experience-mcp run scan:sources",
        launch_tier: expect.stringMatching(/^tier[12]-/),
      })
      expect(canSourceSupportAuthorityClaim(expected.id, "event_listing_presence")).toBe(true)
    }
  })

  it("does not register any source as tier3 market-claim eligible before proof exists", () => {
    // Given: Todo 3 forbids broad public-copy coverage claims unless tier3 is proven.
    const tier3Sources = sourceRegistry.filter(
      (source) => source.launch_tier === "tier3-market-claim-eligible",
    )

    // When/Then: no current source is broad-market eligible by itself.
    expect(tier3Sources).toEqual([])
  })
})

describe("fixture family experience source records", () => {
  it("exposes fixture IDs and audit fields on every fixture candidate", () => {
    // Given: deterministic fixture candidates are loaded.
    const fixtureRecords = fixtureFamilyExperienceRecords

    // When: each candidate is inspected for source auditability.
    for (const record of fixtureRecords) {
      // Then: fixture records are explicitly non-live and carry audit fields.
      expect(record.mode).toBe("fixture")
      expect(record.id.startsWith("fixture-family-experience-v1:")).toBe(true)
      expect(record.raw_snapshot_id.startsWith("fixture-family-experience-v1:raw:")).toBe(true)
      expect(record.date.start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(record.venue.name.length).toBeGreaterThan(0)
      expect(record.source.id).toBe("fixture-family-experience-v1")
      expect(record.source.mode).toBe("fixture")
      expect(record.retrieved_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(record.confidence.date).toBeDefined()
      expect(record.parent_check.reservation).toBe("confirmation_needed")
      expect(record.fixture_notice).toContain("not live")
    }
  })

  it("contains three Seoul indoor preschool weekend fixtures and one unsuitable edge record", () => {
    // Given: the happy prompt targets Seoul, this-Saturday-like, age 4, indoor experiences.
    const targetChildAge = 4

    // When: fixture records are classified by that future filtering contract.
    const happyPromptMatches = fixtureFamilyExperienceRecords.filter(
      (record) =>
        record.city === "Seoul" &&
        record.date.start === "2026-07-04" &&
        record.indoor_outdoor === "indoor" &&
        record.min_child_age <= targetChildAge &&
        record.max_child_age >= targetChildAge &&
        record.child_stages.includes("preschool"),
    )
    const edgeRecords = fixtureFamilyExperienceRecords.filter(
      (record) => record.suitability === "edge_unsuitable",
    )

    // Then: fixture coverage supports happy-path and later edge filtering tests.
    expect(happyPromptMatches).toHaveLength(3)
    expect(edgeRecords).toHaveLength(1)
  })
})
