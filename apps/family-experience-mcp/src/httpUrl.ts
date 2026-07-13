import * as z from "zod/v4"

export const MAX_HTTP_URL_LENGTH = 2_048

export const HttpUrlSchema = z
  .string()
  .trim()
  .max(MAX_HTTP_URL_LENGTH)
  .url()
  .regex(/^https?:\/\//iu, "Expected HTTP or HTTPS URL")

export const HttpsUrlSchema = z
  .string()
  .trim()
  .max(MAX_HTTP_URL_LENGTH)
  .url()
  .regex(/^https:\/\//iu, "Expected HTTPS URL")
