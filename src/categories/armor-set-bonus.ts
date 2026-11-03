import { Category } from '../v2/types.js'

export default {
  id: 'armor-set-bonus', label: 'Armor Set Bonuses', group: 'Armor', order: 25,
  select(manifest) {
    return Object.values(manifest.equipableItemSet ?? {})
      .filter(set => !set.redacted && set.displayProperties.name.trim())
      .sort((a, b) => a.displayProperties.name.localeCompare(b.displayProperties.name) || a.hash - b.hash)
      .flatMap(set => [...set.setPerks].sort((a, b) => a.requiredSetCount - b.requiredSetCount).map(perk => {
        const definition = manifest.sandboxPerk[perk.sandboxPerkHash]
        if (!definition || definition.redacted || !definition.displayProperties.name.trim()) {
          throw new Error(`Missing set-bonus sandbox perk ${perk.sandboxPerkHash}`)
        }
        if (perk.requiredSetCount !== 2 && perk.requiredSetCount !== 4) throw new Error('Unsupported set piece count')
        return {
          hash: definition.hash, name: `${set.displayProperties.name} (${perk.requiredSetCount} pc): ${definition.displayProperties.name}`,
          categoryId: 'armor-set-bonus', definitionType: 'DestinySandboxPerkDefinition' as const,
          setHash: set.hash, setName: set.displayProperties.name, pieceCount: perk.requiredSetCount,
          icon: definition.displayProperties.icon ?? set.displayProperties.icon ?? '',
          inGameDescription: definition.displayProperties.description,
        }
      }))
  },
} satisfies Category
