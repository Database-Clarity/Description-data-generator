import { InventoryItems } from '@icemourne/tool-box'

import { RawDataList } from './rawData.js'

type WeaponFormulaData = {
   legendary: {
      [key: string]: {
         [key: string]: number[]
      }
   }
   exotic: {
      [key: string]: {
         [key: string]: number[]
      }
   }
}

export function createWeaponFormulaData(inventoryItems: InventoryItems, rawData: RawDataList) {
   return Object.entries(rawData).reduce(
      (acc, [key, value]) => {
         if (!value.type.startsWith('Weapon Frame')) return acc
         const { appearsOn, name } = value

         if (value.type.endsWith(' Exotic')) {
            appearsOn.forEach((item) => {
               const weaponType = inventoryItems[item].itemTypeDisplayName
               if (!weaponType) return acc
               if (!acc.exotic[weaponType]) {
                  acc.exotic[weaponType] = {}
               }
               if (!acc.exotic[weaponType][item]) {
                  acc.exotic[weaponType][item] = []
               }

               acc.exotic[weaponType][item].push(Number(key))
            })
            return acc
         }

         appearsOn.forEach((item) => {
            if (!acc.legendary[item]) {
               acc.legendary[item] = {}
            }
            if (!acc.legendary[item][name]) {
               acc.legendary[item][name] = []
            }

            acc.legendary[item][name].push(Number(key))
         })
         return acc
      },
      { legendary: {}, exotic: {} } as WeaponFormulaData
   )
}
