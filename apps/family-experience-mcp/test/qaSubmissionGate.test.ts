import { describe, expect, it } from "vitest"

import {
  releaseTreePaths,
  sha256,
  validateFreshPass,
  validateLiteralPassOutput,
  validateReleaseTreeUnchanged,
} from "../scripts/qa-submission-gate.js"

describe("submission gate receipt validation", () => {
  it("accepts a fresh literal PASS bound to the sealed dataset", () => {
    // Given
    const hash = sha256("sealed")
    const raw = JSON.stringify({ status: "PASS", hashes: { holdout_sha256: hash } })

    // When / Then
    expect(() => validateFreshPass("holdout", raw, 101, 100, hash)).not.toThrow()
  })

  it("fails closed for a stale receipt", () => {
    // Given
    const raw = JSON.stringify({ status: "PASS" })

    // When / Then
    expect(() => validateFreshPass("contract", raw, 99, 100)).toThrow("receipt is stale")
  })

  it("fails closed for a non-PASS or differently bound holdout receipt", () => {
    // Given
    const failed = JSON.stringify({ status: "FAIL" })
    const substituted = JSON.stringify({ status: "PASS", hashes: { holdout_sha256: sha256("other") } })

    // When / Then
    expect(() => validateFreshPass("contract", failed, 100, 100)).toThrow("literal PASS")
    expect(() => validateFreshPass("holdout", substituted, 100, 100, sha256("sealed"))).toThrow("sealed dataset")
  })

  it("requires a literal PASS object from scanners", () => {
    // Given
    const passing = '{"status":"PASS","scanned_files":10}'

    // When / Then
    expect(() => validateLiteralPassOutput("scan", passing)).not.toThrow()
    expect(() => validateLiteralPassOutput("scan", '{"status":"FAIL"}')).toThrow("literal PASS")
    expect(() => validateLiteralPassOutput("scan", '{"status":"FAIL","nested":{"status":"PASS"}}')).toThrow("literal PASS")
    expect(() => validateLiteralPassOutput("scan", "PASS")).toThrow("literal PASS")
  })

  it("binds the release tree to root container inputs and the application subtree", () => {
    expect(releaseTreePaths).toEqual([".dockerignore", "Dockerfile", "apps/family-experience-mcp"])
    expect(() => validateReleaseTreeUnchanged("before", "before")).not.toThrow()
    expect(() => validateReleaseTreeUnchanged("before", "after")).toThrow("release inputs changed")
  })
})
