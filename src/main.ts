import fs from 'fs'

import { PerkTypes } from '@icemourne/description-converter'
import { fetchBungieManifest } from '@icemourne/tool-box'
import _ from 'lodash'

import { armorMods } from './filters/armorMod.js'
import { artifactMods } from './filters/artifactMod.js'
import { exoticArmors } from './filters/exoticArmor.js'
import { exoticsWeapons } from './filters/exoticWeapon.js'
import { ghostMods } from './filters/ghostMods.js'
import { legendaryWeapons } from './filters/legendaryWeapon.js'
import { subclass } from './filters/subclass.js'
import { weaponCraftingRecipes } from './filters/weaponCraftingRecipes.js'
import { categorizeItems } from './utils/categorizeItems.js'
import { createFolders } from './utils/createFolders.js'
import { createPerks } from './utils/createPerks.js'
import { linkEnhancedTraits } from './utils/enhancedTraitsLinking.js'
import { InventoryItemEnums } from './utils/enums.js'

export type PerkData = {
   appearsOn: Set<string | number>
   name: string
   hash: number
   type: PerkTypes
}

export type PerkDataList = {
   [key: string]: PerkData
}

export type CompletePerkData = {
   appearsOn: (string | number)[]
   name: string
   hash: number
   type: PerkTypes
}

export type CompletePerkDataList = {
   [key: string]: CompletePerkData
}
;(async () => {
   const {
      inventoryItem: dirtyInventoryItems,
      plugSet,
      socketType
   } = await fetchBungieManifest(['inventoryItem', 'plugSet', 'socketType'])
   if (dirtyInventoryItems === undefined || plugSet === undefined || socketType === undefined) {
      throw new Error('Failed to fetch manifest')
   }

   const inventoryItems = _.omitBy(dirtyInventoryItems, (item) => {
      // remove stuff
      if (
         item.itemTypeDisplayName === 'Shader' ||
         item.itemTypeDisplayName === 'Deprecated Armor Mod' ||
         item.displayProperties.name === 'Crucible Tracker' ||
         item.displayProperties.name === 'Kill Tracker' ||
         item.displayProperties.name === 'Tracker Disabled' ||
         item.displayProperties.name === 'Classified' ||
         item.displayProperties.name === 'Default Shader' ||
         item.displayProperties.name.match(/Empty [A-z]+ Socket/) ||
         item.displayProperties.name.match(/ Mod Socket$/) ||
         item.displayProperties.name.match(/ Damage Mod$/) ||
         item.displayProperties.name.match(/[A-z]+ Memento Tracker/) ||
         item.hash === InventoryItemEnums.osteoStrigaCatalyst || // not equippable
         item.hash === InventoryItemEnums.transformative || //      no reason to have placeholder perk
         item.hash === InventoryItemEnums.aeonSafe || //            dummy item
         item.hash === InventoryItemEnums.aeonSoul || //            dummy item
         item.hash === InventoryItemEnums.aeonSwift || //           dummy item
         item.hash === InventoryItemEnums.weaponAttackMod //        removed mod
      )
         return true
   })
   const {
      exoticArmorArr,
      exoticWeaponsArr,
      legendaryArmorArr,
      legendaryWeaponArr,
      subclassArr,
      artifactArr,
      craftingRecipeArr,
      ghostArr
   } = categorizeItems(inventoryItems)

   const legendaryWeaponsList = legendaryWeapons(inventoryItems, plugSet, legendaryWeaponArr)
   const exoticsWeaponsList = exoticsWeapons(
      inventoryItems,
      plugSet,
      exoticWeaponsArr,
      socketType,
      legendaryWeaponsList
   )
   const craftingRecipeList = weaponCraftingRecipes(
      inventoryItems,
      plugSet,
      craftingRecipeArr,
      legendaryWeaponsList,
      exoticsWeaponsList
   )
   const armorModList = armorMods(inventoryItems, plugSet, legendaryArmorArr)

   const exoticArmorList = exoticArmors(inventoryItems, plugSet, exoticArmorArr)
   const artifactModList = artifactMods(inventoryItems, artifactArr)
   const subclassList = subclass(inventoryItems, plugSet, subclassArr)

   const ghostList = ghostMods(inventoryItems, plugSet, ghostArr)

   const allPerks = {
      ...legendaryWeaponsList,
      ...exoticsWeaponsList,
      ...craftingRecipeList,
      ...armorModList,
      ...exoticArmorList,
      ...artifactModList,
      ...subclassList,
      ...ghostList
   }

   if (!fs.existsSync('./templates')) {
      fs.mkdirSync('./templates')
   }

   // converts appears on from set to array and filters out exotic weapons from legendary/exotic weapon perks
   const completeList = Object.entries(allPerks).reduce((acc, [hash, perk]) => {
      let appearsOnArr = Array.from(perk.appearsOn)

      // filter out exotic weapons from legendary/exotic weapon perks
      if (appearsOnArr.some((x) => typeof x === 'string') && appearsOnArr.some((x) => typeof x === 'number')) {
         const newArr = appearsOnArr.map((typeOrHash) => {
            if (typeof typeOrHash === 'number') {
               const itemType = inventoryItems[typeOrHash].itemTypeDisplayName
               if (itemType) return itemType
            }
            return typeOrHash
         })
         // remove duplicates
         appearsOnArr = [...new Set(newArr)]
      }

      acc[hash] = {
         ...perk,
         appearsOn: appearsOnArr
      }

      return acc
   }, {} as CompletePerkDataList)

   const dataForDescriptions = {
      perks: createPerks(inventoryItems, completeList),
      databaseSettings: {
         folders: createFolders(completeList, inventoryItems),
         enhancedPerks: linkEnhancedTraits(completeList)
      }
   }

   fs.writeFileSync('./templates/rawData.json', JSON.stringify(completeList, undefined, 1))
   fs.writeFileSync('./templates/descriptions.json', JSON.stringify(dataForDescriptions, undefined, 1))
   console.log('Completed')
})()
