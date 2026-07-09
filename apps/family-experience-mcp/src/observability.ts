import type { ToolFailure, ToolFailureCode, ToolMode } from "./types.js"
import { redactOperationalText } from "./observabilityRedaction.js"
import {
  serviceName,
  serviceVersion,
  type OperationalLogEntry,
  type OperationalLogLevel,
  type OperationalLogger,
  type OperationalOutcome,
  type OperationalToolLog,
  type OperationalToolName,
} from "./observabilityTypes.js"

export {
  CACHE_OPERATIONAL_STATUSES,
  getCacheOperationalSummary,
  type CacheOperationalStatus,
  type CacheOperationalSummary,
  type SourceHealthSummary,
} from "./observabilityCache.js"
export { redactOperationalText } from "./observabilityRedaction.js"
export type {
  OperationalFailureDiagnostics,
  OperationalHttpLog,
  OperationalLogEntry,
  OperationalLogEvent,
  OperationalLogger,
  OperationalLogLevel,
  OperationalOutcome,
  OperationalToolLog,
  OperationalToolName,
} from "./observabilityTypes.js"

const maxLatencySamples = 200

type MutableCounters = {
  requestsTotal: number
  requestsSucceeded: number
  requestsFailed: number
  requestsRateLimited: number
  toolCallsTotal: number
  toolCallsSucceeded: number
  toolCallsFailed: number
  invalidInput: number
  noResults: number
  sourceFailures: number
  requestLatenciesMs: number[]
  toolLatenciesMs: number[]
}

const counters: MutableCounters = {
  requestsTotal: 0,
  requestsSucceeded: 0,
  requestsFailed: 0,
  requestsRateLimited: 0,
  toolCallsTotal: 0,
  toolCallsSucceeded: 0,
  toolCallsFailed: 0,
  invalidInput: 0,
  noResults: 0,
  sourceFailures: 0,
  requestLatenciesMs: [],
  toolLatenciesMs: [],
}

export const silentOperationalLogger: OperationalLogger = () => {}

export const consoleOperationalLogger: OperationalLogger = (entry) => {
  console.log(JSON.stringify(redactOperationalLogEntry(entry)))
}

export function resetOperationalMetrics(): void {
  counters.requestsTotal = 0
  counters.requestsSucceeded = 0
  counters.requestsFailed = 0
  counters.requestsRateLimited = 0
  counters.toolCallsTotal = 0
  counters.toolCallsSucceeded = 0
  counters.toolCallsFailed = 0
  counters.invalidInput = 0
  counters.noResults = 0
  counters.sourceFailures = 0
  counters.requestLatenciesMs = []
  counters.toolLatenciesMs = []
}

export function getOperationalSnapshot() {
  return {
    deployed_version: serviceVersion,
    requests: {
      total: counters.requestsTotal,
      succeeded: counters.requestsSucceeded,
      failed: counters.requestsFailed,
      rate_limited: counters.requestsRateLimited,
      latency_ms: latencySnapshot(counters.requestLatenciesMs),
    },
    tool_calls: {
      total: counters.toolCallsTotal,
      succeeded: counters.toolCallsSucceeded,
      failed: counters.toolCallsFailed,
      invalid_input: counters.invalidInput,
      no_results: counters.noResults,
      source_failures: counters.sourceFailures,
      latency_ms: latencySnapshot(counters.toolLatenciesMs),
    },
  }
}

export function recordServerStart(input: {
  readonly logger: OperationalLogger
  readonly host: string
  readonly port: number
}): void {
  input.logger({
    timestamp: new Date().toISOString(),
    service: serviceName,
    version: serviceVersion,
    level: "info",
    event: "server_start",
    message: `family-experience-mcp listening on ${input.host}:${input.port}`,
  })
}

