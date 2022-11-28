"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeBasePerk = void 0;
const makeBasePerk = (perk, type, item) => {
    return {
        name: perk.displayProperties.name,
        hash: Number(perk.hash),
        type,
        perk,
        item
    };
};
exports.makeBasePerk = makeBasePerk;
