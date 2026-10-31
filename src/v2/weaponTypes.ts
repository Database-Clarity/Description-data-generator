/** Canonical weapon types: the manifest itemTypeDisplayName strings found in rawData.json appearsOn of weapon perks. */
export const weaponTypes = [
  'Auto Rifle', 'Combat Bow', 'Fusion Rifle', 'Glaive', 'Grenade Launcher', 'Hand Cannon', 'Linear Fusion Rifle',
  'Machine Gun', 'Pulse Rifle', 'Rocket Launcher', 'Scout Rifle', 'Shotgun', 'Sidearm', 'Sniper Rifle',
  'Submachine Gun', 'Sword', 'Trace Rifle',
] as const

const weaponTypeSet: ReadonlySet<string> = new Set(weaponTypes)

/** Canonical weapon types from a legacy appearsOn list (deduplicated, authored order). */
export function weaponTypesOf(appearsOn: readonly (string | number)[]): string[] {
  return [...new Set(appearsOn.filter((value): value is string => typeof value === 'string' && weaponTypeSet.has(value)))]
}

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function category(english: Record<string, string>, type: string): string | undefined {
  const wanted = new Set([normalize(type), normalize(type.replace(/^Combat /, ''))])
  return Object.keys(english).find(hash => wanted.has(normalize(english[hash])))
}

/**
 * { canonical: { lang: label } } from per-language item category names. The category is found by its English name;
 * languages missing a name fall back to English; types without a matching category are reported, not guessed.
 */
export function buildWeaponTypeLabels(names: Record<string, Record<string, string>>) {
  const english = names.en ?? {}
  const labels: Record<string, Record<string, string>> = {}
  const unmatched: string[] = []
  for (const type of weaponTypes) {
    const hash = category(english, type)
    if (hash === undefined) unmatched.push(type)
    labels[type] = { en: hash === undefined ? type : english[hash] }
    if (hash === undefined) continue
    for (const [lang, table] of Object.entries(names)) {
      if (lang !== 'en' && table[hash]) labels[type][lang] = table[hash]
    }
  }
  return { labels, unmatched }
}
