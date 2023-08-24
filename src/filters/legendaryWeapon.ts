import { PerkTypes } from '@icemourne/description-converter'
import { InventoryItem, InventoryItems, PlugSets } from '@icemourne/tool-box'

import { PerkData } from '../main.js'
import { SocketCategoryEnums } from '../utils/enums.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

export const legendaryWeapons = (
  inventoryItems: InventoryItems,
  plugSets: PlugSets,
  inventoryItemWeapons: InventoryItem[]
) => {
  const data: { [key: string]: PerkData } = {}

  const addData = (weapon: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
    const weaponType = weapon.itemTypeDisplayName
    if (weaponType === undefined) return

    if (data[perk.hash] !== undefined) {
      data[perk.hash].appearsOn.add(weaponType)
      return
    }

    data[perk.hash] = {
      appearsOn: new Set([weaponType]),
      name: perk.displayProperties.name,
      hash: Number(perk.hash),
      type,
    }
  }

  inventoryItemWeapons.forEach((weapon) => {
    const weaponSockets = weapon.sockets
    if (weaponSockets === undefined) return

    const frameSocketCategory = weaponSockets.socketCategories.find(
      (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.weaponFrame
    )
    const perkSocketCategory = weaponSockets.socketCategories.find(
      (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.weaponPerks
    )
    const modSocketCategory = weaponSockets.socketCategories.find(
      (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.weaponMods
    )

    frameSocketCategory?.socketIndexes.forEach((socketIndex) => {
      const frameArr = getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

      frameArr.forEach((frameHash) => {
        const frame = inventoryItems[frameHash]

        if (frame?.itemTypeDisplayName === 'Intrinsic') {
          addData(weapon, frame, 'Weapon Frame')
          return
        }
        if (frame?.itemTypeDisplayName === 'Enhanced Intrinsic') {
          addData(weapon, frame, 'Weapon Frame Enhanced')
        }
      })
    })

    perkSocketCategory?.socketIndexes.forEach((socketIndex) => {
      const perkArr = getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

      perkArr.forEach((frameHash) => {
        const perk = inventoryItems[frameHash]

        switch (perk?.itemTypeDisplayName) {
          case 'Trait':
            addData(weapon, perk, 'Weapon Trait')
            break
          case 'Origin Trait':
            addData(weapon, perk, 'Weapon Trait Origin')
            break
          case 'Enhanced Trait':
            addData(weapon, perk, 'Weapon Trait Enhanced')
            break
          default:
            addData(weapon, perk, 'Weapon Perk')
            break
        }
      })
    })

    modSocketCategory?.socketIndexes.forEach((socketIndex) => {
      const modArr = getAllFromSocket(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex])

      modArr.forEach((modHash) => {
        const mod = inventoryItems[modHash]

        if (mod?.itemTypeDisplayName === 'Weapon Mod') {
          addData(weapon, mod, 'Weapon Mod')
        }
      })
    })
  })

  return data
}
