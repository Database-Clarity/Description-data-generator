import { PerkTypes } from '@icemourne/description-converter'
import { InventoryItem, InventoryItems } from '@icemourne/tool-box'

import { PerkData } from '../main.js'

export const artifactMods = (inventoryItems: InventoryItems, inventoryItemArtifact: InventoryItem[]) => {
  const data: { [key: string]: PerkData } = {}

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

  inventoryItemArtifact.forEach((artifact) => {
    artifact.preview?.derivedItemCategories
      ?.flatMap((category) => category.items.flatMap((item) => item.itemHash))
      .flat()
      .forEach((modHash) => {
        if (inventoryItems[modHash]?.inventory.tierType !== 5) return
        addData(artifact, inventoryItems[modHash], 'Armor Mod Seasonal')
      })
  })

  return data
}
