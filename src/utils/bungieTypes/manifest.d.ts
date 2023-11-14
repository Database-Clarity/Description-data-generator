import { InventoryItem } from './inventoryItem.js'
import { PlugSet } from './plugSet.js'
import { SocketType } from './socketType.js'
import { Stat } from './stat.js'

export type InventoryItems = {
  [key: string]: InventoryItem
}

export type InventoryItemsLite = {
  [key: string]: InventoryItemLite
}

export type PlugSets = {
  [key: string]: PlugSet
}

export type SocketTypes = {
  [key: string]: SocketType
}

export type Stats = {
  [key: string]: Stat
}

export type Content = {
  version: string
  inventoryItem?: InventoryItems
  inventoryItemLite?: InventoryItemsLite
  plugSet?: PlugSets
  socketType?: SocketTypes
  stat?: Stats
}

export type ContentPathKeys =
  | 'DestinyInventoryItemDefinition'
  | 'DestinyInventoryItemLiteDefinition'
  | 'DestinyPlugSetDefinition'
  | 'DestinySocketTypeDefinition'

type ContentLinks = {
  en: { [key in ContentPathKeys]: string }
  fr: { [key in ContentPathKeys]: string }
  es: { [key in ContentPathKeys]: string }
  'es-mx': { [key in ContentPathKeys]: string }
  de: { [key in ContentPathKeys]: string }
  it: { [key in ContentPathKeys]: string }
  ja: { [key in ContentPathKeys]: string }
  'pt-br': { [key in ContentPathKeys]: string }
  ru: { [key in ContentPathKeys]: string }
  pl: { [key in ContentPathKeys]: string }
  ko: { [key in ContentPathKeys]: string }
  'zh-cht': { [key in ContentPathKeys]: string }
  'zh-chs': { [key in ContentPathKeys]: string }
}

export type Manifest = {
  Response: {
    version: string
    jsonWorldComponentContentPaths: ContentLinks
  }
}

export type Language = keyof ContentLinks

type LivePerkTypes =
  | 'Armor Trait Exotic'
  | 'Armor Mod General'
  | 'Armor Mod Combat'
  | 'Armor Mod Activity'
  | 'Armor Mod Seasonal'
  // ---------
  | 'Weapon Perk'
  | 'Weapon Perk Exotic'
  // ---------
  | 'Weapon Trait'
  | 'Weapon Trait Exotic'
  | 'Weapon Trait Origin'
  | 'Weapon Trait Origin Exotic'
  | 'Weapon Trait Enhanced'
  | 'Weapon Trait Enhanced Exotic'
  // ---------
  | 'Weapon Frame'
  | 'Weapon Frame Exotic'
  | 'Weapon Frame Enhanced'
  | 'Weapon Frame Enhanced Exotic'
  // ---------
  | 'Weapon Catalyst Exotic'
  // ---------
  | 'Weapon Mod'
  // ---------
  | 'Subclass Fragment'
  | 'Subclass Aspect'
  | 'Subclass Super'
  | 'Subclass Grenade'
  | 'Subclass Melee'
  | 'Subclass Class'
  | 'Subclass Movement'
  // ---------
  | 'Ghost Mod'

export type PerkTypes = LivePerkTypes | 'none'
