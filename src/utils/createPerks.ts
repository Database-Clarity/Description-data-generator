import { InventoryItems } from '@icemourne/tool-box'

import { CompletePerkDataList } from '../main.js'

type PerksForDescriptions = {
   [key: string]: {
      name: string
      hash: number
      itemName?: string
      itemHash?: number
      type: string
   }
}

export const createPerks = (inventoryItems: InventoryItems, perkData: CompletePerkDataList) => {
   return Object.entries(perkData).reduce<PerksForDescriptions>((acc, [hash, item]) => {
      if (item.type.endsWith(' Exotic') && item.appearsOn.length === 1) {
         acc[hash] = {
            name: item.name,
            hash: Number(hash),
            itemName: inventoryItems[item.appearsOn[0]].displayProperties.name,
            itemHash: Number(item.appearsOn[0]),
            type: item.type
         }
      } else {
         acc[hash] = {
            name: item.name,
            hash: Number(hash),
            type: item.type
         }
      }

      return acc
   }, {})
}
