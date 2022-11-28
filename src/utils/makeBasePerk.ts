import { PerkTypes } from "../interfaces/editor.interface"
import { InventoryItem, InventoryItems } from "../interfaces/inventoryItem.interface"

export const makeBasePerk = (perk: InventoryItem, type: PerkTypes, item?: InventoryItem) => {
   return {
      name: perk.displayProperties.name,
      hash: Number(perk.hash),
      type,
      perk,
      item
   }
}