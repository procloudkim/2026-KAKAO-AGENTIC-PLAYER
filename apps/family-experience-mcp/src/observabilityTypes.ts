import type { ToolFailureCode, ToolMode } from "./types.js"

export const serviceName = "family-experience-mcp"
export const serviceVersion = "0.1.0"

export type OperationalOutcome = "success" | "failure"
export type OperationalLogLevel = "info" | "warn" | "error"
export type OperationalLogEvent = "server_start" | "http_request" | "tool_call"

export type OperationalFailureDiagnostics = {
  readonly failure_code: string
  readonly retryable: boolean
  readonly message: string
}

export type OperationalHttpLog = {
  readonly method: string
  readonly path: string
  readonly status_code: number
  readonly outcome: OperationalOutcome
  readonly latency_ms: number
}

export type OperationalToolLog = {
  readonly name: "find_family_experiences"
  readonly outcome: OperationalOutcome
  readonly mode: ToolMode
  readonly latency_ms: number
  readonly candidate_count: number
  readonly failure_code: ToolFailureCode | "internal_error" | null
}

export type OperationalLogEntry = {
  readonly timestamp: string
  readonly service: typeof serviceName
  readonly version: typeof serviceVersion
  readonly level: OperationalLogLevel
  readonly event: OperationalLogEvent
  readonly http?: OperationalHttpLog
  readonly tool?: OperationalToolLog
  readonly diagnostics?: OperationalFailureDiagnostics
  readonly message?: string
}

export type OperationalLogger = (entry: OperationalLogEntry) => void
