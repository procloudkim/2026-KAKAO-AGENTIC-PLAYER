import { encodeKakaoDestinationLabel } from "../placeLabels.js"
import type {
  NavigablePlaceEvidenceStatus,
  PlaceEvidenceStatus,
} from "../placeResolution.js"
import { TransientKakaoPlaceResolutionSchema } from "../placeResolution.js"
import type { NormalizedFamilyExperienceCandidate } from "./normalize.js"
import { assessSourceBackedPlace } from "./placeEvidence.js"

export type KakaoNavigation = {
  readonly place_evidence_status: NavigablePlaceEvidenceStatus
  readonly map_url: string
  readonly directions_url: string
}

export type KakaoNavigationAssessment = {
  readonly status: PlaceEvidenceStatus
  readonly reason: string
  readonly navigation?: KakaoNavigation
}

export function renderKakaoNavigation(
  candidate: NormalizedFamilyExperienceCandidate,
  placeResolution?: unknown,
): KakaoNavigation | undefined {
  return assessKakaoNavigation(candidate, placeResolution).navigation
}

export function assessKakaoNavigation(
  candidate: NormalizedFamilyExperienceCandidate,
  placeResolution?: unknown,
): KakaoNavigationAssessment {
  if (placeResolution !== undefined) {
    const parsedResolution = TransientKakaoPlaceResolutionSchema.safeParse(placeResolution)
    if (!parsedResolution.success) {
      return { status: "unresolved", reason: "invalid_place_resolution" }
    }

    if (parsedResolution.data.status !== "kakao_place_matched") {
      return {
        status: parsedResolution.data.status,
        reason: `place_resolution_${parsedResolution.data.status}`,
      }
    }

    // W0 defines and validates the adapter contract but does not promote an
    // untested provider match into a public exact-POI claim.
    return { status: "unresolved", reason: "kakao_place_matching_not_promoted" }
  }

  const sourceAssessment = assessSourceBackedPlace(candidate)
  if (
    sourceAssessment.status !== "source_backed" ||
    sourceAssessment.destination_label === undefined ||
    candidate.coordinates === undefined
  ) {
    return {
      status: sourceAssessment.status,
      reason: sourceAssessment.reason,
    }
  }

  const latitude = compactCoordinate(candidate.coordinates.latitude)
  const longitude = compactCoordinate(candidate.coordinates.longitude)
  const destination = encodeKakaoDestinationLabel(sourceAssessment.destination_label)
  const mapUrl = `https://map.kakao.com/link/map/${destination},${latitude},${longitude}`
  const directionsUrl = `https://map.kakao.com/link/to/${destination},${latitude},${longitude}`

  if (
    !isSafeKakaoLink(mapUrl, "map", destination, latitude, longitude) ||
    !isSafeKakaoLink(directionsUrl, "to", destination, latitude, longitude)
  ) {
    return { status: "unresolved", reason: "unsafe_navigation_url" }
  }

  return {
    status: "source_backed",
    reason: sourceAssessment.reason,
    navigation: {
      place_evidence_status: "source_backed",
      map_url: mapUrl,
      directions_url: directionsUrl,
    },
  }
}

function compactCoordinate(value: number): string {
  return value.toFixed(6).replace(/\.?0+$/u, "")
}

function isSafeKakaoLink(
  value: string,
  kind: "map" | "to",
  destination: string,
  latitude: string,
  longitude: string,
): boolean {
  if (value.length > 2_048) return false

  try {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      url.hostname === "map.kakao.com" &&
      url.username.length === 0 &&
      url.password.length === 0 &&
      url.search.length === 0 &&
      url.hash.length === 0 &&
      url.pathname === `/link/${kind}/${destination},${latitude},${longitude}`
    )
  } catch {
    return false
  }
}
