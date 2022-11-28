"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exoticArmor = void 0;
const enums_1 = require("../utils/enums");
const getAllFromSocket_1 = require("../utils/getAllFromSocket");
const makeBasePerk_1 = require("../utils/makeBasePerk");
const exoticArmor = (inventoryItems, plugSets, inventoryItemExoticArmor) => inventoryItemExoticArmor.reduce((acc, armor) => {
    const armorSockets = armor.sockets;
    if (armorSockets === undefined)
        return acc;
    const perkSocketCategory = armorSockets.socketCategories.find((socketCategory) => (socketCategory.socketCategoryHash === enums_1.SocketCategory.armorPerks));
    perkSocketCategory?.socketIndexes.forEach((socketIndex) => {
        const perkArr = (0, getAllFromSocket_1.getAllFromSocket)(inventoryItems, plugSets, armorSockets.socketEntries[socketIndex]);
        perkArr.forEach((perkHash) => {
            const perk = inventoryItems[perkHash];
            if (perk.itemTypeDisplayName === 'Intrinsic' || perk.itemTypeDisplayName === 'Aeon Cult Mod') {
                acc[perkHash] = (0, makeBasePerk_1.makeBasePerk)(perk, 'armorExotic', armor);
                return;
            }
        });
    });
    return acc;
}, {});
exports.exoticArmor = exoticArmor;
