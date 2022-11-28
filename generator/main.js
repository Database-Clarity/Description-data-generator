"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const armorMod_1 = require("./filters/armorMod");
const categorizeItems_1 = require("./utils/categorizeItems");
const getManifest_1 = require("./utils/getManifest");
const legendaryWeapon_1 = require("./filters/legendaryWeapon");
const subclass_1 = require("./filters/subclass");
const exoticWeapon_1 = require("./filters/exoticWeapon");
const artifactMod_1 = require("./filters/artifactMod");
const exoticArmor_1 = require("./filters/exoticArmor");
const lodash_1 = __importDefault(require("lodash"));
const fs_1 = __importDefault(require("fs"));
const weaponCraftingRecipes_1 = require("./filters/weaponCraftingRecipes");
const makeBasePerk_1 = require("./utils/makeBasePerk");
(async () => {
    const { inventoryItems, plugSet, socketType } = await (0, getManifest_1.getManifest)();
    const { exoticArmorArr, exoticWeaponsArr, legendaryArmorArr, legendaryWeaponArr, subclassArr, artifactArr, craftingRecipeArr } = (0, categorizeItems_1.categorizeItems)(inventoryItems);
    const exoticArmorList = (0, exoticArmor_1.exoticArmor)(inventoryItems, plugSet, exoticArmorArr);
    const exoticsWeaponList = (0, exoticWeapon_1.exoticsWeapon)(inventoryItems, plugSet, socketType, exoticWeaponsArr);
    // legendary weapon has to go after exotic weapon
    const legendaryWeaponList = (0, legendaryWeapon_1.legendaryWeapon)(inventoryItems, plugSet, legendaryWeaponArr);
    const armorModList = (0, armorMod_1.armorMod)(inventoryItems, plugSet, legendaryArmorArr);
    // artifact mod has to go after armor mod
    const artifactModList = (0, artifactMod_1.artifactMod)(inventoryItems, artifactArr);
    const subclassList = (0, subclass_1.subclass)(subclassArr);
    const craftingRecipeList = (0, weaponCraftingRecipes_1.weaponCraftingRecipes)(inventoryItems, plugSet, craftingRecipeArr);
    const missingPerks = {
        weaponPerk: [
            1431678320, 1968497646, 1716000303, 4134353779, 1047830412, 1561002382, 3796465595, 1687452232, 830282363,
            409831596, 3999527219, 1140096971, 466087222, 3301904089, 3373736292, 3721627275
        ]
    };
    const manualFixes = {
        // Riven's Curse
        2527938402: {
            type: 'armorModActivity'
        },
        // Transcendent Blessing
        369171376: {
            type: 'armorModActivity'
        }
    };
    const perkList = {
        ...{
            ...exoticArmorList,
            ...exoticsWeaponList,
            ...armorModList,
            ...subclassList,
            ...craftingRecipeList
        },
        ...{
            ...legendaryWeaponList,
            ...artifactModList,
            ...Object.entries(missingPerks).reduce((acc, [type, hashArr]) => {
                hashArr.forEach((hash) => {
                    acc[hash] = (0, makeBasePerk_1.makeBasePerk)(inventoryItems[hash], type);
                });
                return acc;
            }, {})
        }
    };
    const blacklisted = [712324018, 2132353550];
    const competeList = lodash_1.default.merge(lodash_1.default.omit(perkList, blacklisted), manualFixes);
    const findLinkWithItem = (perk, type) => {
        return Object.values(competeList).find((weapon) => {
            return weapon.item?.hash === perk.item?.hash && weapon.type === type;
        })?.hash;
    };
    const findLinkWithPerk = (perk, type) => {
        return Object.values(competeList).find((perkInList) => {
            return perkInList.type === type && perkInList.name.startsWith(perk.name.replace(' Enhanced', ''));
        })?.hash;
    };
    const finalList = Object.entries(competeList).reduce((acc, [hash, perk]) => {
        switch (perk.type) {
            case 'armorExotic':
                acc[hash] = {
                    hash,
                    name: perk.name,
                    itemHash: perk.item?.hash,
                    itemName: perk.item?.displayProperties.name,
                    type: perk.type
                };
                break;
            case 'weaponCatalystExotic':
                acc[hash] = {
                    hash,
                    name: perk.name,
                    itemHash: perk.item?.hash,
                    itemName: perk.item?.displayProperties.name,
                    type: perk.type,
                    linkedWith: {
                        perk: findLinkWithItem(perk, 'weaponPerkExotic'),
                        frame: findLinkWithItem(perk, 'weaponFrameExotic')
                    }
                };
                break;
            case 'weaponFrameExotic':
                acc[hash] = {
                    hash,
                    name: perk.name,
                    itemHash: perk.item?.hash,
                    itemName: perk.item?.displayProperties.name,
                    type: perk.type,
                    linkedWith: {
                        perk: findLinkWithItem(perk, 'weaponPerkExotic'),
                        catalyst: findLinkWithItem(perk, 'weaponCatalystExotic')
                    }
                };
                break;
            case 'weaponPerkExotic':
                acc[hash] = {
                    hash,
                    name: perk.name,
                    itemHash: perk.item?.hash,
                    itemName: perk.item?.displayProperties.name,
                    type: perk.type,
                    linkedWith: {
                        frame: findLinkWithItem(perk, 'weaponFrameExotic'),
                        catalyst: findLinkWithItem(perk, 'weaponCatalystExotic')
                    }
                };
                break;
            case 'weaponPerkEnhanced':
                acc[hash] = {
                    hash,
                    name: perk.name,
                    type: perk.type,
                    linkedWith: {
                        perk: findLinkWithPerk(perk, 'weaponPerk')
                    }
                };
                break;
            case 'weaponPerk':
                acc[hash] = {
                    hash,
                    name: perk.name,
                    type: perk.type,
                    linkedWith: {
                        perk: findLinkWithPerk(perk, 'weaponPerkEnhanced')
                    }
                };
                break;
            default:
                acc[hash] = {
                    hash,
                    name: perk.name,
                    type: perk.type
                };
                break;
        }
        return acc;
    }, {});
    if (!fs_1.default.existsSync('./templates')) {
        fs_1.default.mkdirSync('./templates');
    }
    const jsonStringifyCleaner = (key, value) => {
        if (typeof value === 'object' && Object.keys(value).length === 0)
            return;
        return value;
    };
    const finalListWithOutUndefined = JSON.parse(JSON.stringify(finalList));
    fs_1.default.writeFileSync('./templates/descriptions.json', JSON.stringify(finalListWithOutUndefined, jsonStringifyCleaner));
    console.log('Completed');
})();
