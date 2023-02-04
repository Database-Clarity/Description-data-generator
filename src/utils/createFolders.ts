import { InventoryItems, TypedObject } from '@icemourne/tool-box'

import { CompletePerkData, CompletePerkDataList } from '../main.js'

type FolderTypes = 'exoticWeapons' | 'enhancedTraitLinking' | 'legendaryWepFrames' | 'enhancedLegendaryWeaponFrames'

type FoldersWithSet = {
   [key in FolderTypes]: {
      [key: string]: {
         name: string
         has: Set<number>
         hash?: number
      }
   }
}
type FolderContent = {
   name: string
   has: number[]
   hash?: number
}

type Folders = {
   [key in FolderTypes]: FolderContent[]
}

export const createFolders = (perkDataList: CompletePerkDataList, inventoryItems: InventoryItems) => {
   const descriptionData: FoldersWithSet = {
      exoticWeapons: {},
      enhancedTraitLinking: {},
      legendaryWepFrames: {},
      enhancedLegendaryWeaponFrames: {}
   }

   const addExoticWeapon = (perkData: CompletePerkData) => {
      perkData.appearsOn.forEach((hash) => {
         const weapon = inventoryItems[hash]

         const folder = descriptionData.exoticWeapons[hash] ?? {
            name: weapon.displayProperties.name,
            has: new Set([perkData.hash])
         }
         descriptionData.exoticWeapons[hash] = folder
      })
   }

   const addWeaponFrame = (perkData: CompletePerkData) => {
      perkData.appearsOn.forEach((wepType) => {
         const folder = descriptionData.legendaryWepFrames[wepType] ?? {
            name: wepType,
            has: new Set([perkData.hash])
         }
         descriptionData.legendaryWepFrames[wepType] = folder
      })
   }

   const addEnhancedWeaponFrame = (perkData: CompletePerkData) => {
      perkData.appearsOn.forEach((wepType) => {
         const folder = descriptionData.enhancedLegendaryWeaponFrames[wepType] ?? {
            name: wepType,
            has: new Set([perkData.hash])
         }
         descriptionData.enhancedLegendaryWeaponFrames[wepType] = folder
      })
   }

   const addEnhancedTraits = (perkData: CompletePerkData) => {
      Object.values(perkDataList).forEach((perk) => {
         if (perk.type === 'Weapon Trait Enhanced' && perk.name.startsWith(perkData.name)) {
            descriptionData.enhancedTraitLinking[perkData.hash] = {
               name: perkData.name,
               has: new Set([perk.hash, perkData.hash])
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
            if (!descriptionData.legendaryWepFrames[hash]) return
            descriptionData.legendaryWepFrames[hash].has.add(perkData.hash)
         })
      }

      if (perkData.type === 'Weapon Frame Enhanced') {
         perkData.appearsOn.forEach((hash) => {
            if (!descriptionData.enhancedLegendaryWeaponFrames[hash]) return
            descriptionData.enhancedLegendaryWeaponFrames[hash].has.add(perkData.hash)
         })
      }

      // --- exotic weapons
      perkData.appearsOn.forEach((hash) => {
         if (!descriptionData.exoticWeapons[hash]) return
         descriptionData.exoticWeapons[hash].has.add(perkData.hash)
      })
   })

   return TypedObject.entries(descriptionData).reduce((acc, [folderName, folder]) => {
      acc[folderName] = Object.entries(folder)
         .reduce<FolderContent[]>((acc, [hash, folder]) => {
            acc.push(
               folder.hash
                  ? {
                       name: folder.name,
                       has: Array.from(folder.has),
                       hash: Number(hash)
                    }
                  : {
                       name: folder.name,
                       has: Array.from(folder.has)
                    }
            )
            return acc
         }, [])
         .sort((a, b) => a.name.localeCompare(b.name))
      return acc
   }, {} as Folders)
}