export function recordHttpRequest(input: {
  readonly logger: OperationalLogger
  readonly method: string | undefined
  readonly path: string
  readonly statusCode: number
  readonly latencyMs: number
}): void {
  const outcome: OperationalOutcome = input.statusCode >= 400 ? "failure" : "success"
  counters.requestsTotal += 1
  addLatency(counters.requestLatenciesMs, input.latencyMs)
  if (outcome === "success") counters.requestsSucceeded += 1
  else counters.requestsFailed += 1
  if (input.statusCode === 429) counters.requestsRateLimited += 1

  input.logger({
    timestamp: new Date().toISOString(),
    service: serviceName,
    version: serviceVersion,
    level: levelForStatus(input.statusCode),
    event: "http_request",
    http: {
      method: input.method ?? "UNKNOWN",
      path: input.path,
      status_code: input.statusCode,
      outcome,
      latency_ms: Math.max(0, Math.round(input.latencyMs)),
    },
  })
}

export function recordToolCall(input: {
  readonly logger: OperationalLogger
  readonly name?: OperationalToolName
  readonly mode: ToolMode
  readonly latencyMs: number
  readonly candidateCount: number
  readonly failure?: ToolFailure
}): void {
  const outcome: OperationalOutcome = input.failure === undefined ? "success" : "failure"
  counters.toolCallsTotal += 1
  addLatency(counters.toolLatenciesMs, input.latencyMs)

  if (input.failure === undefined) {
    counters.toolCallsSucceeded += 1
  } else {
    counters.toolCallsFailed += 1
    countFailure(input.failure.code)
  }

  input.logger(toolLogEntry(input, outcome))
}

function toolLogEntry(
  input: {
    readonly mode: ToolMode
    readonly name?: OperationalToolName
    readonly latencyMs: number
    readonly candidateCount: number
    readonly failure?: ToolFailure
  },
  outcome: OperationalOutcome,
): OperationalLogEntry {
  const tool: OperationalToolLog = {
    name: input.name ?? "find_family_experiences",
    outcome,
    mode: input.mode,
    latency_ms: Math.max(0, Math.round(input.latencyMs)),
    candidate_count: input.candidateCount,
    failure_code: input.failure?.code ?? null,
  }

  if (input.failure === undefined) {
    return { timestamp: new Date().toISOString(), service: serviceName, version: serviceVersion, level: "info", event: "tool_call", tool }
  }

  return {
    timestamp: new Date().toISOString(),
    service: serviceName,
    version: serviceVersion,
    level: input.failure.retryable ? "warn" : "error",
    event: "tool_call",
    tool,
    diagnostics: {
      failure_code: input.failure.code,
      retryable: input.failure.retryable,
      message: redactOperationalText(input.failure.message),
    },
  }
}

function countFailure(code: ToolFailureCode): void {
  switch (code) {
    case "invalid_input":
      counters.invalidInput += 1
      return
    case "no_results":
      counters.noResults += 1
      return
    case "upstream_unavailable":
    case "upstream_invalid_response":
      counters.sourceFailures += 1
      return
    case "missing_configuration":
    case "internal_error":
      return
    default:
      assertNeverToolFailureCode(code)
  }
}

function addLatency(samples: number[], latencyMs: number): void {
  samples.push(Math.max(0, Math.round(latencyMs)))
  if (samples.length > maxLatencySamples) samples.shift()
}

function latencySnapshot(samples: readonly number[]) {
  const last = samples[samples.length - 1] ?? null
  return { last, p95: percentile(samples, 0.95) }
}

function percentile(samples: readonly number[], fraction: number): number | null {
  if (samples.length === 0) return null
  const sorted = [...samples].sort((left, right) => left - right)
  const index = Math.ceil(sorted.length * fraction) - 1
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))] ?? null
}

function levelForStatus(statusCode: number): OperationalLogLevel {
  if (statusCode >= 500) return "error"
  return statusCode >= 400 ? "warn" : "info"
}

function redactOperationalLogEntry(entry: OperationalLogEntry): OperationalLogEntry {
  return {
    ...entry,
    ...(entry.message === undefined ? {} : { message: redactOperationalText(entry.message) }),
    ...(entry.diagnostics === undefined
      ? {}
      : {
          diagnostics: {
            failure_code: redactOperationalText(entry.diagnostics.failure_code),
            retryable: entry.diagnostics.retryable,
            message: redactOperationalText(entry.diagnostics.message),
          },
        }),
  }
}

function assertNeverToolFailureCode(value: never): never {
  throw new Error(`Unexpected tool failure code: ${JSON.stringify(value)}`)
}
