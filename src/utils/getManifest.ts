import { InventoryItems } from '../interfaces/inventoryItem.interface'
import { PlugSets } from '../interfaces/plugSet.interface'
import { SocketTypes } from '../interfaces/socketType.interface'
import { persistentFetch } from '@icemourne/tool-box'

export interface Manifest {
   inventoryItems: InventoryItems
   plugSet: PlugSets
   socketType: SocketTypes
}

export const getManifest = async () => {
   const manifest = await persistentFetch('https://www.bungie.net/Platform/Destiny2/Manifest/', 5)
   if (manifest === undefined) throw new Error('failed getting manifest')

   const inventoryItemUrl = `https://www.bungie.net${manifest.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition}`,
      plugSetUrl = `https://www.bungie.net${manifest.Response.jsonWorldComponentContentPaths.en.DestinyPlugSetDefinition}`,
      socketTypeUrl = `https://www.bungie.net${manifest.Response.jsonWorldComponentContentPaths.en.DestinySocketTypeDefinition}`

   const inventoryItems = await persistentFetch(inventoryItemUrl, 5),
      plugSet = await persistentFetch(plugSetUrl, 5),
      socketType = await persistentFetch(socketTypeUrl, 5)

   if (inventoryItems === undefined || plugSet === undefined || socketType === undefined)
      throw new Error('Failed getting data')

   const newManifest: Manifest = {
      inventoryItems,
      plugSet,
      socketType
   }

   return newManifest
}
