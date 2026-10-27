import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { categories } from '../generator/categories/index.js'
import { fetchJson, parseDefinitions, parsePairings } from '../generator/v2/fetch.js'
import { generateV2 } from '../generator/v2/generate.js'
import { derivePairings } from '../generator/v2/pairing.js'
import { associateSandbox } from '../generator/v2/sandbox.js'

function plug(hash, name, type = 'Trait', tierType = 2) {
  return {
    hash, displayProperties: { name, description: `${name} description`, icon: '/icon.png' },
    itemTypeDisplayName: type, itemType: 19, inventory: { tierType },
    plug: { plugCategoryHash: type.includes('Intrinsic') ? 10 : 20 },
  }
}

function socket(...hashes) {
  return { singleInitialItemHash: hashes[0], reusablePlugItems: hashes.map(plugItemHash => ({ plugItemHash })) }
}

function weapon(hash, hashes, tierType = 6) {
  return { hash, itemType: 3, inventory: { tierType }, sockets: { socketEntries: [socket(...hashes)] } }
}

function byHash(...items) {
  return Object.fromEntries(items.map(item => [item.hash, item]))
}

test('registry has all 27 converter types, plus verbs; stable unique IDs/orders', () => {
  assert.equal(categories.length, 28)
  assert.equal(new Set(categories.map(category => category.id)).size, categories.length)
  assert.equal(new Set(categories.map(category => category.order)).size, categories.length)
  assert.equal(categories.some(category => category.id === 'sandbox-perk'), false)
  assert.deepEqual(categories.map(category => category.order), categories.map(category => category.order).sort((a, b) => a - b))
})

test('pairing is exact, distinguishes prefix names, and never chooses the first ambiguous base', () => {
  const inventory = byHash(plug(1, 'Rampage'), plug(2, 'Rampage Plus'),
    plug(3, 'Rampage Plus', 'Enhanced Trait', 3), plug(4, 'Rampage Plus'))
  assert.equal(derivePairings(inventory, {}, {}).byEnhanced[3], undefined)
  inventory[10] = weapon(10, [2, 3])
  assert.equal(derivePairings(inventory, {}, {}).byEnhanced[3], 2)
})

test('shared plug sets resolve duplicate exact names', () => {
  const inventory = byHash(plug(1, 'One'), plug(2, 'One'), plug(3, 'One', 'Enhanced Trait', 3))
  const sets = { 100: { hash: 100, reusablePlugItems: [{ plugItemHash: 2 }, { plugItemHash: 3 }] } }
  assert.equal(derivePairings(inventory, sets, {}).byEnhanced[3], 2)
})

test('DIM wins disagreements in both directions and reports absent definitions', () => {
  const inventory = byHash(plug(1, 'One'), plug(2, 'One', 'Enhanced Trait', 3),
    plug(3, 'Two', 'Enhanced Trait', 3), plug(4, 'Four'))
  const pairs = derivePairings(inventory, {}, { 1: 3, 4: 2, 999: 1000 })
  assert.deepEqual(pairs.byEnhanced, { 2: 4, 3: 1 })
  assert.ok(pairs.report.disagreements.length >= 1)
  assert.deepEqual(pairs.report.missingDim, [{ baseHash: 999, enhancedHash: 1000 }])
})

test('all DIM mappings survive cross-swapped manifest disagreements', () => {
  const inventory = byHash(plug(1, 'One'), plug(2, 'One', 'Enhanced Trait', 3),
    plug(3, 'Four', 'Enhanced Trait', 3), plug(4, 'Four'))
  assert.deepEqual(derivePairings(inventory, {}, { 1: 3, 4: 2 }).byEnhanced, { 2: 4, 3: 1 })
  assert.throws(() => derivePairings(inventory, {}, { 1: 2, 4: 2 }), /Conflicting DIM owners/)
})

test('exotic enhanced traits and numbered intrinsics are retained; intrinsics require socket evidence', () => {
  const inventory = byHash(plug(1, 'Exotic Trait', 'Trait', 6), plug(2, 'Exotic Trait', 'Enhanced Trait', 6),
    plug(3, "Hunter's Trace", 'Intrinsic', 6), plug(4, "Hunter's Trace II", 'Intrinsic', 6),
    plug(5, "Hunter's Trace III", 'Intrinsic', 6))
  assert.equal(derivePairings(inventory, {}, {}).byEnhanced[4], undefined)
  inventory[10] = weapon(10, [1, 2, 3, 4, 5])
  const pairs = derivePairings(inventory, {}, {})
  assert.deepEqual(pairs.byEnhanced, { 2: 1, 4: 3, 5: 3 })
  assert.equal(pairs.exotic.has(2), true)
})

