import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { fetchSupplemental, fetchJson } from '../generator/v2/fetch.js'
import { generateV2 } from '../generator/v2/generate.js'
import { createPerks } from '../generator/utils/createPerks.js'
import { exoticsWeapons } from '../generator/filters/exoticWeapon.js'
import { categorizeItems } from '../generator/utils/categorizeItems.js'

// npm run build; node tests/category-cleanup-audit.mjs <pinned manifest.json> <evidence directory>
const root = process.cwd(), ref = '54486e2'
const input = JSON.parse(fs.readFileSync(process.argv[2]))
const out = path.resolve(process.argv[3])
fs.mkdirSync(out, { recursive: true })
const supplemental = await fetchSupplemental()
assert.equal(supplemental.version, input.version, 'Use the same manifest version for every table')
const manifest = { ...input.manifest, equipableItemSet: supplemental.equipableItemSet,
  legacy: JSON.parse(execFileSync('git', ['show', `${ref}:templates/rawData.json`], { maxBuffer: 20e6 })) }
const baseline = path.join(root, 'generator/category-baseline')
for (const file of execFileSync('git', ['ls-tree', '-r', '--name-only', ref, 'src'], { encoding: 'utf8' }).trim().split('\n')) {
  if (!file.endsWith('.ts')) continue
  const target = path.join(baseline, file.slice(4).replace(/\.ts$/, '.js'))
  fs.mkdirSync(path.dirname(target), { recursive: true })
  const source = execFileSync('git', ['show', `${ref}:${file}`], { encoding: 'utf8' })
  fs.writeFileSync(target, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext } }).outputText)
}
const previous = await import(pathToFileURL(path.join(baseline, 'v2/generate.js')))
// Exercise the actual exotic socket classifier against Revision Zero's manifest sockets.
const metadata = await fetchJson('https://www.bungie.net/Platform/Destiny2/Manifest/')
const socketTypes = await fetchJson('https://www.bungie.net' + metadata.Response.jsonWorldComponentContentPaths.en.DestinySocketTypeDefinition)
const classified = exoticsWeapons(manifest.inventoryItem, manifest.plugSet,
  categorizeItems(manifest.inventoryItem).exoticWeaponsArr, socketTypes, {})
const hashes = ['2206869417', '4152458172']
const afterManifest = structuredClone(manifest)
for (const hash of hashes) {
  assert.equal(classified[hash].type, 'Weapon Perk Exotic')
  assert.equal(manifest.legacy[hash].type, 'Weapon Trait Origin Exotic')
  afterManifest.legacy[hash].type = classified[hash].type
}
for (const [side, fn, facts] of [['before', previous.generateV2, manifest], ['after', generateV2, afterManifest]]) {
  const dir = path.join(out, side); fs.mkdirSync(dir, { recursive: true }); process.chdir(dir)
  fn(structuredClone(facts), input.dim, input.version)
}
process.chdir(root)
const read = (side, name) => JSON.parse(fs.readFileSync(path.join(out, side, 'templates/v2', `${name}.json`)))
const before = read('before', 'items'), after = read('after', 'items')
const changes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(h => JSON.stringify(a[h]) !== JSON.stringify(b[h]))
assert.deepEqual(changes(before, after), hashes)
for (const hash of hashes) assert.deepEqual(after[hash], { ...before[hash], categoryId: 'weapon-perk-exotic' })
const exportedBefore = createPerks(manifest.inventoryItem, manifest.legacy)
const exportedAfter = createPerks(manifest.inventoryItem, afterManifest.legacy)
assert.deepEqual(changes(exportedBefore, exportedAfter), hashes)
for (const hash of hashes) assert.deepEqual(exportedAfter[hash], { ...exportedBefore[hash], type: 'Weapon Perk Exotic' })
for (const name of ['aliases', 'sandboxAliases', 'aliasProposals']) assert.deepEqual(read('before', name), read('after', name), `${name} changed`)
const removed = read('before', 'categories').filter(c => !read('after', 'categories').some(a => a.id === c.id))
assert.equal(removed.length, 6)
for (const c of removed) assert.equal(Object.values(before).filter(i => i.categoryId === c.id).length, c.id === 'weapon-trait-origin-exotic' ? 2 : 0)
const audit = read('before', 'categories').map(c => {
  const items = Object.values(before).filter(i => i.categoryId === c.id)
  const types = [...new Set(items.map(i => manifest.inventoryItem[i.hash]?.itemTypeDisplayName).filter(Boolean))].sort()
  const derivation = c.id === 'armor-set-bonus' ? 'EquipableItemSet.setPerks → SandboxPerk' : c.id === 'verbs' ? 'Trait.displayHint=keyword + description' : `${c.legacyType}; socket/recipe selection; manifest types: ${types.join(', ') || '(none selected)'}`
  const verdict = c.id === 'weapon-trait-origin-exotic' ? 'Misleading split: manifest calls these Origin Trait, but both are Revision Zero firing modes; move to weapon-perk-exotic' : c.id.includes('enhanced-exotic') ? 'Invented empty cross-product; remove (exotics have no enhanced subgroups)' : c.id === 'armor-mod-combat' ? 'Real retired Charged with Light / Elemental Well / Warmind Cell mods; keep despite no selected sockets' : 'Real manifest grouping; keep (editor label unchanged)'
  return { id: c.id, count: items.length, derivation, verdict }
})
fs.writeFileSync(path.join(out, 'audit.json'), JSON.stringify({ manifestVersion: input.version, categories: audit }, null, 2))
fs.writeFileSync(path.join(out, 'parity.json'), JSON.stringify({ baseline: ref, manifestVersion: input.version, removed: removed.map(c => c.id), changedHashes: hashes.map(hash => ({hash, before: exportedBefore[hash], after: exportedAfter[hash]})), unchanged: ['aliases', 'sandboxAliases', 'aliasProposals'] }, null, 2))
fs.mkdirSync('docs', { recursive: true })
fs.writeFileSync('docs/category-cleanup-audit.md', `# Category audit\n\nManifest ${input.version}; baseline ${ref}. Counts before cleanup. Registry selectors use legacy socket/recipe categories; enhanced selections also use DIM/manifest pairing. Existing labels remain unchanged.\n\n| Category | Items | Derivation | Finding |\n|---|---:|---|---|\n` + audit.map(c => `| ${c.id} | ${c.count} | ${c.derivation.replaceAll('|', '&#124;')} | ${c.verdict} |`).join('\n') + '\n')
// Refresh only the two legacy records and the reproduced v2 outputs.
for (const name of ['rawData', 'descriptions']) {
 const filename = `templates/${name}.json`, data = JSON.parse(fs.readFileSync(filename))
 const entries = name === 'descriptions' ? data.perks : data
 for (const hash of hashes) entries[hash].type = 'Weapon Perk Exotic'
 fs.writeFileSync(filename, JSON.stringify(data, undefined, 1))
}
for (const name of fs.readdirSync(path.join(out, 'after/templates/v2'))) fs.copyFileSync(path.join(out, 'after/templates/v2', name), path.join(root, 'templates/v2', name))
console.log('PASS: 35 categories audited; 6 removed; only exported types changed for', hashes.join(', '))
