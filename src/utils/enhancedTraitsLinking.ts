import { CompletePerkDataList } from '../main.js'

type EnhancedPerk = {
   name: string
   has: number[]
}

type EnhancedPerks = {
   [key: string]: EnhancedPerk
}

export const linkEnhancedTraits = (perkDataList: CompletePerkDataList) => {
   return Object.values(perkDataList).reduce((acc, enhancedPerk) => {
      if (enhancedPerk.type !== 'Weapon Trait Enhanced') return acc

      const normalPerk = Object.values(perkDataList).find((perkInList) => {
         return enhancedPerk.name.startsWith(perkInList.name) && perkInList.type === 'Weapon Trait'
      })
      if (!normalPerk) return acc

      acc[normalPerk.hash] = {
         name: normalPerk.name,
         has: [normalPerk.hash, enhancedPerk.hash]
      }

      return acc
   }, {} as EnhancedPerks)
}