test('invalid upstream schemas fail explicitly', () => {
  assert.throws(() => parsePairings({ 1: '2' }), /Invalid DIM pairing/)
  assert.throws(() => parsePairings({ 1: 1 }), /Invalid DIM pairing/)
  assert.throws(() => parseDefinitions({ 1: { hash: 2, displayProperties: {} } }), /Invalid display definition/)
  assert.deepEqual(parsePairings({ 1: 2 }), { 1: 2 })
})

test('transient HTTP errors retry; permanent failures reject explicitly', async () => {
  const original = globalThis.fetch
  let calls = 0
  try {
    globalThis.fetch = async () => ++calls === 1
      ? new Response('', { status: 500 })
      : new Response('{"ok":true}')
    assert.deepEqual(await fetchJson('https://example.invalid/fixture'), { ok: true })
    assert.equal(calls, 2)
    calls = 0
    globalThis.fetch = async () => {
      calls++
      return new Response('', { status: 404 })
    }
    await assert.rejects(fetchJson('https://example.invalid/missing'), /Fetch failed \(404\)/)
    assert.equal(calls, 1)
  } finally {
    globalThis.fetch = original
  }
})

test('sandbox references are deduplicated aliases; shared ownership and missing definitions are reported', () => {
  const inventory = byHash(plug(1, 'One'), plug(2, 'Two'))
  inventory[1].perks = [{ perkHash: 100 }, { perkHash: 100 }, { perkHash: 0 }, { perkHash: 999 }]
  inventory[2].perks = [{ perkHash: 100 }]
  const items = Object.fromEntries([2, 1].map(hash => [hash, { hash, definitionType: 'DestinyInventoryItemDefinition' }]))
  const result = associateSandbox(items, inventory, { 100: { hash: 100 } })
  assert.deepEqual(result.aliases, { 100: 1 })
  assert.deepEqual(items[1].sandboxPerkHashes, [100, 999])
  assert.equal(items[1].autoAssociated, undefined)
  assert.equal(result.report.ambiguous.length, 1)
  assert.deepEqual(result.report.missingDefinitions, [999])
  assert.equal(Object.keys(items).length, 2)
})

test('end-to-end v2 writes preserve legacy hashes/categories and reciprocal multi-variant pairing', () => {
  const inventory = byHash(plug(1, "Hunter's Trace", 'Intrinsic', 6),
    plug(2, "Hunter's Trace II", 'Intrinsic', 6), plug(3, "Hunter's Trace III", 'Intrinsic', 6))
  inventory[10] = weapon(10, [1, 2, 3])
  inventory[1].perks = [{ perkHash: 100 }]
  const legacy = { 1: { hash: 1, name: "Hunter's Trace", type: 'Weapon Frame Exotic', appearsOn: [10] } }
  const manifest = {
    inventoryItem: inventory, plugSet: {}, legacy, extraTypes: {},
    sandboxPerk: { 100: { hash: 100 } },
    trait: {
      200: { hash: 200, displayHint: 'keyword', displayProperties: { name: 'Scorch', description: 'Burn' } },
      201: { hash: 201, displayHint: 'other', displayProperties: { name: 'Other', description: 'Not a verb' } },
    },
  }
  const cwd = process.cwd()
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'clarity-generator-v2-'))
  try {
    process.chdir(directory)
    generateV2(manifest, { 1: 999 }, 'fixture')
    const items = JSON.parse(fs.readFileSync(path.join('templates', 'v2', 'items.json')))
    assert.deepEqual(items[1].enhancedHashes, [2, 3])
    assert.equal(items[1].enhancedHash, 2)
    assert.equal(items[2].baseHash, 1)
    assert.equal(items[3].baseHash, 1)
    assert.equal(items[1].itemHash, 10)
    assert.equal(items[2].categoryId, 'weapon-frame-enhanced-exotic')
    assert.equal(items[200].definitionType, 'DestinyTraitDefinition')
    assert.equal(items[200].inGameDescription, 'Burn')
    assert.equal(items[201], undefined)
    assert.equal(items[100], undefined)
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join('templates', 'v2', 'sandboxAliases.json'))), { 100: 1 })
    assert.deepEqual(legacy[1].appearsOn, [10])
  } finally {
    process.chdir(cwd)
    fs.rmSync(directory, { recursive: true })
  }
})
