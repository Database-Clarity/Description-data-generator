import { InventoryItems, PlugSets, SocketEntry } from '@icemourne/tool-box'

export const getAllFromSocket = (inventoryItems: InventoryItems, plugSets: PlugSets, socket: SocketEntry) => {
  try {
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
  } catch (e) {
    console.log(socket)
    throw new Error('getAllFromSocket.ts: getAllFromSocket()')
  }
}
