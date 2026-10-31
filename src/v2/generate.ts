import fs from 'fs'
import { categories } from '../categories/index.js'
import { Manifest, Item } from './types.js'
import { derivePairings, isEnhanced, weaponCategory } from './pairing.js'
import { associateSandbox } from './sandbox.js'
import { pairingUrl } from './fetch.js'
import { groupFrames, Alias } from './frames.js'
import { buildWeaponTypeLabels } from './weaponTypes.js'

export function generateV2(manifest: Manifest, dim: Record<string, number>, version: string) {
  const pairing = derivePairings(manifest.inventoryItem, manifest.plugSet, dim)
  const selected = new Set<number>([
    ...Object.keys(manifest.legacy).map(Number),
    ...Object.entries(pairing.byEnhanced).flatMap(([enhanced, base]) => [Number(enhanced), base]),
    ...Object.values(manifest.inventoryItem).filter(item => !item.redacted && isEnhanced(item)).map(item => item.hash),
  ])
  const extraTypes: Record<string, string> = {}
  for (const hash of selected) {
    if (manifest.legacy[hash]) continue
    const item = manifest.inventoryItem[hash]
    if (!item) throw new Error(`Missing selected inventory item ${hash}`)
    extraTypes[hash] = weaponCategory(item, pairing.exotic.has(hash) || item.inventory.tierType === 6)
  }
  const facts: Manifest = { ...manifest, extraTypes }
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
      items[item.hash] = item
    }
    const legacy = Object.values(manifest.legacy).filter(item => item.type === category.legacyType)
    for (const item of legacy) {
      if (items[item.hash]?.categoryId !== category.id) throw new Error(`Lost legacy entry ${item.hash}`)
    }
    coverage[category.id] = { legacy: legacy.length, v2: entries.length }
  }
  for (const legacy of Object.values(manifest.legacy)) {
    if (!items[legacy.hash]) throw new Error(`Unregistered legacy type ${legacy.type}: ${legacy.hash}`)
  }
  for (const [enhancedKey, baseHash] of Object.entries(pairing.byEnhanced)) {
    const enhancedHash = Number(enhancedKey)
    if (!items[enhancedHash] || !items[baseHash]) throw new Error(`Missing pairing endpoint ${baseHash}/${enhancedHash}`)
    items[enhancedHash].baseHash = baseHash
    const base = items[baseHash]
    if (!items[enhancedHash].weaponTypes && base.weaponTypes) items[enhancedHash].weaponTypes = [...base.weaponTypes]
    base.enhancedHashes = [...(base.enhancedHashes ?? []), enhancedHash].sort((a, b) => a - b)
    base.enhancedHash = base.enhancedHashes.includes(dim[baseHash]) ? dim[baseHash] : base.enhancedHashes[0]
  }
  const sandbox = associateSandbox(items, manifest.inventoryItem, manifest.sandboxPerk)
  const frames = groupFrames(items)
  const aliases: Record<string, Alias> = { ...frames.aliases }
  for (const [hash, owner] of Object.entries(sandbox.aliases)) {
    if (Number(hash) === owner) continue
    if (aliases[hash]) throw new Error(`Duplicate alias hash ${hash}`)
    aliases[hash] = { to: frames.aliases[owner]?.to ?? owner, kind: 'sandbox' }
  }
  const weaponTypeLabels = buildWeaponTypeLabels(manifest.itemCategoryNames ?? {})
  if (weaponTypeLabels.unmatched.length) {
    console.warn(`v2: no item category found for weapon types: ${weaponTypeLabels.unmatched.join(', ')}`)
  }
  fs.mkdirSync('./templates/v2', { recursive: true })
  const write = (name: string, value: unknown) =>
    fs.writeFileSync(`./templates/v2/${name}.json`, JSON.stringify(value, undefined, 1) + '\n')
  write('categories', categories.map(({ id, label, group, order, legacyType }) => ({
    id, label, group, order, legacyType,
  })))
  write('items', items)
  write('sandboxAliases', sandbox.aliases)
  write('weaponTypes', weaponTypeLabels.labels)
  write('aliases', aliases)
  write('coverage', {
    manifestVersion: version,
    pairingSource: pairingUrl,
    categories: coverage,
    pairing: pairing.report,
    sandbox: sandbox.report,
    frames: frames.report,
    weaponTypeLabels: {
      languages: Object.keys(manifest.itemCategoryNames ?? {}).sort(),
      unmatched: weaponTypeLabels.unmatched,
    },
  })
  console.log('v2 category coverage (legacy -> v2):', coverage)
  console.log(`v2: ${Object.keys(items).length} items, ${pairing.report.paired} enhanced pairs, ${sandbox.report.aliases} sandbox aliases`)
}
