import { BasePerk } from '../interfaces/editor.interface'
import { InventoryItem } from '../interfaces/inventoryItem.interface'
import { makeBasePerk } from '../utils/makeBasePerk'

export const subclass = (inventoryItemSubclass: InventoryItem[]) => {
   return inventoryItemSubclass.reduce<{ [key: string]: BasePerk }>((acc, subclassThing) => {
      const hash = subclassThing.hash

      if (subclassThing?.itemTypeDisplayName.includes('Grenade')) {
         acc[hash] = makeBasePerk(subclassThing, 'Subclass Grenade')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Movement Ability')) {
         acc[hash] = makeBasePerk(subclassThing, 'Subclass Movement')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Class Ability')) {
         acc[hash] = makeBasePerk(subclassThing, 'Subclass Class')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Fragment')) {
         acc[hash] = makeBasePerk(subclassThing, 'Subclass Fragment')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Aspect')) {
         acc[hash] = makeBasePerk(subclassThing, 'Subclass Aspect')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Super Ability')) {
         acc[hash] = makeBasePerk(subclassThing, 'Subclass Super')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Melee')) {
         acc[hash] = makeBasePerk(subclassThing, 'Subclass Melee')
         return acc
      }

      return acc
   }, {})
}
