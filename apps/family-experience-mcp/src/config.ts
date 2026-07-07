import * as z from "zod/v4"

import type { ToolMode } from "./types.js"

export const DEFAULT_FAMILY_EXPERIENCE_PORT = 3345
export const DEFAULT_FAMILY_EXPERIENCE_HOST = "127.0.0.1"
export const DEFAULT_SEOUL_OPEN_DATA_BASE_URL = "http://openapi.seoul.go.kr:8088"
export const DEFAULT_CULTURE_PORTAL_BASE_URL =
  "https://apis.data.go.kr/B553457/cultureinfo"
export const DEFAULT_KTO_TOURAPI_BASE_URL = "https://apis.data.go.kr/B551011/KorService2"
export const DEFAULT_NATIONAL_CULTURE_FESTIVAL_CSV_PATH =
  "공공데이터-관련/전국문화축제표준데이터.csv"
export const DEFAULT_FAMILY_EXPERIENCE_SOURCE_SET = [
  "seoul",
  "culture_portal",
  "kto_tourapi",
  "national_festival",
] as const
export const DEFAULT_FAMILY_EXPERIENCE_ETL_CACHE_DIR = "data/family-experience-cache"
export const DEFAULT_FAMILY_EXPERIENCE_ETL_MAX_PAGES = 1
export const DEFAULT_FAMILY_EXPERIENCE_ETL_TTL_HOURS = 24

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

const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().trim().url().optional(),
)

const optionalHttpsUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z
    .string()
    .trim()
    .url()
    .refine((value) => value.startsWith("https://"), "Expected HTTPS base URL")
    .optional(),
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

const rawConfigSchema = z.object({
  HOST: z.string().trim().min(1).optional(),
  PORT: z.coerce.number().int().min(1).max(65_535).optional(),
  FAMILY_EXPERIENCE_ALLOW_FIXTURE: booleanEnvSchema.optional(),
  SEOUL_OPEN_DATA_KEY: optionalNonEmptyStringSchema,
  SEOUL_OPEN_DATA_BASE_URL: optionalUrlSchema,
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
  readonly seoulOpenDataKey?: string
  readonly culturePortalServiceKey?: string
  readonly ktoTourApiServiceKey?: string
  readonly publicDataStandardServiceKey?: string
  readonly nationalCultureFestivalCsvPath?: string
  readonly nationalCultureFestivalBaseUrl?: string
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
  readonly seoulOpenDataKey: ConfigSecretDiagnostic
  readonly culturePortalServiceKey: ConfigSecretDiagnostic
  readonly ktoTourApiServiceKey: ConfigSecretDiagnostic
  readonly publicDataStandardServiceKey: ConfigSecretDiagnostic
  readonly nationalCultureFestivalCsvPath: string | "missing"
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
  seoulOpenDataKey: config.seoulOpenDataKey === undefined ? "missing" : "redacted",
  culturePortalServiceKey:
    config.culturePortalServiceKey === undefined ? "missing" : "redacted",
  ktoTourApiServiceKey: config.ktoTourApiServiceKey === undefined ? "missing" : "redacted",
  publicDataStandardServiceKey:
    config.publicDataStandardServiceKey === undefined ? "missing" : "redacted",
  nationalCultureFestivalCsvPath: config.nationalCultureFestivalCsvPath ?? "missing",
})
