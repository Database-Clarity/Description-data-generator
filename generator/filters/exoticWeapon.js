"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exoticsWeapon = void 0;
const enums_1 = require("../utils/enums");
const getAllFromSocket_1 = require("../utils/getAllFromSocket");
const lookForNewCatalyst_1 = require("../utils/lookForNewCatalyst");
const makeBasePerk_1 = require("../utils/makeBasePerk");
const exoticsWeapon = (inventoryItems, plugSets, socketTypes, inventoryItemExoticWeapon) => {
    return inventoryItemExoticWeapon.reduce((acc, weapon) => {
        const weaponSockets = weapon.sockets;
        if (weaponSockets === undefined)
            return acc;
        const frameSocketCategory = weaponSockets.socketCategories.find((socketCategory) => (socketCategory.socketCategoryHash === enums_1.SocketCategory.weaponFrame));
        const perkSocketCategory = weaponSockets.socketCategories.find((socketCategory) => (socketCategory.socketCategoryHash === enums_1.SocketCategory.weaponPerks));
        const catalystSocketCategory = weaponSockets.socketCategories.find((socketCategory) => (socketCategory.socketCategoryHash === enums_1.SocketCategory.weaponMods));
        frameSocketCategory?.socketIndexes.forEach((socketIndex) => {
            const frameArr = (0, getAllFromSocket_1.getAllFromSocket)(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex]);
            frameArr.forEach((frameHash) => {
                const frame = inventoryItems[frameHash];
                if (frame?.itemTypeDisplayName === 'Intrinsic') {
                    acc[frameHash] = (0, makeBasePerk_1.makeBasePerk)(frame, 'weaponFrameExotic', weapon);
                    return;
                }
            });
        });
        perkSocketCategory?.socketIndexes.forEach((socketIndex) => {
            const perkArr = (0, getAllFromSocket_1.getAllFromSocket)(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex]);
            perkArr.forEach((perkHash) => {
                const perk = inventoryItems[perkHash];
                if (perk?.itemTypeDisplayName === 'Trait') {
                    acc[perkHash] = (0, makeBasePerk_1.makeBasePerk)(perk, 'weaponPerkExotic', weapon);
                    return;
                }
            });
        });
        catalystSocketCategory?.socketIndexes.forEach((socketIndex) => {
            // Because of Bungie spaghetti code we have to check if exotic has replacement catalyst
            const socket = weaponSockets.socketEntries[socketIndex];
            const catalystArr = (0, lookForNewCatalyst_1.lookForNewCatalyst)(socketTypes, socket.socketTypeHash) ||
                (0, getAllFromSocket_1.getAllFromSocket)(inventoryItems, plugSets, weaponSockets.socketEntries[socketIndex]);
            catalystArr.forEach((catalystHash) => {
                const catalyst = inventoryItems[catalystHash];
                if (catalyst?.displayProperties.name.endsWith(' Catalyst')) {
                    acc[catalystHash] = (0, makeBasePerk_1.makeBasePerk)(catalyst, 'weaponCatalystExotic', weapon);
                    return;
                }
            });
        });
        return acc;
    }, {});
};
exports.exoticsWeapon = exoticsWeapon;
