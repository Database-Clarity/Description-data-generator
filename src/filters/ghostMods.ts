import { PerkTypes } from '@icemourne/description-converter'
import { InventoryItem, InventoryItems, PlugSets } from '@icemourne/tool-box'

import { PerkData } from '../main.js'
import { SocketCategoryEnums } from '../utils/enums.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

export const ghostMods = (
   inventoryItems: InventoryItems,
   plugSets: PlugSets,
   inventoryItemGhost: InventoryItem[]
) => {
   const data: { [key: string]: PerkData } = {}

   const addData = (armor: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
      const ghostType = armor.itemTypeDisplayName
      if (ghostType === undefined) return

      if (data[perk.hash] !== undefined) {
         data[perk.hash].appearsOn.add(ghostType)
         return
      }

      data[perk.hash] = {
         appearsOn: new Set([ghostType]),
         name: perk.displayProperties.name,
         hash: Number(perk.hash),
         type
      }
   }

   inventoryItemGhost.forEach((ghost) => {
      const ghostSockets = ghost.sockets
      if (ghostSockets === undefined) return

      const modSocketCategory = ghostSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.ghostMods
      )

      modSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const modsArr = getAllFromSocket(inventoryItems, plugSets, ghostSockets.socketEntries[socketIndex])

         modsArr.forEach((modHash) => {
            const mod = inventoryItems[modHash]
            if (mod === undefined) return

            if (mod?.itemTypeDisplayName?.match(/ Ghost Mod/)) {
               addData(ghost, mod, 'Ghost Mod')
               return
            }
         })
      })
   })

   return data
}
