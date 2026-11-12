import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { categories } from '../generator/categories/index.js'
import { fetchJson, fetchSupplemental, parseDefinitions, parsePairings } from '../generator/v2/fetch.js'
import { generateV2 } from '../generator/v2/generate.js'
import { legacyCategory, legacyOwner } from '../generator/v2/legacyCategory.js'
import { derivePairings, isEnhanced, weaponCategory } from '../generator/v2/pairing.js'
import { associateSandbox } from '../generator/v2/sandbox.js'
import { aliasProposals } from '../generator/v2/proposals.js'
import { groupFrames } from '../generator/v2/frames.js'
import { armorMods } from '../generator/filters/armorMod.js'
import { artifactMods, isCurrentArtifact } from '../generator/filters/artifactMod.js'

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

function assertNoStatData(value) {
  if (value === null || typeof value !== 'object') return
  for (const [key, entry] of Object.entries(value)) {
    assert.doesNotMatch(key, /stat|formula/i, `Unexpected v2 stat/formula field: ${key}`)
    assertNoStatData(entry)
  }
}

test('all generated v2 outputs exclude stat data and weapon formula files', () => {
  const directory = new URL('../templates/v2/', import.meta.url)
  // The refresh workflow adds the new worklist after the source-only merge.
  assert.deepEqual(fs.readdirSync(directory).filter(name => !['aliasProposals.json', 'sandboxConflicts.json'].includes(name)).sort(), [
    'aliases.json', 'categories.json', 'coverage.json', 'items.json', 'sandboxAliases.json',
  ])
  for (const name of fs.readdirSync(directory)) {
    if (name !== 'aliasProposals.json') assertNoStatData(JSON.parse(fs.readFileSync(new URL(name, directory))))
  }
})

test('checked-in shared owner metadata covers the pinned references without inventing owners', () => {
  const items = JSON.parse(fs.readFileSync(new URL('../templates/v2/items.json', import.meta.url)))
  const coverage = JSON.parse(fs.readFileSync(new URL('../templates/v2/coverage.json', import.meta.url)))
  const pinned = JSON.parse(fs.readFileSync(new URL('./pinned-shared-owners.json', import.meta.url)))
  const shared = Object.values(items).filter(item => item.owners?.length >= 2)
  assert.equal(Object.keys(pinned.shared).length, 139)
  assert.equal(Object.values(pinned.shared).flat().length, 291)
  if (coverage.manifestVersion === pinned.manifestVersion) {
    for (const [hash, owners] of Object.entries(pinned.shared)) {
      for (const owner of owners) {
        if (items[hash]?.owners?.includes(owner)) {
          assert.ok(items[hash].ownerNames?.[owner]?.trim(), `${hash} missing pinned owner ${owner}`)
        }
      }
    }
    if (items[8507332]?.owners?.includes(1906093346)) {
      assert.equal(items[8507332].ownerNames?.[1906093346], 'Contraverse Hold')
    }
  }
  for (const item of shared) {
    for (const [owner, name] of Object.entries(item.ownerNames ?? {})) {
      assert.ok(item.owners.includes(Number(owner)))
      assert.ok(name.trim())
    }
  }
})

test('registry contains supported categories with stable unique IDs/orders', () => {
  assert.equal(categories.length, 30)
  assert.equal(new Set(categories.map(category => category.id)).size, categories.length)
  assert.equal(new Set(categories.map(category => category.order)).size, categories.length)
  assert.equal(categories.some(category => category.id === 'sandbox-perk'), false)
  assert.deepEqual(categories.map(category => category.order), categories.map(category => category.order).sort((a, b) => a - b))
})

test('registry maps supported converter types and omits removed exotic placeholders', () => {
  const converterTypes = fs.readFileSync(
    new URL('../node_modules/@icemourne/description-converter/src/livePerkTypes.d.ts', import.meta.url), 'utf8',
  ).match(/export type LivePerkTypes = ([^;]+);/)[1]
  const expected = [...converterTypes.matchAll(/'([^']+)'/g)].map(match => match[1]).filter(type => type !== 'Weapon Trait Origin Exotic' && !type.includes('Enhanced Exotic')).sort()
  const legacyCategories = categories.filter(category => category.legacyType !== undefined)
  assert.equal(legacyCategories.length, 27)
  assert.deepEqual([...new Set(legacyCategories.map(category => category.legacyType))].sort(), expected)
  for (const category of legacyCategories) {
    if (!category.id.includes('perk-enhanced') && !category.id.includes('origin-enhanced') && !category.id.includes('mod-enhanced')) assert.equal(category.legacyType, category.label)
  }
  assert.equal(Object.hasOwn(categories.find(category => category.id === 'verbs'), 'legacyType'), false)
})

test('legacy selection uses legacyType independently of a presentation label', () => {
  const category = legacyCategory('trait', 'Weapon Trait', 'Weapons', 1)
  category.label = 'Translated weapon traits'
  const inventory = byHash(plug(1, 'One'))
  const manifest = {
    inventoryItem: inventory, extraTypes: {},
    legacy: { 1: { hash: 1, type: 'Weapon Trait', appearsOn: [] } },
  }
  assert.equal(category.legacyType, 'Weapon Trait')
  assert.deepEqual(category.select(manifest).map(item => item.hash), [1])
})

