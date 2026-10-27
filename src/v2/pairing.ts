import { InventoryItem, InventoryItems, PlugSets } from '@icemourne/tool-box'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

function family(item: InventoryItem): string {
  return (item.itemTypeDisplayName ?? '').replace(/^Enhanced /, '')
}

function intrinsicUpgrade(item: InventoryItem): boolean {
  return item.itemTypeDisplayName === 'Intrinsic' && item.inventory.tierType === 6 &&
    / (II|III|IV)$/.test(item.displayProperties.name)
}

export function isEnhanced(item: InventoryItem): boolean {
  return Boolean(item.plug && (/^Enhanced /.test(item.itemTypeDisplayName ?? '') || intrinsicUpgrade(item)))
}

function baseName(item: InventoryItem): string {
  const name = item.displayProperties.name
  return item.itemTypeDisplayName === 'Intrinsic' && item.inventory.tierType === 6
    ? name.replace(/ (I|II|III|IV)$/, '')
    : name
}

export function derivePairings(inventory: InventoryItems, plugSets: PlugSets, dim: Record<string, number>) {
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
  const candidates = items.filter(isEnhanced)
  const normals = new Map<string, InventoryItem[]>()
  const key = (item: InventoryItem) => `${family(item)}:${item.plug?.plugCategoryHash}:${baseName(item)}`
  for (const item of items.filter(item => !isEnhanced(item))) {
    const list = normals.get(key(item)) ?? []
    list.push(item)
    normals.set(key(item), list)
  }
  const manifestPairs: Record<string, number> = {}
  const unresolved: { enhancedHash: number; candidates: number[] }[] = []
  for (const enhanced of candidates) {
    const matches = normals.get(key(enhanced)) ?? []
    const contextual = matches.filter(base => sharedContext(base.hash, enhanced.hash))
    // Numbered exotic intrinsics require socket evidence, not just a similar name.
    const eligible = contextual.length ? contextual : intrinsicUpgrade(enhanced) ? [] : matches
    if (eligible.length === 1) manifestPairs[enhanced.hash] = eligible[0].hash
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
    const previousOwner = dimOwners.get(enhancedHash)
    if (previousOwner !== undefined && previousOwner !== baseHash) {
      throw new Error(`Conflicting DIM owners ${previousOwner}, ${baseHash} for ${enhancedHash}`)
    }
    dimOwners.set(enhancedHash, baseHash)
    for (const [manifestEnhanced, manifestBase] of Object.entries(manifestPairs)) {
      if ((manifestBase === baseHash && Number(manifestEnhanced) !== enhancedHash) ||
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
    byEnhanced, exotic,
    report: {
      enhancedCandidates: candidates.length,
      manifestPairs: Object.keys(manifestPairs).length,
      dimPairs: Object.keys(dim).length,
      paired: Object.keys(byEnhanced).length,
      disagreements, missingDim, unresolved: unresolvedAfterDim,
    },
  }
}

export function weaponCategory(item: InventoryItem, exotic: boolean): string {
  const suffix = exotic ? ' Exotic' : ''
  if (family(item) === 'Intrinsic') return `Weapon Frame${isEnhanced(item) ? ' Enhanced' : ''}${suffix}`
  if (family(item) === 'Trait') return `Weapon Trait${isEnhanced(item) ? ' Enhanced' : ''}${suffix}`
  if (family(item) === 'Origin Trait') return `Weapon Trait Origin${suffix}`
  return `Weapon Perk${suffix}`
}
