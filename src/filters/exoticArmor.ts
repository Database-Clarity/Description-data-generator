import { BasePerk } from '../interfaces/editor.interface'
import { InventoryItem, InventoryItems } from '../interfaces/inventoryItem.interface'
import { PlugSets } from '../interfaces/plugSet.interface'
import { SocketCategory } from '../utils/enums'
import { getAllFromSocket } from '../utils/getAllFromSocket'
import { makeBasePerk } from '../utils/makeBasePerk'

export const exoticArmor = (
   inventoryItems: InventoryItems,
   plugSets: PlugSets,
   inventoryItemExoticArmor: InventoryItem[]
) =>
   inventoryItemExoticArmor.reduce<{ [key: string]: BasePerk }>((acc, armor) => {
      const armorSockets = armor.sockets
      if (armorSockets === undefined) return acc

      const perkSocketCategory = armorSockets.socketCategories.find(
         (socketCategory) => (socketCategory.socketCategoryHash === SocketCategory.armorPerks)
      )

      perkSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const perkArr = getAllFromSocket(inventoryItems, plugSets, armorSockets.socketEntries[socketIndex])

         perkArr.forEach((perkHash) => {
            const perk = inventoryItems[perkHash]

            if (perk.itemTypeDisplayName === 'Intrinsic' || perk.itemTypeDisplayName === 'Aeon Cult Mod') {
               acc[perkHash] = makeBasePerk(perk, 'armorExotic', armor)
               return
            }
         })
      })
      return acc
   }, {})
