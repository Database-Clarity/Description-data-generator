import { DisplayDefinition } from './types.js'

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
  const paths = metadata.Response.jsonWorldComponentContentPaths.en
  const table = async (name: string) => {
    const path = paths[name]
    if (typeof path !== 'string' || !path.startsWith('/common/')) throw new Error(`Missing manifest table ${name}`)
    return parseDefinitions(await fetchJson(`https://www.bungie.net${path}`))
  }
  const [sandboxPerk, trait, dim] = await Promise.all([
    table('DestinySandboxPerkDefinition'),
    table('DestinyTraitDefinition'),
    fetchJson(pairingUrl).then(parsePairings),
  ])
  return { sandboxPerk, trait, dim, version: metadata.Response.version }
}