test('pairing is exact, distinguishes prefix names, and requires a verified alias group for duplicate bases', () => {
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

test('exotic traits and numbered intrinsics never become enhanced pairs, including DIM overrides', () => {
  const inventory = byHash(plug(1, 'Exotic Trait', 'Trait', 6), plug(2, 'Exotic Trait', 'Enhanced Trait', 6),
    plug(3, "Hunter's Trace", 'Intrinsic', 6), plug(4, "Hunter's Trace II", 'Intrinsic', 6),
    plug(5, "Hunter's Trace III", 'Intrinsic', 6))
  assert.equal(derivePairings(inventory, {}, {}).byEnhanced[4], undefined)
  inventory[10] = weapon(10, [1, 2, 3, 4, 5])
  const pairs = derivePairings(inventory, {}, {})
  assert.deepEqual(pairs.byEnhanced, {})
  assert.deepEqual(derivePairings(inventory, {}, {1:2,3:4}).byEnhanced, {})
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
  assert.deepEqual(result.aliases, {})
  assert.deepEqual(result.conflicts, { 100: [1, 2] })
  assert.deepEqual(result.report.ambiguous, [{ sandboxPerkHash: 100, itemHashes: [1, 2] }])
  assert.equal(result.report.aliases, 0)
  assert.deepEqual(items[1].sandboxPerkHashes, [100, 999])
  assert.equal(items[1].autoAssociated, undefined)
  assert.equal(result.report.ambiguous.length, 1)
  assert.deepEqual(result.report.missingDefinitions, [999])
  assert.equal(Object.keys(items).length, 2)
})

test('sandbox candidates that share a generated frame identity keep the existing alias owner', () => {
  const inventory = byHash(plug(1, 'Frame', 'Intrinsic'), plug(2, ' Frame ', 'Intrinsic'))
  for (const definition of Object.values(inventory)) definition.perks = [{ perkHash: 100 }]
  const items = Object.fromEntries([2, 1].map(hash => [hash, {
    hash, name: inventory[hash].displayProperties.name, categoryId: 'weapon-frame',
    definitionType: 'DestinyInventoryItemDefinition', inGameDescription: '',
  }]))
  const result = associateSandbox(items, inventory, { 100: { hash: 100 } }, groupFrames(items).aliases)
  assert.deepEqual(result.aliases, { 100: 1 })
  assert.deepEqual(result.conflicts, {})
  assert.deepEqual(result.report.ambiguous, [{ sandboxPerkHash: 100, itemHashes: [1, 2], selected: 1 }])
  assert.deepEqual(associateSandbox(Object.fromEntries(Object.entries(items).reverse()), inventory,
    { 100: { hash: 100 } }, groupFrames(items).aliases), result)
})

test('sandbox and inventory hashes can legitimately be identical, but cannot alias another tooltip', () => {
  const inventory = byHash(plug(1, 'One'), plug(2, 'Two'))
  inventory[1].perks = [{ perkHash: 1 }]
  const items = { 1: { hash: 1, definitionType: 'DestinyInventoryItemDefinition' } }
  assert.deepEqual(associateSandbox(items, inventory, { 1: { hash: 1 } }).aliases, { 1: 1 })
  inventory[1].perks = [{ perkHash: 2 }]
  items[2] = { hash: 2, definitionType: 'DestinyInventoryItemDefinition' }
  assert.throws(() => associateSandbox(items, inventory, { 2: { hash: 2 } }), /collides/)
})

test('end-to-end v2 writes preserve legacy hashes/categories and propose owner-scoped exotic frames', () => {
  const inventory = byHash(plug(1, "Hunter's Trace", 'Intrinsic', 6),
    plug(2, "Hunter's Trace II", 'Intrinsic', 6), plug(3, "Hunter's Trace III", 'Intrinsic', 6),
    plug(4, 'Shared Exotic Perk', 'Trait', 6))
  inventory[10] = weapon(10, [1, 2, 3])
  inventory[10].displayProperties = { name: 'Fixture Weapon', description: '' }
  inventory[20] = weapon(20, [4])
  inventory[20].displayProperties = { name: 'First Exotic', description: '' }
  inventory[30] = weapon(30, [4])
  inventory[30].displayProperties = { name: 'Second Exotic', description: '' }
  inventory[1].perks = [{ perkHash: 100 }, { perkHash: 101 }]
  inventory[4].perks = [{ perkHash: 101 }]
  inventory[1].stats = { stats: { 10: { value: 42 } } }
  inventory[1].investmentStats = [{ statTypeHash: 10, value: 42 }]
  const legacy = {
    1: { hash: 1, name: "Hunter's Trace", type: 'Weapon Frame Exotic', appearsOn: [10] },
    2: {hash:2,name:"Hunter's Trace II",type:'Weapon Frame Exotic',appearsOn:[10]},
    3: {hash:3,name:"Hunter's Trace III",type:'Weapon Frame Exotic',appearsOn:[10]},
    4: { hash: 4, name: 'Shared Exotic Perk', type: 'Weapon Perk Exotic', appearsOn: [20, 30, 40] },
  }
  legacy[1].stats = { Damage: 42 }
  legacy[1].importStatsFrom = 10
  legacy[1].weaponFormula = { damage: '42' }
  const manifest = {
    inventoryItem: inventory, plugSet: {}, legacy, extraTypes: {},
    sandboxPerk: { 100: { hash: 100 }, 101: { hash: 101 } },
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
    const emittedCategories = JSON.parse(fs.readFileSync(path.join('templates', 'v2', 'categories.json')))
    assert.equal(emittedCategories.find(category => category.id === 'weapon-frame-exotic').legacyType, 'Weapon Frame Exotic')
    assert.equal(Object.hasOwn(emittedCategories.find(category => category.id === 'verbs'), 'legacyType'), false)
    assert.equal(items[1].enhancedHashes, undefined)
    assert.equal(items[1].enhancedHash, undefined)
    assert.equal(items[2].plugCategoryHash, inventory[2].plug.plugCategoryHash)
    assert.equal(items[2].baseHash, undefined)
    assert.equal(items[3].baseHash, undefined)
    assert.equal(items[1].itemHash, 10)
    assert.equal(items[1].itemName, 'Fixture Weapon')
    assert.equal(items[1].owners, undefined)
    assert.deepEqual(items[4].owners, [20, 30, 40])
    assert.deepEqual(items[4].ownerNames, { 20: 'First Exotic', 30: 'Second Exotic' })
    for (const hash of [2, 3]) {
      assert.equal(items[hash].itemHash, 10)
      assert.equal(items[hash].itemName, 'Fixture Weapon')
    }
    assert.equal(items[2].categoryId, 'weapon-frame-exotic')
    const proposal = JSON.parse(fs.readFileSync('templates/v2/aliasProposals.json')).proposals.find(p=>p.basis.exoticFrameOwner === 10)
    assert.deepEqual(proposal.members,[1,2,3])
    assert.equal(proposal.canonical,1)
    assert.equal(items[200].definitionType, 'DestinyTraitDefinition')
    assert.equal(items[200].inGameDescription, 'Burn')
    assert.equal(items[201], undefined)
    assert.equal(items[100], undefined)
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join('templates', 'v2', 'sandboxAliases.json'))), { 100: 1 })
    assert.deepEqual(JSON.parse(fs.readFileSync('templates/v2/sandboxConflicts.json')), { 101: [1, 4] })
    assert.equal(JSON.parse(fs.readFileSync('templates/v2/aliases.json'))[101], undefined)
    assert.deepEqual(legacy[1].appearsOn, [10])
    assert.deepEqual(fs.readdirSync(path.join('templates', 'v2')).sort(), [
      'aliasProposals.json', 'aliases.json', 'categories.json', 'coverage.json', 'items.json', 'sandboxAliases.json', 'sandboxConflicts.json',
    ])
    for (const name of fs.readdirSync(path.join('templates', 'v2'))) {
      if (name !== 'aliasProposals.json') assertNoStatData(JSON.parse(fs.readFileSync(path.join('templates', 'v2', name))))
    }
    assert.deepEqual(inventory[1].investmentStats, [{ statTypeHash: 10, value: 42 }])
    assert.deepEqual(legacy[1].stats, { Damage: 42 })
    assert.equal(legacy[1].importStatsFrom, 10)
    assert.deepEqual(legacy[1].weaponFormula, { damage: '42' })
  } finally {
    process.chdir(cwd)
    fs.rmSync(directory, { recursive: true })
  }
})

