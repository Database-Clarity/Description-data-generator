import { PerkDataList } from '../main.js'
import { InventoryItem } from '../utils/bungieTypes/inventoryItem.js'
import { InventoryItems, PlugSets, SocketTypes, PerkTypes } from '../utils/bungieTypes/manifest.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

export const exoticsWeapons = (
  inventoryItems: InventoryItems,
  plugSets: PlugSets,
  socketTypes: SocketTypes,
  data: PerkDataList
) => {
  const weaponArr = Object.values(inventoryItems).filter(
    (item) => item.itemType === 3 && item.itemTypeAndTierDisplayName?.includes('Exotic')
  )

  const addData = (weapon: InventoryItem, perk: InventoryItem, type: PerkTypes, frameArr?: InventoryItem[]) => {
    // Check if the perk is already on the list. If it is, it's a legendary perk, not an exotic.

    const weaponHash = weapon.hash

    if (data[perk.hash] !== undefined) {
      data[perk.hash].appearsOn.add(weaponHash)
      data[perk.hash].linkedWith = [
        ...new Set([...(data[perk.hash].linkedWith ?? []), ...(frameArr?.map((frame) => frame.hash) ?? [])]),
      ]
      return
    }

    data[perk.hash] = {
      appearsOn: new Set([weaponHash]),
      name: perk.displayProperties.name,
      hash: Number(perk.hash),
      type,
      linkedWith: frameArr?.map((frame) => frame.hash) ?? [],
    }
  }

  weaponArr.forEach((weapon) => {
    const frameArr = getAllFromSocket(inventoryItems, plugSets, weapon, ['weapon frame'])
    const perkArr = getAllFromSocket(inventoryItems, plugSets, weapon, ['weapon perks'])
    const catalystArr = getAllFromSocket(inventoryItems, plugSets, weapon, ['weapon mods'], socketTypes)

    frameArr.forEach((frame) => {
      if (frame.itemTypeDisplayName === 'Intrinsic') {
        addData(weapon, frame, 'Weapon Frame Exotic', frameArr)
      }
    })

    perkArr.forEach((perk) => {
      if (perk.plug?.uiPlugLabel === 'masterwork') {
        addData(weapon, perk, 'Weapon Catalyst Exotic')
        return
      }

      switch (perk.itemTypeDisplayName) {
        case 'Trait':
          addData(weapon, perk, 'Weapon Trait Exotic')
          break
        case 'Origin Trait':
          addData(weapon, perk, 'Weapon Trait Origin Exotic')
          break
        case 'Enhanced Trait':
          addData(weapon, perk, 'Weapon Trait Enhanced Exotic')
          break
        default:
          addData(weapon, perk, 'Weapon Perk Exotic')
          break
      }
    })

    catalystArr.forEach((catalyst) => {
      if (catalyst.displayProperties.name.endsWith(' Catalyst')) {
        addData(weapon, catalyst, 'Weapon Catalyst Exotic')
      }
    })
  })
}
