import { describe, expect, it } from "vitest"

import {
  getFamilyExperienceConfigDiagnostics,
  loadFamilyExperienceConfig,
} from "../src/config.js"

describe("family experience config", () => {
  it("uses safe defaults when optional environment variables are missing", () => {
    // Given: no app-specific environment variables are present.
    const env = {}

    // When: config is loaded from the environment boundary.
    const config = loadFamilyExperienceConfig(env)

    // Then: the runtime uses the documented local defaults.
    expect(config.host).toBe("127.0.0.1")
    expect(config.port).toBe(3345)
    expect(config.allowFixture).toBe(false)
    expect(config.seoulOpenDataBaseUrl).toBe("https://openapi.seoul.go.kr:8088")
    expect(config.sourceSet).toEqual(["kto_tourapi"])
  })

  it("PIN:24_HOUR_TTL_DEFAULT uses the documented cache freshness window", () => {
    // Given: no explicit cache TTL override is configured.
    const env = {}

    // When: config is loaded from the environment boundary.
    const config = loadFamilyExperienceConfig(env)

    // Then: bundled cache freshness defaults to 24 hours.
    expect(config.etlTtlHours).toBe(24)
    expect(config.etlStaleGraceHours).toBe(24)
  })

  it("redacts SEOUL_OPEN_DATA_KEY from diagnostics", () => {
    // Given: a Seoul Open Data key is configured.
    const rawKey = "seoul-open-data-secret-key"
    const env = {
      PORT: "3456",
      HOST: "0.0.0.0",
      FAMILY_EXPERIENCE_ALLOW_FIXTURE: "true",
      SEOUL_OPEN_DATA_KEY: rawKey,
      SEOUL_OPEN_DATA_BASE_URL: "https://data.example.test",
    }

    // When: diagnostics are produced from loaded config.
    const config = loadFamilyExperienceConfig(env)
    const diagnostics = getFamilyExperienceConfigDiagnostics(config)

    // Then: diagnostics expose operational status without leaking the raw key.
    expect(config.seoulOpenDataKey).toBe(rawKey)
    expect(diagnostics.host).toBe("0.0.0.0")
    expect(diagnostics.seoulOpenDataKey).toBe("redacted")
    expect(JSON.stringify(diagnostics)).not.toContain(rawKey)
  })

  it("reports missing nationwide official source keys without leaking values", () => {
    // Given: no nationwide ETL source keys are configured.
    const env = {}

    // When: diagnostics are produced from loaded config.
    const config = loadFamilyExperienceConfig(env)
    const diagnostics = getFamilyExperienceConfigDiagnostics(config)

    // Then: every secret-bearing source reports status only.
    expect(diagnostics.culturePortalServiceKey).toBe("missing")
    expect(diagnostics.ktoTourApiServiceKey).toBe("missing")
    expect(diagnostics.publicDataStandardServiceKey).toBe("missing")
    expect(diagnostics.nationalCultureFestivalBaseUrl).toBe("missing")
  })

  it("redacts configured nationwide official source keys and parses ETL controls", () => {
    // Given: sample official source keys and ETL controls are configured.
    const culturePortalKey = "culture-portal-secret"
    const ktoTourApiKey = "kto-tourapi-secret"
    const standardDatasetKey = "standard-dataset-secret"
    const env = {
      CULTURE_PORTAL_SERVICE_KEY: culturePortalKey,
      CULTURE_PORTAL_BASE_URL: "https://culture.example.test/openapi",
      KTO_TOURAPI_SERVICE_KEY: ktoTourApiKey,
      KTO_TOURAPI_BASE_URL: "https://kto.example.test/KorService2",
      PUBLIC_DATA_STANDARD_SERVICE_KEY: standardDatasetKey,
      NATIONAL_CULTURE_FESTIVAL_BASE_URL: "https://standard.example.test/festivals",
      FAMILY_EXPERIENCE_SOURCE_SET: "seoul,culture_portal,kto_tourapi,national_festival",
      FAMILY_EXPERIENCE_ETL_CACHE_DIR: "tmp/family-cache",
      FAMILY_EXPERIENCE_ETL_MAX_PAGES: "3",
      FAMILY_EXPERIENCE_ETL_TTL_HOURS: "12",
      FAMILY_EXPERIENCE_ETL_STALE_GRACE_HOURS: "6",
    }

    // When: config is loaded and diagnostics are emitted.
    const config = loadFamilyExperienceConfig(env)
    const diagnostics = getFamilyExperienceConfigDiagnostics(config)
    const serializedDiagnostics = JSON.stringify(diagnostics)

    // Then: operational values parse while secrets are represented only by status.
    expect(config.sourceSet).toEqual(["seoul", "culture_portal", "kto_tourapi", "national_festival"])
    expect(config.etlCacheDir).toBe("tmp/family-cache")
    expect(config.etlMaxPages).toBe(3)
    expect(config.etlTtlHours).toBe(12)
    expect(config.etlStaleGraceHours).toBe(6)
    expect(diagnostics.culturePortalServiceKey).toBe("redacted")
    expect(diagnostics.ktoTourApiServiceKey).toBe("redacted")
    expect(diagnostics.publicDataStandardServiceKey).toBe("redacted")
    expect(serializedDiagnostics).not.toContain(culturePortalKey)
    expect(serializedDiagnostics).not.toContain(ktoTourApiKey)
    expect(serializedDiagnostics).not.toContain(standardDatasetKey)
  })

  it("rejects malformed nationwide source environment values", () => {
    // Given: invalid source-set, page, TTL, and URL values cross the config boundary.
    const invalidEnvs = [
      { CULTURE_PORTAL_BASE_URL: "not-a-url" },
      { SEOUL_OPEN_DATA_BASE_URL: "http://openapi.seoul.go.kr:8088" },
      { FAMILY_EXPERIENCE_SOURCE_SET: "seoul,unofficial_scraper" },
      { FAMILY_EXPERIENCE_ETL_MAX_PAGES: "0" },
      { FAMILY_EXPERIENCE_ETL_TTL_HOURS: "-1" },
      { FAMILY_EXPERIENCE_ETL_STALE_GRACE_HOURS: "169" },
      { NATIONAL_CULTURE_FESTIVAL_BASE_URL: "ftp://standard.example.test/festivals" },
    ]

    // When / Then: each malformed boundary value is rejected by config parsing.
    for (const env of invalidEnvs) {
      expect(() => loadFamilyExperienceConfig(env)).toThrow()
    }
  })

  it("PIN:ORIGIN_403 parses exact normalized origins without exposing values in diagnostics", () => {
    // Given: two explicit browser origins and HTTP-control thresholds are configured.
    const firstOrigin = "https://family.example.test"
    const secondOrigin = "https://app.example.test:8443"

    // When: configuration crosses the environment boundary.
    const config = loadFamilyExperienceConfig({
      FAMILY_EXPERIENCE_ALLOWED_ORIGINS: `${firstOrigin}/, ${secondOrigin}`,
      FAMILY_EXPERIENCE_MCP_RATE_LIMIT: "7",
      FAMILY_EXPERIENCE_MCP_RATE_WINDOW_MS: "2000",
      FAMILY_EXPERIENCE_MCP_MAX_CONCURRENCY: "3",
      FAMILY_EXPERIENCE_SHUTDOWN_GRACE_MS: "15000",
      FAMILY_EXPERIENCE_OPERATOR_NAME: "Family Experience Lab",
      FAMILY_EXPERIENCE_PRIVACY_CONTACT: "privacy@example.test",
    })
    const diagnostics = getFamilyExperienceConfigDiagnostics(config)

    // Then: origins are normalized for exact matching and diagnostics disclose only count/state.
    expect(config.allowedOrigins).toEqual([firstOrigin, secondOrigin])
    expect(config.mcpRateLimit).toBe(7)
    expect(config.mcpRateWindowMs).toBe(2_000)
    expect(config.mcpMaxConcurrency).toBe(3)
    expect(config.shutdownGraceMs).toBe(15_000)
    expect(config.operatorName).toBe("Family Experience Lab")
    expect(config.privacyContact).toBe("privacy@example.test")
    expect(diagnostics).toMatchObject({
      originsConfigured: true,
      allowedOriginCount: 2,
      privacyNoticeConfigured: true,
    })
    expect(JSON.stringify(diagnostics)).not.toContain("example.test")
  })

  it("keeps the public privacy notice unconfigured until both operator fields are valid", () => {
    const partial = loadFamilyExperienceConfig({
      FAMILY_EXPERIENCE_OPERATOR_NAME: "Family Experience Lab",
    })

    expect(getFamilyExperienceConfigDiagnostics(partial).privacyNoticeConfigured).toBe(false)
    expect(() => loadFamilyExperienceConfig({
      FAMILY_EXPERIENCE_PRIVACY_CONTACT: "privacy@example.test\nforged",
    })).toThrow()
  })
})
