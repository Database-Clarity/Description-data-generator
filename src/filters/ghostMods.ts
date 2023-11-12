import { getAllFromSocket } from '../utils/getAllFromSocket.js'
import { PerkDataList } from '../main.js'
import { InventoryItem } from '../utils/bungieTypes/inventoryItem.js'
import { InventoryItems, PerkTypes, PlugSets } from '../utils/bungieTypes/manifest.js'

export const ghostMods = (inventoryItems: InventoryItems, plugSets: PlugSets, data: PerkDataList) => {
  const ghostArr = Object.values(inventoryItems).filter((item) => item.itemType === 24)

  const addData = (ghost: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
    const ghostType = ghost.itemTypeDisplayName
    if (ghostType === undefined) return

    if (data[perk.hash] !== undefined) {
      data[perk.hash].appearsOn.add(ghostType)
      return
    }

    data[perk.hash] = {
      appearsOn: new Set([ghostType]),
      name: perk.displayProperties.name,
      hash: Number(perk.hash),
      type,
    }
  }

  ghostArr.forEach((ghost) => {
    const modsArr = getAllFromSocket(inventoryItems, plugSets, ghost, ['ghost mods'])

    modsArr.forEach((mod) => {
      if (mod.itemTypeDisplayName?.match(/ ghost mod/i)) {
        addData(ghost, mod, 'Ghost Mod')
      }
    })
  })
}
