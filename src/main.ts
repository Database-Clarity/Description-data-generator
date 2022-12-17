import { armorMod } from './filters/armorMod'
import { categorizeItems } from './utils/categorizeItems'
import { getManifest } from './utils/getManifest'
import { legendaryWeapon } from './filters/legendaryWeapon'
import { subclass } from './filters/subclass'
import { exoticsWeapon } from './filters/exoticWeapon'
import { BasePerk, PerkTypes } from './interfaces/editor.interface'
import { artifactMod } from './filters/artifactMod'
import { exoticArmor } from './filters/exoticArmor'

import _ from 'lodash'
import fs from 'fs'
import { weaponCraftingRecipes } from './filters/weaponCraftingRecipes'
import { makeBasePerk } from './utils/makeBasePerk'
;(async () => {
   const { inventoryItems, plugSet, socketType } = await getManifest()

   const {
      exoticArmorArr,
      exoticWeaponsArr,
      legendaryArmorArr,
      legendaryWeaponArr,
      subclassArr,
      artifactArr,
      craftingRecipeArr
   } = categorizeItems(inventoryItems)

   const exoticArmorList = exoticArmor(inventoryItems, plugSet, exoticArmorArr)
   const exoticsWeaponList = exoticsWeapon(inventoryItems, plugSet, socketType, exoticWeaponsArr)
   // legendary weapon has to go after exotic weapon
   const legendaryWeaponList = legendaryWeapon(inventoryItems, plugSet, legendaryWeaponArr)
   const armorModList = armorMod(inventoryItems, plugSet, legendaryArmorArr)
   // artifact mod has to go after armor mod
   const artifactModList = artifactMod(inventoryItems, artifactArr)
   const subclassList = subclass(subclassArr)
   const craftingRecipeList = weaponCraftingRecipes(inventoryItems, plugSet, craftingRecipeArr)

   const missingPerks: { [key in PerkTypes]?: { perk: number; item?: number }[] } = {
      'Weapon Perk': [
         { perk: 1431678320 }, // Alloy Magazine
         { perk: 1968497646 }, // Armor-Piercing Rounds
         { perk: 1716000303 }, // Concussion Grenades
         { perk: 4134353779 }, // Drop Mag
         { perk: 1047830412 }, // Full Choke
         { perk: 1561002382 }, // High-Caliber Rounds
         { perk: 3796465595 }, // Impact Casing
         { perk: 1687452232 }, // Liquid Coils
         { perk: 830282363 }, //  Phase Magazine
         { perk: 409831596 }, //  Proximity Grenades
         { perk: 3999527219 }, // Remote Detonation
         { perk: 1140096971 }, // Seraph Rounds
         { perk: 466087222 }, //  Smoothbore
         { perk: 3301904089 }, // Spike Grenades
         { perk: 3373736292 }, // Sticky Grenades
         { perk: 3721627275 }, // Swap Mag
         { perk: 689005463 }, //  Accelerated Coils
         { perk: 3032599245 }, // Blinding Grenades
         { perk: 1885400500 }, // Ricochet Rounds
         { perk: 806159697 }, //  Trench Barrel
      ],
      'Armor Perk Exotic': [
         { perk: 3651607301, item: 1654461647 }, // Sect of Insight // Aeon Safe
         { perk: 3683811620, item: 2950045886 }, // Sect of Vigor   // Aeon Sou
         { perk: 3268255645, item: 3942036043 } //  Sect of Force   // Aeon Swift
      ],
      'Armor Mod Activity': [
         { perk: 369171376 }, // Transcendent Blessing
      ]
   }

   const manualFixes: { [key: string]: { type?: PerkTypes } } = {
      // Riven's Curse
      2527938402: {
         type: 'Armor Mod Activity'
      }
   }

   const perkList: { [key: string]: BasePerk } = {
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
         ...Object.entries(missingPerks).reduce<{ [key: string]: BasePerk }>((acc, [type, hashArr]) => {
            hashArr.forEach((data) => {
               const {perk, item} = data
               if (item) {
                  acc[perk] = makeBasePerk(inventoryItems[perk], type as PerkTypes, inventoryItems[item])
               } else {
                  acc[perk] = makeBasePerk(inventoryItems[perk], type as PerkTypes)
               }
            })
            return acc
         }, {})
      }
   }

   const blacklisted = [712324018, 2132353550]

   const competeList = _.merge(_.omit(perkList, blacklisted), manualFixes) as unknown as BasePerk

   const findLinkWithItem = (perk: BasePerk, type: PerkTypes) => {
      return Object.values(competeList).find((weapon) => {
         return weapon.item?.hash === perk.item?.hash && weapon.type === type
      })?.hash
   }
   const findLinkWithPerk = (perk: BasePerk, type: PerkTypes) => {
      return Object.values(competeList).find((perkInList) => {
         return perkInList.type === type && perkInList.name.startsWith(perk.name.replace(' Enhanced', ''))
      })?.hash
   }

   const finalList = Object.entries(competeList).reduce<{ [key: string]: any }>((acc, [hash, perk]) => {
      switch (perk.type as PerkTypes) {
         case 'Armor Perk Exotic':
            acc[hash] = {
               hash,
               name: perk.name,
               itemHash: perk.item?.hash,
               itemName: perk.item?.displayProperties.name,
               type: perk.type
            }
            break
         case 'Weapon Catalyst Exotic':
            acc[hash] = {
               hash,
               name: perk.name,
               itemHash: perk.item?.hash,
               itemName: perk.item?.displayProperties.name,
               type: perk.type,
               linkedWith: {
                  perk: findLinkWithItem(perk, 'Weapon Perk Exotic'),
                  frame: findLinkWithItem(perk, 'Weapon Frame Exotic')
               }
            }
            break
         case 'Weapon Frame Exotic':
            acc[hash] = {
               hash,
               name: perk.name,
               itemHash: perk.item?.hash,
               itemName: perk.item?.displayProperties.name,
               type: perk.type,
               linkedWith: {
                  perk: findLinkWithItem(perk, 'Weapon Perk Exotic'),
                  catalyst: findLinkWithItem(perk, 'Weapon Catalyst Exotic')
               }
            }
            break
         case 'Weapon Perk Exotic':
            acc[hash] = {
               hash,
               name: perk.name,
               itemHash: perk.item?.hash,
               itemName: perk.item?.displayProperties.name,
               type: perk.type,
               linkedWith: {
                  frame: findLinkWithItem(perk, 'Weapon Frame Exotic'),
                  catalyst: findLinkWithItem(perk, 'Weapon Catalyst Exotic')
               }
            }
            break
         case 'Weapon Perk Enhanced':
            acc[hash] = {
               hash,
               name: perk.name,
               type: perk.type,
               linkedWith: {
                  perk: findLinkWithPerk(perk, 'Weapon Perk')
               }
            }
            break
         case 'Weapon Perk':
            acc[hash] = {
               hash,
               name: perk.name,
               type: perk.type,
               linkedWith: {
                  perk: findLinkWithPerk(perk, 'Weapon Perk Enhanced')
               }
            }
            break
         default:
            acc[hash] = {
               hash,
               name: perk.name,
               type: perk.type
            }
            break
      }
      return acc
   }, {})

   if (!fs.existsSync('./templates')) {
      fs.mkdirSync('./templates')
   }

   const jsonStringifyCleaner = (key: string, value: any) => {
      if (typeof value === 'object' && Object.keys(value).length === 0) return
      return value
   }

   const finalListWithOutUndefined = JSON.parse(JSON.stringify(finalList))

   fs.writeFileSync('./templates/descriptions.json', JSON.stringify(finalListWithOutUndefined, jsonStringifyCleaner, 1))
   console.log('Completed')
})()
