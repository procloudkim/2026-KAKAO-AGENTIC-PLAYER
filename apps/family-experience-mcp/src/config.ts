import * as z from "zod/v4"

import type { ToolMode } from "./types.js"
import { HttpsUrlSchema } from "./httpUrl.js"

export const DEFAULT_FAMILY_EXPERIENCE_PORT = 3345
export const DEFAULT_FAMILY_EXPERIENCE_HOST = "127.0.0.1"
export const DEFAULT_SEOUL_OPEN_DATA_BASE_URL = "https://openapi.seoul.go.kr:8088"
export const DEFAULT_CULTURE_PORTAL_BASE_URL =
  "https://apis.data.go.kr/B553457/cultureinfo"
export const DEFAULT_KTO_TOURAPI_BASE_URL = "https://apis.data.go.kr/B551011/KorService2"
export const DEFAULT_NATIONAL_CULTURE_FESTIVAL_CSV_PATH =
  "공공데이터-관련/전국문화축제표준데이터.csv"
export const DEFAULT_FAMILY_EXPERIENCE_SOURCE_SET = [
  "kto_tourapi",
] as const
export const DEFAULT_FAMILY_EXPERIENCE_ETL_CACHE_DIR = "data/family-experience-cache"
export const DEFAULT_FAMILY_EXPERIENCE_ETL_MAX_PAGES = 1
export const DEFAULT_FAMILY_EXPERIENCE_ETL_TTL_HOURS = 24
export const DEFAULT_FAMILY_EXPERIENCE_ETL_STALE_GRACE_HOURS = 24
export const DEFAULT_MCP_RATE_LIMIT = 60
export const DEFAULT_MCP_RATE_WINDOW_MS = 60_000
export const DEFAULT_MCP_MAX_CONCURRENCY = 32
export const DEFAULT_SHUTDOWN_GRACE_MS = 30_000

export const FAMILY_EXPERIENCE_SOURCE_SET_VALUES = [
  "fixture",
  "seoul",
  "culture_portal",
  "kto_tourapi",
  "national_festival",
] as const

export type FamilyExperienceSourceSetEntry = (typeof FAMILY_EXPERIENCE_SOURCE_SET_VALUES)[number]

const trueEnvValues = ["1", "true", "TRUE", "True", "yes", "YES", "Yes", "on", "ON", "On"] as const
const falseEnvValues = [
  "0",
  "false",
  "FALSE",
  "False",
  "no",
  "NO",
  "No",
  "off",
  "OFF",
  "Off",
] as const

const booleanEnvSchema = z.union([
  z.enum(trueEnvValues).transform(() => true),
  z.enum(falseEnvValues).transform(() => false),
])

const optionalNonEmptyStringSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().trim().min(1).optional(),
)

const optionalPublicTextSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z
    .string()
    .trim()
    .min(1)
    .max(200)
    .refine((value) => !/[\u0000-\u001f\u007f]/u.test(value), "Expected single-line public text")
    .optional(),
)

const optionalHttpsUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  HttpsUrlSchema.optional(),
)

const sourceSetEnvSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, context): readonly FamilyExperienceSourceSetEntry[] => {
    const sourceSet = value.split(",").map((source) => source.trim())
    const sourceSetSchema = z.array(z.enum(FAMILY_EXPERIENCE_SOURCE_SET_VALUES)).min(1)
    const result = sourceSetSchema.safeParse(sourceSet)

    if (result.success) {
      return result.data
    }

    context.addIssue({
      code: "custom",
      message: result.error.issues.map((issue) => issue.message).join("; "),
    })

    return z.NEVER
  })
  .optional()

const allowedOriginsEnvSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, context): readonly string[] => {
    const normalized: string[] = []
    for (const candidate of value.split(",").map((entry) => entry.trim())) {
      try {
        const url = new URL(candidate)
        const isWebOrigin = url.protocol === "https:" || url.protocol === "http:"
        const isOriginOnly =
          url.username.length === 0 &&
          url.password.length === 0 &&
          url.pathname === "/" &&
          url.search.length === 0 &&
          url.hash.length === 0
        if (!isWebOrigin || !isOriginOnly || url.origin === "null") {
          throw new TypeError("Invalid origin")
        }
        normalized.push(url.origin)
      } catch (error: unknown) {
        if (!(error instanceof Error)) throw error
        context.addIssue({ code: "custom", message: "Expected comma-separated HTTP(S) origins" })
        return z.NEVER
      }
    }
    return [...new Set(normalized)]
  })
  .optional()

