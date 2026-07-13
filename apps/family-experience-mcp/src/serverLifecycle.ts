import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import type { Server } from "node:http"

const parentPollIntervalMs = 250
const windowsAncestorProbeTimeoutMs = 5_000
const msysProbeTimeoutMs = 1_000
const defaultGitPsPath = "C:\\Program Files\\Git\\usr\\bin\\ps.exe"

type ShutdownReason = "SIGINT" | "SIGTERM" | "parent-exit"
export type LifecycleMode = "signals_only" | "windows_ancestors"

type MsysProcess = { readonly pid: number; readonly ppid: number; readonly winpid: number }

type AncestorWatchTarget = {
  readonly seedWindowsPid: number
  readonly windowsPids: readonly number[]
  readonly msysPids: readonly number[]
}

type ShutdownTimer = number | NodeJS.Timeout

type GracefulShutdownDependencies = {
  readonly graceMs: number
  readonly close: (complete: (error?: Error) => void) => void
  readonly drain?: () => Promise<void>
  readonly forceClose: () => void
  readonly exit: (code: number) => void
  readonly schedule: (callback: () => void, delayMs: number) => ShutdownTimer
  readonly cancel: (timer: ShutdownTimer) => void
}

export function createGracefulShutdown(
  dependencies: GracefulShutdownDependencies,
): () => void {
  let completed = false

  const complete = (forceTimer: ShutdownTimer, error?: Error): void => {
    if (completed) return
    completed = true
    dependencies.cancel(forceTimer)
    dependencies.exit(error === undefined ? 0 : 1)
  }

  return () => {
    const forceTimer = dependencies.schedule(() => {
      if (completed) return
      completed = true
      dependencies.forceClose()
      dependencies.exit(1)
    }, dependencies.graceMs)

    dependencies.close((error) => {
      if (error !== undefined || dependencies.drain === undefined) {
        complete(forceTimer, error)
        return
      }

      void dependencies.drain().then(
        () => complete(forceTimer),
        (drainError: unknown) => {
          complete(
            forceTimer,
            drainError instanceof Error ? drainError : new Error("Server drain failed."),
          )
        },
      )
    })
  }
}

export function lifecycleModeForPlatform(platform: NodeJS.Platform): LifecycleMode {
  return platform === "win32" ? "windows_ancestors" : "signals_only"
}

export function installLifecycleHandlers(
  server: Server,
  graceMs: number,
  drain?: () => Promise<void>,
): void {
  const lifecycleMode = lifecycleModeForPlatform(process.platform)
  const windowsPids =
    lifecycleMode === "windows_ancestors" ? getWindowsAncestorPids(process.ppid) : []
  const msysPids =
    lifecycleMode === "windows_ancestors" ? getMsysAncestorPids(windowsPids) : []
  let shutdownStarted = false
  let stopAncestorWatcher: () => void = () => {}
  const gracefulShutdown = createGracefulShutdown({
    graceMs,
    close: (complete) => server.close(complete),
    ...(drain === undefined ? {} : { drain }),
    forceClose: () => server.closeAllConnections(),
    exit: (code) => process.exit(code),
    schedule: (callback, delayMs) => {
      const timer = setTimeout(callback, delayMs)
      timer.unref()
      return timer
    },
    cancel: (timer) => clearTimeout(timer),
  })

  const shutdown = (reason: ShutdownReason): void => {
    if (shutdownStarted) {
      return
    }

    shutdownStarted = true
    stopAncestorWatcher()
    console.log(`family-experience-mcp shutting down: ${reason}`)

    gracefulShutdown()
  }

  if (lifecycleMode === "windows_ancestors") {
    stopAncestorWatcher = watchAncestorProcesses(
      { seedWindowsPid: process.ppid, windowsPids, msysPids },
      () => {
        shutdown("parent-exit")
      },
    )
  }

  const handleSigint = (): void => {
    shutdown("SIGINT")
  }
  const handleSigterm = (): void => {
    shutdown("SIGTERM")
  }

  process.once("SIGINT", handleSigint)
  process.once("SIGTERM", handleSigterm)
  server.once("close", () => {
    stopAncestorWatcher()
    process.off("SIGINT", handleSigint)
    process.off("SIGTERM", handleSigterm)
  })
}

