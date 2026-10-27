import { InventoryItems } from '@icemourne/tool-box'
import { DisplayDefinition, Item } from './types.js'

export function associateSandbox(items: Record<string, Item>, inventory: InventoryItems,
  definitions: Record<string, DisplayDefinition>) {
  const owners = new Map<number, number[]>()
  const missingDefinitions = new Set<number>()
  for (const item of Object.values(items)) {
    if (item.definitionType !== 'DestinyInventoryItemDefinition') continue
    const hashes = [...new Set(inventory[item.hash].perks?.map(perk => perk.perkHash).filter(Boolean) ?? [])]
      .sort((a, b) => a - b)
    if (!hashes.length) continue
    item.sandboxPerkHashes = hashes
    for (const hash of hashes) {
      if (!definitions[hash]) {
        missingDefinitions.add(hash)
        continue
      }
      const list = owners.get(hash) ?? []
      list.push(item.hash)
      owners.set(hash, list)
    }
  }
  const aliases: Record<string, number> = {}
  const ambiguous: { sandboxPerkHash: number; itemHashes: number[]; selected: number }[] = []
  const rank = (hash: number) => inventory[hash].plug ? 0 : 1
  for (const [hash, candidates] of owners) {
    candidates.sort((a, b) => rank(a) - rank(b) || a - b)
    const owner = candidates[0]
    if (items[hash] && hash !== owner) throw new Error(`Sandbox alias ${hash} collides with an inventory/trait tooltip`)
    aliases[hash] = owner
    if (candidates.length > 1) ambiguous.push({ sandboxPerkHash: hash, itemHashes: candidates, selected: owner })
  }
  if (missingDefinitions.size) console.warn(`v2: ${missingDefinitions.size} referenced sandbox definitions missing; see coverage.json`)
  if (ambiguous.length) console.warn(`v2: ${ambiguous.length} shared sandbox hashes; deterministic alias owners recorded in coverage.json`)
  return {
    aliases,
    report: {
      aliases: Object.keys(aliases).length,
      inventoryItemsWithPerks: Object.values(inventory).filter(item => item.perks?.some(perk => perk.perkHash)).length,
      selectedItemsWithPerks: Object.values(items).filter(item => item.sandboxPerkHashes?.length).length,
      ambiguous,
      missingDefinitions: [...missingDefinitions],
    },
  }
}
