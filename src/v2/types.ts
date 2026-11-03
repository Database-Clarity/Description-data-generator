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
  equipableItemSet?: Record<string, DisplayDefinition & { setPerks: { requiredSetCount: number; sandboxPerkHash: number }[] }>
  extraTypes: Record<string, string>

}

export interface Item {
  hash: number
  name: string
  icon?: string
  categoryId: string
  itemHash?: number
  itemName?: string
  owners?: number[]
  ownerNames?: Record<string, string>
  enhancedHash?: number
  enhancedHashes?: number[]
  plugCategoryHash?: number
  dimBaseHash?: number
  baseHash?: number
  sandboxPerkHashes?: number[]
  inGameDescription: string
  setHash?: number
  setName?: string
  pieceCount?: 2 | 4
  hiddenFromEditor?: boolean
  definitionType: 'DestinyInventoryItemDefinition' | 'DestinyTraitDefinition' | 'DestinySandboxPerkDefinition'
}

export interface Category {
  id: string
  label: string
  group: string
  order: number
  legacyType?: Exclude<PerkTypes, 'none'> | 'Weapon Trait Origin Enhanced' | 'Weapon Trait Origin Enhanced Exotic' | 'Weapon Perk Enhanced' | 'Weapon Perk Enhanced Exotic' | 'Weapon Mod Enhanced' | 'Weapon Mod Enhanced Exotic'
  select(manifest: Manifest): Item[]
}
