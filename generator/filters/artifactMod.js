"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.artifactMod = void 0;
const makeBasePerk_1 = require("../utils/makeBasePerk");
const artifactMod = (inventoryItems, inventoryItemArtifact) => {
    return inventoryItemArtifact.reduce((acc, artifact) => {
        artifact.preview?.derivedItemCategories
            ?.flatMap((category) => category.items.flatMap((item) => item.itemHash))
            .flat()
            .forEach((modHash) => {
            if (inventoryItems[modHash].inventory.tierType !== 5 ||
                inventoryItems[modHash].itemTypeDisplayName === 'Deprecated Armor Mod')
                return;
            acc[modHash] = (0, makeBasePerk_1.makeBasePerk)(inventoryItems[modHash], 'artifactMod');
        });
        return acc;
    }, {});
};
exports.artifactMod = artifactMod;
