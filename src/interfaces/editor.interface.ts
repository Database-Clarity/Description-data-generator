import { InventoryItem } from './inventoryItem.interface'

export type PerkTypes =
   | 'Armor Perk Exotic'
   | 'Weapon Perk Exotic'
   | 'Weapon Frame Exotic'
   | 'Weapon Catalyst Exotic'
   // ---------
   | 'Weapon Perk'
   | 'Weapon Perk Enhanced'
   | 'Weapon Origin Trait'
   | 'Weapon Frame'
   // ---------
   | 'Subclass Fragment'
   | 'Subclass Aspect'
   | 'Subclass Super'
   | 'Subclass Grenade'
   | 'Subclass Melee'
   | 'Subclass Class'
   | 'Subclass Movement'
   // ---------
   | 'Armor Mod General'
   | 'Armor Mod Combat'
   | 'Armor Mod Activity'
   | 'Armor Mod Seasonal'
   | 'Weapon Mod'
   | 'Ghost Mod'

export interface BasePerk {
   name: string
   hash: number
   type: PerkTypes
   perk: InventoryItem
   item?: InventoryItem
}

export interface BasePerkassas {
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