test('frames group exact normalized names across legendary categories only, with deterministic non-enhanced ownership', () => {
  const member = (hash, name, categoryId, inGameDescription = 'one') =>
    ({ hash, name, categoryId, inGameDescription })
  const items = byHash(
    member(1, ' Adaptive Frame ', 'weapon-frame-enhanced'),
    member(20, 'adaptive frame', 'weapon-frame-exotic', 'two'),
    member(10, 'Adaptive Frame', 'weapon-frame'),
    member(30, 'Adaptive-Frame', 'weapon-frame'),
    member(40, 'Adaptive Frame', 'weapon-trait'),
    member(50, 'Adaptive Frame', 'weapon-frame-exotic'),
  )
  const result = groupFrames(items)
  assert.deepEqual(result.aliases, {
    1: { to: 10, kind: 'frame' },
  })

  assert.equal(result.report.groups[0].mixedExotic, false)
  assert.equal(result.report.groups[0].differingDescriptions, false)
  assert.deepEqual(result.report.nearMisses, [['adaptive frame', 'adaptive-frame']])
  assert.deepEqual(groupFrames(Object.fromEntries(Object.entries(items).reverse())), result)
  assert.throws(() => groupFrames(byHash(member(1, 'Only', 'weapon-frame-enhanced'),
    member(2, 'Only', 'weapon-frame-enhanced'))), /no non-enhanced/)
  // Exotic frames never join a group, not even with another exotic of the same name.
  assert.deepEqual(groupFrames(byHash(member(1, 'Trait', 'weapon-frame-exotic'),
    member(2, 'Trait', 'weapon-frame-exotic'), member(3, 'Trait', 'weapon-frame-exotic'))), {
    aliases: {}, report: { groups: [], nearMisses: [] },
  })
})

test('generation flattens sandbox owners through same-name frame groups without altering legacy aliases', () => {
  const inventory = byHash(plug(1, 'Frame', 'Intrinsic'), plug(2, ' Frame ', 'Intrinsic'),
    plug(3, 'Frame', 'Enhanced Intrinsic', 3))
  inventory[2].perks = [{ perkHash: 100 }]
  const legacy = Object.fromEntries([1, 2].map(hash => [hash, {
    hash, name: inventory[hash].displayProperties.name, type: 'Weapon Frame', appearsOn: [],
  }]))
  const cwd = process.cwd()
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'clarity-frame-aliases-'))
  try {
    process.chdir(directory)
    generateV2({
      inventoryItem: inventory, plugSet: {}, legacy, extraTypes: {}, trait: {},
      sandboxPerk: { 100: { hash: 100 } },
    }, { 1: 3 }, 'fixture')
    const read = name => JSON.parse(fs.readFileSync(path.join('templates', 'v2', `${name}.json`)))
    assert.deepEqual(read('aliases'), {
      2: { to: 1, kind: 'frame' }, 3: { to: 1, kind: 'frame' },
      100: { to: 1, kind: 'sandbox' },
    })
    assert.deepEqual(read('sandboxAliases'), { 100: 2 })
    assert.equal(read('items')[3].categoryId, 'weapon-frame-enhanced')
    assert.equal(read('items')[1].categoryId, 'weapon-frame')
  } finally {
    process.chdir(cwd)
    fs.rmSync(directory, { recursive: true })
  }
})

test('legacyOwner mirrors the legacy generator owner rule', () => {
  assert.equal(legacyOwner('Armor Trait Exotic', [5, 6]), 5)
  assert.equal(legacyOwner('Armor Trait Exotic', []), undefined)
  assert.equal(legacyOwner('Weapon Frame Exotic', [5]), 5)
  assert.equal(legacyOwner('Weapon Frame Exotic', [5, 6]), undefined)
  assert.equal(legacyOwner('Weapon Trait Exotic', [5, 'Sword']), undefined)
  assert.equal(legacyOwner('Weapon Trait', [5]), undefined)
  assert.equal(legacyOwner('Weapon Perk Exotic', ['Sword']), undefined)
})

test('exotic armor traits prefer current owners and retain the first current owner on ties', () => {
  const inventory = byHash(plug(5, 'Old'), plug(6, 'Current'), plug(7, 'Also current'), plug(8, 'Redacted'))
  inventory[6].collectibleHash = 60
  inventory[7].collectibleHash = 70
  inventory[8].collectibleHash = 80
  inventory[8].redacted = true
  assert.equal(legacyOwner('Armor Trait Exotic', [5, 6], inventory), 6)
  assert.equal(legacyOwner('Armor Trait Exotic', [5, 7, 6], inventory), 7)
  assert.equal(legacyOwner('Armor Trait Exotic', [8, 5, 6], inventory), 6)
  assert.equal(legacyOwner('Armor Trait Exotic', [5, 8], inventory), 5)
  assert.equal(legacyOwner('Armor Trait Exotic', [5], inventory), 5)
  assert.equal(legacyOwner('Weapon Frame Exotic', [5, 6], inventory), undefined)
  const selected = legacyCategory('armor-trait-exotic', 'Armor Trait Exotic', 'Armor', 1).select({
    inventoryItem: { ...inventory, 1: plug(1, 'Trait') }, extraTypes: {},
    legacy: { 1: { hash: 1, type: 'Armor Trait Exotic', appearsOn: [5, 6] } },
  })[0]
  assert.equal(selected.itemHash, 6)
  assert.equal(selected.itemName, 'Current')
  assert.deepEqual(selected.owners, [5, 6])
})

