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
;import { makeBasePerk } from './utils/makeBasePerk'
(async () => {
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

   const missingPerks: { [key in PerkTypes]?: number[] } = {
      weaponPerk: [
         1431678320, 1968497646, 1716000303, 4134353779, 1047830412, 1561002382, 3796465595, 1687452232, 830282363,
         409831596, 3999527219, 1140096971, 466087222, 3301904089, 3373736292, 3721627275
      ]
   }

   const manualFixes = {
      // Riven's Curse
      2527938402: {
         type: 'armorModActivity'
      },
      // Transcendent Blessing
      369171376: {
         type: 'armorModActivity'
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
            hashArr.forEach((hash) => {
               acc[hash] = makeBasePerk(inventoryItems[hash], type as PerkTypes)
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
      switch (perk.type) {
         case 'armorExotic':
            acc[hash] = {
               hash,
               name: perk.name,
               itemHash: perk.item?.hash,
               itemName: perk.item?.displayProperties.name,
               type: perk.type
            }
            break
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
            }
            break
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
            }
            break
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
            }
            break
         case 'weaponPerkEnhanced':
            acc[hash] = {
               hash,
               name: perk.name,
               type: perk.type,
               linkedWith: {
                  perk: findLinkWithPerk(perk, 'weaponPerk')
               }
            }
            break
         case 'weaponPerk':
            acc[hash] = {
               hash,
               name: perk.name,
               type: perk.type,
               linkedWith: {
                  perk: findLinkWithPerk(perk, 'weaponPerkEnhanced')
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

   fs.writeFileSync('./templates/descriptions.json', JSON.stringify(finalListWithOutUndefined, jsonStringifyCleaner))
   console.log('Completed')
})()
