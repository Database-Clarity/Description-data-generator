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
const ref = process.env.ALIAS_BASE_REF ?? '54486e2'
for (const file of execFileSync('git', ['ls-tree', '-r', '--name-only', ref, 'src'], {encoding:'utf8'}).trim().split('\n')) {
  if (!file.endsWith('.ts')) continue
  const source = execFileSync('git', ['show', ref + ':' + file], {encoding:'utf8'})
  const target = path.join(baseline, file.slice(4).replace(/\.ts$/, '.js'))
  fs.mkdirSync(path.dirname(target), {recursive:true})
  fs.writeFileSync(target, ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ESNext}}).outputText)
}
const baselineModule = await import(pathToFileURL(path.join(baseline, 'v2/generate.js')))
const currentModule = await import('../generator/v2/generate.js')
for (const [label, fn] of [['before', baselineModule.generateV2], ['after', currentModule.generateV2]]) {
  const dir = path.join(out, label); fs.mkdirSync(dir, {recursive:true}); process.chdir(dir)
  fn(structuredClone(input.manifest), input.dim, input.version)
}
process.chdir(root)
const read = (side, name) => JSON.parse(fs.readFileSync(path.join(out, side, 'templates/v2', name + '.json')))
const oldItems = read('before','items'), newItems = read('after','items')
const changes = Object.keys(newItems).filter(h => JSON.stringify(oldItems[h]) !== JSON.stringify(newItems[h])).map(h=>({hash:Number(h),before:oldItems[h],after:newItems[h]}))
const unresolved = read('before','coverage').pairing.unresolved
const cases = unresolved.filter(row=>row.candidates.length>1).map(row=>({...row,name:input.manifest.inventoryItem[row.enhancedHash].displayProperties.name,actual:newItems[row.enhancedHash]?.baseHash,expected:({"189818679": 836583820, "389945760": 836583820, "540070330": 2928496916, "651554065": 2928496916, "745725302": 2928496916, "785441979": 2078075300, "1278053348": 2928496916, "1487938731": 836583820, "1632897927": 836583820, "1737914521": 836583820, "1926141333": 2078075300, "2491949917": 2078075300, "2707250581": 2078075300, "4024789138": 2928496916})[row.enhancedHash]}))
for (const row of cases) assert.equal(row.actual,row.expected)
const expectedHashes = [...new Set(cases.filter(row=>row.expected!==undefined).flatMap(row=>[row.enhancedHash,row.expected]))].sort((a,b)=>a-b)
assert.deepEqual(changes.map(row=>row.hash).sort((a,b)=>a-b),expectedHashes)
for (const row of changes) {
  const clean = item => Object.fromEntries(Object.entries(item).filter(([key])=>!['baseHash','enhancedHash','enhancedHashes'].includes(key)))
  assert.deepEqual(clean(row.before),clean(row.after))
}
assert.deepEqual(read('before','aliases'),read('after','aliases'))
fs.writeFileSync(path.join(out,'frame-enh-parity.json'),JSON.stringify({cases,changes},null,2))
console.log(JSON.stringify({cases,changed:changes.map(r=>r.hash)}))