test('legacy selection records owner name, shared owners, and fails on a missing owner definition', () => {
  const holder = hash => ({ hash, displayProperties: { name: `Holder ${hash}`, description: '' } })
  const inventory = byHash(plug(1, 'One', 'Intrinsic', 6), plug(2, 'Two', 'Intrinsic', 6),
    plug(3, 'Three', 'Intrinsic', 6), plug(4, 'Four', 'Intrinsic', 6),
    plug(5, 'Five', 'Intrinsic', 6), holder(50), holder(51), holder(52))
  inventory[52].displayProperties.name = ' '
  const entry = (hash, type, appearsOn) => ({ hash, type, appearsOn })
  const legacy = {
    1: entry(1, 'Weapon Frame Exotic', [50]),
    2: entry(2, 'Weapon Frame Exotic', [50, 51, 50]),
    3: entry(3, 'Weapon Frame Exotic', ['Sword']),
    4: entry(4, 'Weapon Frame Exotic', [51, 'Sword']),
    5: entry(5, 'Weapon Frame Exotic', [50, 999, 52]),
  }
  const select = (manifest) => legacyCategory('weapon-frame-exotic', 'Weapon Frame Exotic', 'Weapons', 1).select(manifest)
  const items = Object.fromEntries(select({ inventoryItem: inventory, extraTypes: {}, legacy }).map(item => [item.hash, item]))
  assert.deepEqual([items[1].itemHash, items[1].itemName, items[1].owners], [50, 'Holder 50', undefined])
  assert.deepEqual([items[2].itemHash, items[2].itemName, items[2].owners], [undefined, undefined, [50, 51]])
  assert.deepEqual(items[2].ownerNames, { 50: 'Holder 50', 51: 'Holder 51' })
  assert.deepEqual(items[5].owners, [50, 999, 52])
  assert.deepEqual(items[5].ownerNames, { 50: 'Holder 50' })
  assert.deepEqual([items[3].itemHash, items[3].itemName, items[3].owners], [undefined, undefined, undefined])
  assert.deepEqual([items[4].itemHash, items[4].itemName, items[4].owners], [undefined, undefined, undefined])
  assert.equal(items[1].ownerNames, undefined)
  const armor = legacyCategory('armor-trait-exotic', 'Armor Trait Exotic', 'Armor', 1).select({
    inventoryItem: inventory, extraTypes: {},
    legacy: { 2: entry(2, 'Armor Trait Exotic', [50, 51]) },
  })[0]
  assert.equal(armor.itemHash, 50)
  assert.equal(armor.itemName, 'Holder 50')
  assert.deepEqual(armor.ownerNames, { 50: 'Holder 50', 51: 'Holder 51' })
  legacy[5].appearsOn = [999, 52]
  assert.equal(select({ inventoryItem: inventory, extraTypes: {}, legacy })[4].ownerNames, undefined)
  legacy[1].appearsOn = [999]
  assert.throws(() => select({ inventoryItem: inventory, extraTypes: {}, legacy }), /Missing inventory definition/)
})

test('legacyOwner reproduces the checked-in descriptions.json owners and names', () => {
  const read = name => JSON.parse(fs.readFileSync(new URL(`../templates/${name}.json`, import.meta.url)))
  const rawData = read('rawData')
  const { perks } = read('descriptions')
  const names = new Map()
  let hashes = 0
  let shared = 0
  for (const [hash, raw] of Object.entries(rawData)) {
    hashes++
    assert.equal(legacyOwner(raw.type, raw.appearsOn), perks[hash]?.itemHash, `owner of ${hash}`)
    if (raw.type.endsWith(' Exotic') && new Set(raw.appearsOn.filter(value => typeof value === 'number')).size >= 2) shared++
  }
  for (const perk of Object.values(perks)) {
    if (perk.itemHash === undefined) continue
    assert.equal(typeof perk.itemName, 'string')
    assert.ok(names.get(perk.itemHash) === undefined || names.get(perk.itemHash) === perk.itemName,
      `owner ${perk.itemHash} has two names`)
    names.set(perk.itemHash, perk.itemName)
  }
  for (const [hash, raw] of Object.entries(rawData)) {
    const owner = legacyOwner(raw.type, raw.appearsOn)
    if (owner !== undefined) assert.ok(names.has(owner), `owner ${owner} of ${hash} has a name`)
  }
  assert.ok(hashes > 0)
  assert.ok(shared > 0)
  console.log(`legacyOwner parity: ${hashes} hashes, ${shared} with 2+ exotic owners`)
})


test('weapon appearances do not constrain generated base or enhanced items', () => {
  const inventory = byHash(plug(1, 'One'), plug(2, 'One', 'Enhanced Trait', 3))
  const legacy = { 1: { hash: 1, type: 'Weapon Trait', appearsOn: ['Sword', 'Combat Bow'] } }
  const cwd = process.cwd()
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'clarity-full-perks-'))
  try {
    process.chdir(directory)
    generateV2({ inventoryItem: inventory, plugSet: {}, legacy, extraTypes: {}, trait: {}, sandboxPerk: {} }, { 1: 2 }, 'fixture')
    const output = path.join('templates', 'v2')
    const items = JSON.parse(fs.readFileSync(path.join(output, 'items.json')))
    assert.equal(items[2].plugCategoryHash, inventory[2].plug.plugCategoryHash)
    assert.equal(items[2].baseHash, 1)
    assert.equal(Object.hasOwn(items[1], 'weaponTypes'), false)
    assert.equal(Object.hasOwn(items[2], 'weaponTypes'), false)
    assert.equal(fs.existsSync(path.join(output, 'weaponTypes.json')), false)
    assert.equal(Object.hasOwn(JSON.parse(fs.readFileSync(path.join(output, 'coverage.json'))), 'weaponTypeLabels'), false)
  } finally {
    process.chdir(cwd)
    fs.rmSync(directory, { recursive: true })
  }
})

