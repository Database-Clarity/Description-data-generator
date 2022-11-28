"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.armorMod = void 0;
const enums_1 = require("../utils/enums");
const getAllFromSocket_1 = require("../utils/getAllFromSocket");
const makeBasePerk_1 = require("../utils/makeBasePerk");
const armorMod = (inventoryItems, plugSets, inventoryItemLegendaryArmor) => {
    return inventoryItemLegendaryArmor.reduce((acc, armor) => {
        const armorSockets = armor.sockets;
        if (armorSockets === undefined)
            return acc;
        const modSocketCategory = armorSockets.socketCategories.find((socketCategory) => (socketCategory.socketCategoryHash === enums_1.SocketCategory.armorMods));
        modSocketCategory?.socketIndexes.forEach((socketIndex) => {
            const modsArr = (0, getAllFromSocket_1.getAllFromSocket)(inventoryItems, plugSets, armorSockets.socketEntries[socketIndex]);
            modsArr.forEach((modHash) => {
                const mod = inventoryItems[modHash];
                if (mod?.itemTypeDisplayName.match(/(General|Helmet|Arms|Chest|Leg) Armor Mod|Class Item Mod/)) {
                    acc[modHash] = (0, makeBasePerk_1.makeBasePerk)(mod, 'armorModGeneral');
                    return;
                }
                if (mod?.itemTypeDisplayName.match(/(Elemental Well|Charged with Light|Warmind Cell) Mod/)) {
                    acc[modHash] = (0, makeBasePerk_1.makeBasePerk)(mod, 'armorModCombat');
                    return;
                }
                if (mod?.itemTypeDisplayName.match(/ Raid Mod^|Nightmare Mod/)) {
                    acc[modHash] = (0, makeBasePerk_1.makeBasePerk)(mod, 'armorModActivity');
                    return;
                }
            });
        });
        return acc;
    }, {});
};
exports.armorMod = armorMod;
