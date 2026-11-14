import { PerkTypes } from '@icemourne/description-converter'
import { InventoryItem, InventoryItems, PlugSets, SocketTypes } from '@icemourne/tool-box'

import { PerkData } from '../main.js'
import { SocketCategoryEnums } from '../utils/enums.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'

/** Raid and seasonal-activity mods share plug categories, so a future raid needs no name rule. */
export const isActivityMod = (mod: InventoryItem | undefined) =>
  Boolean(mod?.plug?.plugCategoryIdentifier?.match(/^enhancements\.(raid_|season_outlaw|season_maverick)/)) &&
  mod?.displayProperties.name !== 'Empty Mod Socket'

export const armorMods = (
  inventoryItems: InventoryItems,
  plugSets: PlugSets,
  inventoryItemLegendaryArmor: InventoryItem[],
  socketTypes: SocketTypes = {}
) => {
  const data: { [key: string]: PerkData } = {}

  const addData = (armor: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
    const armorType = armor.itemTypeDisplayName
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

  // Consumable inventory plugs are not listed in reusable plug sets. Discover
  // stackable armor mods through inventory-enabled sockets and their whitelist.
  // The description check also excludes old mods whose type was never renamed.
  const inventoryMods = new Map<number, number[]>()
  Object.values(inventoryItems).forEach((mod) => {
    const category = mod.plug?.plugCategoryHash
    if (category === undefined || mod.itemType !== 19 || mod.redacted || mod.blacklisted ||
      mod.plug?.isDummyPlug || mod.inventory.maxStackSize <= 1 ||
      !mod.itemTypeDisplayName?.endsWith('Armor Mod') ||
      mod.itemTypeDisplayName.startsWith('Deprecated') ||
      /deprecated/i.test(mod.displayProperties.description) ||
      !mod.displayProperties.name || /Empty .*Socket| Mod Socket$/.test(mod.displayProperties.name)) return
    inventoryMods.set(category, [...(inventoryMods.get(category) ?? []), mod.hash])
  })

  inventoryItemLegendaryArmor.forEach((armor) => {
    const armorSockets = armor.sockets
    if (armorSockets === undefined) return

    const modSocketCategory = armorSockets.socketCategories.find(
      (socketCategory) => socketCategory.socketCategoryHash === SocketCategoryEnums.armorMods
    )

    modSocketCategory?.socketIndexes.forEach((socketIndex) => {
      const socket = armorSockets.socketEntries[socketIndex]
      const modsArr = new Set(getAllFromSocket(inventoryItems, plugSets, socket))
      // SocketPlugSources.InventorySourced = 1; a whitelist alone does not supply plugs.
      if (socket.plugSources & 1) {
        socketTypes[socket.socketTypeHash]?.plugWhitelist.forEach(({ categoryHash }) => {
          inventoryMods.get(categoryHash)?.forEach((hash) => modsArr.add(hash))
        })
      }

      modsArr.forEach((modHash) => {
        const mod = inventoryItems[modHash]

        // black list stat mods
        if (
          mod?.itemTypeDisplayName?.match(/(Artifice|General) Armor Mod/) &&
          mod?.displayProperties.name.match(/Resilience|Recovery|Discipline|Mobility|Strength|Intellect/)
        )
          return

        if (mod?.itemTypeDisplayName?.match(/(General|Helmet|Arms|Chest|Leg|Class Item) Armor Mod/)) {
          addData(armor, mod, 'Armor Mod General')
          return
        }
        if (mod?.itemTypeDisplayName?.match(/(Elemental Well|Charged with Light|Warmind Cell) Mod/)) {
          addData(armor, mod, 'Armor Mod Combat')
          return
        }
        if (isActivityMod(mod)) {
          addData(armor, mod, 'Armor Mod Activity')
          return
        }
      })
    })
  })

  return data
}
