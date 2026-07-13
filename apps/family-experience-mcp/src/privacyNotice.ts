import {
  DEFAULT_MCP_RATE_WINDOW_MS,
  type FamilyExperienceConfig,
} from "./config.js"

export const PRIVACY_NOTICE_EFFECTIVE_DATE = "2026-07-14"

export type FamilyExperiencePrivacyNotice = {
  readonly publication_ready: boolean
  readonly missing_fields: readonly ("operator_name" | "privacy_contact")[]
  readonly operator: {
    readonly name: string | null
    readonly contact: string | null
  }
  readonly effective_date: string
  readonly input_categories: readonly string[]
  readonly purpose: string
  readonly application_processing: {
    readonly request_content: string
    readonly rate_limit_key: string
    readonly operational_logs: string
  }
  readonly maximum_application_retention: {
    readonly request_content: string
    readonly rate_limit_key_ms: number
    readonly operational_logs: string
  }
  readonly external_boundaries: readonly string[]
}

export function buildFamilyExperiencePrivacyNotice(
  config: FamilyExperienceConfig,
): FamilyExperiencePrivacyNotice {
  const missingFields: ("operator_name" | "privacy_contact")[] = []
  if (config.operatorName === undefined) missingFields.push("operator_name")
  if (config.privacyContact === undefined) missingFields.push("privacy_contact")
  const rateWindowMs = config.mcpRateWindowMs ?? DEFAULT_MCP_RATE_WINDOW_MS

  return {
    publication_ready: missingFields.length === 0,
    missing_fields: missingFields,
    operator: {
      name: config.operatorName ?? null,
      contact: config.privacyContact ?? null,
    },
    effective_date: PRIVACY_NOTICE_EFFECTIVE_DATE,
    input_categories: [
      "지역",
      "날짜 범위",
      "아이 연령 또는 발달 단계",
      "선호 시간대와 실내·실외 조건",
      "키워드와 자유 형식 요청 문구",
    ],
    purpose: "가족 체험·행사 후보를 검색하고 안전한 확인 항목과 함께 추천하기 위해 처리합니다.",
    application_processing: {
      request_content:
        "요청 처리 중 메모리에서 사용하며, 애플리케이션 로그나 영구 저장소에 원문 요청 본문·프롬프트를 기록하지 않습니다.",
      rate_limit_key:
        "네트워크 주소는 프로세스별 임시 비밀값으로 HMAC-SHA-256 처리한 뒤 메모리 rate-limit 키로만 사용합니다.",
      operational_logs:
        "HTTP 메서드, 허용된 경로 라벨, 상태 코드, 지연 시간, 제한 결과와 도구 결과 개수·실패 코드만 기록하며 원문 프롬프트와 네트워크 주소는 기록하지 않습니다.",
    },
    maximum_application_retention: {
      request_content: "요청 처리 완료 시까지",
      rate_limit_key_ms: rateWindowMs,
      operational_logs:
        "애플리케이션 내부 로그 저장소는 없습니다. 배포 플랫폼이 수집하는 stdout·접근 로그의 보유기간은 해당 플랫폼 설정과 정책을 확인해야 합니다.",
    },
    external_boundaries: [
      "공공 행사 데이터 공급자와 캐시는 행사 정보의 출처이며, 런타임은 사용자 식별자를 공급자에 전달하도록 구현되어 있지 않습니다.",
      "PlayMCP·KakaoCloud 같은 호스팅 계층은 접속 메타데이터를 별도로 처리할 수 있습니다. 그 범위와 보유기간은 플랫폼 정책 및 실제 배포 설정의 적용을 받습니다.",
    ],
  }
}

export function renderFamilyExperiencePrivacyNoticeHtml(
  notice: FamilyExperiencePrivacyNotice,
): string {
  const title = notice.publication_ready ? "개인정보 처리방침" : "개인정보 처리 고지 준비 상태"
  const readiness = notice.publication_ready
    ? "이 고지는 공개 배포용 운영자 정보가 설정된 상태입니다."
    : `공개 배포용 고지로 사용할 수 없습니다. 누락: ${notice.missing_fields.join(", ")}`
  const operatorName = notice.operator.name ?? "미설정"
  const privacyContact = notice.operator.contact ?? "미설정"

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p><strong>공개 준비:</strong> ${notice.publication_ready ? "완료" : "미완료"}</p>
    <p>${escapeHtml(readiness)}</p>
    <p><strong>운영자:</strong> ${escapeHtml(operatorName)}<br><strong>개인정보 문의:</strong> ${escapeHtml(privacyContact)}<br><strong>시행일:</strong> ${escapeHtml(notice.effective_date)}</p>
    <h2>처리하는 입력과 목적</h2>
    <ul>${notice.input_categories.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <p>${escapeHtml(notice.purpose)}</p>
    <h2>애플리케이션 처리와 보유</h2>
    <ul>
      <li>${escapeHtml(notice.application_processing.request_content)} 보유: ${escapeHtml(notice.maximum_application_retention.request_content)}</li>
      <li>${escapeHtml(notice.application_processing.rate_limit_key)} 최대 보유: ${notice.maximum_application_retention.rate_limit_key_ms}ms</li>
      <li>${escapeHtml(notice.application_processing.operational_logs)} ${escapeHtml(notice.maximum_application_retention.operational_logs)}</li>
    </ul>
    <h2>외부 처리 경계</h2>
    <ul>${notice.external_boundaries.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </main>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
