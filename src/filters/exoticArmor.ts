import { PerkDataList } from '../main.js'
import { InventoryItem } from '../utils/bungieTypes/inventoryItem.js'
import { InventoryItems, PlugSets, PerkTypes } from '../utils/bungieTypes/manifest.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

export const exoticArmors = (inventoryItems: InventoryItems, plugSets: PlugSets, data: PerkDataList) => {
  const armorArr = Object.values(inventoryItems).filter(
    (item) => item.itemType === 2 && item.itemTypeAndTierDisplayName?.includes('Exotic')
  )

  const addData = (armor: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
    const armorHash = armor.hash

    if (data[perk.hash] !== undefined) {
      data[perk.hash].appearsOn.add(armorHash)
      return
    }

    data[perk.hash] = {
      appearsOn: new Set([armorHash]),
      name: perk.displayProperties.name,
      hash: Number(perk.hash),
      type,
    }
  }

  armorArr.forEach((armor) => {
    const perkArr = getAllFromSocket(inventoryItems, plugSets, armor, ['armor mods', 'armor perks'])

    perkArr.forEach((perk) => {
      if (perk.itemTypeDisplayName === 'Intrinsic' || perk.itemTypeDisplayName === 'Aeon Cult Mod') {
        addData(armor, perk, 'Armor Trait Exotic')
      }
    })
  })
}
