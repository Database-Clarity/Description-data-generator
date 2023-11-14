import { InventoryItem } from './bungieTypes/inventoryItem.js'
import { InventoryItems, PlugSets, SocketTypes } from './bungieTypes/manifest.js'
import { TypedObject } from './typedObject.js'

const socketCategoryHashes = {
  'armor mods': [590099826],
  'armor perks': [3154740035],

  'weapon mods': [2685412949],
  'weapon perks': [4241085061],
  'weapon crafting perks': [3410521964],
  'weapon frame': [3956125808],

  abilities: [309722977, 3218807805],
  super: [457473665],
  aspects: [2140934067, 3400923910, 764703411],
  fragments: [1313488945, 193371309, 2819965312],

  'ghost mods': [3886482628],
}

type SocketCategoryNames = keyof typeof socketCategoryHashes

export const getAllFromSocket = (
  inventoryItems: InventoryItems,
  plugSets: PlugSets,
  item: InventoryItem,
  socketCategoryNames: SocketCategoryNames[],
  socketTypes?: SocketTypes
) => {
  const socketIndexes = item.sockets?.socketCategories
    ?.filter((socketCategory) => {
      // check if any of the passed category names match items socket category hash
      return socketCategoryNames.some((name) => socketCategoryHashes[name].includes(socketCategory.socketCategoryHash))
    })
    ?.flatMap((socketCategory) => {
      return socketCategory.socketIndexes || []
    })

  const sockets = socketIndexes?.flatMap((socketIndex) => {
    return item.sockets?.socketEntries?.[socketIndex] || []
  })

  const items: Set<number> = new Set()

  // this is for then exotic weapons catalysts have replacement
  if (socketTypes) {
    sockets?.forEach((socket) => {
      socketTypes[socket.socketTypeHash].plugWhitelist.forEach((socket) => {
        if (socket.reinitializationPossiblePlugHashes) {
          socket.reinitializationPossiblePlugHashes.forEach((hash) => items.add(hash))
        }
      })
    })

    if (items.size > 0) {
      return [...items].filter((hash) => inventoryItems[hash]).map((hash) => inventoryItems[hash])
    }
  }

  sockets?.forEach((socket) => {
    items.add(socket.singleInitialItemHash)
    socket.reusablePlugItems.forEach((plug) => items.add(plug.plugItemHash))
    plugSets[socket.randomizedPlugSetHash || '']?.reusablePlugItems.forEach((plug) => items.add(plug.plugItemHash))
    plugSets[socket.reusablePlugSetHash || '']?.reusablePlugItems?.forEach((plug) => items.add(plug.plugItemHash))
  })

  return [...items].filter((hash) => inventoryItems[hash]).map((hash) => inventoryItems[hash])
}
