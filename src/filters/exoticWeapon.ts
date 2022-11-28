import { BasePerk } from '../interfaces/editor.interface'
import { InventoryItem, InventoryItems } from '../interfaces/inventoryItem.interface'
import { PlugSets } from '../interfaces/plugSet.interface'
import { SocketTypes } from '../interfaces/socketType.interface'
import { SocketCategory } from '../utils/enums'
import { getAllFromSocket } from '../utils/getAllFromSocket'
import { lookForNewCatalyst } from '../utils/lookForNewCatalyst'
import { makeBasePerk } from '../utils/makeBasePerk'

export const exoticsWeapon = (
   inventoryItems: InventoryItems,
   plugSets: PlugSets,
   socketTypes: SocketTypes,
   inventoryItemExoticWeapon: InventoryItem[]
) => {
   return inventoryItemExoticWeapon.reduce<{ [key: string]: BasePerk }>((acc, weapon) => {
      const weaponSockets = weapon.sockets
      if (weaponSockets === undefined) return acc

      const frameSocketCategory = weaponSockets.socketCategories.find(
         (socketCategory) => (socketCategory.socketCategoryHash === SocketCategory.weaponFrame)
      )
      const perkSocketCategory = weaponSockets.socketCategories.find(
         (socketCategory) => (socketCategory.socketCategoryHash === SocketCategory.weaponPerks)
      )
      const catalystSocketCategory = weaponSockets.socketCategories.find(
         (socketCategory) => (socketCategory.socketCategoryHash === SocketCategory.weaponMods)
      )

      frameSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const frameArr = getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

         frameArr.forEach((frameHash) => {
            const frame = inventoryItems[frameHash]

            if (frame?.itemTypeDisplayName === 'Intrinsic') {
               acc[frameHash] = makeBasePerk(frame, 'weaponFrameExotic', weapon)
               return
            }
         })
      })

      perkSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const perkArr = getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

         perkArr.forEach((perkHash) => {
            const perk = inventoryItems[perkHash]

            if (perk?.itemTypeDisplayName === 'Trait') {
               acc[perkHash] = makeBasePerk(perk, 'weaponPerkExotic', weapon)
               return
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
               acc[catalystHash] = makeBasePerk(catalyst, 'weaponCatalystExotic', weapon)
               return
            }
         })
      })
      return acc
   }, {})
}
