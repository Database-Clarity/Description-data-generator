import { Category } from '../v2/types.js'

const category: Category = {
  id: 'verbs', label: 'Subclass Verbs and Keywords', group: 'Subclasses', order: 370,
  select: manifest => Object.values(manifest.trait)
    .filter(trait => trait.displayHint === 'keyword' && !trait.redacted &&
      Boolean(trait.displayProperties.name && trait.displayProperties.description))
    .map(trait => ({
      hash: trait.hash,
      name: trait.displayProperties.name,
      icon: trait.displayProperties.icon,
      categoryId: 'verbs',
      inGameDescription: trait.displayProperties.description,
      definitionType: 'DestinyTraitDefinition',
    })),
}
export default category
