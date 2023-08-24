import { InventoryItems } from '@icemourne/tool-box'

import { RawDataList } from './rawData.js'

type WeaponFormulaData = {
  legendary: {
    [key: string]: {
      [key: string]: number[]
    }
  }
  exotic: {
    [key: string]: {
      [key: string]: number[]
    }
  }
}

function sortObjectKeysRecursive<T>(obj: any): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    const sorted = obj
      .map(sortObjectKeysRecursive)
      .sort((a, b) => (`${a}` as any).localeCompare(`${b}`, undefined, { numeric: true }))
    return sorted as unknown as T
  }

  return Object.keys(obj)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .reduce((acc, key) => {
      acc[key] = sortObjectKeysRecursive(obj[key])
      return acc
    }, {} as any) as unknown as T
}

export function createWeaponFormulaData(inventoryItems: InventoryItems, rawData: RawDataList) {
  let exotic: WeaponFormulaData['exotic'] = {}
  let legendary: WeaponFormulaData['legendary'] = {}

  const addExoticWeapon = (appearsOn: (string | number)[], key: string) => {
    appearsOn.forEach((item) => {
      const weaponType = inventoryItems[item].itemTypeDisplayName
      if (!weaponType) return
      if (!exotic[weaponType]) exotic[weaponType] = {}
      if (!exotic[weaponType][item]) exotic[weaponType][item] = []

      exotic[weaponType][item].push(Number(key))
    })
  }

  const addWeaponFrame = (appearsOn: (string | number)[], key: string, name: string) => {
    appearsOn.forEach((item) => {
      if (!legendary[item]) legendary[item] = {}
      if (!legendary[item][name]) legendary[item][name] = []

      legendary[item][name].push(Number(key))
    })
  }

  for (const key in rawData) {
    if (!rawData[key].type.startsWith('Weapon Frame')) continue
    const { appearsOn, name } = rawData[key]

    if (rawData[key].type.endsWith(' Exotic')) {
      addExoticWeapon(appearsOn, key)
      continue
    }

    addWeaponFrame(appearsOn, key, name)
  }

  const sortedExotic = sortObjectKeysRecursive(exotic)

  const sortedLegendary = sortObjectKeysRecursive(legendary)

  return { legendary: sortedLegendary, exotic: sortedExotic }
}
