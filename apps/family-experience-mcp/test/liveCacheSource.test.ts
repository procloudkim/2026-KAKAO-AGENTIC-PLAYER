import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { loadSource } from "../src/etl/sourceLoaders.js"

describe("production cache source range", () => {
  it("loads the full 2026 standard dataset window", async () => {
    // Given: the tracked official nationwide festival CSV is the live cache source.
    const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..")

    // When: the production ETL loads the standard dataset.
    const result = await loadSource({
      fixture: false,
      source: "national_festival",
      env: {
        NATIONAL_CULTURE_FESTIVAL_CSV_PATH: resolve(
          repoRoot,
          "공공데이터-관련",
          "전국문화축제표준데이터.csv",
        ),
      },
    })

    // Then: the cache source covers dates before and after the former July-only window.
    expect(result.ok).toBe(true)
    if (!result.ok) {
      throw new Error(result.failure.message)
    }
    expect(result.records.some((record) => record.date.start < "2026-07-01")).toBe(true)
    expect(result.records.some((record) => record.date.start > "2026-07-31")).toBe(true)
  })
})
