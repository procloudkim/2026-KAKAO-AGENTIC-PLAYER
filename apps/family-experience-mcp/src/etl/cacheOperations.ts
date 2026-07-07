import type { FamilyExperienceSourceSetEntry } from "../config.js"

type CacheRefreshCommandInput = {
  readonly allowFixture: boolean
  readonly cacheDir: string
  readonly sourceSet?: readonly FamilyExperienceSourceSetEntry[]
}

export function buildCacheRefreshCommand(input: CacheRefreshCommandInput): string {
  if (input.allowFixture) {
    return `npm run etl:nationwide -- --fixture --write-cache --cache-dir ${input.cacheDir}`
  }

  return `npm run etl:nationwide -- --live --write-cache --cache-dir ${input.cacheDir} --source ${liveRefreshSource(input.sourceSet)}`
}

export function buildCacheRecoverySentence(input: CacheRefreshCommandInput): string {
  return `Run source-specific cache refresh: ${buildCacheRefreshCommand(input)}.`
}

function liveRefreshSource(
  sourceSet: readonly FamilyExperienceSourceSetEntry[] | undefined,
): FamilyExperienceSourceSetEntry {
  const source = sourceSet?.find((entry) => entry !== "fixture")
  return source ?? "culture_portal"
}
