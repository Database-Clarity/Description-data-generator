import { DisplayDefinition } from './types.js'

/** Same language list as the editor (packages/core/src/languages.ts); also Bungie's manifest language keys. */
export const languages = [
  'en', 'de', 'es', 'es-mx', 'fr', 'it', 'ja', 'ko', 'pl', 'pt-br', 'ru', 'zh-chs', 'zh-cht',
] as const

export const pairingUrl = 'https://raw.githubusercontent.com/DestinyItemManager/d2-additional-info/master/output/trait-to-enhanced-trait.json'

export async function fetchJson(url: string): Promise<unknown> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(url)
    if (response.ok) return response.json()
    if (attempt === 3 || (response.status !== 429 && response.status < 500)) {
      throw new Error(`Fetch failed (${response.status}): ${url}`)
    }
    console.warn(`Fetch returned ${response.status}; retry ${attempt}/2: ${url}`)
    await new Promise(resolve => setTimeout(resolve, attempt * 500))
  }
  throw new Error(`Fetch attempts exhausted: ${url}`)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseDefinitions(value: unknown): Record<string, DisplayDefinition> {
  if (!isRecord(value)) throw new Error('Expected manifest definition table')
  const definitions: Record<string, DisplayDefinition> = {}
  for (const [hash, entry] of Object.entries(value)) {
    if (!isRecord(entry) || entry.hash !== Number(hash) || !isRecord(entry.displayProperties) ||
      typeof entry.displayProperties.name !== 'string' || typeof entry.displayProperties.description !== 'string') {
      throw new Error(`Invalid display definition ${hash}`)
    }
    definitions[hash] = {
      hash: Number(hash),
      displayProperties: {
        name: entry.displayProperties.name,
        description: entry.displayProperties.description,
        icon: typeof entry.displayProperties.icon === 'string' ? entry.displayProperties.icon : undefined,
      },
      displayHint: typeof entry.displayHint === 'string' ? entry.displayHint : undefined,
      redacted: entry.redacted === true,
    }
  }
  return definitions
}

/** DestinyItemCategoryDefinition table -> { hash: name }; lenient because the table holds many unrelated categories. */
export function parseCategoryNames(value: unknown): Record<string, string> {
  if (!isRecord(value)) throw new Error('Expected item category definition table')
  const names: Record<string, string> = {}
  for (const [hash, entry] of Object.entries(value)) {
    if (isRecord(entry) && isRecord(entry.displayProperties) && typeof entry.displayProperties.name === 'string' &&
      entry.displayProperties.name.trim()) names[hash] = entry.displayProperties.name.trim()
  }
  return names
}

export function parsePairings(value: unknown): Record<string, number> {
  if (!isRecord(value)) throw new Error('Expected DIM base-to-enhanced hash map')
  const pairs: Record<string, number> = {}
  for (const [base, enhanced] of Object.entries(value)) {
    if (!/^\d+$/.test(base) || Number(base) <= 0 || Number(base) > 0xffffffff ||
      typeof enhanced !== 'number' || !Number.isInteger(enhanced) || enhanced <= 0 || enhanced > 0xffffffff ||
      enhanced === Number(base)) {
      throw new Error(`Invalid DIM pairing ${base}: ${String(enhanced)}`)
    }
    pairs[base] = enhanced
  }
  return pairs
}

export async function fetchSupplemental() {
  const metadata = await fetchJson('https://www.bungie.net/Platform/Destiny2/Manifest/')
  if (!isRecord(metadata) || !isRecord(metadata.Response) ||
    !isRecord(metadata.Response.jsonWorldComponentContentPaths) ||
    !isRecord(metadata.Response.jsonWorldComponentContentPaths.en) ||
    typeof metadata.Response.version !== 'string') throw new Error('Invalid Bungie manifest metadata')
  const allPaths = metadata.Response.jsonWorldComponentContentPaths
  const englishPaths = metadata.Response.jsonWorldComponentContentPaths.en
  const tableUrl = (languagePaths: Record<string, unknown>, name: string) => {
    const path = languagePaths[name]
    if (typeof path !== 'string' || !path.startsWith('/common/')) throw new Error(`Missing manifest table ${name}`)
    return `https://www.bungie.net${path}`
  }
  const table = async (name: string) => parseDefinitions(await fetchJson(tableUrl(englishPaths, name)))
  // Small per-language table (singular weapon type names). Labels are optional: a language that is not served, fails to
  // download or does not parse is omitted (consumers fall back to English) and reported; it never fails the run.
  const categoryNames = async () => {
    const results = await Promise.all(languages.map(async language => {
      try {
        const paths = allPaths[language]
        if (!isRecord(paths)) throw new Error('No manifest paths for this language')
        return { language, names: parseCategoryNames(await fetchJson(tableUrl(paths, 'DestinyItemCategoryDefinition'))) }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        console.warn(`v2: weapon type labels unavailable for ${language}: ${reason}`)
        return { language, reason }
      }
    }))
    const names: Record<string, Record<string, string>> = {}
    const failures: Record<string, string> = {}
    for (const result of results) {
      if (result.names) names[result.language] = result.names
      else failures[result.language] = result.reason ?? 'unknown'
    }
    return { names, failures }
  }
  const [sandboxPerk, trait, dim, { names: itemCategoryNames, failures: itemCategoryFailures }] = await Promise.all([
    table('DestinySandboxPerkDefinition'),
    table('DestinyTraitDefinition'),
    fetchJson(pairingUrl).then(parsePairings),
    categoryNames(),
  ])
  return { sandboxPerk, trait, dim, itemCategoryNames, itemCategoryFailures, version: metadata.Response.version }
}
