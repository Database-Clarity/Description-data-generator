import { BasePerk } from '../interfaces/editor.interface'
import { InventoryItem, InventoryItems } from '../interfaces/inventoryItem.interface'
import { makeBasePerk } from '../utils/makeBasePerk'

export const artifactMod = (inventoryItems: InventoryItems, inventoryItemArtifact: InventoryItem[]) => {
   return inventoryItemArtifact.reduce<{ [key: string]: BasePerk }>((acc, artifact) => {
      artifact.preview?.derivedItemCategories
         ?.flatMap((category) => category.items.flatMap((item) => item.itemHash))
         .flat()
         .forEach((modHash) => {
            if (
               inventoryItems[modHash].inventory.tierType !== 5 ||
               inventoryItems[modHash].itemTypeDisplayName === 'Deprecated Armor Mod'
            )
               return
            acc[modHash] = makeBasePerk(inventoryItems[modHash], 'artifactMod')
         })
      return acc
   }, {})
}
