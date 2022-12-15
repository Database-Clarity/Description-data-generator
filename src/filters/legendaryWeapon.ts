import { BasePerk } from '../interfaces/editor.interface'
import { InventoryItem, InventoryItems } from '../interfaces/inventoryItem.interface'
import { PlugSets } from '../interfaces/plugSet.interface'
import { SocketCategory } from '../utils/enums'
import { getAllFromSocket } from '../utils/getAllFromSocket'
import { makeBasePerk } from '../utils/makeBasePerk'

export const legendaryWeapon = (
   inventoryItems: InventoryItems,
   plugSets: PlugSets,
   inventoryItemLegendaryWeapon: InventoryItem[]
) => {
   return inventoryItemLegendaryWeapon.reduce<{ [key: string]: BasePerk }>((acc, weapon) => {
      const weaponSockets = weapon.sockets
      if (weaponSockets === undefined) return acc

      const frameSocketCategory = weaponSockets.socketCategories.find(
         (socketCategory) => (socketCategory.socketCategoryHash === SocketCategory.weaponFrame)
      )
      const perkSocketCategory = weaponSockets.socketCategories.find(
         (socketCategory) => (socketCategory.socketCategoryHash === SocketCategory.weaponPerks)
      )
      const modSocketCategory = weaponSockets.socketCategories.find(
         (socketCategory) => (socketCategory.socketCategoryHash === SocketCategory.weaponMods)
      )

      frameSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const frameArr = getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

         frameArr.forEach((frameHash) => {
            const frame = inventoryItems[frameHash]

            if (frame?.itemTypeDisplayName === 'Intrinsic') {
               acc[frameHash] = makeBasePerk(frame, 'Weapon Frame')
               return
            }
         })
      })

      perkSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const perkArr = getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

         perkArr.forEach((perkHash) => {
            const perk = inventoryItems[perkHash]

            if (perk?.itemTypeDisplayName === 'Trait') {
               acc[perkHash] = makeBasePerk(perk, 'Weapon Perk')
               return
            }
            if (perk?.itemTypeDisplayName === 'Origin Trait') {
               acc[perkHash] = makeBasePerk(perk, 'Weapon Origin Trait')
               return
            }
            if (perk?.itemTypeDisplayName === 'Enhanced Trait') {
               acc[perkHash] = makeBasePerk(perk, 'Weapon Perk Enhanced')
               return
            }
         })
      })

      modSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const modArr = getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

         modArr.forEach((modHash) => {
            const mod = inventoryItems[modHash]

            if (mod?.itemTypeDisplayName === 'Weapon Mod') {
               acc[modHash] = makeBasePerk(mod, 'Weapon Mod')
               return
            }
         })
      })
      return acc
   }, {})
}
