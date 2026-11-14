import fs from 'fs'
import { fetchJson, isRecord } from './fetch.js'
import { Item } from './types.js'

/**
 * Official names per language for the editor's translate mode (TR2): one small file per
 * language, templates/v2/names/<lang>.json, holding only the names of what items.json lists,
 * so a translator never downloads a raw item table (3+ MB gzipped per language).
 *
 * names:     each item's own hash, from its definition table (inventory item, sandbox perk, trait)
 * itemNames: the exotic items perks belong to (itemHash, owners)
 * setNames:  armor sets (setHash)
 *
 * Additions only: it reads items.json's data and writes nothing else.
 */
export const nameLanguages = ['de', 'es', 'es-mx', 'fr', 'it', 'ja', 'ko', 'pl', 'pt-br', 'ru', 'zh-chs', 'zh-cht'] as const

type Tables = Record<'item' | 'sandboxPerk' | 'trait' | 'itemSet', Record<string, unknown>>
export interface NamesFile {
  v: 1
  lang: string
  manifestVersion: string
  names: Record<string, string>
  itemNames: Record<string, string>
  setNames: Record<string, string>
}

const tableFor: Record<string, keyof Tables> = {
  DestinyInventoryItemDefinition: 'item',
  DestinySandboxPerkDefinition: 'sandboxPerk',
  DestinyTraitDefinition: 'trait',
}

function nameIn(table: Record<string, unknown>, hash: number | string): string | undefined {
  const entry = table[String(hash)]
  if (!isRecord(entry) || !isRecord(entry.displayProperties)) return undefined
  const name = entry.displayProperties.name
  return typeof name === 'string' && name.trim() ? name : undefined
}

/** Keys in ascending numeric order (JSON keeps integer-like keys in that order anyway). */
function sorted(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => Number(a) - Number(b)))
}

export function namesFor(items: Record<string, Item>, tables: Tables, lang: string, manifestVersion: string): NamesFile {
  const names: Record<string, string> = {}
  const itemNames: Record<string, string> = {}
  const setNames: Record<string, string> = {}
  for (const item of Object.values(items)) {
    const table = tableFor[item.definitionType]
    const name = table ? nameIn(tables[table], item.hash) : undefined
    if (name) names[item.hash] = name
    for (const owner of [item.itemHash, ...(item.owners ?? [])]) {
      if (owner === undefined) continue
      const ownerName = nameIn(tables.item, owner)
      if (ownerName) itemNames[owner] = ownerName
    }
    if (item.setHash !== undefined) {
      const setName = nameIn(tables.itemSet, item.setHash)
      if (setName) setNames[item.setHash] = setName
    }
  }
  return { v: 1, lang, manifestVersion, names: sorted(names), itemNames: sorted(itemNames), setNames: sorted(setNames) }
}

/**
 * Fetches each language's tables one language at a time (one big table in memory at once).
 * Optional output: it never rejects. Any failure (the manifest metadata, a language's tables, a
 * write) keeps the previous files and is logged, so the run still commits the v2 outputs
 * generateV2 already wrote. Returns how many languages it wrote.
 */
export async function generateNames(
  items: Record<string, Item>,
  outDir = './templates/v2/names',
  fetch: (url: string) => Promise<unknown> = fetchJson,
): Promise<number> {
  let paths: Record<string, unknown>
  let version: string
  try {
    const metadata = await fetch('https://www.bungie.net/Platform/Destiny2/Manifest/')
    if (!isRecord(metadata) || !isRecord(metadata.Response) ||
      !isRecord(metadata.Response.jsonWorldComponentContentPaths) ||
      typeof metadata.Response.version !== 'string') throw new Error('Invalid Bungie manifest metadata')
    paths = metadata.Response.jsonWorldComponentContentPaths
    version = metadata.Response.version
    fs.mkdirSync(outDir, { recursive: true })
  } catch (error) {
    console.warn('names skipped (previous files kept):', error instanceof Error ? error.message : error)
    return 0
  }
  let written = 0
  for (const lang of nameLanguages) {
    // One language failing (a Bungie hiccup) keeps its previous file and never fails the run:
    // the other v2 outputs are already written and must still be committed.
    try {
      const languagePaths = paths[lang]
      if (!isRecord(languagePaths)) throw new Error(`Missing manifest language ${lang}`)
      const table = async (name: string) => {
        const path = languagePaths[name]
        if (typeof path !== 'string' || !path.startsWith('/common/')) throw new Error(`Missing manifest table ${lang} ${name}`)
        const value = await fetch(`https://www.bungie.net${path}`)
        if (!isRecord(value)) throw new Error(`Invalid manifest table ${lang} ${name}`)
        return value
      }
      // The lite item table carries the display names at about half the size of the full one.
      const [item, sandboxPerk, trait, itemSet] = await Promise.all([
        table('DestinyInventoryItemLiteDefinition'),
        table('DestinySandboxPerkDefinition'),
        table('DestinyTraitDefinition'),
        table('DestinyEquipableItemSetDefinition'),
      ])
      const file = namesFor(items, { item, sandboxPerk, trait, itemSet }, lang, version)
      fs.writeFileSync(`${outDir}/${lang}.json`, JSON.stringify(file) + '\n')
      written++
      console.log(`names ${lang}: ${Object.keys(file.names).length} items, ${Object.keys(file.itemNames).length} exotics, ${Object.keys(file.setNames).length} sets`)
    } catch (error) {
      console.warn(`names ${lang} skipped (previous file kept):`, error instanceof Error ? error.message : error)
    }
  }
  return written
}