test('all enhanced families classify from manifest fields, never a perk name', () => {
  for (const family of ['Trait', 'Origin Trait', 'Weapon Mod', 'Magazine', 'Barrel', 'Battery', 'Intrinsic']) {
    const item = plug(1, 'Not an enhanced name', 'Enhanced ' + family);
    assert.ok(isEnhanced(item));
    assert.match(weaponCategory(item, false), / Enhanced$/);
    assert.doesNotMatch(weaponCategory(item, true), /Enhanced/);
    assert.doesNotMatch(weaponCategory(plug(2, 'Enhanced name', family), false), /Enhanced/);
  }
});

test('proposals split enhanced, exotic, plug categories; exclude aliases and frames; compare wording/numbers/stats', () => {
  const inventory = byHash(...Array.from({length:10}, (_, i) => plug(i+1, 'Same')));
  inventory[3].itemTypeDisplayName = 'Enhanced Trait';
  inventory[5].plug.plugCategoryHash = 30;
  inventory[2].investmentStats = [{statTypeHash:1,value:5}];
  const items = Object.fromEntries(Object.values(inventory).map(i => [i.hash, {
    hash:i.hash,name:'Same',categoryId:'weapon-perk',inGameDescription:'Gain 5 seconds.',
    definitionType:'DestinyInventoryItemDefinition',
  }]));
  items[4].categoryId = 'weapon-perk-exotic';
  items[6].categoryId = 'weapon-frame';
  items[7].dimBaseHash = 1;
  items[7].inGameDescription = 'Grants 5 seconds.';
  items[8].inGameDescription = 'Gain 10 seconds.';
  const aliases = {9:{to:1,kind:'sandbox'},10:{to:1,kind:'frame'}};
  const result = aliasProposals(items,inventory,aliases);
  const same = result.proposals.find(p => p.kind === 'S');
  assert.deepEqual(same.members, [1,2,8]);
  assert.equal(same.descriptionDiff,'numbers');
  assert.equal(same.statsDiff,true);
  assert.equal(result.proposals.some(p => p.kind === 'X'),false);
  assert.deepEqual(result.possibleEnhanced,[{baseHash:1,variantHash:7,reason:'possible enhanced — maintainer call'}]);
  assert.deepEqual(result, aliasProposals(Object.fromEntries(Object.entries(items).reverse()),inventory,aliases));
});

test('subclass proposals ignore plug category and flag differing wording for individual review', () => {
  const inventory = byHash(plug(1,'Grenade'),plug(2,'Grenade'));
  inventory[2].plug.plugCategoryHash = 30;
  const items = {1:{hash:1,name:'Grenade',categoryId:'subclass-grenade',inGameDescription:'Same'},
    2:{hash:2,name:'Grenade',categoryId:'subclass-grenade',inGameDescription:'Different'}};
  assert.equal(aliasProposals(items,inventory,{}).proposals[0].descriptionDiff, 'wording');
});

