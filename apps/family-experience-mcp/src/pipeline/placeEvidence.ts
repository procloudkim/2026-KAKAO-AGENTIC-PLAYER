import {
  canonicalFamilyExperienceRegion,
  type FamilyExperienceRegion,
} from "../location.js"
import { isMeaningfulPlaceLabel, normalizeKakaoDestinationLabel } from "../placeLabels.js"
import type { PlaceEvidenceStatus } from "../placeResolution.js"
import type { ExperienceCoordinates } from "../sources/types.js"

export type SourcePlaceEvidenceCandidate = {
  readonly city: string
  readonly coordinates?: ExperienceCoordinates
  readonly venue_address: string
  readonly venue_name: string
}

export type SourceBackedPlaceAssessment = {
  readonly status: Extract<PlaceEvidenceStatus, "source_backed" | "conflict" | "unresolved">
  readonly reason:
    | "source_name_address_coordinates"
    | "missing_coordinates"
    | "meaningless_name"
    | "meaningless_address"
    | "region_conflict"
  readonly destination_label?: string
}

type RegionEnvelope = {
  readonly minimum_latitude: number
  readonly maximum_latitude: number
  readonly minimum_longitude: number
  readonly maximum_longitude: number
}

const REGION_ENVELOPES: Readonly<
  Partial<Record<FamilyExperienceRegion, RegionEnvelope>>
> = {
  seoul: { minimum_latitude: 37.4, maximum_latitude: 37.72, minimum_longitude: 126.73, maximum_longitude: 127.3 },
  busan: { minimum_latitude: 34.85, maximum_latitude: 35.4, minimum_longitude: 128.7, maximum_longitude: 129.35 },
  daegu: { minimum_latitude: 35.55, maximum_latitude: 36.1, minimum_longitude: 128.3, maximum_longitude: 129.05 },
  daejeon: { minimum_latitude: 36.15, maximum_latitude: 36.55, minimum_longitude: 127.2, maximum_longitude: 127.6 },
  gwangju: { minimum_latitude: 34.95, maximum_latitude: 35.4, minimum_longitude: 126.6, maximum_longitude: 127.1 },
  incheon: { minimum_latitude: 37, maximum_latitude: 38.2, minimum_longitude: 124.5, maximum_longitude: 127.05 },
  ulsan: { minimum_latitude: 35.25, maximum_latitude: 35.8, minimum_longitude: 128.95, maximum_longitude: 129.55 },
  sejong: { minimum_latitude: 36.35, maximum_latitude: 36.75, minimum_longitude: 127.1, maximum_longitude: 127.5 },
  gyeonggi: { minimum_latitude: 36.85, maximum_latitude: 38.3, minimum_longitude: 126.3, maximum_longitude: 127.9 },
  gangwon: { minimum_latitude: 37, maximum_latitude: 38.65, minimum_longitude: 127.5, maximum_longitude: 129.4 },
  chungbuk: { minimum_latitude: 36, maximum_latitude: 37.25, minimum_longitude: 127.2, maximum_longitude: 128.7 },
  chungnam: { minimum_latitude: 35.9, maximum_latitude: 37.1, minimum_longitude: 125.8, maximum_longitude: 127.7 },
  jeonbuk: { minimum_latitude: 35.25, maximum_latitude: 36.2, minimum_longitude: 126.35, maximum_longitude: 127.9 },
  jeonnam: { minimum_latitude: 33.8, maximum_latitude: 35.6, minimum_longitude: 125, maximum_longitude: 127.9 },
  gyeongbuk: { minimum_latitude: 35.5, maximum_latitude: 37.3, minimum_longitude: 127.7, maximum_longitude: 131.9 },
  gyeongnam: { minimum_latitude: 34.4, maximum_latitude: 36.1, minimum_longitude: 127.5, maximum_longitude: 129.6 },
  jeju: { minimum_latitude: 33, maximum_latitude: 34, minimum_longitude: 125.8, maximum_longitude: 127.1 },
}

const BROAD_REGION_MEMBERS: Readonly<
  Partial<Record<FamilyExperienceRegion, readonly FamilyExperienceRegion[]>>
> = {
  chungcheong: ["chungbuk", "chungnam"],
  jeolla: ["jeonbuk", "jeonnam"],
  gyeongsang: ["gyeongbuk", "gyeongnam"],
}

const METROPOLITAN_REGIONS = [
  "seoul",
  "busan",
  "daegu",
  "daejeon",
  "gwangju",
  "incheon",
  "ulsan",
  "sejong",
] as const satisfies readonly FamilyExperienceRegion[]

// These deliberately conservative cores detect only obvious cross-metro
// coordinate conflicts. Full administrative envelopes overlap at borders and
// cannot safely identify a metro by themselves.
const METROPOLITAN_CORE_ENVELOPES: Readonly<
  Record<(typeof METROPOLITAN_REGIONS)[number], RegionEnvelope>
