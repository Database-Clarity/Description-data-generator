import { PerkTypes } from '@icemourne/description-converter'
import { InventoryItem, InventoryItems, PlugSets } from '@icemourne/tool-box'

import { PerkData } from '../main.js'
import { SocketCategoryEnums } from '../utils/enums.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

export const armorMods = (
   inventoryItems: InventoryItems,
   plugSets: PlugSets,
   inventoryItemLegendaryArmor: InventoryItem[]
) => {
   const data: { [key: string]: PerkData } = {}

   const addData = (armor: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
      const armorType = armor.itemTypeDisplayName
      if (armorType === undefined) return

      if (data[perk.hash] !== undefined) {
         data[perk.hash].appearsOn.add(armorType)
         return
      }

      data[perk.hash] = {
         appearsOn: new Set([armorType]),
         name: perk.displayProperties.name,
         hash: Number(perk.hash),
         type
      }
   }

   inventoryItemLegendaryArmor.forEach((armor) => {
      const armorSockets = armor.sockets
      if (armorSockets === undefined) return

      const modSocketCategory = armorSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.armorMods
      )

      modSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const modsArr = getAllFromSocket(inventoryItems, plugSets, armorSockets.socketEntries[socketIndex])

         modsArr.forEach((modHash) => {
            const mod = inventoryItems[modHash]

            if (mod?.itemTypeDisplayName?.match(/(General|Helmet|Arms|Chest|Leg) Armor Mod|Class Item Mod/)) {
               addData(armor, mod, 'Armor Mod General')
               return
            }
            if (mod?.itemTypeDisplayName?.match(/(Elemental Well|Charged with Light|Warmind Cell) Mod/)) {
               addData(armor, mod, 'Armor Mod Combat')
               return
            }
            if (mod?.itemTypeDisplayName?.match(/ Raid Mod$|Nightmare Mod|King's Fall Mod|Vault of Glass Armor Mod/)) {
               addData(armor, mod, 'Armor Mod Activity')
               return
            }
         })
      })
   })

   return data
}
