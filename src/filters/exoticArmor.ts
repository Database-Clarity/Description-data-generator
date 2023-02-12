import { PerkTypes } from '@icemourne/description-converter'
import { InventoryItem, InventoryItems, PlugSets } from '@icemourne/tool-box'

import { PerkData } from '../main.js'
import { SocketCategoryEnums } from '../utils/enums.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

export const exoticArmors = (
   inventoryItems: InventoryItems,
   plugSets: PlugSets,
   inventoryItemExoticArmor: InventoryItem[]
) => {
   const data: { [key: string]: PerkData } = {}

   const addData = (armor: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
      const armorHash = armor.hash

      if (data[perk.hash] !== undefined) {
         data[perk.hash].appearsOn.add(armorHash)
         return
      }

      data[perk.hash] = {
         appearsOn: new Set([armorHash]),
         name: perk.displayProperties.name,
         hash: Number(perk.hash),
         type
      }
   }

   inventoryItemExoticArmor.forEach((armor) => {
      const armorSockets = armor.sockets
      if (armorSockets === undefined) return

      const perkSocketCategory = armorSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.armorPerks
      )
      const modSocketCategory = armorSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.armorMods
      )

      perkSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const perkArr = getAllFromSocket(inventoryItems, plugSets, armorSockets.socketEntries[socketIndex])

         perkArr.forEach((perkHash) => {
            const perk = inventoryItems[perkHash]

            if (perk.itemTypeDisplayName === 'Intrinsic' || perk.itemTypeDisplayName === 'Aeon Cult Mod') {
               addData(armor, perk, 'Armor Trait Exotic')
               return
            }
         })
      })

      modSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const perkArr = getAllFromSocket(inventoryItems, plugSets, armorSockets.socketEntries[socketIndex])

         perkArr.forEach((perkHash) => {
            const perk = inventoryItems[perkHash]

            if (perk.itemTypeDisplayName === 'Intrinsic' || perk.itemTypeDisplayName === 'Aeon Cult Mod') {
               addData(armor, perk, 'Armor Trait Exotic')
               return
            }
         })
      })
   })

   return data
}
