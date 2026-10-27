import { Category, Item } from './types.js'

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
        const owner = legacy?.appearsOn.find(value => typeof value === 'number')
        const item: Item = {
          hash,
          name: definition.displayProperties.name,
          icon: definition.displayProperties.icon,
          categoryId: id,
          inGameDescription: definition.displayProperties.description,
          definitionType: 'DestinyInventoryItemDefinition',
        }
        if (legacyType.endsWith(' Exotic') && typeof owner === 'number') item.itemHash = owner
        return item
      })
    },
  }
}
