"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFromSocket = void 0;
const getAllFromSocket = (inventoryItems, plugSets, socket) => {
    const items = new Set();
    items.add(socket.singleInitialItemHash);
    socket.reusablePlugItems.forEach((plug) => items.add(plug.plugItemHash));
    plugSets[socket.randomizedPlugSetHash || '']?.reusablePlugItems.forEach((plug) => items.add(plug.plugItemHash));
    plugSets[socket.reusablePlugSetHash || '']?.reusablePlugItems.forEach((plug) => items.add(plug.plugItemHash));
    return [...items].filter((hash) => {
        const name = inventoryItems[hash]?.displayProperties?.name;
        return !(hash === 0 ||
            name === undefined ||
            name === '' ||
            name === 'Empty Mod Socket' ||
            name === 'Deprecated Armor Mod');
    });
};
exports.getAllFromSocket = getAllFromSocket;
