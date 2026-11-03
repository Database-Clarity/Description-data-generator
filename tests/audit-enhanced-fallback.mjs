import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import { fetchJson, fetchSupplemental } from '../generator/v2/fetch.js'
import { enhancedFallbacks, isEnhanced, weaponCategory } from '../generator/v2/pairing.js'
const root = process.cwd()
const out = process.env.ALIAS_AUDIT_DIR ?? fs.mkdtempSync(path.join(os.tmpdir(), 'clarity-alias-a-'))
fs.mkdirSync(out, {recursive:true})
const cache = path.join(out, 'manifest.json')
let input
if (fs.existsSync(cache)) input = JSON.parse(fs.readFileSync(cache))
else {
  const metadata = await fetchJson('https://www.bungie.net/Platform/Destiny2/Manifest/')
  const paths = metadata.Response.jsonWorldComponentContentPaths.en
  const [inventoryItem, plugSet, supplemental] = await Promise.all([
    fetchJson('https://www.bungie.net' + paths.DestinyInventoryItemDefinition),
    fetchJson('https://www.bungie.net' + paths.DestinyPlugSetDefinition), fetchSupplemental(),
  ])
  input = { manifest: { inventoryItem, plugSet, legacy: JSON.parse(fs.readFileSync('templates/rawData.json')),
    sandboxPerk: supplemental.sandboxPerk, trait: supplemental.trait, extraTypes:{} },
    dim: supplemental.dim, version: supplemental.version }
  fs.writeFileSync(cache, JSON.stringify(input))
}
const markerItems = Object.values(input.manifest.inventoryItem).filter(item => item.tooltipNotifications?.some(n => n.displayStyle === 'ui_display_style_enhanced_perk')).map(item => ({hash:item.hash,name:item.displayProperties.name,field:'tooltipNotifications[].displayStyle',label:item.itemTypeDisplayName,tier:item.inventory.tierType,alreadyEnhanced:isEnhanced(item)}))
assert.equal(markerItems.length,418)
assert.equal(markerItems.filter(item=>item.alreadyEnhanced).length,411)
assert.equal(markerItems.filter(item=>item.tier===6).length,0)
fs.writeFileSync(path.join(out,'marker-items.json'),JSON.stringify(markerItems,null,2))
const baseline = path.join(root, 'generator/parity-baseline')
fs.mkdirSync(baseline, { recursive:true })
const ref = process.env.ALIAS_BASE_REF ?? '78e0350'
for (const file of execFileSync('git', ['ls-tree', '-r', '--name-only', ref, 'src'], {encoding:'utf8'}).trim().split('\n')) {
  if (!file.endsWith('.ts')) continue
  const source = execFileSync('git', ['show', ref + ':' + file], {encoding:'utf8'})
  const target = path.join(baseline, file.slice(4).replace(/\.ts$/, '.js'))
  fs.mkdirSync(path.dirname(target), {recursive:true})
  fs.writeFileSync(target, ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ESNext}}).outputText)
}
const before = await import(pathToFileURL(path.join(baseline, 'v2/generate.js')))
const after = await import('../generator/v2/generate.js')
for (const [label, fn] of [['before', before.generateV2], ['after', after.generateV2]]) {
  const dir = path.join(out, label); fs.mkdirSync(dir, {recursive:true}); process.chdir(dir)
  fn(structuredClone(input.manifest), input.dim, input.version)
}
process.chdir(root)
const read = (side, name) => JSON.parse(fs.readFileSync(path.join(out, side, 'templates/v2', name + '.json')))
const old = read('before', 'items'), current = read('after', 'items')
const fallback = enhancedFallbacks(input.manifest.inventoryItem)
assert.deepEqual([...fallback].sort((a,b)=>a-b), [270582335,843406310,1164602481,1807646319,1847323754,2060213237,2671305723])
const changes = [...new Set([...Object.keys(old), ...Object.keys(current)])].filter(h => JSON.stringify(old[h]) !== JSON.stringify(current[h]))
assert.deepEqual(Object.keys(current).filter(h => !old[h]), ['2060213237'], 'Only unresolved fallback Osmosis is newly selected')
assert.deepEqual(Object.keys(old).filter(h => !current[h]), [])
const expectedPairs = {270582335:1823011807,843406310:3018257738,1164602481:3993379141,1807646319:164468655,1847323754:2697390518,2671305723:3713579091}
for (const [variant,base] of Object.entries(expectedPairs)) {
  assert.equal(current[variant].baseHash, base)
  assert.deepEqual(current[base].enhancedHashes, [Number(variant)])
  assert.equal(current[variant].dimBaseHash, undefined)
}
assert.equal(current[2060213237].categoryId, 'weapon-trait-enhanced')
assert.equal(current[2060213237].baseHash, undefined)
assert.deepEqual(read('after','aliasProposals').possibleEnhanced, [])
assert.deepEqual(changes.map(Number).sort((a,b)=>a-b), [...new Set([...Object.keys(expectedPairs).map(Number),...Object.values(expectedPairs),2060213237])].sort((a,b)=>a-b))
const categories = read('after', 'categories')
const expectedCategories = Object.fromEntries(Object.entries(old).map(([hash, item]) => {
  const definition = input.manifest.inventoryItem[hash]
  if (!definition || item.categoryId.endsWith('-exotic') || !isEnhanced(definition, fallback)) return [hash, item.categoryId]
  const category = categories.find(c => c.label === weaponCategory(definition, false, fallback))
  assert.ok(category, `Missing enhanced category for ${hash}`)
  return [hash, category.id]
}))
const expectedCategoryHashes = Object.keys(old).filter(h => old[h].categoryId !== expectedCategories[h]).map(Number).sort((a,b) => a-b)
const actualCategoryHashes = Object.keys(old).filter(h => old[h].categoryId !== current[h].categoryId).map(Number).sort((a,b) => a-b)
assert.deepEqual(actualCategoryHashes, expectedCategoryHashes, 'Unexpected category changes')
const allowedChangedFields = ['plugCategoryHash', 'categoryId', 'baseHash', 'enhancedHash', 'enhancedHashes', 'dimBaseHash']
const unchangedFacts = item => Object.fromEntries(Object.entries(item).filter(([key]) => !allowedChangedFields.includes(key)))
for (const [hash, item] of Object.entries(current).filter(([hash]) => old[hash])) {
  assert.equal(item.categoryId, expectedCategories[hash], `Wrong enhanced classification for ${hash}`)
  assert.deepEqual(unchangedFacts(item), unchangedFacts(old[hash]), `Unexpected item-fact change for ${hash}`)
  const definition = item.definitionType === 'DestinyInventoryItemDefinition' ? input.manifest.inventoryItem[hash] : undefined
  if (definition?.plug) assert.equal(item.plugCategoryHash, definition.plug.plugCategoryHash, `Missing plug facts for ${hash}`)
  if (item.categoryId.endsWith('-exotic')) {
    assert.ok(!item.categoryId.includes('-enhanced'), `Exotic enhanced category ${hash}`)
    for (const field of ['baseHash', 'enhancedHash', 'enhancedHashes', 'dimBaseHash'])
      assert.equal(item[field], undefined, `Exotic pairing ${hash}.${field}`)
  }
  if (item.baseHash !== undefined) {
    assert.ok(isEnhanced(definition, fallback), `Non-enhanced base mapping ${hash}`)
    assert.ok(current[item.baseHash]?.enhancedHashes?.includes(item.hash), `Missing reciprocal pair ${hash}`)
  }
  if (item.dimBaseHash !== undefined) {
    assert.ok(!isEnhanced(definition, fallback), `Real enhancement stored as DIM twin ${hash}`)
    assert.equal(item.baseHash, undefined, `Twin also has enhanced base ${hash}`)
  }
}
assert.deepEqual(read('before', 'aliases'), read('after', 'aliases'), 'Generated aliases changed before approval')
const report = { baseline:ref, manifestVersion:input.version, changedHashes: changes.map(hash => ({
  hash:Number(hash), before:old[hash], after:current[hash], manifestType: input.manifest.inventoryItem[hash]?.itemTypeDisplayName,
})), itemFactParity: { matches: true, allowedChangedFields },
  categoryParity: { matches: true, expectedChangedHashes: expectedCategoryHashes, actualChangedHashes: actualCategoryHashes },
  proposals:read('after','aliasProposals') }
fs.writeFileSync(path.join(out, 'parity.json'), JSON.stringify(report, null, 2))
console.log('AUDIT',out,'changed hashes',changes.length,'expected/actual categories',expectedCategoryHashes.length,actualCategoryHashes.length,'proposals',report.proposals.proposals.length)
