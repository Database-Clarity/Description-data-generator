import { InventoryItem } from '../utils/bungieTypes/inventoryItem.js'
import { InventoryItems, PerkTypes, PlugSets } from '../utils/bungieTypes/manifest.js'

import { PerkDataList } from '../main.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

export const subclass = (inventoryItems: InventoryItems, plugSets: PlugSets, data: PerkDataList) => {
  const subclassArr = Object.values(inventoryItems).filter((item) => item.itemType === 16 && item.sockets !== undefined)

  const addData = (subclass: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
    const armorType = subclass.itemTypeDisplayName
    if (armorType === undefined) return

    if (data[perk.hash] !== undefined) {
      data[perk.hash].appearsOn.add(armorType)
      return
    }

    data[perk.hash] = {
      appearsOn: new Set([armorType]),
      name: perk.displayProperties.name,
      hash: Number(perk.hash),
      type,
    }
  }

  subclassArr.forEach((subclass) => {
    const abilityArr = getAllFromSocket(inventoryItems, plugSets, subclass, ['abilities'])
    const superArr = getAllFromSocket(inventoryItems, plugSets, subclass, ['super'])
    const aspectArr = getAllFromSocket(inventoryItems, plugSets, subclass, ['aspects_light', 'aspects_dark'])
    const fragmentsArr = getAllFromSocket(inventoryItems, plugSets, subclass, ['fragments_light', 'fragments_dark'])

    abilityArr.forEach((perk) => {
      if (perk.itemTypeDisplayName?.includes('Melee')) {
        addData(subclass, perk, 'Subclass Melee')
        return
      }
      if (perk.itemTypeDisplayName?.includes('Grenade')) {
        addData(subclass, perk, 'Subclass Grenade')
        return
      }
      if (perk.itemTypeDisplayName === 'Movement Ability') {
        addData(subclass, perk, 'Subclass Movement')
        return
      }
      if (perk.itemTypeDisplayName === 'Class Ability') {
        addData(subclass, perk, 'Subclass Class')
      }
    })

    superArr.forEach((perk) => {
      if (perk.itemTypeDisplayName === 'Super Ability') {
        addData(subclass, perk, 'Subclass Super')
      }
    })

    aspectArr.forEach((perk) => {
      if (perk.itemTypeDisplayName?.includes('Aspect')) {
        addData(subclass, perk, 'Subclass Aspect')
      }
    })

    fragmentsArr.forEach((perk) => {
      if (perk.itemTypeDisplayName?.includes('Fragment')) {
        addData(subclass, perk, 'Subclass Fragment')
      }
    })
  })
}
