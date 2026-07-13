import type { Server } from "node:http"

import { afterEach, describe, expect, it } from "vitest"

import type { FamilyExperienceConfig } from "../src/config.js"
import type { OperationalLogEntry } from "../src/observability.js"
import {
  buildFamilyExperiencePrivacyNotice,
  renderFamilyExperiencePrivacyNoticeHtml,
} from "../src/privacyNotice.js"
import { createFamilyExperienceHttpServer } from "../src/server.js"

let activeServer: Server | undefined

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    if (activeServer === undefined) {
      resolve()
      return
    }

    activeServer.close((error) => {
      activeServer = undefined
      if (error === undefined) resolve()
      else reject(error)
    })
  })
})

function baseConfig(overrides: Partial<FamilyExperienceConfig> = {}): FamilyExperienceConfig {
  return {
    host: "127.0.0.1",
    port: 3345,
    allowFixture: false,
    seoulOpenDataBaseUrl: "https://openapi.seoul.go.kr:8088",
    ...overrides,
  }
}

async function listen(server: Server): Promise<string> {
  activeServer = server
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (typeof address !== "object" || address === null) throw new Error("Expected server address")
  return `http://127.0.0.1:${address.port}`
}

describe("family experience privacy notice", () => {
  it("fails closed as a publication notice when operator identity is missing", () => {
    const notice = buildFamilyExperiencePrivacyNotice(baseConfig())

    expect(notice).toMatchObject({
      publication_ready: false,
      missing_fields: ["operator_name", "privacy_contact"],
      operator: { name: null, contact: null },
    })
    expect(notice.maximum_application_retention.rate_limit_key_ms).toBe(60_000)
  })

  it("renders configured operator text safely", () => {
    const notice = buildFamilyExperiencePrivacyNotice(baseConfig({
      operatorName: "Family <script>alert(1)</script>",
      privacyContact: "privacy@example.test",
    }))
    const html = renderFamilyExperiencePrivacyNoticeHtml(notice)

    expect(notice.publication_ready).toBe(true)
    expect(html).not.toContain("<script>")
    expect(html).toContain("Family &lt;script&gt;alert(1)&lt;/script&gt;")
  })

  it("serves only a configured notice as publication-ready", async () => {
    const unconfiguredBaseUrl = await listen(createFamilyExperienceHttpServer({
      config: baseConfig(),
    }))
    const unconfigured = await fetch(`${unconfiguredBaseUrl}/privacy`)
    expect(unconfigured.status).toBe(503)
    expect(await unconfigured.text()).toContain("공개 준비:</strong> 미완료")

    await new Promise<void>((resolve, reject) => {
      activeServer?.close((error) => {
        activeServer = undefined
        if (error === undefined) resolve()
        else reject(error)
      })
    })

    const configuredBaseUrl = await listen(createFamilyExperienceHttpServer({
      config: baseConfig({
        operatorName: "Family Experience Lab",
        privacyContact: "privacy@example.test",
      }),
    }))
    const configured = await fetch(`${configuredBaseUrl}/privacy`)
    const html = await configured.text()

    expect(configured.status).toBe(200)
    expect(configured.headers.get("content-security-policy")).toContain("default-src 'none'")
    expect(html).toContain("Family Experience Lab")
    expect(html).toContain("privacy@example.test")
  })

  it("normalizes arbitrary request paths before operational logging", async () => {
    const marker = "private-user-path-marker"
    const logs: OperationalLogEntry[] = []
    const baseUrl = await listen(createFamilyExperienceHttpServer({
      config: baseConfig(),
      logger: (entry) => logs.push(entry),
    }))

    const response = await fetch(`${baseUrl}/${marker}`)
    expect(response.status).toBe(404)
    expect(logs).toHaveLength(1)
    expect(logs[0]?.http?.path).toBe("other")
    expect(JSON.stringify(logs)).not.toContain(marker)
  })
})
