import { armorMods } from './filters/armorMod.js'
import { artifactMods } from './filters/artifactMod.js'
import { exoticArmors } from './filters/exoticArmor.js'
import { exoticsWeapons } from './filters/exoticWeapon.js'
import { ghostMods } from './filters/ghostMods.js'
import { legendaryWeapons } from './filters/legendaryWeapon.js'
import { subclass } from './filters/subclass.js'
import { weaponCraftingRecipes } from './filters/weaponCraftingRecipes.js'
import {
  armorModsLinking as armorModLinking,
  enhancedPerkLinking,
  exoticWeaponLinking,
  originTraitsLinking as originTraitLinking,
  weaponFramesLinking as weaponFrameLinking,
} from './utils/perkLinking.js'
import { updateData } from './utils/postgres.js'
import { fetchBungie } from './utils/fetchBungieManifest.js'
import { Language, PerkTypes } from './utils/bungieTypes/manifest.js'
import { timeTracker } from './utils/timeTracker.js'
import fs from 'fs'

export type PerkData = {
  appearsOn: Set<string | number>
  name: string
  hash: number
  type: PerkTypes
  linkedWith?: number[]
}

export type PerkDataList = {
  [key: string]: PerkData
}

export type FinalData = {
  [key: string]: {
    appearsOn: (string | number)[]
    name: { [key in Language]: string }
    itemName: { [key in Language]: string } | null
    hash: number
    itemHash: number | null
    type: PerkTypes
    icon: string
    itemIcon: string | null
    linkedWith: number[] | null
  }
}
;(async () => {
  timeTracker.start()

  const {
    en: { inventoryItem, plugSet, socketType },
  } = await fetchBungie(['inventoryItem', 'plugSet', 'socketType'], ['en'])

  if (inventoryItem === undefined || plugSet === undefined || socketType === undefined) {
    throw new Error('Failed to fetch manifest')
  }

  for (const key in inventoryItem) {
    const item = inventoryItem[key]

    if (
      (item.itemType === 2 || item.itemType === 3) &&
      !Boolean(item.quality?.versions.some((powerCap) => powerCap.powerCapHash === 2759499571)) // 2759499571 = 999990 power cap
    ) {
      // remove weapons and armor with power cap
      delete inventoryItem[key]
      continue
    }

    // remove deprecated items
    if (item.displayProperties.description.match(/deprecated/i) || item.displayProperties.name.match(/deprecated/i)) {
      delete inventoryItem[key]
      continue
    }

    // remove shaders
    if (item.itemTypeDisplayName === 'Shader' || item.itemCategoryHashes?.includes(41) || item.itemSubType === 20) {
      delete inventoryItem[key]
      continue
    }

    // remove trackers
    if (item.plug?.plugCategoryHash === 2947756142) {
      delete inventoryItem[key]
      continue
    }

    // remove ornaments
    if (
      item.itemCategoryHashes?.includes(56) ||
      item.itemSubType === 21 ||
      item.itemTypeDisplayName?.endsWith('Ornament')
    ) {
      delete inventoryItem[key]
      continue
    }

    // remove dummy items
    if (item.itemType === 20 || item.itemCategoryHashes?.includes(3109687656)) {
      delete inventoryItem[key]
      continue
    }

    // remove items with out name
    if (item.displayProperties.name === '') {
      delete inventoryItem[key]
      continue
    }

    // remove masterworks
    if (item.plug?.plugCategoryIdentifier.match(/masterwork/i))
      if (
        item.plug?.plugCategoryIdentifier.match(/stat|kills|armor|ghosts/i) ||
        item.plug?.uiPlugLabel.match(/interactable/i)
      ) {
        delete inventoryItem[key]
        continue
      }

    // remove memento
    if (item.itemTypeAndTierDisplayName?.match(/memento/i)) {
      delete inventoryItem[key]
      continue
    }

    // remove empty sockets
    if (item.displayProperties.name?.match(/empty [\s\S]+ socket/i)) {
      delete inventoryItem[key]
      continue
    }

    // remove classified, redacted items
    if (item.redacted || item.displayProperties.name?.match(/classified/i)) {
      delete inventoryItem[key]
      continue
    }

    // remove stat mods
    if (
      item.displayProperties.name.match(/(Resilience|Recovery|Discipline|Mobility|Strength|Intellect)( Mod|-Forged)/i)
    ) {
      delete inventoryItem[key]
      continue
    }

    // black listing random stuff
    if (
      item.itemTypeDisplayName === 'Solstice Embers' ||
      item.itemTypeDisplayName === 'Kindling' ||
      item.displayProperties.name === 'Reset Artifact' ||
      item.displayProperties.icon === '/common/destiny2_content/icons/564c4604b7e78e78bf126359b91990e5.jpg' // pink icon
    ) {
      delete inventoryItem[key]
      continue
    }

    // remove bungie fuckups
    if (
      item.hash === 2132353550 || // osteo striga catalyst // can't be equipped
      item.hash === 712324018 || //  transformative perk   // basically place holder
      item.hash === 1906855381 || // aeon safe             // dummy item
      item.hash === 2076339106 || // aeon soul             // dummy item
      item.hash === 1656912113 //    aeon swift            // dummy item
    ) {
      delete inventoryItem[key]
      continue
    }

    // remove random crap
    // this is just to reduce number of items to process
    const randomCrap_itemType = new Set([9, 12, 14, 15, 17, 21, 22, 25, 26])
    const randomCrap_itemCategoryHashes = new Set([
      34, 43, 44, 53, 56, 58, 1404791674, 1112488720, 208981632, 874645359, 1873949940,
    ])
    if (
      randomCrap_itemType.has(item.itemType) ||
      item.itemCategoryHashes?.some((hash) => randomCrap_itemCategoryHashes.has(hash)) ||
      item.displayProperties.name === 'Legendary Engram' ||
      item.displayProperties.name === 'Deepsight Resonance' ||
      item.displayProperties.name === 'Extract Pattern' ||
      item.displayProperties.name === 'Locked Armor Mod' ||
      item.displayProperties.name === 'Trait Locked' ||
      item.itemTypeDisplayName === 'Material' ||
      item.itemTypeDisplayName === 'Armor Set' ||
      item.itemTypeDisplayName?.replaceAll('"', '') === 'Holiday Gift' ||
      item.itemTypeDisplayName?.endsWith('Engram') ||
      item.itemTypeDisplayName?.endsWith('Currency') ||
      (item.itemType === 0 && item.quality?.versions.some((x) => x.powerCapHash === 2759499571))
    ) {
      delete inventoryItem[key]
      continue
    }
  }

  const data: PerkDataList = {}

  // these \/ functions modify data object
  armorMods(inventoryItem, plugSet, data)
  artifactMods(inventoryItem, data)
  exoticArmors(inventoryItem, plugSet, data)
  exoticsWeapons(inventoryItem, plugSet, socketType, data)
  ghostMods(inventoryItem, plugSet, data)
  legendaryWeapons(inventoryItem, plugSet, data)
  subclass(inventoryItem, plugSet, data)
  weaponCraftingRecipes(inventoryItem, plugSet, data)

  exoticWeaponLinking(data, inventoryItem)
  weaponFrameLinking(data)
  originTraitLinking(data)
  armorModLinking(data)
  enhancedPerkLinking(data)
  // these /\ functions modify data object

  const fixAppearsOn = (data: (string | number)[]) => {
    const dataArr = data.map((x) => {
      if (typeof x === 'string') return x
      return inventoryItem[x].itemTypeDisplayName!
    })
    return [...new Set(dataArr)]
  }

  const {
    de: { inventoryItemLite: invLightDe },
    es: { inventoryItemLite: invLightEs },
    'es-mx': { inventoryItemLite: invLightEsMx },
    fr: { inventoryItemLite: invLightFr },
    it: { inventoryItemLite: invLightIt },
    ja: { inventoryItemLite: invLightJa },
    ko: { inventoryItemLite: invLightKo },
    pl: { inventoryItemLite: invLightPl },
    'pt-br': { inventoryItemLite: invLightPtBr },
    ru: { inventoryItemLite: invLightRu },
    'zh-chs': { inventoryItemLite: invLightZhChs },
    'zh-cht': { inventoryItemLite: invLightZhCht },
  } = await fetchBungie(['inventoryItemLite'], 'all')

  const finalData = Object.entries(data).reduce((acc, [key, item]) => {
    const appearsOnArr = Array.from(item.appearsOn)
    const isLegendary = appearsOnArr.some((x) => typeof x === 'string')

    // change exotic hash to name on legendary perks
    const appearsOn = isLegendary ? fixAppearsOn(appearsOnArr) : appearsOnArr

    const itemHash = appearsOn.every((value) => typeof value === 'number') ? (appearsOn[0] as number) : null

    acc[key] = {
      appearsOn,
      name: {
        en: item.name,
        de: invLightDe[key].displayProperties.name,
        es: invLightEs[key].displayProperties.name,
        'es-mx': invLightEsMx[key].displayProperties.name,
        fr: invLightFr[key].displayProperties.name,
        it: invLightIt[key].displayProperties.name,
        ja: invLightJa[key].displayProperties.name,
        ko: invLightKo[key].displayProperties.name,
        pl: invLightPl[key].displayProperties.name,
        'pt-br': invLightPtBr[key].displayProperties.name,
        ru: invLightRu[key].displayProperties.name,
        'zh-chs': invLightZhChs[key].displayProperties.name,
        'zh-cht': invLightZhCht[key].displayProperties.name,
      },
      itemName: itemHash
        ? {
            en: inventoryItem[itemHash].displayProperties.name,
            de: invLightDe[itemHash].displayProperties.name,
            es: invLightEs[itemHash].displayProperties.name,
            'es-mx': invLightEsMx[itemHash].displayProperties.name,
            fr: invLightFr[itemHash].displayProperties.name,
            it: invLightIt[itemHash].displayProperties.name,
            ja: invLightJa[itemHash].displayProperties.name,
            ko: invLightKo[itemHash].displayProperties.name,
            pl: invLightPl[itemHash].displayProperties.name,
            'pt-br': invLightPtBr[itemHash].displayProperties.name,
            ru: invLightRu[itemHash].displayProperties.name,
            'zh-chs': invLightZhChs[itemHash].displayProperties.name,
            'zh-cht': invLightZhCht[itemHash].displayProperties.name,
          }
        : null,
      icon: inventoryItem[key].displayProperties.icon?.replace('/common/destiny2_content/icons', '') || '',
      itemIcon: itemHash
        ? inventoryItem[itemHash].displayProperties.icon?.replace('/common/destiny2_content/icons', '') || ''
        : null,
      hash: item.hash,
      itemHash,
      type: item.type,
      linkedWith: item.linkedWith?.length !== 0 ? item.linkedWith || null : null,
    }

    return acc
  }, {} as FinalData)

  await updateData(finalData)

  timeTracker.stop()
  console.log('Completed in', timeTracker.getElapsedTime())
})()
