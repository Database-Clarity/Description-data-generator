import { InventoryItems } from '../interfaces/inventoryItem.interface'
import { PlugSets } from '../interfaces/plugSet.interface'
import { SocketTypes } from '../interfaces/socketType.interface'

export interface Manifest {
   inventoryItems: InventoryItems
   plugSet: PlugSets
   socketType: SocketTypes
}

const justFetch = async (link: string, retries: number = 0): Promise<any> => {
   const resp = await fetch(link)
   if (resp.status === 200) return await resp.json()
   if (retries > 5) return
   return await justFetch(link, retries + 1)
}

export const getManifest = async () => {
   const manifest = await justFetch('https://www.bungie.net/Platform/Destiny2/Manifest/')
   if (manifest === undefined) throw new Error('failed getting manifest')

   const inventoryItemUrl = `https://www.bungie.net${manifest.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition}`,
      plugSetUrl = `https://www.bungie.net${manifest.Response.jsonWorldComponentContentPaths.en.DestinyPlugSetDefinition}`,
      socketTypeUrl = `https://www.bungie.net${manifest.Response.jsonWorldComponentContentPaths.en.DestinySocketTypeDefinition}`

   const inventoryItems = await justFetch(inventoryItemUrl),
      plugSet = await justFetch(plugSetUrl),
      socketType = await justFetch(socketTypeUrl)

   if (inventoryItems === undefined || plugSet === undefined || socketType === undefined)
      throw new Error('Failed getting data')

   const newManifest: Manifest = {
      inventoryItems,
      plugSet,
      socketType
   }

   return newManifest
}
