import { InventoryItems, TypedObject } from '@icemourne/tool-box'

import { CompletePerkData, CompletePerkDataList } from '../main.js'

type FoldersWithSet = {
   [key: string]: {
      name: string
      hash: number
      has: Set<number>
   }
}
type FolderContent = {
   name: string
   hash: number
   has: number[]
}

type Folders = {
   [key: string]: FolderContent
}

export const createFolders = (perkDataList: CompletePerkDataList, inventoryItems: InventoryItems) => {
   const descriptionData: FoldersWithSet = {}

   const addExoticWeapon = (perkData: CompletePerkData) => {
      perkData.appearsOn.forEach((hash) => {
         const weapon = inventoryItems[hash]

         const folder = descriptionData[hash] ?? {
            name: weapon.displayProperties.name,
            hash: perkData.hash,
            has: new Set([perkData.hash])
         }
         descriptionData[hash] = folder
      })
   }

   const addWeaponFrame = (perkData: CompletePerkData) => {
      perkData.appearsOn.forEach((wepType) => {
         const folder = descriptionData[wepType] ?? {
            name: wepType,
            hash: perkData.hash,
            has: new Set([perkData.hash])
         }
         descriptionData[wepType] = folder
      })
   }

   const addEnhancedWeaponFrame = (perkData: CompletePerkData) => {
      perkData.appearsOn.forEach((wepType) => {
         const folder = descriptionData[wepType] ?? {
            name: wepType,
            hash: perkData.hash,
            has: new Set([perkData.hash])
         }
         descriptionData[wepType] = folder
      })
   }

   const addEnhancedTraits = (perk: CompletePerkData) => {
      Object.values(perkDataList).forEach((enhancedPerk) => {
         if (enhancedPerk.type === 'Weapon Trait Enhanced' && enhancedPerk.name.startsWith(perk.name)) {
            descriptionData[perk.hash] = {
               name: perk.name,
               hash: perk.hash,
               has: new Set([perk.hash, enhancedPerk.hash])
            }
         }
      })
   }

   Object.values(perkDataList).forEach((perkData) => {
      if (perkData.type === 'Weapon Frame Exotic') addExoticWeapon(perkData)
      if (perkData.type === 'Weapon Trait') addEnhancedTraits(perkData)
      if (perkData.type === 'Weapon Frame') addWeaponFrame(perkData)
      if (perkData.type === 'Weapon Frame Enhanced') addEnhancedWeaponFrame(perkData)
   })

   Object.values(perkDataList).forEach((perkData) => {
      // --- legendary weapon frames
      if (perkData.type === 'Weapon Frame') {
         perkData.appearsOn.forEach((hash) => {
            if (!descriptionData[hash]) return
            descriptionData[hash].has.add(perkData.hash)
         })
      }

      if (perkData.type === 'Weapon Frame Enhanced') {
         perkData.appearsOn.forEach((hash) => {
            if (!descriptionData[hash]) return
            descriptionData[hash].has.add(perkData.hash)
         })
      }

      // --- exotic weapons
      perkData.appearsOn.forEach((hash) => {
         if (!descriptionData[hash]) return
         descriptionData[hash].has.add(perkData.hash)
      })
   })

   return TypedObject.entries(descriptionData).reduce((acc, [hash, perk]) => {
      acc[hash] = {
         name: perk.name,
         has: Array.from(perk.has).sort((a, b) =>
            inventoryItems[a].displayProperties.name.localeCompare(inventoryItems[b].displayProperties.name)
         ),
         hash: Number(hash)
      }
      return acc
   }, {} as Folders)
}