const rawConfigSchema = z.object({
  HOST: z.string().trim().min(1).optional(),
  PORT: z.coerce.number().int().min(1).max(65_535).optional(),
  FAMILY_EXPERIENCE_ALLOW_FIXTURE: booleanEnvSchema.optional(),
  SEOUL_OPEN_DATA_KEY: optionalNonEmptyStringSchema,
  SEOUL_OPEN_DATA_BASE_URL: optionalHttpsUrlSchema,
  CULTURE_PORTAL_SERVICE_KEY: optionalNonEmptyStringSchema,
  CULTURE_PORTAL_BASE_URL: optionalHttpsUrlSchema,
  KTO_TOURAPI_SERVICE_KEY: optionalNonEmptyStringSchema,
  KTO_TOURAPI_BASE_URL: optionalHttpsUrlSchema,
  PUBLIC_DATA_STANDARD_SERVICE_KEY: optionalNonEmptyStringSchema,
  NATIONAL_CULTURE_FESTIVAL_CSV_PATH: optionalNonEmptyStringSchema,
  NATIONAL_CULTURE_FESTIVAL_BASE_URL: optionalHttpsUrlSchema,
  FAMILY_EXPERIENCE_SOURCE_SET: sourceSetEnvSchema,
  FAMILY_EXPERIENCE_ETL_CACHE_DIR: optionalNonEmptyStringSchema,
  FAMILY_EXPERIENCE_ETL_MAX_PAGES: z.coerce.number().int().min(1).optional(),
  FAMILY_EXPERIENCE_ETL_TTL_HOURS: z.coerce.number().int().min(1).optional(),
  FAMILY_EXPERIENCE_ETL_STALE_GRACE_HOURS: z.coerce.number().int().min(0).max(7 * 24).optional(),
  FAMILY_EXPERIENCE_ALLOWED_ORIGINS: allowedOriginsEnvSchema,
  FAMILY_EXPERIENCE_MCP_RATE_LIMIT: z.coerce.number().int().min(1).max(10_000).optional(),
  FAMILY_EXPERIENCE_MCP_RATE_WINDOW_MS: z.coerce.number().int().min(1_000).max(3_600_000).optional(),
  FAMILY_EXPERIENCE_MCP_MAX_CONCURRENCY: z.coerce.number().int().min(1).max(1_000).optional(),
  FAMILY_EXPERIENCE_SHUTDOWN_GRACE_MS: z.coerce.number().int().min(1_000).max(300_000).optional(),
  FAMILY_EXPERIENCE_OPERATOR_NAME: optionalPublicTextSchema,
  FAMILY_EXPERIENCE_PRIVACY_CONTACT: optionalPublicTextSchema,
})

export type FamilyExperienceConfig = {
  readonly host: string
  readonly port: number
  readonly allowFixture: boolean
  readonly seoulOpenDataBaseUrl: string
  readonly culturePortalBaseUrl?: string
  readonly ktoTourApiBaseUrl?: string
  readonly sourceSet?: readonly FamilyExperienceSourceSetEntry[]
  readonly etlCacheDir?: string
  readonly etlMaxPages?: number
  readonly etlTtlHours?: number
  readonly etlStaleGraceHours?: number
  readonly seoulOpenDataKey?: string
  readonly culturePortalServiceKey?: string
  readonly ktoTourApiServiceKey?: string
  readonly publicDataStandardServiceKey?: string
  readonly nationalCultureFestivalCsvPath?: string
  readonly nationalCultureFestivalBaseUrl?: string
  readonly allowedOrigins?: readonly string[]
  readonly mcpRateLimit?: number
  readonly mcpRateWindowMs?: number
  readonly mcpMaxConcurrency?: number
  readonly shutdownGraceMs?: number
  readonly operatorName?: string
  readonly privacyContact?: string
}

export type ConfigSecretDiagnostic = "missing" | "redacted"

