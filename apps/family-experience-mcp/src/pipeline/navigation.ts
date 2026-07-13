import type { NormalizedFamilyExperienceCandidate } from "./normalize.js"

export type KakaoNavigation = {
  readonly map_url: string
  readonly directions_url: string
}

export function renderKakaoNavigation(
  candidate: NormalizedFamilyExperienceCandidate,
): KakaoNavigation | undefined {
  if (candidate.coordinates === undefined) return undefined

  const latitude = compactCoordinate(candidate.coordinates.latitude)
  const longitude = compactCoordinate(candidate.coordinates.longitude)
  const destination = "행사장"
  return {
    map_url: `https://map.kakao.com/link/map/${destination},${latitude},${longitude}`,
    directions_url: `https://map.kakao.com/link/to/${destination},${latitude},${longitude}`,
  }
}

function compactCoordinate(value: number): string {
  return value.toFixed(6).replace(/\.?0+$/u, "")
}
