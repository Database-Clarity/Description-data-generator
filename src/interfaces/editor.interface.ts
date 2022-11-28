import { InventoryItem } from './inventoryItem.interface'

export type PerkTypes =
   | 'armorExotic'
   | 'weaponPerkExotic'
   | 'weaponFrameExotic'
   | 'weaponCatalystExotic'
   //---------
   | 'weaponPerk'
   | 'weaponPerkEnhanced'
   | 'weaponOriginTrait'
   | 'weaponFrame'
   //---------
   | 'fragment'
   | 'aspect'
   | 'super'
   | 'grenade'
   | 'melee'
   | 'class'
   | 'movement'
   //---------
   | 'armorModGeneral'
   | 'armorModCombat'
   | 'armorModActivity'
   | 'weaponMod'
   | 'ghostMod'
   | 'artifactMod'

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