export type FamilyExperienceConfigDiagnostics = {
  readonly host: string
  readonly port: number
  readonly allowFixture: boolean
  readonly toolMode: ToolMode
  readonly seoulOpenDataBaseUrl: string
  readonly culturePortalBaseUrl: string
  readonly ktoTourApiBaseUrl: string
  readonly nationalCultureFestivalBaseUrl: string | "missing"
  readonly sourceSet: readonly FamilyExperienceSourceSetEntry[]
  readonly etlCacheDir: string
  readonly etlMaxPages: number
  readonly etlTtlHours: number
  readonly etlStaleGraceHours: number
  readonly seoulOpenDataKey: ConfigSecretDiagnostic
  readonly culturePortalServiceKey: ConfigSecretDiagnostic
  readonly ktoTourApiServiceKey: ConfigSecretDiagnostic
  readonly publicDataStandardServiceKey: ConfigSecretDiagnostic
  readonly nationalCultureFestivalCsvPath: string | "missing"
  readonly originsConfigured: boolean
  readonly allowedOriginCount: number
  readonly mcpRateLimit: number
  readonly mcpRateWindowMs: number
  readonly mcpMaxConcurrency: number
  readonly shutdownGraceMs: number
  readonly privacyNoticeConfigured: boolean
}

export const loadFamilyExperienceConfig = (
  env: NodeJS.ProcessEnv = process.env,
): FamilyExperienceConfig => {
  const rawConfig = rawConfigSchema.parse(env)
  const config = {
    host: rawConfig.HOST ?? DEFAULT_FAMILY_EXPERIENCE_HOST,
    port: rawConfig.PORT ?? DEFAULT_FAMILY_EXPERIENCE_PORT,
    allowFixture: rawConfig.FAMILY_EXPERIENCE_ALLOW_FIXTURE ?? false,
    seoulOpenDataBaseUrl: rawConfig.SEOUL_OPEN_DATA_BASE_URL ?? DEFAULT_SEOUL_OPEN_DATA_BASE_URL,
    culturePortalBaseUrl: rawConfig.CULTURE_PORTAL_BASE_URL ?? DEFAULT_CULTURE_PORTAL_BASE_URL,
    ktoTourApiBaseUrl: rawConfig.KTO_TOURAPI_BASE_URL ?? DEFAULT_KTO_TOURAPI_BASE_URL,
    sourceSet: rawConfig.FAMILY_EXPERIENCE_SOURCE_SET ?? DEFAULT_FAMILY_EXPERIENCE_SOURCE_SET,
    etlCacheDir:
      rawConfig.FAMILY_EXPERIENCE_ETL_CACHE_DIR ?? DEFAULT_FAMILY_EXPERIENCE_ETL_CACHE_DIR,
    etlMaxPages:
      rawConfig.FAMILY_EXPERIENCE_ETL_MAX_PAGES ?? DEFAULT_FAMILY_EXPERIENCE_ETL_MAX_PAGES,
    etlTtlHours:
      rawConfig.FAMILY_EXPERIENCE_ETL_TTL_HOURS ?? DEFAULT_FAMILY_EXPERIENCE_ETL_TTL_HOURS,
    etlStaleGraceHours:
      rawConfig.FAMILY_EXPERIENCE_ETL_STALE_GRACE_HOURS ??
      DEFAULT_FAMILY_EXPERIENCE_ETL_STALE_GRACE_HOURS,
    allowedOrigins: rawConfig.FAMILY_EXPERIENCE_ALLOWED_ORIGINS ?? [],
    mcpRateLimit: rawConfig.FAMILY_EXPERIENCE_MCP_RATE_LIMIT ?? DEFAULT_MCP_RATE_LIMIT,
    mcpRateWindowMs:
      rawConfig.FAMILY_EXPERIENCE_MCP_RATE_WINDOW_MS ?? DEFAULT_MCP_RATE_WINDOW_MS,
    mcpMaxConcurrency:
      rawConfig.FAMILY_EXPERIENCE_MCP_MAX_CONCURRENCY ?? DEFAULT_MCP_MAX_CONCURRENCY,
    shutdownGraceMs:
      rawConfig.FAMILY_EXPERIENCE_SHUTDOWN_GRACE_MS ?? DEFAULT_SHUTDOWN_GRACE_MS,
  }

  return {
    ...config,
    ...(rawConfig.SEOUL_OPEN_DATA_KEY === undefined
      ? {}
      : { seoulOpenDataKey: rawConfig.SEOUL_OPEN_DATA_KEY }),
    ...(rawConfig.CULTURE_PORTAL_SERVICE_KEY === undefined
      ? {}
      : { culturePortalServiceKey: rawConfig.CULTURE_PORTAL_SERVICE_KEY }),
    ...(rawConfig.KTO_TOURAPI_SERVICE_KEY === undefined
      ? {}
      : { ktoTourApiServiceKey: rawConfig.KTO_TOURAPI_SERVICE_KEY }),
    ...(rawConfig.PUBLIC_DATA_STANDARD_SERVICE_KEY === undefined
      ? {}
      : { publicDataStandardServiceKey: rawConfig.PUBLIC_DATA_STANDARD_SERVICE_KEY }),
    ...(rawConfig.NATIONAL_CULTURE_FESTIVAL_CSV_PATH === undefined
      ? {}
      : { nationalCultureFestivalCsvPath: rawConfig.NATIONAL_CULTURE_FESTIVAL_CSV_PATH }),
    ...(rawConfig.NATIONAL_CULTURE_FESTIVAL_BASE_URL === undefined
      ? {}
      : { nationalCultureFestivalBaseUrl: rawConfig.NATIONAL_CULTURE_FESTIVAL_BASE_URL }),
    ...(rawConfig.FAMILY_EXPERIENCE_OPERATOR_NAME === undefined
      ? {}
      : { operatorName: rawConfig.FAMILY_EXPERIENCE_OPERATOR_NAME }),
    ...(rawConfig.FAMILY_EXPERIENCE_PRIVACY_CONTACT === undefined
      ? {}
      : { privacyContact: rawConfig.FAMILY_EXPERIENCE_PRIVACY_CONTACT }),
  }
}

