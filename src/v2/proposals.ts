import { InventoryItems, PlugSets } from '@icemourne/tool-box'
import { Item } from './types.js'
import { Alias } from './frames.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'
import { isEnhanced } from './pairing.js'

/** Manifest-only proposals. Clarity text and approval decisions never enter this function. */
export function aliasProposals(items: Record<string, Item>, inventory: InventoryItems, aliases: Record<string, Alias>, plugSets: PlugSets = {}) {
  const eligible = (item: Item) => /^(weapon-(perk|trait|mod)|armor-mod|subclass)-?/.test(item.categoryId) &&
    !aliases[item.hash] && Boolean(inventory[item.hash]?.plug)
  const enhanced = (item: Item) => isEnhanced(inventory[item.hash])
  const exotic = (item: Item) => item.categoryId.endsWith('-exotic')
  const name = (item: Item) => item.name.trim().toLowerCase()
  const key = (item: Item) => JSON.stringify([name(item), item.categoryId, enhanced(item), exotic(item),
    item.categoryId.startsWith('subclass-') ? null : inventory[item.hash].plug?.plugCategoryHash])
  const groups = new Map<string, Item[]>()
  for (const item of Object.values(items).filter(eligible).sort((a, b) => a.hash - b.hash)) {
    const list = groups.get(key(item)) ?? []
    list.push(item); groups.set(key(item), list)
  }
  const numbers = (text: string) => JSON.stringify(text.match(/[-+]?\d*\.?\d+%?/g) ?? [])
  const stats = (item: Item) => JSON.stringify([...(inventory[item.hash].investmentStats ?? [])]
    .sort((a, b) => a.statTypeHash - b.statTypeHash))
  const weaponOwners = new Map<number, Set<number>>()
  for (const weapon of Object.values(inventory)) {
    if (weapon.itemType !== 3) continue
    for (const socket of weapon.sockets?.socketEntries ?? []) {
      for (const hash of getAllFromSocket(inventory, plugSets, socket)) {
        const owners = weaponOwners.get(hash) ?? new Set<number>()
        owners.add(weapon.hash); weaponOwners.set(hash, owners)
      }
    }
  }
  const make = (kind: 'S' | 'X', members: Item[], canonical = members[0].hash) => {
    const first = items[canonical]
    const descriptions = members.map(i => i.inGameDescription)
    const owners = (item: Item) => {
      const hashes = new Set([...(item.owners ?? []), ...(item.itemHash === undefined ? [] : [item.itemHash])])
      for (const hash of weaponOwners.get(item.hash) ?? []) hashes.add(hash)
      return [...hashes].sort((a, b) => a - b).map(hash => ({
        hash, name: inventory[hash]?.displayProperties.name ?? item.ownerNames?.[hash] ?? '',
      }))
    }
    return {
      kind, canonical, members: members.map(i => i.hash),
      basis: { name: first.name, categoryId: first.categoryId, isEnhanced: enhanced(first), exotic: exotic(first),
        ...(first.categoryId.startsWith('subclass-') ? {} : { plugCategoryHash: inventory[first.hash].plug?.plugCategoryHash }) },
      descriptionDiff: new Set(descriptions).size === 1 ? 'identical' :
        new Set(descriptions.map(numbers)).size === 1 ? 'wording' : 'numbers',
      statsDiff: new Set(members.map(stats)).size > 1,
      weapons: Object.fromEntries(members.map(i => [i.hash, owners(i)])),
    }
  }
  const proposals = [...groups.values()].filter(g => g.length > 1).map(g => make('S', g))
  for (const item of Object.values(items).filter(eligible)) {
    const base = item.baseHash === undefined ? undefined : items[item.baseHash]
    if (base && eligible(base) && !enhanced(item) && !enhanced(base) &&
        exotic(item) === exotic(base) && name(item) === name(base)) {
      proposals.push(make('X', [base, item], base.hash))
    }
  }
  const membership = new Map<number, number>()
  for (const p of proposals) for (const hash of p.members) membership.set(hash, p.canonical)
  const linked = proposals.map(p => {
    const targets = new Set(p.members.flatMap(h => items[h].enhancedHashes ?? [])
      .map(h => membership.get(h) ?? h))
    return { ...p, ...(targets.size === 1 ? { enhancedLink: [...targets][0] } : {}) }
  })
  return { version: 1, proposals: linked.sort((a, b) => a.canonical - b.canonical || a.kind.localeCompare(b.kind)) }
}
