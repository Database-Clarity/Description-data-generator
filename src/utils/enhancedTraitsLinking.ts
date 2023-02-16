import { RawDataList } from "../rawData.js"

type EnhancedPerk = {
   name: string
   linkedWith: number
}

type EnhancedPerks = {
   [key: string]: EnhancedPerk
}

export const linkEnhancedTraits = (perkDataList: RawDataList) => {
   return Object.values(perkDataList).reduce((acc, enhancedPerk) => {
      if (enhancedPerk.type !== 'Weapon Trait Enhanced') return acc

      const normalPerk = Object.values(perkDataList).find((perkInList) => {
         return enhancedPerk.name.startsWith(perkInList.name) && perkInList.type === 'Weapon Trait'
      })
      if (!normalPerk) return acc

      acc[normalPerk.hash] = {
         name: normalPerk.name,
         linkedWith: enhancedPerk.hash
      }
      acc[enhancedPerk.hash] = {
         name: enhancedPerk.name,
         linkedWith: normalPerk.hash
      }

      return acc
   }, {} as EnhancedPerks)
}