test('emitted proposal members carry the manifest plug category without enrichment', () => {
  const inventory = byHash(plug(1, 'Shared'), plug(2, 'Shared'));
  const legacy = Object.fromEntries([1,2].map(hash => [hash, {
    hash, type:'Weapon Trait', appearsOn:[],
  }]));
  const cwd = process.cwd(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-facts-'));
  try {
    process.chdir(dir);
    generateV2({inventoryItem:inventory,plugSet:{},legacy,extraTypes:{},trait:{},sandboxPerk:{}}, {}, 'fixture');
    const items=JSON.parse(fs.readFileSync('templates/v2/items.json'));
    const proposals=JSON.parse(fs.readFileSync('templates/v2/aliasProposals.json')).proposals;
    assert.equal(proposals.length,1);
    for(const hash of proposals[0].members) {
      assert.equal(items[hash].plugCategoryHash,inventory[hash].plug.plugCategoryHash);
      assert.equal(items[hash].plugCategoryHash,proposals[0].basis.plugCategoryHash);
    }
  } finally {process.chdir(cwd);fs.rmSync(dir,{recursive:true});}
});

test('exotic numbered frame proposals require common owner and never group different exotics or legendary frames', () => {
  const inventory=byHash(plug(1,'Frame','Intrinsic',6),plug(2,'Frame II','Intrinsic',6),
    plug(3,'Frame III','Intrinsic',6),plug(4,'Frame IV','Intrinsic',6),plug(5,'Frame II','Intrinsic'));
  inventory[2].investmentStats=[{statTypeHash:1,value:10}];
  const items=Object.fromEntries(Object.values(inventory).map(i=>[i.hash,{hash:i.hash,name:i.displayProperties.name,
    categoryId:i.hash===5?'weapon-frame':'weapon-frame-exotic',inGameDescription:'Same',itemHash:i.hash===3?200:100}]));
  const proposals=aliasProposals(items,inventory,{}).proposals;
  assert.equal(proposals.length,1);
  assert.deepEqual(proposals[0].members,[1,2,4]);
  assert.equal(proposals[0].canonical,1);
  assert.equal(proposals[0].statsDiff,true);
  assert.equal(proposals[0].basis.exoticFrameOwner,100);
  assert.equal(proposals[0].basis.isEnhanced,false);
});

test('only identical DIM twins become Kind X; wording differences go to a separate list', () => {
  const inventory=byHash(plug(1,'Twin'),plug(2,'Twin'),plug(3,'Twin'));
  const items={1:{hash:1,name:'Twin',categoryId:'weapon-perk',inGameDescription:'Same'},
    2:{hash:2,name:'Twin',categoryId:'weapon-perk',inGameDescription:'Same',dimBaseHash:1},
    3:{hash:3,name:'Twin',categoryId:'weapon-perk',inGameDescription:'Longer duration',dimBaseHash:1}};
  const result=aliasProposals(items,inventory,{});
  assert.deepEqual(result.proposals.filter(p=>p.kind==='X').map(p=>p.members),[[1,2]]);
  assert.equal(result.proposals.some(p=>p.members.includes(3)),false);
  assert.deepEqual(result.possibleEnhanced,[{baseHash:1,variantHash:3,reason:'possible enhanced — maintainer call'}]);
});

test('generation separates real enhanced pointers from identical and uncertain DIM twins', () => {
  const inventory = byHash(plug(1, 'Drop Mag', 'Magazine'), plug(2, 'Drop Mag', 'Magazine'),
    plug(3, 'Assault'), plug(4, 'Assault'), plug(5, 'Origin', 'Origin Trait'),
    plug(6, 'Origin', 'Enhanced Origin Trait'))
  inventory[4].displayProperties.description = 'Further increases handling.'
  const legacy = Object.fromEntries(Object.values(inventory).map(item => [item.hash, {
    hash: item.hash, name: item.displayProperties.name, type: 'Weapon Perk', appearsOn: [],
  }]))
  const cwd = process.cwd(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alias-pairing-'))
  try {
    process.chdir(dir)
    generateV2({ inventoryItem: inventory, plugSet: {}, legacy, extraTypes: {}, trait: {}, sandboxPerk: {} },
      { 1: 2, 3: 4, 5: 6 }, 'fixture')
    const items = JSON.parse(fs.readFileSync('templates/v2/items.json'))
    for (const [base, twin] of [[1, 2], [3, 4]]) {
      assert.equal(items[twin].dimBaseHash, base)
      assert.equal(items[twin].baseHash, undefined)
      assert.equal(items[base].enhancedHash, undefined)
      assert.equal(items[base].enhancedHashes, undefined)
    }
    assert.equal(items[6].baseHash, 5)
    assert.equal(items[6].dimBaseHash, undefined)
    assert.equal(items[6].categoryId, 'weapon-trait-origin-enhanced')
    assert.deepEqual(items[5].enhancedHashes, [6])
    assert.equal(items[5].enhancedHash, 6)
    const proposals = JSON.parse(fs.readFileSync('templates/v2/aliasProposals.json'))
    assert.deepEqual(proposals.proposals.filter(p => p.kind === 'X').map(p => p.members), [[1, 2]])
    assert.equal(proposals.proposals.some(p => p.members.includes(4) || p.members.includes(6)), false)
    assert.deepEqual(proposals.possibleEnhanced, [
      { baseHash: 3, variantHash: 4, reason: 'possible enhanced — maintainer call' },
    ])
    const { pairing } = JSON.parse(fs.readFileSync('templates/v2/coverage.json'))
    assert.equal(pairing.paired, 1)
    assert.equal(pairing.nonEnhancedDimPairs, 2)
  } finally {
    process.chdir(cwd)
    fs.rmSync(dir, { recursive: true })
  }
})

test('notification fallback requires an exact base and keeps exotics and unrelated styles out', async () => {
  const { enhancedFallbacks } = await import('../generator/v2/pairing.js')
  const mark = item => ({ ...item, tooltipNotifications: [{ displayStyle: 'ui_display_style_enhanced_perk' }] })
  const inventory = byHash(plug(1, 'Assault', 'Origin Trait'), mark(plug(2, 'Assault', 'Origin Trait')),
    mark(plug(3, 'Orphan')), plug(4, 'Exotic', 'Trait', 6), mark(plug(5, 'Exotic', 'Trait', 6)),
    plug(6, 'Wrong category'), mark(plug(7, 'Wrong category')), plug(8, 'Other style'), plug(9, 'Other style'),
    plug(10, 'Label only', 'Enhanced Trait'))
  inventory[7].plug.plugCategoryHash = 99
  inventory[9].tooltipNotifications = [{ displayStyle: 'ui_display_style_other' }]
  const fallback = enhancedFallbacks(inventory)
  assert.deepEqual([...fallback], [2])
  assert.equal(isEnhanced(inventory[10], fallback), true)
  assert.equal(weaponCategory(inventory[2], false, fallback), 'Weapon Trait Origin Enhanced')
  assert.equal(weaponCategory(inventory[5], true, fallback), 'Weapon Trait Exotic')
  assert.equal(derivePairings(inventory, {}, {}).byEnhanced[2], 1)
  const legacy = Object.fromEntries(Object.values(inventory).map(item => [item.hash, {
    hash: item.hash, type: item.inventory.tierType === 6 ? 'Weapon Trait Exotic' : 'Weapon Perk', appearsOn: [],
  }]))
  inventory[2].displayProperties.description = 'Further increases reload speed.'
  const cwd = process.cwd(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'enhanced-fallback-'))
  try {
    process.chdir(dir)
    generateV2({ inventoryItem: inventory, plugSet: {}, legacy, extraTypes: {}, trait: {}, sandboxPerk: {} }, {1:2}, 'fixture')
    const items = JSON.parse(fs.readFileSync('templates/v2/items.json'))
    const proposals = JSON.parse(fs.readFileSync('templates/v2/aliasProposals.json'))
    assert.equal(items[2].categoryId, 'weapon-trait-origin-enhanced')
    assert.equal(items[2].baseHash, 1)
    assert.equal(items[2].dimBaseHash, undefined)
    assert.deepEqual(items[1].enhancedHashes, [2])
    assert.deepEqual(proposals.possibleEnhanced, [])
    assert.equal(proposals.proposals.some(p => p.members.includes(2)), false)
  } finally {
    process.chdir(cwd)
    fs.rmSync(dir, {recursive:true})
  }
})

test('set bonuses are sandbox identities grouped by set and ordered by piece count', () => {
  const category = categories.find(category => category.id === 'armor-set-bonus')
  const manifest = {
    sandboxPerk: byHash(plug(701, 'Second Bonus'), plug(702, 'First Bonus')),
    equipableItemSet: { 901: { ...plug(901, 'Example Set'), setPerks: [
      { requiredSetCount: 4, sandboxPerkHash: 701 }, { requiredSetCount: 2, sandboxPerkHash: 702 },
    ] } },
  }
  const entries = category.select(manifest)
  assert.deepEqual(entries.map(item => item.hash), [702, 701])
  assert.deepEqual(entries.map(item => item.pieceCount), [2, 4])
  for (const item of entries) {
    assert.equal(item.definitionType, 'DestinySandboxPerkDefinition')
    assert.equal(item.setHash, 901)
    assert.equal(item.setName, 'Example Set')
    assert.equal(item.itemHash, undefined)
    assert.equal(item.inGameDescription, manifest.sandboxPerk[item.hash].displayProperties.description)
  }
  delete manifest.sandboxPerk[701]
  assert.throws(() => category.select(manifest), /Missing set-bonus/)
})

test('checked-in set bonuses cover 56 sets with no selector deletions or aliases', () => {
  const items = JSON.parse(fs.readFileSync(new URL('../templates/v2/items.json', import.meta.url)))
  const aliases = JSON.parse(fs.readFileSync(new URL('../templates/v2/aliases.json', import.meta.url)))
  const entries = Object.values(items).filter(item => item.categoryId === 'armor-set-bonus')
  assert.equal(entries.length, 112)
  const sets = new Map()
  for (const item of entries) {
    assert.equal(item.definitionType, 'DestinySandboxPerkDefinition')
    assert.equal(aliases[item.hash], undefined)
    sets.set(item.setHash, [...(sets.get(item.setHash) ?? []), item.pieceCount])
  }
  assert.equal(sets.size, 56)
  for (const counts of sets.values()) assert.deepEqual(counts.sort(), [2, 4])
  const selectors = Object.values(items).filter(item => item.hiddenFromEditor)
  assert.equal(selectors.length, 18)
  for (const item of selectors) assert.match(item.name, /^Set Bonus:/)
})

test('duplicate bases preserve multiple enhanced variants despite a DIM preferred variant', () => {
  const inventory = byHash(plug(9, 'Osmosis'), plug(1, 'Osmosis'),
    plug(3, 'Osmosis', 'Enhanced Trait'), plug(4, 'Osmosis', 'Enhanced Trait'))
  const pairing = derivePairings(inventory, {}, { 1: 3 }, new Map([[1,1],[9,1]]))
  assert.deepEqual(pairing.byEnhanced, { 3: 1, 4: 1 })
  assert.deepEqual(pairing.report.unresolved, [])
  const items = Object.fromEntries(Object.values(inventory).map(i => [i.hash, {
    hash: i.hash, name: 'Osmosis', categoryId: i.hash === 1 || i.hash === 9 ? 'weapon-trait' : 'weapon-trait-enhanced',
    inGameDescription: 'Same', ...(i.hash === 1 ? { enhancedHashes: [3,4] } : {}),
  }]))
  const proposals = aliasProposals(items, inventory, {}).proposals
  assert.deepEqual(proposals.find(p=>p.canonical===1).members, [1,9])
  assert.equal(proposals.find(p=>p.canonical===1).enhancedLink, 3)
})


test('legendary intrinsic frames pair through their shared group, never across groups', () => {
  const inventory = byHash(plug(1, 'Aggressive Frame', 'Intrinsic'),
    plug(2, 'Aggressive Frame', 'Intrinsic'), plug(3, 'Aggressive Frame', 'Enhanced Intrinsic'))
  inventory[1].displayProperties.description = 'Heavy glaive slam'
  inventory[2].displayProperties.description = 'Reduced fusion bolts'
  inventory[3].displayProperties.description = 'Reduced fusion bolts with enhanced stats'
  assert.equal(derivePairings(inventory, {}, {}, new Map([[1,1],[2,1]])).byEnhanced[3], 1)
  assert.equal(derivePairings(inventory, {}, {}, new Map()).byEnhanced[3], undefined)
  assert.equal(derivePairings(inventory, {}, {}, new Map([[1,1],[2,2]])).byEnhanced[3], undefined)
})

// Origin-slot exotic firing modes are weapon perks, never enhanced subgroups.
test('exotic firing modes and enhanced-looking plugs use existing exotic categories', () => {
  assert.equal(weaponCategory(plug(1, 'Häkke Heavy Burst Fire', 'Origin Trait'), true), 'Weapon Perk Exotic')
  assert.equal(weaponCategory(plug(2, 'Trait', 'Enhanced Trait'), true), 'Weapon Trait Exotic')
  assert.equal(weaponCategory(plug(3, 'Frame', 'Enhanced Intrinsic'), true), 'Weapon Frame Exotic')
  assert.ok(categories.every(category => !category.id.includes('enhanced-exotic') && category.id !== 'weapon-trait-origin-exotic'))
  const items = JSON.parse(fs.readFileSync(new URL('../templates/v2/items.json', import.meta.url)))
  for (const hash of [2206869417, 4152458172]) {
    assert.equal(items[hash].categoryId, 'weapon-perk-exotic')
    assert.equal(items[hash].itemName, 'Revision Zero')
  }
})

test('generation pairs cross-weapon legendary frames to the existing frame canonical', () => {
  const inventory = byHash(plug(9, 'Aggressive Frame', 'Intrinsic'), plug(1, 'Aggressive Frame', 'Intrinsic'),
    plug(3, 'Aggressive Frame', 'Enhanced Intrinsic'), plug(4, 'Aggressive Frame', 'Enhanced Intrinsic', 6))
  const legacy = Object.fromEntries(Object.values(inventory).map(i => [i.hash, {
    hash: i.hash, type: i.hash === 4 ? 'Weapon Frame Exotic' : 'Weapon Frame', appearsOn: [],
  }]))
  const cwd = process.cwd(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'frame-enh-'))
  try {
    process.chdir(dir)
    generateV2({ inventoryItem: inventory, plugSet: {}, legacy, extraTypes: {}, trait: {}, sandboxPerk: {} }, {}, 'fixture')
    const items = JSON.parse(fs.readFileSync('templates/v2/items.json'))
    assert.equal(items[3].baseHash, 1)
    assert.deepEqual(items[1].enhancedHashes, [3])
    assert.equal(items[4].baseHash, undefined)
  } finally {
    process.chdir(cwd)
    fs.rmSync(dir, {recursive:true})
  }
})

