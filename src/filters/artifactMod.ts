import { PerkTypes } from '@icemourne/description-converter'
import { InventoryItem, InventoryItems, PlugSets } from '@icemourne/tool-box'

import { PerkData } from '../main.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

/** Current, equippable artifacts are the "Artifact" items with sockets; earlier ones survive only as unsocketed definitions. */
export const isCurrentArtifact = (item: InventoryItem) =>
  item.itemTypeDisplayName === 'Artifact' && Boolean(item.sockets?.socketEntries?.length)

export const isArtifactPerk = (item: InventoryItem | undefined) =>
  item?.plug?.plugCategoryIdentifier === 'artifact_perks' && item.itemTypeDisplayName === 'Artifact Perk'

export const artifactMods = (
  inventoryItems: InventoryItems,
  plugSets: PlugSets,
  inventoryItemArtifact: InventoryItem[]
) => {
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

    if (!isCurrentArtifact(artifact)) return
    artifact.sockets?.socketEntries.forEach((socketEntry) => {
      getAllFromSocket(inventoryItems, plugSets, socketEntry).forEach((perkHash) => {
        const perk = inventoryItems[perkHash]
        if (isArtifactPerk(perk)) addData(artifact, perk, 'Armor Mod Seasonal')
      })
    })
  })

  return data
}
