"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subclass = void 0;
const makeBasePerk_1 = require("../utils/makeBasePerk");
const subclass = (inventoryItemSubclass) => {
    return inventoryItemSubclass.reduce((acc, subclassThing) => {
        const hash = subclassThing.hash;
        if (subclassThing?.itemTypeDisplayName.includes('Grenade')) {
            acc[hash] = (0, makeBasePerk_1.makeBasePerk)(subclassThing, 'grenade');
            return acc;
        }
        if (subclassThing?.itemTypeDisplayName.includes('Movement Ability')) {
            acc[hash] = (0, makeBasePerk_1.makeBasePerk)(subclassThing, 'movement');
            return acc;
        }
        if (subclassThing?.itemTypeDisplayName.includes('Class Ability')) {
            acc[hash] = (0, makeBasePerk_1.makeBasePerk)(subclassThing, 'class');
            return acc;
        }
        if (subclassThing?.itemTypeDisplayName.includes('Fragment')) {
            acc[hash] = (0, makeBasePerk_1.makeBasePerk)(subclassThing, 'fragment');
            return acc;
        }
        if (subclassThing?.itemTypeDisplayName.includes('Aspect')) {
            acc[hash] = (0, makeBasePerk_1.makeBasePerk)(subclassThing, 'aspect');
            return acc;
        }
        if (subclassThing?.itemTypeDisplayName.includes('Super Ability')) {
            acc[hash] = (0, makeBasePerk_1.makeBasePerk)(subclassThing, 'super');
            return acc;
        }
        if (subclassThing?.itemTypeDisplayName.includes('Melee')) {
            acc[hash] = (0, makeBasePerk_1.makeBasePerk)(subclassThing, 'melee');
            return acc;
        }
        return acc;
    }, {});
};
exports.subclass = subclass;
