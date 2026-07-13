import { describe, expect, it } from "vitest"

import {
  validateCleanupObservation,
  validateHealthObservation,
  validateImageInspection,
  validateMcpObservation,
  validateRuntimeIdentity,
  validateShutdownObservation,
} from "../scripts/qa-container.js"

const liveResult = {
  ok: true,
  mode: "live",
  candidates: [{
    id: "candidate-1",
    title: "Family program",
    location: "Seoul",
    starts_at: "2026-08-01",
    ends_at: "2026-08-01",
    source: "kto_tourapi",
    tags: ["family"],
    date_time: "2026-08-01 10:00",
    venue: "Family hall",
    address: "Seoul family hall",
    age_fit_label: "source-stated",
    age_fit_reason: "The source states the child age range.",
    indoor_outdoor: "indoor",
    fee_text: "Confirm fees with the official source.",
    source_name: "KTO TourAPI",
    source_url: "https://apis.data.go.kr/B551011/KorService2/detailIntro2?contentId=1",
    retrieved_at: "2026-07-13T00:00:00.000Z",
    confidence: "date and venue are API-returned; age fit is source-stated",
    mode: "live",
    warnings: "Confirm current details with the official source.",
    source_summary: "KTO source record.",
    parent_check: "Confirm age fit with the official source.",
    next_action: "Confirm the schedule with the official source.",
  }],
}

describe("container release QA pure validators", () => {
  it("accepts the canonical linux image and rejects root or wrapper drift", () => {
    const inspection = [{
      Os: "linux",
      Architecture: "amd64",
      Config: { User: "node", Cmd: ["node", "dist/src/server.js"], StopSignal: "SIGTERM" },
    }]

    expect(validateImageInspection(inspection)).toMatchObject({
      os: "linux",
      architecture: "amd64",
      user: "node",
      cmd: ["node", "dist/src/server.js"],
      stop_signal: "SIGTERM",
    })
    expect(() => validateImageInspection([{ ...inspection[0], Config: { ...inspection[0]?.Config, User: "root" } }])).toThrow("image user")
    expect(() => validateImageInspection([{ ...inspection[0], Config: { ...inspection[0]?.Config, Cmd: ["npm", "start"] } }])).toThrow("CMD")
  })

  it("requires live fresh health with a successful source", () => {
    const health = {
      ok: true,
      config: { allowFixture: false, toolMode: "live" },
      cache: {
        status: "fresh",
        mode: "live",
        source_health: { failed_sources: 0, ok_sources: 1 },
      },
    }

    expect(validateHealthObservation(200, health)).toMatchObject({
      status: 200,
      ok: true,
      cache_status: "fresh",
      cache_mode: "live",
    })
    expect(() => validateHealthObservation(503, { ...health, ok: false })).toThrow("health returned")
    expect(() => validateHealthObservation(200, { ...health, cache: { ...health.cache, status: "stale" } })).toThrow("not fresh")
  })

  it("requires non-root direct Node PID 1", () => {
    expect(validateRuntimeIdentity("1000\n", "node\0dist/src/server.js\0")).toEqual({
      uid: 1000,
      pid1_argv: ["node", "dist/src/server.js"],
    })
    expect(() => validateRuntimeIdentity("0", "node\0dist/src/server.js\0")).toThrow("root")
    expect(() => validateRuntimeIdentity("1000", "sh\0-c\0node dist/src/server.js\0")).toThrow("PID 1")
  })

  it("requires exactly one tool and a live 1..3 candidate result", () => {
    expect(validateMcpObservation(["find_family_experiences"], liveResult)).toMatchObject({
      tool_count: 1,
      mode: "live",
      candidate_count: 1,
    })
    expect(() => validateMcpObservation(["find_family_experiences", "extra"], liveResult)).toThrow("exactly")
    expect(() => validateMcpObservation(["find_family_experiences"], { ...liveResult, mode: "fixture" })).toThrow("not live")
  })

  it("requires graceful SIGTERM evidence and complete cleanup", () => {
    const logs = "family-experience-mcp shutting down: SIGTERM\n"
    expect(validateShutdownObservation([{ State: { Running: false, ExitCode: 0 } }], logs)).toMatchObject({
      exit_code: 0,
      running: false,
      shutdown_log: true,
    })
    expect(() => validateShutdownObservation([{ State: { Running: false, ExitCode: 137 } }], logs)).toThrow("exited 137")
    expect(validateCleanupObservation({ container_absent: true, image_absent: true, port_free: true })).toEqual({
      container_absent: true,
      image_absent: true,
      port_free: true,
    })
    expect(() => validateCleanupObservation({ container_absent: true, image_absent: false, port_free: true })).toThrow("image")
  })
})
