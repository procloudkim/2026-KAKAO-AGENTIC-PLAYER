import { z } from "zod/v4"

import {
  DEFAULT_FAMILY_EXPERIENCE_ETL_CACHE_DIR,
  getFamilyExperienceConfigDiagnostics,
  loadFamilyExperienceConfig,
  type FamilyExperienceConfig,
} from "./config.js"
import { getCacheOperationalStatus } from "./etl/cacheStatus.js"
import { FAMILY_EXPERIENCE_PUBLIC_TOOLS } from "./mcp.js"
import {
  CACHE_OPERATIONAL_STATUSES,
  getCacheOperationalSummary,
  getOperationalSnapshot,
} from "./observability.js"

const HealthStatusSchema = z
  .object({
    ok: z.literal(true),
    name: z.literal("family-experience-mcp"),
    version: z.literal("0.1.0"),
    tools: z.array(z.enum(FAMILY_EXPERIENCE_PUBLIC_TOOLS)).length(FAMILY_EXPERIENCE_PUBLIC_TOOLS.length),
    config: z.object({
      host: z.string().min(1),
      port: z.number().int().min(1).max(65_535),
      allowFixture: z.boolean(),
      toolMode: z.enum(["fixture", "live"]),
      seoulOpenDataBaseUrl: z.string().url(),
      seoulOpenDataKey: z.enum(["missing", "redacted"]),
    }),
    cache: z.object({
      age_seconds: z.number().int().min(0).nullable(),
      cacheDir: z.string().min(1),
      expiresAt: z.string().optional(),
      generated_at: z.string().nullable(),
      mode: z.enum(["fixture", "live"]).optional(),
      refreshCommand: z.string().min(1),
      source_health: z.object({
        total_sources: z.number().int().min(0),
        ok_sources: z.number().int().min(0),
        failed_sources: z.number().int().min(0),
        failure_codes: z.array(z.string()),
      }),
      status: z.enum(["fresh", "invalid", "missing", "refreshing", "stale"]),
      ttl_hours: z.number().int().min(1).nullable(),
    }).strict(),
    cache_metrics: z.object({
      status: z.enum(CACHE_OPERATIONAL_STATUSES),
      generated_at: z.string().nullable(),
      age_seconds: z.number().int().min(0).nullable(),
      ttl_hours: z.number().int().min(1).nullable(),
      source_health: z.object({
        total_sources: z.number().int().min(0),
        ok_sources: z.number().int().min(0),
        failed_sources: z.number().int().min(0),
        failure_codes: z.array(z.string()),
      }),
    }),
    operations: z.object({
      deployed_version: z.literal("0.1.0"),
      requests: z.object({
        total: z.number().int().min(0),
        succeeded: z.number().int().min(0),
        failed: z.number().int().min(0),
        rate_limited: z.number().int().min(0),
        latency_ms: z.object({
          last: z.number().int().min(0).nullable(),
          p95: z.number().int().min(0).nullable(),
        }),
      }),
      tool_calls: z.object({
        total: z.number().int().min(0),
        succeeded: z.number().int().min(0),
        failed: z.number().int().min(0),
        invalid_input: z.number().int().min(0),
        no_results: z.number().int().min(0),
        source_failures: z.number().int().min(0),
        latency_ms: z.object({
          last: z.number().int().min(0).nullable(),
          p95: z.number().int().min(0).nullable(),
        }),
      }),
    }),
  })
  .strict()

export type HealthStatus = z.infer<typeof HealthStatusSchema>

export function getHealthStatus(config: FamilyExperienceConfig = loadFamilyExperienceConfig()): HealthStatus {
  return HealthStatusSchema.parse({
    ok: true,
    name: "family-experience-mcp",
    version: "0.1.0",
    tools: [...FAMILY_EXPERIENCE_PUBLIC_TOOLS],
    config: getFamilyExperienceConfigDiagnostics(config),
    cache: getCacheOperationalStatus({
      allowFixture: config.allowFixture,
      cacheDir: config.etlCacheDir ?? DEFAULT_FAMILY_EXPERIENCE_ETL_CACHE_DIR,
      ...(config.sourceSet === undefined ? {} : { sourceSet: config.sourceSet }),
    }),
    cache_metrics: getCacheOperationalSummary(config),
    operations: getOperationalSnapshot(),
  })
}