function getWindowsAncestorPids(pid: number): readonly number[] {
  if (process.platform !== "win32") {
    return [pid]
  }

  const script = 'Get-CimInstance Win32_Process | ForEach-Object { "{0},{1}" -f $_.ProcessId,$_.ParentProcessId }'

  try {
    const output = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      {
        encoding: "utf8",
        timeout: windowsAncestorProbeTimeoutMs,
        windowsHide: true,
      },
    )

    const parentByPid = new Map<number, number>()
    for (const line of output.split(/\r?\n/)) {
      const [processIdText = "", parentProcessIdText = ""] = line.split(",")
      const processId = Number.parseInt(processIdText.trim(), 10)
      const parentProcessId = Number.parseInt(parentProcessIdText.trim(), 10)
      if (Number.isInteger(processId) && Number.isInteger(parentProcessId)) {
        parentByPid.set(processId, parentProcessId)
      }
    }

    const ancestors: number[] = [pid]
    const seen = new Set(ancestors)
    let currentPid = pid
    while (currentPid > 1) {
      const parentProcessId = parentByPid.get(currentPid)
      if (parentProcessId === undefined || parentProcessId <= 1 || seen.has(parentProcessId)) {
        break
      }

      ancestors.push(parentProcessId)
      seen.add(parentProcessId)
      currentPid = parentProcessId
    }

    return ancestors
  } catch (error: unknown) {
    if (error instanceof Error) {
      return [pid]
    }

    throw error
  }
}

function parseMsysProcessLine(line: string): MsysProcess | undefined {
  const tokens = line.trim().split(/\s+/)
  const pidText = tokens[0]
  const ppidText = tokens[1]
  const winpidText = tokens[3]

  if (pidText === undefined || ppidText === undefined || winpidText === undefined) {
    return undefined
  }

  const pid = Number.parseInt(pidText, 10)
  const ppid = Number.parseInt(ppidText, 10)
  const winpid = Number.parseInt(winpidText, 10)

  if (!Number.isInteger(pid) || !Number.isInteger(ppid) || !Number.isInteger(winpid)) {
    return undefined
  }

  return { pid, ppid, winpid }
}

function getMsysPsExecutable(): string {
  if (process.platform === "win32" && existsSync(defaultGitPsPath)) {
    return defaultGitPsPath
  }

  return "ps"
}

function listMsysProcesses(): readonly MsysProcess[] | undefined {
  try {
    const output = execFileSync(getMsysPsExecutable(), ["-lW"], {
      encoding: "utf8",
      timeout: msysProbeTimeoutMs,
      windowsHide: true,
    })

    return output
      .split(/\r?\n/)
      .map((line) => parseMsysProcessLine(line))
      .filter((processLine) => processLine !== undefined)
  } catch (error: unknown) {
    if (error instanceof Error) {
      return undefined
    }

    throw error
  }
}

function getMsysAncestorPids(windowsAncestorPids: readonly number[]): readonly number[] {
  const windowsPidSet = new Set(windowsAncestorPids)
  const processes = listMsysProcesses()

  if (processes === undefined) {
    return []
  }

  return processes
    .filter((processLine) => windowsPidSet.has(processLine.winpid) && processLine.ppid > 1)
    .map((processLine) => processLine.pid)
}

function hasDetachedMsysAncestor(msysPids: readonly number[]): boolean {
  if (msysPids.length === 0) {
    return false
  }

  const processes = listMsysProcesses()

  if (processes === undefined) {
    return false
  }

  return msysPids.some((msysPid) => {
    const processLine = processes.find((candidate) => candidate.pid === msysPid)
    return processLine === undefined || processLine.ppid <= 1
  })
}

function mergePids(first: readonly number[], second: readonly number[]): readonly number[] {
  return [...new Set([...first, ...second])]
}

function watchAncestorProcesses(target: AncestorWatchTarget, onAncestorExit: () => void): () => void {
  if (target.windowsPids.length === 0 && target.msysPids.length === 0) {
    return () => undefined
  }

  let windowsPids: readonly number[] = [...target.windowsPids]
  let msysPids: readonly number[] = [...target.msysPids]
  const timer = setInterval(() => {
    if (msysPids.length === 0) {
      windowsPids = mergePids(windowsPids, getWindowsAncestorPids(target.seedWindowsPid))
    }

    const discoveredMsysPids = getMsysAncestorPids(windowsPids)
    if (discoveredMsysPids.length > 0) {
      msysPids = mergePids(msysPids, discoveredMsysPids)
    }

    if (hasDetachedMsysAncestor(msysPids)) {
      onAncestorExit()
    }
  }, parentPollIntervalMs)
  timer.unref()

  return () => {
    clearInterval(timer)
  }
}
