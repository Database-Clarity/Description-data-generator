import { InventoryItems, SocketEntry } from '../interfaces/inventoryItem.interface'
import { PlugSets } from '../interfaces/plugSet.interface'

export const getAllFromSocket = (inventoryItems: InventoryItems, plugSets: PlugSets, socket: SocketEntry) => {
   const items: Set<number> = new Set()

   items.add(socket.singleInitialItemHash)
   socket.reusablePlugItems.forEach((plug) => items.add(plug.plugItemHash))
   plugSets[socket.randomizedPlugSetHash || '']?.reusablePlugItems.forEach((plug) => items.add(plug.plugItemHash))
   plugSets[socket.reusablePlugSetHash || '']?.reusablePlugItems.forEach((plug) => items.add(plug.plugItemHash))

   return [...items].filter((hash) => {
      const name = inventoryItems[hash]?.displayProperties?.name
      return !(
         hash === 0 ||
         name === undefined ||
         name === '' ||
         name === 'Empty Mod Socket' ||
         name === 'Deprecated Armor Mod'
      )
   })
}
