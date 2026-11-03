import fs from 'fs'
import { aliasProposals } from './proposals.js'
import { categories } from '../categories/index.js'
import { Manifest, Item } from './types.js'
import { derivePairings, isEnhanced, weaponCategory } from './pairing.js'
import { associateSandbox } from './sandbox.js'
import { pairingUrl } from './fetch.js'
import { groupFrames, Alias } from './frames.js'

export function generateV2(manifest: Manifest, dim: Record<string, number>, version: string) {
  const pairing = derivePairings(manifest.inventoryItem, manifest.plugSet, dim)
  const selected = new Set<number>([
    ...Object.keys(manifest.legacy).map(Number),
    ...Object.entries(pairing.byEnhanced).flatMap(([enhanced, base]) => [Number(enhanced), base]),
    ...Object.values(manifest.inventoryItem).filter(item => !item.redacted && isEnhanced(item, pairing.fallback)).map(item => item.hash),
  ])
  const legacy = Object.fromEntries(Object.entries(manifest.legacy).map(([hash, entry]) => {
    const definition = manifest.inventoryItem[hash]
    return [hash, definition && isEnhanced(definition, pairing.fallback) && !entry.type.endsWith(' Exotic')
      ? { ...entry, type: weaponCategory(definition, entry.type.endsWith(' Exotic'), pairing.fallback) as typeof entry.type }
      : entry]
  }))
  const extraTypes: Record<string, string> = {}
  for (const hash of selected) {
    if (manifest.legacy[hash]) continue
    const item = manifest.inventoryItem[hash]
    if (!item) throw new Error(`Missing selected inventory item ${hash}`)
    extraTypes[hash] = weaponCategory(item, pairing.exotic.has(hash) || item.inventory.tierType === 6, pairing.fallback)
  }
  const facts: Manifest = { ...manifest, legacy, extraTypes }
  const items: Record<string, Item> = {}
  const coverage: Record<string, { legacy: number; v2: number }> = {}
  const ids = new Set<string>()
  for (const category of categories) {
    if (ids.has(category.id)) throw new Error(`Duplicate category ID ${category.id}`)
    ids.add(category.id)
    const entries = category.select(facts)
    for (const item of entries) {
      if (items[item.hash]) throw new Error(`Duplicate tooltip hash ${item.hash}`)
      if (item.categoryId !== category.id) throw new Error(`Wrong category on ${item.hash}`)
      const definition = item.definitionType === 'DestinyInventoryItemDefinition'
        ? manifest.inventoryItem[item.hash] : undefined
      if (definition?.plug) item.plugCategoryHash = definition.plug.plugCategoryHash
      items[item.hash] = item
    }
    const legacyEntries = Object.values(legacy).filter(item => entries.some(entry => entry.hash === item.hash))
    for (const item of legacyEntries) {
      if (items[item.hash]?.categoryId !== category.id) throw new Error(`Lost legacy entry ${item.hash}`)
    }
    coverage[category.id] = { legacy: legacyEntries.length, v2: entries.length }
  }
  for (const legacy of Object.values(manifest.legacy)) {
    if (!items[legacy.hash]) throw new Error(`Unregistered legacy type ${legacy.type}: ${legacy.hash}`)
  }
  for (const [enhancedKey, baseHash] of Object.entries(pairing.byEnhanced)) {
    const enhancedHash = Number(enhancedKey)
    if (!items[enhancedHash] || !items[baseHash]) throw new Error(`Missing pairing endpoint ${baseHash}/${enhancedHash}`)
    if (items[enhancedHash].categoryId.endsWith('-exotic') || items[baseHash].categoryId.endsWith('-exotic')) continue
    if (!isEnhanced(manifest.inventoryItem[enhancedHash], pairing.fallback)) {
      items[enhancedHash].dimBaseHash = baseHash
      continue
    }
    items[enhancedHash].baseHash = baseHash
    const base = items[baseHash]
    base.enhancedHashes = [...(base.enhancedHashes ?? []), enhancedHash].sort((a, b) => a - b)
    base.enhancedHash = base.enhancedHashes.includes(dim[baseHash]) ? dim[baseHash] : base.enhancedHashes[0]
  }
  const realEnhancedPairs = Object.values(items).filter(item => item.baseHash !== undefined).length
  const nonEnhancedDimPairs = Object.values(items).filter(item => item.dimBaseHash !== undefined).length
  const sandbox = associateSandbox(items, manifest.inventoryItem, manifest.sandboxPerk)
  const frames = groupFrames(items)
  const aliases: Record<string, Alias> = { ...frames.aliases }
  for (const [hash, owner] of Object.entries(sandbox.aliases)) {
    if (Number(hash) === owner) continue
    if (aliases[hash]) throw new Error(`Duplicate alias hash ${hash}`)
    aliases[hash] = { to: frames.aliases[owner]?.to ?? owner, kind: 'sandbox' }
  }
  fs.mkdirSync('./templates/v2', { recursive: true })
  const write = (name: string, value: unknown) =>
    fs.writeFileSync(`./templates/v2/${name}.json`, JSON.stringify(value, undefined, 1) + '\n')
  write('aliasProposals', aliasProposals(items, manifest.inventoryItem, aliases, manifest.plugSet))
  write('categories', categories.map(({ id, label, group, order, legacyType }) => ({
    id, label, group, order, legacyType,
  })))
  write('items', items)
  write('sandboxAliases', sandbox.aliases)
  write('aliases', aliases)
  write('coverage', {
    manifestVersion: version,
    pairingSource: pairingUrl,
    categories: coverage,
    pairing: { ...pairing.report, inputPairs: pairing.report.paired, paired: realEnhancedPairs, nonEnhancedDimPairs },
    sandbox: sandbox.report,
    frames: frames.report,
  })
  console.log('v2 category coverage (legacy -> v2):', coverage)
  console.log(`v2: ${Object.keys(items).length} items, ${realEnhancedPairs} enhanced pairs, ${sandbox.report.aliases} sandbox aliases`)
}
