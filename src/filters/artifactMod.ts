import { PerkDataList } from '../main.js'
import { InventoryItem } from '../utils/bungieTypes/inventoryItem.js'
import { InventoryItems, PerkTypes } from '../utils/bungieTypes/manifest.js'

export const artifactMods = (inventoryItems: InventoryItems, data: PerkDataList) => {
  const artifactArr = Object.values(inventoryItems).filter((item) => item.itemTypeDisplayName === 'Artifact')

  const addData = (artifact: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
    const itemType = artifact.itemTypeDisplayName
    if (itemType === undefined) return

    if (data[perk.hash] !== undefined) {
      data[perk.hash].appearsOn.add(itemType)
      return
    }

    data[perk.hash] = {
      appearsOn: new Set([itemType]),
      name: perk.displayProperties.name,
      hash: Number(perk.hash),
      type,
    }
  }

  artifactArr.forEach((artifact) => {
    const artifactMods = artifact.preview?.derivedItemCategories?.flatMap((category) => {
      return category.items.map((item) => item.itemHash)
    })

    if (artifactMods === undefined) return

    artifactMods.forEach((modHash) => {
      if (inventoryItems[modHash] === undefined) return
      addData(artifact, inventoryItems[modHash], 'Armor Mod Seasonal')
    })
  })
}
