"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weaponCraftingRecipes = void 0;
const enums_1 = require("../utils/enums");
const getAllFromSocket_1 = require("../utils/getAllFromSocket");
const makeBasePerk_1 = require("../utils/makeBasePerk");
const weaponCraftingRecipes = (inventoryItems, plugSets, inventoryItemCraftingRecipes) => {
    return inventoryItemCraftingRecipes.reduce((acc, weapon) => {
        const weaponSockets = weapon.sockets;
        if (weaponSockets === undefined)
            return acc;
        const craftingSocketCategory = weaponSockets.socketCategories.find((socketCategory) => socketCategory.socketCategoryHash === enums_1.SocketCategory.weaponCraftingPerks);
        craftingSocketCategory?.socketIndexes.forEach((socketIndex) => {
            const craftingArr = (0, getAllFromSocket_1.getAllFromSocket)(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex]);
            craftingArr.forEach((craftingHash) => {
                const craftingStuff = inventoryItems[craftingHash];
                const newWeaponHash = weapon?.crafting?.outputItemHash;
                const newWeapon = inventoryItems[newWeaponHash || ''];
                const isExotic = craftingStuff.inventory.tierTypeName === 'Exotic';
                if (craftingStuff?.itemTypeDisplayName === 'Intrinsic' ||
                    craftingStuff?.itemTypeDisplayName === 'Enhanced Intrinsic') {
                    const type = isExotic ? 'weaponFrameExotic' : 'weaponFrame';
                    acc[craftingHash] = (0, makeBasePerk_1.makeBasePerk)(craftingStuff, type, newWeapon);
                    return;
                }
                if (craftingStuff?.itemTypeDisplayName === 'Trait') {
                    const type = isExotic ? 'weaponPerkExotic' : 'weaponPerk';
                    acc[craftingHash] = (0, makeBasePerk_1.makeBasePerk)(craftingStuff, type, newWeapon);
                    return;
                }
                if (craftingStuff?.itemTypeDisplayName === 'Enhanced Trait') {
                    acc[craftingHash] = (0, makeBasePerk_1.makeBasePerk)(craftingStuff, 'weaponPerkEnhanced', newWeapon);
                    return;
                }
                if (craftingStuff?.itemTypeDisplayName === 'Origin Trait') {
                    acc[craftingHash] = (0, makeBasePerk_1.makeBasePerk)(craftingStuff, 'weaponOriginTrait', newWeapon);
                    return;
                }
                if (craftingStuff?.displayProperties.name.endsWith(' Catalyst')) {
                    acc[craftingHash] = (0, makeBasePerk_1.makeBasePerk)(craftingStuff, 'weaponCatalystExotic', newWeapon);
                    return;
                }
            });
        });
        return acc;
    }, {});
};
exports.weaponCraftingRecipes = weaponCraftingRecipes;
