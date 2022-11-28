"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManifest = void 0;
const justFetch = async (link, retries = 0) => {
    const resp = await fetch(link);
    if (resp.status === 200)
        return await resp.json();
    if (retries > 5)
        return;
    return await justFetch(link, retries + 1);
};
const getManifest = async () => {
    const manifest = await justFetch('https://www.bungie.net/Platform/Destiny2/Manifest/');
    if (manifest === undefined)
        throw new Error('failed getting manifest');
    const inventoryItemUrl = `https://www.bungie.net${manifest.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition}`, plugSetUrl = `https://www.bungie.net${manifest.Response.jsonWorldComponentContentPaths.en.DestinyPlugSetDefinition}`, socketTypeUrl = `https://www.bungie.net${manifest.Response.jsonWorldComponentContentPaths.en.DestinySocketTypeDefinition}`;
    const inventoryItems = await justFetch(inventoryItemUrl), plugSet = await justFetch(plugSetUrl), socketType = await justFetch(socketTypeUrl);
    if (inventoryItems === undefined || plugSet === undefined || socketType === undefined)
        throw new Error('Failed getting data');
    const newManifest = {
        inventoryItems,
        plugSet,
        socketType
    };
    return newManifest;
};
exports.getManifest = getManifest;
