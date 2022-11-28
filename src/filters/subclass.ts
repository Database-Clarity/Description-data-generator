import { BasePerk } from '../interfaces/editor.interface'
import { InventoryItem } from '../interfaces/inventoryItem.interface'
import { makeBasePerk } from '../utils/makeBasePerk'

export const subclass = (inventoryItemSubclass: InventoryItem[]) => {
   return inventoryItemSubclass.reduce<{ [key: string]: BasePerk }>((acc, subclassThing) => {
      const hash = subclassThing.hash

      if (subclassThing?.itemTypeDisplayName.includes('Grenade')) {
         acc[hash] = makeBasePerk(subclassThing, 'grenade')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Movement Ability')) {
         acc[hash] = makeBasePerk(subclassThing, 'movement')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Class Ability')) {
         acc[hash] = makeBasePerk(subclassThing, 'class')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Fragment')) {
         acc[hash] = makeBasePerk(subclassThing, 'fragment')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Aspect')) {
         acc[hash] = makeBasePerk(subclassThing, 'aspect')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Super Ability')) {
         acc[hash] = makeBasePerk(subclassThing, 'super')
         return acc
      }
      if (subclassThing?.itemTypeDisplayName.includes('Melee')) {
         acc[hash] = makeBasePerk(subclassThing, 'melee')
         return acc
      }

      return acc
   }, {})
}
