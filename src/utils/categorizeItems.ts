import { InventoryItem, InventoryItems } from '../interfaces/inventoryItem.interface'

interface Catagories {
   exoticWeaponsArr: InventoryItem[]
   exoticArmorArr: InventoryItem[]
   legendaryArmorArr: InventoryItem[]
   legendaryWeaponArr: InventoryItem[]
   subclassArr: InventoryItem[]
   artifactArr: InventoryItem[]
   craftingRecipeArr: InventoryItem[]
}

export const categorizeItems = (inventoryItem: InventoryItems) => {
   // find exotic weapons
   const exoticWeaponTest = (inventoryItem: InventoryItem) =>
      inventoryItem.itemCategoryHashes?.includes(1) &&
      inventoryItem.itemType === 3 &&
      inventoryItem.itemTypeAndTierDisplayName.includes('Exotic') &&
      Boolean(inventoryItem.collectibleHash)

   // find exotic armor
   const exoticArmorTest = (inventoryItem: InventoryItem) =>
      inventoryItem.itemType === 2 && inventoryItem.itemTypeAndTierDisplayName.includes('Exotic')

   // find legendary armor
   const legendaryArmorTest = (inventoryItem: InventoryItem) =>
      inventoryItem.itemType === 2 &&
      inventoryItem.itemTypeAndTierDisplayName.includes('Legendary') &&
      Boolean(inventoryItem.quality?.versions.some((powerCap) => powerCap.powerCapHash === 2759499571))

   // find legendary weapons
   const legendaryWeaponTest = (inventoryItem: InventoryItem) =>
      inventoryItem.itemCategoryHashes?.includes(1) &&
      inventoryItem.itemType === 3 &&
      !inventoryItem.itemTypeAndTierDisplayName.includes('Exotic')

   // find aspects, fragments, supers
   const subclassTest = (inventoryItem: InventoryItem) =>
      inventoryItem.itemType === 19 &&
      inventoryItem.itemCategoryHashes.includes(1043342778) &&
      !inventoryItem.displayProperties.name.startsWith('Empty ')

   const artifact = (inventoryItem: InventoryItem) => inventoryItem.itemTypeDisplayName === 'Artifact'

   const craftingRecipe = (inventoryItem: InventoryItem) => inventoryItem.itemType === 30

   return Object.values(inventoryItem).reduce<Catagories>(
      (acc, item) => {
         if (exoticWeaponTest(item)) acc.exoticWeaponsArr.push(item)
         if (exoticArmorTest(item)) acc.exoticArmorArr.push(item)
         if (legendaryArmorTest(item)) acc.legendaryArmorArr.push(item)
         if (legendaryWeaponTest(item)) acc.legendaryWeaponArr.push(item)
         if (subclassTest(item)) acc.subclassArr.push(item)
         if (artifact(item)) acc.artifactArr.push(item)
         if (craftingRecipe(item)) acc.craftingRecipeArr.push(item)

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
      }
   )
}