function mod(hash, name, type, plugCategoryIdentifier, tierType = 5) {
  return { ...plug(hash, name, type, tierType), plug: { plugCategoryHash: 30, plugCategoryIdentifier } }
}

test('activity armor mods classify by plug category, so a new raid needs no name rule', () => {
  const inventory = byHash(
    mod(1, 'Old Raid Mod', 'Deep Stone Crypt Raid Mod', 'enhancements.raid_descent'),
    mod(2, 'Future Raid Mod', 'Unheard-Of Armor Mod', 'enhancements.raid_v999'),
    mod(3, 'Empty Mod Socket', 'Unheard-Of Armor Mod', 'enhancements.raid_v999'),
    mod(4, 'Hands-On', 'General Armor Mod', 'enhancements.v2_general'),
    mod(5, 'Seasonal Activity Mod', 'Activity Mod', 'enhancements.season_outlaw'),
  )
  const armor = { hash: 100, itemTypeDisplayName: 'Helmet', sockets: {
    socketCategories: [{ socketCategoryHash: 590099826, socketIndexes: [0] }],
    socketEntries: [socket(1, 2, 3, 4, 5)],
  } }
  const types = Object.fromEntries(Object.values(armorMods(inventory, {}, [armor])).map(perk => [perk.hash, perk.type]))
  assert.deepEqual(types, {
    1: 'Armor Mod Activity', 2: 'Armor Mod Activity', 4: 'Armor Mod General', 5: 'Armor Mod Activity',
  })
})

