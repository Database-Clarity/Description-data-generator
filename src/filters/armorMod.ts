import { BasePerk } from "../interfaces/editor.interface"
import { InventoryItem, InventoryItems } from "../interfaces/inventoryItem.interface"
import { PlugSets } from "../interfaces/plugSet.interface"
import { SocketCategory } from "../utils/enums"
import { getAllFromSocket } from "../utils/getAllFromSocket"
import { makeBasePerk } from "../utils/makeBasePerk"

export const armorMod = (
   inventoryItems: InventoryItems,
   plugSets: PlugSets,
   inventoryItemLegendaryArmor: InventoryItem[]
) => {
   return inventoryItemLegendaryArmor.reduce<{ [key: string]: BasePerk }>((acc, armor) => {
      const armorSockets = armor.sockets
      if (armorSockets === undefined) return acc

      const modSocketCategory = armorSockets.socketCategories.find(
         (socketCategory) => (socketCategory.socketCategoryHash === SocketCategory.armorMods)
      )

      modSocketCategory?.socketIndexes.forEach((socketIndex) => {
         const modsArr = getAllFromSocket(inventoryItems, plugSets, armorSockets.socketEntries[socketIndex])

         modsArr.forEach((modHash) => {
            const mod = inventoryItems[modHash]

            if (mod?.itemTypeDisplayName.match(/(General|Helmet|Arms|Chest|Leg) Armor Mod|Class Item Mod/)) {
               acc[modHash] = makeBasePerk(mod, 'Armor Mod General')
               return
            }
            if (mod?.itemTypeDisplayName.match(/(Elemental Well|Charged with Light|Warmind Cell) Mod/)) {
               acc[modHash] = makeBasePerk(mod, 'Armor Mod Combat')
               return
            }
            if (mod?.itemTypeDisplayName.match(/ Raid Mod$|Nightmare Mod|King's Fall Mod|Vault of Glass Armor Mod/)) {
               acc[modHash] = makeBasePerk(mod, 'Armor Mod Activity')
               return
            }
         })
      })
      return acc
   }, {})
}
