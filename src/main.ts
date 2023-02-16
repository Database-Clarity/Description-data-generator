import fs from 'fs'

import { PerkTypes } from '@icemourne/description-converter'
import { fetchBungieManifest } from '@icemourne/tool-box'
import _ from 'lodash'

import { createDescriptionData } from './descriptionData.js'
import { createRawData } from './rawData.js'
import { InventoryItemEnums } from './utils/enums.js'
import { createWeaponFormulaData } from './weaponFormulaData.js'

export type PerkData = {
   appearsOn: Set<string | number>
   name: string
   hash: number
   type: PerkTypes
}

export type PerkDataList = {
   [key: string]: PerkData
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


   if (!fs.existsSync('./templates')) {
      fs.mkdirSync('./templates')
   }

   const rawData = createRawData(inventoryItems, plugSet, socketType)
   fs.writeFileSync('./templates/rawData.json', JSON.stringify(rawData, undefined, 1))

   const descriptionData = createDescriptionData(inventoryItems, rawData)
   fs.writeFileSync('./templates/descriptions.json', JSON.stringify(descriptionData, undefined, 1))

   const weaponFormula = createWeaponFormulaData(inventoryItems, rawData)
   fs.writeFileSync('./templates/weaponFormula.json', JSON.stringify(weaponFormula, undefined, 1))

   console.log('Completed')
})()
