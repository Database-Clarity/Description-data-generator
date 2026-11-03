import { InventoryItem, InventoryItems, PlugSets } from '@icemourne/tool-box'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

function family(item: InventoryItem): string {
  return (item.itemTypeDisplayName ?? '').replace(/^Enhanced /, '')
}

export function isEnhanced(item: InventoryItem, fallback: ReadonlySet<number> = new Set()): boolean {
  return Boolean(item.plug && item.inventory.tierType !== 6 &&
    (/^Enhanced /.test(item.itemTypeDisplayName ?? '') || fallback.has(item.hash)))
}

/** Bungie's notification style is a fallback only when a matching non-enhanced base exists. */
export function enhancedFallbacks(inventory: InventoryItems): Set<number> {
  const marker = (item: InventoryItem) => item.tooltipNotifications?.some(
    notification => notification.displayStyle === 'ui_display_style_enhanced_perk')
  const key = (item: InventoryItem) => `${item.plug?.plugCategoryHash}:${item.displayProperties.name}`
  const items = Object.values(inventory).filter(item => item.plug && !item.redacted &&
    item.inventory.tierType !== 6 && item.displayProperties.name)
  const bases = new Set(items.filter(item => !isEnhanced(item) && !marker(item)).map(key))
  return new Set(items.filter(item => !isEnhanced(item) && marker(item) && bases.has(key(item))).map(item => item.hash))
}

