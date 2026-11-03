import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
import { pathToFileURL } from 'node:url'
import { fetchJson, fetchSupplemental } from '../generator/v2/fetch.js'
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
const baseline = path.join(root, 'generator/parity-baseline')
fs.mkdirSync(baseline, { recursive:true })
const ref = process.env.ALIAS_BASE_REF ?? 'a2692d5'
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
const changes = [...new Set([...Object.keys(old), ...Object.keys(current)])].filter(h => JSON.stringify(old[h]) !== JSON.stringify(current[h]))
const report = { baseline:ref, manifestVersion:input.version, changedHashes: changes.map(hash => ({
  hash:Number(hash), before:old[hash], after:current[hash], manifestType: input.manifest.inventoryItem[hash]?.itemTypeDisplayName,
})), proposals:read('after','aliasProposals') }
fs.writeFileSync(path.join(out, 'parity.json'), JSON.stringify(report, null, 2))
console.log('AUDIT',out,'changed hashes',changes.length,'proposals',report.proposals.proposals.length)
