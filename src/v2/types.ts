import { InventoryItems, PlugSets } from '@icemourne/tool-box'
import { PerkTypes } from '@icemourne/description-converter'
import { RawDataList } from '../rawData.js'

export interface DisplayDefinition {
  hash: number
  displayProperties: { name: string; description: string; icon?: string }
  displayHint?: string
  redacted?: boolean
}

export interface Manifest {
  inventoryItem: InventoryItems
  plugSet: PlugSets
  legacy: RawDataList
  sandboxPerk: Record<string, DisplayDefinition>
  trait: Record<string, DisplayDefinition>
  extraTypes: Record<string, string>
  /** language -> item category hash -> singular name (DestinyItemCategoryDefinition) */
  itemCategoryNames?: Record<string, Record<string, string>>
}

export interface Item {
  hash: number
  name: string
  icon?: string
  categoryId: string
  itemHash?: number
  itemName?: string
  owners?: number[]
  weaponTypes?: string[]
  enhancedHash?: number
  enhancedHashes?: number[]
  baseHash?: number
  sandboxPerkHashes?: number[]
  inGameDescription: string
  definitionType: 'DestinyInventoryItemDefinition' | 'DestinyTraitDefinition'
}

export interface Category {
  id: string
  label: string
  group: string
  order: number
  legacyType?: Exclude<PerkTypes, 'none'>
  select(manifest: Manifest): Item[]
}
