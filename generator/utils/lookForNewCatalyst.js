"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookForNewCatalyst = void 0;
const lookForNewCatalyst = (socketTypes, hash) => {
    const catalystHashes = socketTypes[hash].plugWhitelist.flatMap((socket) => {
        if (socket.reinitializationPossiblePlugHashes)
            return socket.reinitializationPossiblePlugHashes;
        return [];
    });
    if (catalystHashes.length === 0)
        return;
    return catalystHashes;
};
exports.lookForNewCatalyst = lookForNewCatalyst;
