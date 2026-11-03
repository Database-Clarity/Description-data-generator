import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fetchSupplemental } from '../generator/v2/fetch.js'

// Read-only comparison with an explicit pre-change commit; writes evidence only to the requested path.
const [base, report] = process.argv.slice(2)
assert.ok(base && report, 'Usage: node tests/setbonus-parity.mjs <base-commit> <report-path>')
const previous = name => JSON.parse(execFileSync('git', ['show', `${base}:templates/v2/${name}.json`], { maxBuffer: 30e6 }))
const current = name => JSON.parse(fs.readFileSync(`templates/v2/${name}.json`))
const old = previous('items'), items = current('items')
const added = Object.keys(items).filter(hash => !old[hash]).map(Number).sort((a, b) => a - b)
const changed = Object.keys(old).filter(hash => JSON.stringify(items[hash]) !== JSON.stringify(old[hash])).map(Number).sort((a, b) => a - b)
assert.equal(added.length, 112)
const selectors = []
for (const hash of changed) {
  const { hiddenFromEditor, ...rest } = items[hash]
  assert.equal(hiddenFromEditor, true)
  assert.deepEqual(rest, old[hash])
  assert.match(rest.name, /^Set Bonus:/)
  assert.deepEqual(rest.sandboxPerkHashes ?? [], [])
  selectors.push(hash)
}
assert.equal(selectors.length, 18)
for (const name of ['aliases', 'sandboxAliases', 'aliasProposals']) assert.deepEqual(current(name), previous(name))
const manifest = await fetchSupplemental()
let verified = 0
for (const set of Object.values(manifest.equipableItemSet)) {
  for (const perk of set.setPerks) {
    const item = items[perk.sandboxPerkHash], def = manifest.sandboxPerk[perk.sandboxPerkHash]
    assert.ok(added.includes(item.hash))
    assert.equal(item.definitionType, 'DestinySandboxPerkDefinition')
    assert.equal(item.setHash, set.hash)
    assert.equal(item.setName, set.displayProperties.name)
    assert.equal(item.pieceCount, perk.requiredSetCount)
    assert.equal(item.inGameDescription, def.displayProperties.description)
    assert.equal(item.icon, def.displayProperties.icon ?? set.displayProperties.icon ?? '')
    verified++
  }
}
assert.equal(verified, 112)
fs.writeFileSync(report, JSON.stringify({ base, manifestVersion: manifest.version, verified,
  addedHashes: added, changedHashes: changed, removedHashes: [], selectorMetadataOnly: selectors,
  unchangedOutputs: ['aliases', 'sandboxAliases', 'aliasProposals'],
  exportParity: '112 new sandbox identities; no existing exported identity or text changed; selector hide flag is editor-only.',
}, null, 2) + '\n')
console.log(`Verified ${verified} manifest bonuses; +${added.length}, -0, ${changed.length} editor-only selector flags.`)
