import { PerkDataList } from '../main.js'

export const perkLinking = (data: PerkDataList) => {
  const perkTypes = ['Weapon Frame', 'Weapon Frame Enhanced', 'Weapon Trait Enhanced']

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
