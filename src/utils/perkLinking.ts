import { writeFileSync } from 'fs'
import { PerkDataList } from '../main.js'
import { InventoryItems } from './bungieTypes/manifest.js'

export const perkLinking = (data: PerkDataList) => {
  const perkTypes = ['Weapon Frame', 'Weapon Frame Enhanced']

  for (const key in data) {
    const perk = data[key]
    if (![...perkTypes].includes(perk.type)) continue

    if (perk.type === 'Weapon Trait Enhanced') {
      const normalPerk = Object.values(data).find((perkInList) => {
        return perk.name.startsWith(perkInList.name) && perkInList.type === 'Weapon Trait'
      })
      if (!normalPerk) continue

      data[normalPerk.hash] = {
        ...data[normalPerk.hash],
        linkedWith: [perk.hash],
      }
      data[perk.hash] = {
        ...data[perk.hash],
        linkedWith: [normalPerk.hash],
      }
      continue
    }

    perkTypes.forEach((frameType) => {
      if (perk.type !== frameType) return

      const weaponFrames = Object.values(data)
        .filter((frame) => {
          return perk.name === frame.name && frame.type === frameType
        })
        .map((frame) => frame.hash)

      weaponFrames.forEach((frame) => {
        data[frame] = {
          ...data[frame],
          linkedWith: weaponFrames.sort(),
        }
      })
    })
  }
}

export const exoticWeaponLinking = (data: PerkDataList, invItems: InventoryItems) => {
  const linkedByDescription = Object.values(data).reduce((acc, perk) => {
    const appearsOnArr = Array.from(perk.appearsOn)

    const isExotic = appearsOnArr.every((x) => invItems[x]?.inventory.tierTypeName === 'Exotic')

    if (!isExotic) return acc
    if (perk.type === 'Armor Trait Exotic') return acc

    const itemHash = appearsOnArr[0] as number
    const itemName = invItems[itemHash].displayProperties.name

    if (!acc[itemName]) {
      acc[itemName] = {}
    }

    const description = invItems[perk.hash].displayProperties.description

    if (!acc[itemName][description]) {
      acc[itemName][description] = []
    }

    acc[itemName][description].push({ hash: perk.hash, name: perk.name })
    acc[itemName][description].sort((a, b) => a.name.localeCompare(b.name))

    return acc
  }, {} as { [key: string]: { [key: string]: { name: string; hash: number }[] } })

  for (const wepName in linkedByDescription) {
    for (const description in linkedByDescription[wepName]) {
      const perks = linkedByDescription[wepName][description]
      if (perks.length === 1) {
        continue
      }

      for (let i = 0; i < perks.length; i++) {
        const perk = perks[i]
        if (i === 0) {
          data[perk.hash].linkedWith = perks.map((p) => p.hash)
        } else {
          delete data[perk.hash]
        }
      }
    }
  }
}

export const weaponFramesLinking = (data: PerkDataList) => {
  const linkedByName: { [key: string]: number[] } = {}

  for (const key in data) {
    const perk = data[key]

    if (perk.type !== 'Weapon Frame' && perk.type !== 'Weapon Frame Enhanced') continue

    if (!linkedByName[perk.name]) {
      linkedByName[perk.name] = []
    }
    linkedByName[perk.name].push(perk.hash)
  }

  for (const name in linkedByName) {
    const hashes = linkedByName[name]
    if (hashes.length === 1) continue

    for (let i = 0; i < hashes.length; i++) {
      const hash = hashes[i]
      if (i === 0) {
        data[hash].linkedWith = hashes
      } else {
        delete data[hash]
      }
    }
  }
}

export const originTraitsLinking = (data: PerkDataList) => {
  const linkedByName: { [key: string]: number[] } = {}

  for (const key in data) {
    const perk = data[key]

    if (perk.type !== 'Weapon Trait Origin' && perk.type !== 'Weapon Trait Origin Exotic') continue

    if (!linkedByName[perk.name]) {
      linkedByName[perk.name] = []
    }
    linkedByName[perk.name].push(perk.hash)
  }

  for (const name in linkedByName) {
    const hashes = linkedByName[name]
    if (hashes.length === 1) continue

    for (let i = 0; i < hashes.length; i++) {
      const hash = hashes[i]
      if (i === 0) {
        data[hash].linkedWith = hashes
      } else {
        delete data[hash]
      }
    }
  }
}

export const armorModsLinking = (data: PerkDataList) => {
  const linkedByName: { [key: string]: number[] } = {}

  for (const key in data) {
    const perk = data[key]

    if (perk.type !== 'Armor Mod General') continue

    if (!linkedByName[perk.name]) {
      linkedByName[perk.name] = []
    }
    linkedByName[perk.name].push(perk.hash)
  }

  for (const name in linkedByName) {
    const hashes = linkedByName[name]
    if (hashes.length === 1) continue

    for (let i = 0; i < hashes.length; i++) {
      const hash = hashes[i]
      if (i === 0) {
        data[hash].linkedWith = hashes
      } else {
        delete data[hash]
      }
    }
  }
}

export const enhancedPerkLinking = (data: PerkDataList) => {
  const linkedByName: { [key: string]: { enhanced: number; normal?: number } } = {}

  for (const key in data) {
    const perk = data[key]

    if (perk.type !== 'Weapon Trait Enhanced') continue

    const name = perk.name.replace(/\s+Enhanced$/, '')

    linkedByName[name] = {
      enhanced: perk.hash,
    }
  }
  for (const key in data) {
    const perk = data[key]

    if (perk.type !== 'Weapon Trait') continue

    const name = perk.name
    if (!linkedByName[name]) continue

    linkedByName[name].normal = perk.hash
  }

  for (const name in linkedByName) {
    const hashes = linkedByName[name]

    if (!hashes.normal) continue

    data[hashes.normal].linkedWith = Object.values(hashes)
    delete data[hashes.enhanced]
  }

  writeFileSync('./data.json', JSON.stringify(data, null, 2))
}