export const getFamilyExperienceConfigDiagnostics = (
  config: FamilyExperienceConfig,
): FamilyExperienceConfigDiagnostics => ({
  host: config.host,
  port: config.port,
  allowFixture: config.allowFixture,
  toolMode: config.allowFixture ? "fixture" : "live",
  seoulOpenDataBaseUrl: config.seoulOpenDataBaseUrl,
  culturePortalBaseUrl: config.culturePortalBaseUrl ?? DEFAULT_CULTURE_PORTAL_BASE_URL,
  ktoTourApiBaseUrl: config.ktoTourApiBaseUrl ?? DEFAULT_KTO_TOURAPI_BASE_URL,
  nationalCultureFestivalBaseUrl: config.nationalCultureFestivalBaseUrl ?? "missing",
  sourceSet: config.sourceSet ?? DEFAULT_FAMILY_EXPERIENCE_SOURCE_SET,
  etlCacheDir: config.etlCacheDir ?? DEFAULT_FAMILY_EXPERIENCE_ETL_CACHE_DIR,
  etlMaxPages: config.etlMaxPages ?? DEFAULT_FAMILY_EXPERIENCE_ETL_MAX_PAGES,
  etlTtlHours: config.etlTtlHours ?? DEFAULT_FAMILY_EXPERIENCE_ETL_TTL_HOURS,
  etlStaleGraceHours:
    config.etlStaleGraceHours ?? DEFAULT_FAMILY_EXPERIENCE_ETL_STALE_GRACE_HOURS,
  seoulOpenDataKey: config.seoulOpenDataKey === undefined ? "missing" : "redacted",
  culturePortalServiceKey:
    config.culturePortalServiceKey === undefined ? "missing" : "redacted",
  ktoTourApiServiceKey: config.ktoTourApiServiceKey === undefined ? "missing" : "redacted",
  publicDataStandardServiceKey:
    config.publicDataStandardServiceKey === undefined ? "missing" : "redacted",
  nationalCultureFestivalCsvPath: config.nationalCultureFestivalCsvPath ?? "missing",
  originsConfigured: (config.allowedOrigins?.length ?? 0) > 0,
  allowedOriginCount: config.allowedOrigins?.length ?? 0,
  mcpRateLimit: config.mcpRateLimit ?? DEFAULT_MCP_RATE_LIMIT,
  mcpRateWindowMs: config.mcpRateWindowMs ?? DEFAULT_MCP_RATE_WINDOW_MS,
  mcpMaxConcurrency: config.mcpMaxConcurrency ?? DEFAULT_MCP_MAX_CONCURRENCY,
  shutdownGraceMs: config.shutdownGraceMs ?? DEFAULT_SHUTDOWN_GRACE_MS,
  privacyNoticeConfigured:
    config.operatorName !== undefined && config.privacyContact !== undefined,
})
