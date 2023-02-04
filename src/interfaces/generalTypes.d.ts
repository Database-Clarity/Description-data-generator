import { InventoryItem } from '@icemourne/tool-box'

export type PerkTypes =
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
   | 'Weapon Trait Frame'
   | 'Weapon Trait Frame Exotic'
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

export interface BasePerk {
   name: string
   hash: number
   type: PerkTypes
   perk: InventoryItem
   item?: InventoryItem
}

export interface BasePerks {
   name: string
   hash: number
   itemName?: string
   itemHash?: number
   description: {
      en: {
         main: string
         secondary: string
      }
   }
   type: PerkTypes
   linking?: {
      weaponPerkExotic?: number
      weaponFrameExotic?: number
      weaponCatalystExotic?: number
      weaponPerkEnhanced?: number
   }
   importStatsFrom?: number
}
