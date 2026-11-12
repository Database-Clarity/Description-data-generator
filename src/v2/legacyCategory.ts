import { Category, Item } from './types.js'
import { InventoryItems } from '@icemourne/tool-box'

/** Prefer a current exotic armor owner; preserve the legacy rule for other perk types. */
export function legacyOwner(type: string, appearsOn: readonly (string | number)[], inventory: InventoryItems = {}): number | undefined {
  const first = appearsOn[0]
  if (typeof first !== 'number') return undefined
  if (type === 'Armor Trait Exotic' && appearsOn.length > 1) {
    const current = appearsOn.find((hash): hash is number => typeof hash === 'number' &&
      !!inventory[hash] && !inventory[hash].redacted && !!inventory[hash].collectibleHash)
    return current ?? first
  }
  return type === 'Armor Trait Exotic' || (type.endsWith(' Exotic') && appearsOn.length === 1) ? first : undefined
}

export function legacyCategory(id: string, legacyType: NonNullable<Category['legacyType']>, group: string, order: number): Category {
  const label = legacyType
  return {
    id, label, group, order, legacyType,
    select(manifest) {
      const hashes = new Set([
        ...Object.values(manifest.legacy).filter(item => item.type === legacyType).map(item => item.hash),
        ...Object.entries(manifest.extraTypes).filter(([, type]) => type === legacyType).map(([hash]) => Number(hash)),
      ])
      return [...hashes].sort((a, b) => a - b).map(hash => {
        const definition = manifest.inventoryItem[hash]
        if (!definition) throw new Error(`Missing inventory definition ${hash} for ${id}`)
        const legacy = manifest.legacy[hash]
        const owner = legacy ? legacyOwner(legacy.type, legacy.appearsOn, manifest.inventoryItem) : undefined
        const item: Item = {
          hash,
          name: definition.displayProperties.name,
          icon: definition.displayProperties.icon,
          categoryId: id,
          inGameDescription: definition.displayProperties.description,
          definitionType: 'DestinyInventoryItemDefinition',
        }
        if (owner !== undefined) {
          const holder = manifest.inventoryItem[owner]
          if (!holder) throw new Error(`Missing inventory definition ${owner} (owner of ${hash}) for ${id}`)
          item.itemHash = owner
          item.itemName = holder.displayProperties.name
        }
        if (legacy && legacy.type.endsWith(' Exotic')) {
          const owners = [...new Set(legacy.appearsOn.filter((value): value is number => typeof value === 'number'))]
          if (owners.length >= 2) {
            item.owners = owners
            const names: Record<string, string> = {}
            for (const ownerHash of owners) {
              const name = manifest.inventoryItem[ownerHash]?.displayProperties.name
              if (name?.trim()) names[ownerHash] = name
            }
            if (Object.keys(names).length) item.ownerNames = names
          }
        }
        return item
      })
    },
  }
}
