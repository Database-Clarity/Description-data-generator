import { InventoryItem, InventoryItems } from '@icemourne/tool-box'

import { ItemTypeEnum, PowerCapHashEnum } from './enums.js'

interface Catagories {
   exoticWeaponsArr: InventoryItem[]
   exoticArmorArr: InventoryItem[]
   legendaryArmorArr: InventoryItem[]
   legendaryWeaponArr: InventoryItem[]
   subclassArr: InventoryItem[]
   artifactArr: InventoryItem[]
   craftingRecipeArr: InventoryItem[]
   ghostArr: InventoryItem[]
}

export const categorizeItems = (inventoryItem: InventoryItems) => {
   // find exotic weapons
   const exoticWeaponTest = (inventoryItem: InventoryItem) =>
      inventoryItem.itemCategoryHashes?.includes(1) &&
      inventoryItem.itemType === ItemTypeEnum.weapon &&
      inventoryItem.itemTypeAndTierDisplayName?.includes('Exotic') &&
      Boolean(inventoryItem.collectibleHash)

   // find exotic armor
   const exoticArmorTest = (inventoryItem: InventoryItem) =>
      inventoryItem.itemType === ItemTypeEnum.armor && inventoryItem.itemTypeAndTierDisplayName?.includes('Exotic')

   // find legendary armor
   const legendaryArmorTest = (inventoryItem: InventoryItem) =>
      inventoryItem.itemType === ItemTypeEnum.armor &&
      inventoryItem.itemTypeAndTierDisplayName?.includes('Legendary') &&
      Boolean(inventoryItem.quality?.versions.some((powerCap) => powerCap.powerCapHash === PowerCapHashEnum.maxPower))

   // find legendary weapons
   const legendaryWeaponTest = (inventoryItem: InventoryItem) =>
      inventoryItem.itemCategoryHashes?.includes(1) &&
      inventoryItem.itemType === ItemTypeEnum.weapon &&
      !inventoryItem.itemTypeAndTierDisplayName?.includes('Exotic') &&
      Boolean(inventoryItem.quality?.versions.some((powerCap) => powerCap.powerCapHash === PowerCapHashEnum.maxPower))

   // find subclass
   const subclassTest = (inventoryItem: InventoryItem) =>
      inventoryItem.itemType === ItemTypeEnum.subclass && inventoryItem.sockets !== undefined

   const artifact = (inventoryItem: InventoryItem) => inventoryItem.itemTypeDisplayName === 'Artifact'

   const craftingRecipe = (inventoryItem: InventoryItem) => inventoryItem.itemType === ItemTypeEnum.craftingRecipe

   const ghost = (inventoryItem: InventoryItem) => inventoryItem.itemType === ItemTypeEnum.ghost

   return Object.values(inventoryItem).reduce<Catagories>(
      (acc, item) => {
         if (exoticWeaponTest(item)) acc.exoticWeaponsArr.push(item)
         if (exoticArmorTest(item)) acc.exoticArmorArr.push(item)
         if (legendaryArmorTest(item)) acc.legendaryArmorArr.push(item)
         if (legendaryWeaponTest(item)) acc.legendaryWeaponArr.push(item)
         if (subclassTest(item)) acc.subclassArr.push(item)
         if (artifact(item)) acc.artifactArr.push(item)
         if (craftingRecipe(item)) acc.craftingRecipeArr.push(item)
         if (ghost(item)) acc.ghostArr.push(item)

         return acc
      },
      {
         exoticWeaponsArr: [],
         exoticArmorArr: [],
         legendaryArmorArr: [],
         legendaryWeaponArr: [],
         subclassArr: [],
         artifactArr: [],
         craftingRecipeArr: [],
         ghostArr: []
      }
   )
}
