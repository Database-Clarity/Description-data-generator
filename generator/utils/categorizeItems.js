"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorizeItems = void 0;
const categorizeItems = (inventoryItem) => {
    // find exotic weapons
    const exoticWeaponTest = (inventoryItem) => inventoryItem.itemCategoryHashes?.includes(1) &&
        inventoryItem.itemType === 3 &&
        inventoryItem.itemTypeAndTierDisplayName.includes('Exotic') &&
        Boolean(inventoryItem.collectibleHash);
    // find exotic armor
    const exoticArmorTest = (inventoryItem) => inventoryItem.itemType === 2 && inventoryItem.itemTypeAndTierDisplayName.includes('Exotic');
    // find legendary armor
    const legendaryArmorTest = (inventoryItem) => inventoryItem.itemType === 2 &&
        inventoryItem.itemTypeAndTierDisplayName.includes('Legendary') &&
        Boolean(inventoryItem.quality?.versions.some((powerCap) => powerCap.powerCapHash === 2759499571));
    // find legendary weapons
    const legendaryWeaponTest = (inventoryItem) => inventoryItem.itemCategoryHashes?.includes(1) &&
        inventoryItem.itemType === 3 &&
        !inventoryItem.itemTypeAndTierDisplayName.includes('Exotic');
    // find aspects, fragments, supers
    const subclassTest = (inventoryItem) => inventoryItem.itemType === 19 &&
        inventoryItem.itemCategoryHashes.includes(1043342778) &&
        !inventoryItem.displayProperties.name.startsWith('Empty ');
    const artifact = (inventoryItem) => inventoryItem.itemTypeDisplayName === 'Artifact';
    const craftingRecipe = (inventoryItem) => inventoryItem.itemType === 30;
    return Object.values(inventoryItem).reduce((acc, item) => {
        if (exoticWeaponTest(item))
            acc.exoticWeaponsArr.push(item);
        if (exoticArmorTest(item))
            acc.exoticArmorArr.push(item);
        if (legendaryArmorTest(item))
            acc.legendaryArmorArr.push(item);
        if (legendaryWeaponTest(item))
            acc.legendaryWeaponArr.push(item);
        if (subclassTest(item))
            acc.subclassArr.push(item);
        if (artifact(item))
            acc.artifactArr.push(item);
        if (craftingRecipe(item))
            acc.craftingRecipeArr.push(item);
        return acc;
    }, {
        exoticWeaponsArr: [],
        exoticArmorArr: [],
        legendaryArmorArr: [],
        legendaryWeaponArr: [],
        subclassArr: [],
        artifactArr: [],
        craftingRecipeArr: [],
    });
};
exports.categorizeItems = categorizeItems;
