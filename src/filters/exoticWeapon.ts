import { PerkTypes } from '@icemourne/description-converter'
import { InventoryItem, InventoryItems, PlugSets, SocketTypes } from '@icemourne/tool-box'

import { PerkData, PerkDataList } from '../main.js'
import { SocketCategoryEnums } from '../utils/enums.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'
import { lookForNewCatalyst } from '../utils/lookForNewCatalyst.js'

export const exoticsWeapons = (
   inventoryItems: InventoryItems,
   plugSets: PlugSets,
   inventoryItemWeapons: InventoryItem[],
   socketTypes: SocketTypes,
   legendaryWeaponsList: PerkDataList
) => {
   const data: { [key: string]: PerkData } = {}

   const addData = (weapon: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
      if (legendaryWeaponsList[perk.hash] !== undefined) return
      const weaponHash = weapon.hash

      if (data[perk.hash] !== undefined) {
         data[perk.hash].appearsOn.add(weaponHash)
         return
      }

      data[perk.hash] = {
         appearsOn: new Set([weaponHash]),
         name: perk.displayProperties.name,
         hash: Number(perk.hash),
         type
      }
   }

   inventoryItemWeapons.forEach((weapon) => {
      const weaponSockets = weapon.sockets
      if (weaponSockets === undefined) return

      const frameSocketCategory = weaponSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.weaponFrame
      )
      const perkSocketCategory = weaponSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.weaponPerks
      )
      const catalystSocketCategory = weaponSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.weaponMods
      )

      frameSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const frameArr = getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

         frameArr.forEach((frameHash) => {
            const frame = inventoryItems[frameHash]

            if (frame?.itemTypeDisplayName === 'Intrinsic') {
               addData(weapon, frame, 'Weapon Frame Exotic')
            }
         })
      })

      perkSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const perkArr = getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

         perkArr.forEach((perkHash) => {
            const perk = inventoryItems[perkHash]

            if (perk?.plug?.uiPlugLabel === 'masterwork') {
               addData(weapon, perk, 'Weapon Catalyst Exotic')
               return
            }

            switch (perk?.itemTypeDisplayName) {
               case 'Trait':
                  addData(weapon, perk, 'Weapon Trait Exotic')
                  break
               case 'Origin Trait':
                  addData(weapon, perk, 'Weapon Trait Origin Exotic')
                  break
               case 'Enhanced Trait':
                  addData(weapon, perk, 'Weapon Trait Enhanced Exotic')
                  break
               default:
                  addData(weapon, perk, 'Weapon Perk Exotic')
                  break
            }
         })
      })

      catalystSocketCategory?.socketIndexes.forEach((socketIndex) => {
         // Because of Bungie spaghetti code we have to check if exotic has replacement catalyst
         const socket = weaponSockets.socketEntries[socketIndex]

         const catalystArr =
            lookForNewCatalyst(socketTypes, socket.socketTypeHash) ||
            getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

         catalystArr.forEach((catalystHash) => {
            const catalyst = inventoryItems[catalystHash]

            if (catalyst?.displayProperties.name.endsWith(' Catalyst')) {
               addData(weapon, catalyst, 'Weapon Catalyst Exotic')
            }
         })
      })
   })

   return data
}
