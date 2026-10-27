import { Category, Item } from './types.js'

export function legacyCategory(id: string, label: string, group: string, order: number): Category {
  return {
    id, label, group, order,
    select(manifest) {
      const hashes = new Set([
        ...Object.values(manifest.legacy).filter(item => item.type === label).map(item => item.hash),
        ...Object.entries(manifest.extraTypes).filter(([, type]) => type === label).map(([hash]) => Number(hash)),
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
        if (label.endsWith(' Exotic') && typeof owner === 'number') item.itemHash = owner
        return item
      })
    },
  }
}
