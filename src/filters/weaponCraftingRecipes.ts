import { PerkDataList } from '../main.js'
import { getAllFromSocket } from '../utils/getAllFromSocket.js'
import { InventoryItem } from '../utils/bungieTypes/inventoryItem.js'
import { InventoryItems, PerkTypes, PlugSets } from '../utils/bungieTypes/manifest.js'

export const weaponCraftingRecipes = (inventoryItems: InventoryItems, plugSets: PlugSets, data: PerkDataList) => {
  const craftingRecipeArr = Object.values(inventoryItems).filter((item) => item.itemType === 30)

  const addData = (weapon: InventoryItem, perk: InventoryItem, type: PerkTypes) => {
    const weaponTypeOrHash = weapon.inventory.tierTypeName === 'Exotic' ? weapon.hash : weapon.itemTypeDisplayName
    if (weaponTypeOrHash === undefined) return

    if (data[perk.hash] !== undefined) {
      // this needs clean up later on to remove exotic weapons from perks found on legendary weapons
      data[perk.hash].appearsOn.add(weaponTypeOrHash)
      return
    }

    data[perk.hash] = {
      appearsOn: new Set([weaponTypeOrHash]),
      name: perk.displayProperties.name,
      hash: Number(perk.hash),
      type,
    }
  }

  craftingRecipeArr.forEach((recipe) => {
    const craftedPerkArr = getAllFromSocket(inventoryItems, plugSets, recipe, ['weapon crafting perks'])

    craftedPerkArr.forEach((perk) => {
      const craftedWeapon = inventoryItems[recipe?.crafting?.outputItemHash || '']
      const isExotic = craftedWeapon.inventory.tierTypeName === 'Exotic'

      if (perk?.plug?.uiPlugLabel === 'masterwork' || perk?.displayProperties.name.endsWith(' Catalyst')) {
        addData(craftedWeapon, perk, 'Weapon Catalyst Exotic')
        return
      }

      const exoticText = isExotic ? ' Exotic' : ''

      switch (perk?.itemTypeDisplayName) {
        case 'Intrinsic':
          addData(craftedWeapon, perk, `Weapon Frame${exoticText}`)
          break
        case 'Enhanced Intrinsic':
          addData(craftedWeapon, perk, `Weapon Frame Enhanced${exoticText}`)
          break
        case 'Trait':
          addData(craftedWeapon, perk, `Weapon Trait${exoticText}`)
          break
        case 'Origin Trait':
          addData(craftedWeapon, perk, `Weapon Trait Origin${exoticText}`)
          break
        case 'Enhanced Trait':
          addData(craftedWeapon, perk, `Weapon Trait Enhanced${exoticText}`)
          break
        default:
          addData(craftedWeapon, perk, `Weapon Perk${exoticText}`)
          break
      }
    })
  })

  return data
}
