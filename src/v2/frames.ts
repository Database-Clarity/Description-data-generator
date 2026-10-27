import { Item } from './types.js'

export type Alias = { to: number; kind: 'sandbox' | 'frame' }
const frameCategories = new Set([
  'weapon-frame', 'weapon-frame-exotic', 'weapon-frame-enhanced', 'weapon-frame-enhanced-exotic',
])

export function groupFrames(items: Record<string, Item>) {
  const byName = new Map<string, Item[]>()
  for (const item of Object.values(items)) {
    if (!frameCategories.has(item.categoryId)) continue
    const name = item.name.trim().toLowerCase()
    if (!name) throw new Error(`Unnamed weapon frame ${item.hash}`)
    const group = byName.get(name) ?? []
    group.push(item)
    byName.set(name, group)
  }
  const aliases: Record<string, Alias> = {}
  const groups = []
  for (const [name, members] of byName) {
    if (members.length < 2) continue
    members.sort((a, b) => a.hash - b.hash)
    const canonical = members.find(item => !item.categoryId.includes('enhanced'))
    if (!canonical) throw new Error(`Frame group has no non-enhanced member: ${name}`)
    for (const member of members) {
      if (member.hash !== canonical.hash) aliases[member.hash] = { to: canonical.hash, kind: 'frame' }
    }
    groups.push({
      name, canonicalHash: canonical.hash, hashes: members.map(item => item.hash),
      mixedExotic: new Set(members.map(item => item.categoryId.endsWith('-exotic'))).size > 1,
      differingDescriptions: new Set(members.map(item => item.inGameDescription)).size > 1,
    })
  }
  const nearNames = new Map<string, string[]>()
  for (const name of byName.keys()) {
    const key = name.replace(/[^a-z0-9]/g, '')
    const names = nearNames.get(key) ?? []
    names.push(name)
    nearNames.set(key, names)
  }
  return {
    aliases,
    report: {
      groups,
      nearMisses: [...nearNames.values()].filter(names => names.length > 1),
    },
  }
}
