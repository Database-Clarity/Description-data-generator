import { PerkTypes } from '@icemourne/description-converter'
import { InventoryItem, InventoryItems, PlugSets } from '@icemourne/tool-box'

import { PerkData } from '../main.js'
import { SocketCategoryEnums } from '../utils/enums.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

export const subclass = (
   inventoryItems: InventoryItems,
   plugSets: PlugSets,
   inventoryItemSubclass: InventoryItem[]
) => {
   const data: { [key: string]: PerkData } = {}

   const addData = (armor: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
      const armorType = armor.itemTypeDisplayName
      if (armorType === undefined) return

      if (data[perk.hash] !== undefined) {
         data[perk.hash].appearsOn.add(armorType)
         return
      }

      data[perk.hash] = {
         appearsOn: new Set([armorType]),
         name: perk.displayProperties.name,
         hash: Number(perk.hash),
         type
      }
   }

   inventoryItemSubclass.forEach((subclass) => {
      const subclassSockets = subclass.sockets
      if (subclassSockets === undefined) return

      const abilitiesCategory = subclassSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.abilities
      )
      const superCategory = subclassSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.super
      )
      const aspectsCategory = subclassSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.aspects
      )
      const fragmentsCategory = subclassSockets.socketCategories.find(
         (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.fragments
      )

      abilitiesCategory?.socketIndexes.forEach((socketIndex) => {
         const perkArr = getAllFromSocket(inventoryItems, plugSets, subclassSockets.socketEntries[socketIndex])

         perkArr.forEach((hash) => {
            const perk = inventoryItems[hash]

            if (perk.itemTypeDisplayName?.includes('Melee')) {
               addData(subclass, perk, 'Subclass Melee')
               return
            }
            if (perk.itemTypeDisplayName?.includes('Grenade')) {
               addData(subclass, perk, 'Subclass Grenade')
               return
            }
            if (perk.itemTypeDisplayName === 'Movement Ability') {
               addData(subclass, perk, 'Subclass Movement')
               return
            }
            if (perk.itemTypeDisplayName === 'Class Ability') {
               addData(subclass, perk, 'Subclass Class')
            }
         })
      })
      superCategory?.socketIndexes.forEach((socketIndex) => {
         const perkArr = getAllFromSocket(inventoryItems, plugSets, subclassSockets.socketEntries[socketIndex])

         perkArr.forEach((hash) => {
            const perk = inventoryItems[hash]

            if (perk.itemTypeDisplayName === 'Super Ability') {
               addData(subclass, perk, 'Subclass Super')
            }
         })
      })
      aspectsCategory?.socketIndexes.forEach((socketIndex) => {
         const perkArr = getAllFromSocket(inventoryItems, plugSets, subclassSockets.socketEntries[socketIndex])

         perkArr.forEach((hash) => {
            const perk = inventoryItems[hash]

            if (perk.itemTypeDisplayName?.includes('Aspect')) {
               addData(subclass, perk, 'Subclass Aspect')
            }
         })
      })
      fragmentsCategory?.socketIndexes.forEach((socketIndex) => {
         const perkArr = getAllFromSocket(inventoryItems, plugSets, subclassSockets.socketEntries[socketIndex])

         perkArr.forEach((hash) => {
            const perk = inventoryItems[hash]

            if (perk.itemTypeDisplayName?.includes('Fragment')) {
               addData(subclass, perk, 'Subclass Fragment')
            }
         })
      })
   })

   return data
}
