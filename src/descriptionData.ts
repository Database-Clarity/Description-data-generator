import { InventoryItems } from '@icemourne/tool-box'

import { RawDataList } from './rawData.js'
import { createFolders } from './utils/createFolders.js'
import { createPerks } from './utils/createPerks.js'
import { linkEnhancedTraits } from './utils/enhancedTraitsLinking.js'

export function createDescriptionData(inventoryItems: InventoryItems, rawData: RawDataList) {
  return {
    perks: createPerks(inventoryItems, rawData),
    databaseSettings: {
      folders: createFolders(rawData, inventoryItems),
      enhancedPerks: linkEnhancedTraits(rawData),
    },
  }
}
