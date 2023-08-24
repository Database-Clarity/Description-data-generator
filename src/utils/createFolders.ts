import { InventoryItems, TypedObject } from '@icemourne/tool-box'

import { RawData, RawDataList } from '../rawData.js'

type FolderTypes = 'Weapon Frame Exotic' | 'Weapon Frame' | 'Weapon Frame Enhanced'

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

export const createFolders = (perkDataList: RawDataList, inventoryItems: InventoryItems) => {
  const descriptionData: FoldersWithSet = {
    'Weapon Frame Exotic': {},
    'Weapon Frame': {},
    'Weapon Frame Enhanced': {},
  }

  const addExoticWeapon = (perkData: RawData) => {
    perkData.appearsOn.forEach((hash) => {
      const weapon = inventoryItems[hash]

      const folder = descriptionData['Weapon Frame Exotic'][hash] ?? {
        name: weapon.displayProperties.name,
        has: new Set([perkData.hash]),
      }
      descriptionData['Weapon Frame Exotic'][hash] = folder
    })
  }

  const addWeaponFrame = (perkData: RawData) => {
    perkData.appearsOn.forEach((wepType) => {
      const folder = descriptionData['Weapon Frame'][wepType] ?? {
        name: wepType,
        has: new Set([perkData.hash]),
      }
      descriptionData['Weapon Frame'][wepType] = folder
    })
  }

  const addEnhancedWeaponFrame = (perkData: RawData) => {
    perkData.appearsOn.forEach((wepType) => {
      const folder = descriptionData['Weapon Frame Enhanced'][wepType] ?? {
        name: wepType,
        has: new Set([perkData.hash]),
      }
      descriptionData['Weapon Frame Enhanced'][wepType] = folder
    })
  }

  Object.values(perkDataList).forEach((perkData) => {
    if (perkData.type === 'Weapon Frame Exotic') addExoticWeapon(perkData)
    if (perkData.type === 'Weapon Frame') addWeaponFrame(perkData)
    if (perkData.type === 'Weapon Frame Enhanced') addEnhancedWeaponFrame(perkData)
  })

  Object.values(perkDataList).forEach((perkData) => {
    // --- legendary weapon frames
    if (perkData.type === 'Weapon Frame') {
      perkData.appearsOn.forEach((hash) => {
        if (!descriptionData['Weapon Frame'][hash]) return
        descriptionData['Weapon Frame'][hash].has.add(perkData.hash)
      })
    }

    if (perkData.type === 'Weapon Frame Enhanced') {
      perkData.appearsOn.forEach((hash) => {
        if (!descriptionData['Weapon Frame Enhanced'][hash]) return
        descriptionData['Weapon Frame Enhanced'][hash].has.add(perkData.hash)
      })
    }

    // --- exotic weapons
    perkData.appearsOn.forEach((hash) => {
      if (!descriptionData['Weapon Frame Exotic'][hash]) return
      descriptionData['Weapon Frame Exotic'][hash].has.add(perkData.hash)
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
                hash: Number(hash),
              }
            : {
                name: folder.name,
                has: Array.from(folder.has),
              }
        )
        return acc
      }, [])
      .sort((a, b) => a.name.localeCompare(b.name))
    return acc
  }, {} as Folders)
}
