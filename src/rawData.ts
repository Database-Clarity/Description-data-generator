import { PerkTypes } from '@icemourne/description-converter'
import { InventoryItems, PlugSets, SocketTypes } from '@icemourne/tool-box'

import { armorMods } from './filters/armorMod.js'
import { artifactMods } from './filters/artifactMod.js'
import { exoticArmors } from './filters/exoticArmor.js'
import { exoticsWeapons } from './filters/exoticWeapon.js'
import { ghostMods } from './filters/ghostMods.js'
import { legendaryWeapons } from './filters/legendaryWeapon.js'
import { subclass } from './filters/subclass.js'
import { weaponCraftingRecipes } from './filters/weaponCraftingRecipes.js'
import { categorizeItems } from './utils/categorizeItems.js'

export type RawData = {
  appearsOn: (string | number)[]
  name: string
  hash: number
  type: PerkTypes
}

export type RawDataList = {
  [key: string]: RawData
}

export function createRawData(inventoryItems: InventoryItems, plugSets: PlugSets, socketTypes: SocketTypes) {
  const {
    exoticArmorArr,
    exoticWeaponsArr,
    legendaryArmorArr,
    legendaryWeaponArr,
    subclassArr,
    artifactArr,
    craftingRecipeArr,
    ghostArr,
  } = categorizeItems(inventoryItems)

  const legendaryWeaponsList = legendaryWeapons(inventoryItems, plugSets, legendaryWeaponArr)
  const exoticsWeaponsList = exoticsWeapons(
    inventoryItems,
    plugSets,
    exoticWeaponsArr,
    socketTypes,
    legendaryWeaponsList
  )
  const craftingRecipeList = weaponCraftingRecipes(
    inventoryItems,
    plugSets,
    craftingRecipeArr,
    legendaryWeaponsList,
    exoticsWeaponsList
  )
  const armorModList = armorMods(inventoryItems, plugSets, legendaryArmorArr)

  const exoticArmorList = exoticArmors(inventoryItems, plugSets, exoticArmorArr)
  const artifactModList = artifactMods(inventoryItems, artifactArr)
  const subclassList = subclass(inventoryItems, plugSets, subclassArr)

  const ghostList = ghostMods(inventoryItems, plugSets, ghostArr)

  const allPerks = {
    ...legendaryWeaponsList,
    ...exoticsWeaponsList,
    ...craftingRecipeList,
    ...armorModList,
    ...exoticArmorList,
    ...artifactModList,
    ...subclassList,
    ...ghostList,
  }

  // converts appears on from set to array and filters out exotic weapons from legendary/exotic weapon perks
  return Object.entries(allPerks).reduce((acc, [hash, perk]) => {
    let appearsOnArr = Array.from(perk.appearsOn)

    // filter out exotic weapons from legendary/exotic weapon perks
    if (appearsOnArr.some((x) => typeof x === 'string') && appearsOnArr.some((x) => typeof x === 'number')) {
      const newArr = appearsOnArr.map((typeOrHash) => {
        if (typeof typeOrHash === 'number') {
          const itemType = inventoryItems[typeOrHash].itemTypeDisplayName
          if (itemType) return itemType
        }
        return typeOrHash
      })
      // remove duplicates
      appearsOnArr = [...new Set(newArr)]
    }

    acc[hash] = {
      ...perk,
      appearsOn: appearsOnArr,
    }

    return acc
  }, {} as RawDataList)
}