test('current artifacts are the socketed Artifact items; their perks are listed once beside preview-only perks', () => {
  const owners = [23349941, 1014202826, 1504442987, 3518286241, 2180638678, 1770364095, 3821685388]
  const perk = (hash, name) => mod(hash, name, 'Artifact Perk', 'artifact_perks')
  const artifacts = owners.map((hash, index) => ({
    hash, itemTypeDisplayName: 'Artifact', inventory: { tierType: 6 },
    sockets: { socketEntries: [
      { singleInitialItemHash: 0, reusablePlugItems: [], reusablePlugSetHash: 900 + index },
      { singleInitialItemHash: 500, reusablePlugItems: [{ plugItemHash: 500 }], randomizedPlugSetHash: 999 },
    ] },
  }))
  const old = { hash: 7, itemTypeDisplayName: 'Artifact', inventory: { tierType: 6 },
    preview: { derivedItemCategories: [{ items: [{ itemHash: 600 }, { itemHash: 601 }] }] } }
  const unsocketed = { hash: 8, itemTypeDisplayName: 'Artifact', inventory: { tierType: 6 }, sockets: { socketEntries: [] } }
  const inventory = byHash(...artifacts, old, unsocketed,
    ...owners.map((_, index) => perk(1000 + index, `Perk ${index}`)), perk(500, 'Shared Perk'),
    perk(600, 'Old Perk'), plug(601, 'Old Common Plug', 'Artifact Perk', 2), plug(700, 'Not A Perk', 'Artifact Mod', 5),
    { hash: 0, displayProperties: { name: '' } })
  const plugSets = {
    ...Object.fromEntries(owners.map((_, index) => [900 + index, { reusablePlugItems: [{ plugItemHash: 1000 + index }, { plugItemHash: 700 }] }])),
    999: { reusablePlugItems: [{ plugItemHash: 500 }] },
  }
  const items = Object.values(inventory).filter(item => item.itemTypeDisplayName === 'Artifact')
  assert.deepEqual(items.filter(isCurrentArtifact).map(item => item.hash).sort(), [...owners].sort())
  const data = artifactMods(inventory, plugSets, items)
  assert.deepEqual(Object.keys(data).map(Number).sort((a, b) => a - b),
    [500, 600, ...owners.map((_, index) => 1000 + index)])
  assert.ok(Object.values(data).every(perk => perk.type === 'Armor Mod Seasonal'))
  assert.deepEqual([...data[500].appearsOn], ['Artifact'])
})

test('exotic class item perks derive signatures from initial sockets, with structural owners and unknown columns', () => {
  const category = categories.find(category => category.id === 'armor-trait-exotic-class-item')
  const perk = (hash, classType = 3, style = 'perk-info') => ({
    ...plug(hash, `Unrelated localized label ${hash}`, 'Intrinsic', 6), classType,
    tooltipNotifications: [{ displayStyle: style, displayString: 'Translated text' }],
  })
  const owner = (hash, classType, first, second) => ({
    hash, classType, itemType: 2, itemSubType: 30, inventory: { tierType: 6 },
    displayProperties: { name: `Owner ${hash}` },
    sockets: { socketEntries: [...Array.from({ length: 10 }, () => socket(0)), socket(first), socket(second)] },
  })
  const inventoryItem = byHash(perk(1), perk(2), perk(3), perk(4), perk(5), perk(6),
    perk(7, 0), perk(8, 1), perk(9, 2), { ...perk(11), redacted: true },
    perk(12, 3, 'unrelated'), { ...perk(13), plug: { plugCategoryHash: 999 } },
    { ...perk(14), plug: undefined }, owner(101, 0, 1, 2), owner(102, 1, 3, 4), owner(103, 2, 5, 6))
  // Names, localized notification text, and itemTypeDisplayName are not membership signals.
  inventoryItem[9].itemTypeDisplayName = 'Translated intrinsic'
  inventoryItem[10] = { ...perk(10), tooltipNotifications: [] }
  inventoryItem[104] = { ...owner(104, 0, 12, 12), inventory: { tierType: 5 } }
  inventoryItem[105] = { ...owner(105, 0, 12, 12), itemSubType: 26 }
  const items = category.select({ inventoryItem })
  assert.deepEqual(items.map(item => item.hash), [1, 2, 3, 4, 5, 6, 7, 8, 9])
  for (const item of items.filter(item => item.hash <= 6)) {
    assert.deepEqual(item.owners, [101, 102, 103])
    assert.deepEqual(item.ownerClasses, { 101: 0, 102: 1, 103: 2 })
    assert.equal(item.perkColumn, 'unknown')
  }
  for (const [hash, holder] of [[7, 101], [8, 102], [9, 103]]) assert.deepEqual(items.find(item => item.hash === hash).owners, [holder])
  assert.equal(Object.hasOwn(category, 'legacyType'), false)
  const split = structuredClone(inventoryItem)
  for (const hash of [2, 4, 6]) split[hash].tooltipNotifications[0].displayStyle = 'second-column'
  const columns = category.select({ inventoryItem: split })
  assert.equal(columns.find(item => item.hash === 1).perkColumn, 1)
  assert.equal(columns.find(item => item.hash === 2).perkColumn, 2)
  delete split[1]
  assert.throws(() => category.select({ inventoryItem: split }), /Missing class item initial perk/)
})