export function derivePairings(inventory: InventoryItems, plugSets: PlugSets, dim: Record<string, number>, baseGroups?: ReadonlyMap<number, number>) {
  const fallback = enhancedFallbacks(inventory)
  const enhanced = (item: InventoryItem) => isEnhanced(item, fallback)
  const contexts = new Map<number, Set<string>>()
  const exotic = new Set<number>()
  const addContext = (hash: number, context: string) => {
    const values = contexts.get(hash) ?? new Set<string>()
    values.add(context)
    contexts.set(hash, values)
  }
  for (const set of Object.values(plugSets)) {
    for (const plug of set.reusablePlugItems) addContext(plug.plugItemHash, `set:${set.hash}`)
  }
  for (const item of Object.values(inventory)) {
    if (item.itemType !== 3) continue
    item.sockets?.socketEntries.forEach((socket, index) => {
      for (const hash of getAllFromSocket(inventory, plugSets, socket)) {
        addContext(hash, `socket:${item.hash}:${index}`)
        if (item.inventory.tierType === 6) exotic.add(hash)
      }
    })
  }
  const sharedContext = (a: number, b: number) =>
    [...(contexts.get(a) ?? [])].some(context => contexts.get(b)?.has(context))
  const items = Object.values(inventory).filter(item => item.plug && item.displayProperties.name && !item.redacted)
  const candidates = items.filter(enhanced)
  const normals = new Map<string, InventoryItem[]>()
  const key = (item: InventoryItem) => `${family(item)}:${item.plug?.plugCategoryHash}:${item.displayProperties.name}`
  for (const item of items.filter(item => !enhanced(item) && item.inventory.tierType !== 6)) {
    const list = normals.get(key(item)) ?? []
    list.push(item)
    normals.set(key(item), list)
  }
  const manifestPairs: Record<string, number> = {}
  const unresolved: { enhancedHash: number; candidates: number[] }[] = []
  for (const enhanced of candidates) {
    const matches = normals.get(key(enhanced)) ?? []
    const contextual = matches.filter(base => sharedContext(base.hash, enhanced.hash))
    const eligible = contextual.length ? contextual : matches
    const scoped = baseGroups ? eligible.filter(base => baseGroups.has(base.hash)) : []
    const targets = new Set(scoped.map(base => baseGroups!.get(base.hash)!))
    if (eligible.length === 1) manifestPairs[enhanced.hash] = eligible[0].hash
    // Several candidates are safe only when the selected, in-scope bases share
    // one accepted Kind S or generated legendary frame canonical.
    else if (scoped.length && targets.size === 1 &&
      (family(enhanced) !== 'Intrinsic' || scoped.length === eligible.length)) manifestPairs[enhanced.hash] = [...targets][0]
    else unresolved.push({ enhancedHash: enhanced.hash, candidates: eligible.map(item => item.hash) })
  }
  const byEnhanced = { ...manifestPairs }
  const disagreements: {
    manifestBaseHash: number; manifestEnhancedHash: number; dimBaseHash: number; dimEnhancedHash: number
  }[] = []
  const missingDim: { baseHash: number; enhancedHash: number }[] = []
  const dimOwners = new Map<number, number>()
  for (const [baseKey, enhancedHash] of Object.entries(dim)) {
    const baseHash = Number(baseKey)
    if (!inventory[baseHash] || !inventory[enhancedHash]) {
      missingDim.push({ baseHash, enhancedHash })
      continue
    }
    if (inventory[baseHash].inventory.tierType === 6 || inventory[enhancedHash].inventory.tierType === 6) continue
    const previousOwner = dimOwners.get(enhancedHash)
    if (previousOwner !== undefined && previousOwner !== baseHash) {
      throw new Error(`Conflicting DIM owners ${previousOwner}, ${baseHash} for ${enhancedHash}`)
    }
    dimOwners.set(enhancedHash, baseHash)
    for (const [manifestEnhanced, manifestBase] of Object.entries(manifestPairs)) {
      const sameEnhancedGroup = enhanced(inventory[manifestEnhanced]) && enhanced(inventory[enhancedHash]) &&
        key(inventory[manifestEnhanced]) === key(inventory[enhancedHash])
      if ((manifestBase === baseHash && Number(manifestEnhanced) !== enhancedHash && !sameEnhancedGroup) ||
        (Number(manifestEnhanced) === enhancedHash && manifestBase !== baseHash)) {
        disagreements.push({
          manifestBaseHash: manifestBase, manifestEnhancedHash: Number(manifestEnhanced),
          dimBaseHash: baseHash, dimEnhancedHash: enhancedHash,
        })
        delete byEnhanced[manifestEnhanced]
      }
    }
  }
  for (const [enhancedHash, baseHash] of dimOwners) byEnhanced[enhancedHash] = baseHash
  for (const disagreement of disagreements) console.warn('v2 pairing disagreement; DIM preferred:', disagreement)
  if (missingDim.length) console.warn(`v2: ${missingDim.length} DIM pairs reference absent manifest items`)
  const unresolvedAfterDim = unresolved.filter(item => byEnhanced[item.enhancedHash] === undefined)
  if (unresolvedAfterDim.length) console.warn(`v2: ${unresolvedAfterDim.length} enhanced items have no unambiguous base; see coverage.json`)
  return {
    byEnhanced, exotic, fallback,
    report: {
      enhancedCandidates: candidates.length,
      manifestPairs: Object.keys(manifestPairs).length,
      dimPairs: Object.keys(dim).length,
      paired: Object.keys(byEnhanced).length,
      disagreements, missingDim, unresolved: unresolvedAfterDim,
    },
  }
}

export function weaponCategory(item: InventoryItem, exotic: boolean, fallback: ReadonlySet<number> = new Set()): string {
  const suffix = exotic ? ' Exotic' : ''
  const enhanced = !exotic && isEnhanced(item, fallback) ? ' Enhanced' : ''
  if (family(item) === 'Intrinsic') return `Weapon Frame${enhanced}${suffix}`
  if (family(item) === 'Trait') return `Weapon Trait${enhanced}${suffix}`
  if (family(item) === 'Origin Trait') return `Weapon Trait Origin${enhanced}${suffix}`
  if (family(item) === 'Weapon Mod' && isEnhanced(item, fallback)) return `Weapon Mod${enhanced}${suffix}`
  return `Weapon Perk${enhanced}${suffix}`
}