> = {
  seoul: { minimum_latitude: 37.43, maximum_latitude: 37.7, minimum_longitude: 126.8, maximum_longitude: 127.18 },
  busan: { minimum_latitude: 35.02, maximum_latitude: 35.3, minimum_longitude: 128.85, maximum_longitude: 129.25 },
  daegu: { minimum_latitude: 35.7, maximum_latitude: 36.0, minimum_longitude: 128.45, maximum_longitude: 128.8 },
  daejeon: { minimum_latitude: 36.23, maximum_latitude: 36.45, minimum_longitude: 127.25, maximum_longitude: 127.5 },
  gwangju: { minimum_latitude: 35.05, maximum_latitude: 35.25, minimum_longitude: 126.75, maximum_longitude: 127.0 },
  incheon: { minimum_latitude: 37.35, maximum_latitude: 37.65, minimum_longitude: 126.55, maximum_longitude: 126.78 },
  ulsan: { minimum_latitude: 35.4, maximum_latitude: 35.7, minimum_longitude: 129.1, maximum_longitude: 129.4 },
  sejong: { minimum_latitude: 36.42, maximum_latitude: 36.65, minimum_longitude: 127.15, maximum_longitude: 127.35 },
}

export function assessSourceBackedPlace(
  candidate: SourcePlaceEvidenceCandidate,
): SourceBackedPlaceAssessment {
  if (candidate.coordinates === undefined) {
    return { status: "unresolved", reason: "missing_coordinates" }
  }
  if (!isMeaningfulPlaceLabel(candidate.venue_name)) {
    return { status: "unresolved", reason: "meaningless_name" }
  }
  if (!isMeaningfulPlaceLabel(candidate.venue_address)) {
    return { status: "unresolved", reason: "meaningless_address" }
  }
  if (hasRegionConflict(candidate)) {
    return { status: "conflict", reason: "region_conflict" }
  }

  return {
    status: "source_backed",
    reason: "source_name_address_coordinates",
    destination_label: normalizeKakaoDestinationLabel(candidate.venue_name),
  }
}

function hasRegionConflict(candidate: SourcePlaceEvidenceCandidate): boolean {
  const coordinates = candidate.coordinates
  if (coordinates === undefined) return false

  const addressRegion = canonicalFamilyExperienceRegion(candidate.venue_address)
  const cityRegion = canonicalFamilyExperienceRegion(candidate.city)
  if (
    addressRegion !== undefined &&
    cityRegion !== undefined &&
    addressRegion !== cityRegion &&
    !regionsAreCompatible(addressRegion, cityRegion)
  ) {
    return true
  }

  const region = addressRegion ?? cityRegion
  if (region === undefined) return false
  if (!isWithinSouthKoreaEnvelope(coordinates)) return true

  const coordinateMetropolitanRegion = mostSpecificMetropolitanRegion(
    coordinates.latitude,
    coordinates.longitude,
  )
  if (
    isMetropolitanRegion(region) &&
    coordinateMetropolitanRegion !== undefined &&
    !regionsAreCompatible(region, coordinateMetropolitanRegion) &&
    region !== coordinateMetropolitanRegion
  ) {
    return true
  }

  return !isWithinRegion(region, coordinates.latitude, coordinates.longitude)
}

function isMetropolitanRegion(
  region: FamilyExperienceRegion,
): region is (typeof METROPOLITAN_REGIONS)[number] {
  return METROPOLITAN_REGIONS.some((candidate) => candidate === region)
}

function regionsAreCompatible(
  left: FamilyExperienceRegion,
  right: FamilyExperienceRegion,
): boolean {
  return (
    BROAD_REGION_MEMBERS[left]?.includes(right) === true ||
    BROAD_REGION_MEMBERS[right]?.includes(left) === true
  )
}

function isWithinSouthKoreaEnvelope(
  coordinates: ExperienceCoordinates,
): boolean {
  return (
    coordinates.latitude >= 32.5 &&
    coordinates.latitude <= 38.7 &&
    coordinates.longitude >= 124.5 &&
    coordinates.longitude <= 132
  )
}

function isWithinRegion(
  region: FamilyExperienceRegion,
  latitude: number,
  longitude: number,
): boolean {
  const members = BROAD_REGION_MEMBERS[region]
  if (members !== undefined) {
    return members.some((member) => isWithinRegion(member, latitude, longitude))
  }

  const envelope = REGION_ENVELOPES[region]
  return envelope === undefined || isWithinEnvelope(envelope, latitude, longitude)
}

function mostSpecificMetropolitanRegion(
  latitude: number,
  longitude: number,
): FamilyExperienceRegion | undefined {
  return METROPOLITAN_REGIONS
    .flatMap((region) => {
      const envelope = METROPOLITAN_CORE_ENVELOPES[region]
      return isWithinEnvelope(envelope, latitude, longitude)
        ? [{ region, area: envelopeArea(envelope) }]
        : []
    })
    .sort((left, right) => left.area - right.area)[0]?.region
}

function isWithinEnvelope(
  envelope: RegionEnvelope,
  latitude: number,
  longitude: number,
): boolean {
  return (
    latitude >= envelope.minimum_latitude &&
    latitude <= envelope.maximum_latitude &&
    longitude >= envelope.minimum_longitude &&
    longitude <= envelope.maximum_longitude
  )
}

function envelopeArea(envelope: RegionEnvelope): number {
  return (
    (envelope.maximum_latitude - envelope.minimum_latitude) *
    (envelope.maximum_longitude - envelope.minimum_longitude)
  )
}
