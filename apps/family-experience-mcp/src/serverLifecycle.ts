import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import type { Server } from "node:http"

const parentPollIntervalMs = 250
const forceExitDelayMs = 1_000
const windowsAncestorProbeTimeoutMs = 5_000
const msysProbeTimeoutMs = 1_000
const defaultGitPsPath = "C:\\Program Files\\Git\\usr\\bin\\ps.exe"

type ShutdownReason = "SIGINT" | "SIGTERM" | "parent-exit"

type MsysProcess = { readonly pid: number; readonly ppid: number; readonly winpid: number }

type AncestorWatchTarget = {
  readonly seedWindowsPid: number
  readonly windowsPids: readonly number[]
  readonly msysPids: readonly number[]
}

export function installLifecycleHandlers(server: Server): void {
  const windowsPids = getWindowsAncestorPids(process.ppid)
  const msysPids = getMsysAncestorPids(windowsPids)
  let shutdownStarted = false
  let stopAncestorWatcher: () => void = () => {}

  const shutdown = (reason: ShutdownReason): void => {
    if (shutdownStarted) {
      return
    }

    shutdownStarted = true
    stopAncestorWatcher()
    console.log(`family-experience-mcp shutting down: ${reason}`)

    const forceExitTimer = setTimeout(() => {
      process.exit(process.exitCode ?? 0)
    }, forceExitDelayMs)
    forceExitTimer.unref()

    server.close((error?: Error) => {
      clearTimeout(forceExitTimer)

      if (error !== undefined) {
        console.error(`family-experience-mcp shutdown error: ${error.message}`)
        process.exitCode = 1
      }

      process.exit(process.exitCode ?? 0)
    })
  }

  stopAncestorWatcher = watchAncestorProcesses({ seedWindowsPid: process.ppid, windowsPids, msysPids }, () => {
    shutdown("parent-exit")
  })

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

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error: unknown) {
    if (error instanceof Error) {
      return false
    }

    throw error
  }
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

    const windowsAncestorExited = process.platform !== "win32" && windowsPids.some((ancestorPid) => !isProcessAlive(ancestorPid))

    if (windowsAncestorExited || hasDetachedMsysAncestor(msysPids)) {
      onAncestorExit()
    }
  }, parentPollIntervalMs)
  timer.unref()

  return () => {
    clearInterval(timer)
  }
}
