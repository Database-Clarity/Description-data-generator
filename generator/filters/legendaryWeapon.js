"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legendaryWeapon = void 0;
const enums_1 = require("../utils/enums");
const getAllFromSocket_1 = require("../utils/getAllFromSocket");
const makeBasePerk_1 = require("../utils/makeBasePerk");
const legendaryWeapon = (inventoryItems, plugSets, inventoryItemLegendaryWeapon) => {
    return inventoryItemLegendaryWeapon.reduce((acc, weapon) => {
        const weaponSockets = weapon.sockets;
        if (weaponSockets === undefined)
            return acc;
        const frameSocketCategory = weaponSockets.socketCategories.find((socketCategory) => (socketCategory.socketCategoryHash === enums_1.SocketCategory.weaponFrame));
        const perkSocketCategory = weaponSockets.socketCategories.find((socketCategory) => (socketCategory.socketCategoryHash === enums_1.SocketCategory.weaponPerks));
        const modSocketCategory = weaponSockets.socketCategories.find((socketCategory) => (socketCategory.socketCategoryHash === enums_1.SocketCategory.weaponMods));
        frameSocketCategory?.socketIndexes.forEach((socketIndex) => {
            const frameArr = (0, getAllFromSocket_1.getAllFromSocket)(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex]);
            frameArr.forEach((frameHash) => {
                const frame = inventoryItems[frameHash];
                if (frame?.itemTypeDisplayName === 'Intrinsic') {
                    acc[frameHash] = (0, makeBasePerk_1.makeBasePerk)(frame, 'weaponFrame');
                    return;
                }
            });
        });
        perkSocketCategory?.socketIndexes.forEach((socketIndex) => {
            const perkArr = (0, getAllFromSocket_1.getAllFromSocket)(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex]);
            perkArr.forEach((perkHash) => {
                const perk = inventoryItems[perkHash];
                if (perk?.itemTypeDisplayName === 'Trait') {
                    acc[perkHash] = (0, makeBasePerk_1.makeBasePerk)(perk, 'weaponPerk');
                    return;
                }
                if (perk?.itemTypeDisplayName === 'Origin Trait') {
                    acc[perkHash] = (0, makeBasePerk_1.makeBasePerk)(perk, 'weaponOriginTrait');
                    return;
                }
            });
        });
        modSocketCategory?.socketIndexes.forEach((socketIndex) => {
            const modArr = (0, getAllFromSocket_1.getAllFromSocket)(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex]);
            modArr.forEach((modHash) => {
                const mod = inventoryItems[modHash];
                if (mod?.itemTypeDisplayName === 'Weapon Mod') {
                    acc[modHash] = (0, makeBasePerk_1.makeBasePerk)(mod, 'weaponMod');
                    return;
                }
            });
        });
        return acc;
    }, {});
};
exports.legendaryWeapon = legendaryWeapon;
