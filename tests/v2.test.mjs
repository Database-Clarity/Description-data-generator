import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { categories } from '../generator/categories/index.js'
import { fetchJson, fetchSupplemental, languages, parseDefinitions, parsePairings } from '../generator/v2/fetch.js'
import { generateV2 } from '../generator/v2/generate.js'
import { legacyCategory, legacyOwner } from '../generator/v2/legacyCategory.js'
import { derivePairings } from '../generator/v2/pairing.js'
import { associateSandbox } from '../generator/v2/sandbox.js'
import { groupFrames } from '../generator/v2/frames.js'
import { buildWeaponTypeLabels, weaponTypes, weaponTypesOf } from '../generator/v2/weaponTypes.js'
import { parseCategoryNames } from '../generator/v2/fetch.js'

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
  // weaponTypes.json is written by generation; it appears in the checked-in templates after the next v2-refresh.
  assert.deepEqual(fs.readdirSync(directory).filter(name => name !== 'weaponTypes.json').sort(), [
    'aliases.json', 'categories.json', 'coverage.json', 'items.json', 'sandboxAliases.json',
  ])
  for (const name of fs.readdirSync(directory)) {
    assertNoStatData(JSON.parse(fs.readFileSync(new URL(name, directory))))
  }
})

test('registry has all 27 converter types, plus verbs; stable unique IDs/orders', () => {
  assert.equal(categories.length, 28)
  assert.equal(new Set(categories.map(category => category.id)).size, categories.length)
  assert.equal(new Set(categories.map(category => category.order)).size, categories.length)
  assert.equal(categories.some(category => category.id === 'sandbox-perk'), false)
  assert.deepEqual(categories.map(category => category.order), categories.map(category => category.order).sort((a, b) => a - b))
})

test('registry maps all converter legacy types exactly and omits new categories', () => {
  const converterTypes = fs.readFileSync(
    new URL('../node_modules/@icemourne/description-converter/src/livePerkTypes.d.ts', import.meta.url), 'utf8',
  ).match(/export type LivePerkTypes = ([^;]+);/)[1]
  const expected = [...converterTypes.matchAll(/'([^']+)'/g)].map(match => match[1]).sort()
  const legacyCategories = categories.filter(category => category.legacyType !== undefined)
  assert.equal(legacyCategories.length, 27)
  assert.deepEqual(legacyCategories.map(category => category.legacyType).sort(), expected)
  for (const category of legacyCategories) {
    assert.equal(category.legacyType, category.label)
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

test('a failing weapon-type label language is skipped and reported; required tables still load', async () => {
  const original = globalThis.fetch
  const warn = console.warn
  const paths = language => ({
    DestinySandboxPerkDefinition: `/common/${language}/sandbox`,
    DestinyTraitDefinition: `/common/${language}/trait`,
    DestinyItemCategoryDefinition: `/common/${language}/category`,
  })
  const run = async (respond, languagePaths) => {
    globalThis.fetch = async url => {
      url = String(url)
      if (url.endsWith('/Manifest/')) {
        return Response.json({ Response: { version: 'fixture', jsonWorldComponentContentPaths: languagePaths } })
      }
      return respond(url) ?? Response.json({})
    }
    return fetchSupplemental()
  }
  console.warn = () => undefined
  try {
    const allPaths = Object.fromEntries(languages.map(language => [language, paths(language)]))
    delete allPaths.it.DestinyItemCategoryDefinition
    delete allPaths.ko
    const result = await run(url => {
      if (url.endsWith('/en/category')) return Response.json({ 1: { displayProperties: { name: 'Sword' } } })
      if (url.endsWith('/fr/category')) return Response.json({ 1: { displayProperties: { name: 'Épée' } } })
      if (url.endsWith('/de/category')) return new Response('', { status: 404 })
      if (url.endsWith('/ja/category')) return Response.json([])
      if (url.endsWith('/pl/category')) throw new TypeError('network down')
    }, allPaths)
    assert.deepEqual(result.itemCategoryNames.en, { 1: 'Sword' })
    assert.deepEqual(result.itemCategoryNames.fr, { 1: 'Épée' })
    assert.deepEqual(Object.keys(result.itemCategoryFailures).sort(), ['de', 'it', 'ja', 'ko', 'pl'])
    assert.match(result.itemCategoryFailures.de, /Fetch failed \(404\)/)
    assert.match(result.itemCategoryFailures.it, /Missing manifest table/)
    assert.match(result.itemCategoryFailures.ja, /Expected item category/)
    assert.match(result.itemCategoryFailures.pl, /network down/)
    for (const language of Object.keys(result.itemCategoryFailures)) {
      assert.equal(Object.hasOwn(result.itemCategoryNames, language), false)
    }
    assert.equal(buildWeaponTypeLabels(result.itemCategoryNames).labels.Sword.fr, 'Épée')
    // English labels failing too still completes: canonical English names, every type unmatched.
    const noEnglish = await run(url => url.endsWith('/en/category') ? new Response('', { status: 404 }) : undefined,
      { en: paths('en') })
    assert.deepEqual(noEnglish.itemCategoryNames, {})
    assert.match(noEnglish.itemCategoryFailures.en, /Fetch failed \(404\)/)
    assert.deepEqual(buildWeaponTypeLabels(noEnglish.itemCategoryNames).unmatched, [...weaponTypes])
    // Required inputs keep failing the run.
    await assert.rejects(run(url => url.endsWith('/en/trait') ? new Response('', { status: 404 }) : undefined,
      { en: paths('en') }), /Fetch failed \(404\)/)
  } finally {
    globalThis.fetch = original
    console.warn = warn
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

test('sandbox and inventory hashes can legitimately be identical, but cannot alias another tooltip', () => {
  const inventory = byHash(plug(1, 'One'), plug(2, 'Two'))
  inventory[1].perks = [{ perkHash: 1 }]
  const items = { 1: { hash: 1, definitionType: 'DestinyInventoryItemDefinition' } }
  assert.deepEqual(associateSandbox(items, inventory, { 1: { hash: 1 } }).aliases, { 1: 1 })
  inventory[1].perks = [{ perkHash: 2 }]
  items[2] = { hash: 2, definitionType: 'DestinyInventoryItemDefinition' }
  assert.throws(() => associateSandbox(items, inventory, { 2: { hash: 2 } }), /collides/)
})

test('end-to-end v2 writes preserve legacy hashes/categories and reciprocal multi-variant pairing', () => {
  const inventory = byHash(plug(1, "Hunter's Trace", 'Intrinsic', 6),
    plug(2, "Hunter's Trace II", 'Intrinsic', 6), plug(3, "Hunter's Trace III", 'Intrinsic', 6))
  inventory[10] = weapon(10, [1, 2, 3])
  inventory[10].displayProperties = { name: 'Fixture Weapon', description: '' }
  inventory[1].perks = [{ perkHash: 100 }]
  inventory[1].stats = { stats: { 10: { value: 42 } } }
  inventory[1].investmentStats = [{ statTypeHash: 10, value: 42 }]
  const legacy = { 1: { hash: 1, name: "Hunter's Trace", type: 'Weapon Frame Exotic', appearsOn: [10] } }
  legacy[1].stats = { Damage: 42 }
  legacy[1].importStatsFrom = 10
  legacy[1].weaponFormula = { damage: '42' }
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
    const emittedCategories = JSON.parse(fs.readFileSync(path.join('templates', 'v2', 'categories.json')))
    assert.equal(emittedCategories.find(category => category.id === 'weapon-frame-exotic').legacyType, 'Weapon Frame Exotic')
    assert.equal(Object.hasOwn(emittedCategories.find(category => category.id === 'verbs'), 'legacyType'), false)
    assert.deepEqual(items[1].enhancedHashes, [2, 3])
    assert.equal(items[1].enhancedHash, 2)
    assert.equal(items[2].baseHash, 1)
    assert.equal(items[3].baseHash, 1)
    assert.equal(items[1].itemHash, 10)
    assert.equal(items[1].itemName, 'Fixture Weapon')
    assert.equal(items[1].owners, undefined)
    for (const hash of [2, 3]) {
      assert.equal(Object.hasOwn(items[hash], 'itemHash'), false)
      assert.equal(Object.hasOwn(items[hash], 'itemName'), false)
    }
    assert.equal(items[2].categoryId, 'weapon-frame-enhanced-exotic')
    assert.equal(items[200].definitionType, 'DestinyTraitDefinition')
    assert.equal(items[200].inGameDescription, 'Burn')
    assert.equal(items[201], undefined)
    assert.equal(items[100], undefined)
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join('templates', 'v2', 'sandboxAliases.json'))), { 100: 1 })
    assert.deepEqual(legacy[1].appearsOn, [10])
    assert.deepEqual(fs.readdirSync(path.join('templates', 'v2')).sort(), [
      'aliases.json', 'categories.json', 'coverage.json', 'items.json', 'sandboxAliases.json', 'weaponTypes.json',
    ])
    assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(path.join('templates', 'v2', 'weaponTypes.json')))), [...weaponTypes])
    for (const name of fs.readdirSync(path.join('templates', 'v2'))) {
      assertNoStatData(JSON.parse(fs.readFileSync(path.join('templates', 'v2', name))))
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

test('frames group exact normalized names across categories with deterministic non-enhanced ownership', () => {
  const member = (hash, name, categoryId, inGameDescription = 'one') =>
    ({ hash, name, categoryId, inGameDescription })
  const items = byHash(
    member(1, ' Adaptive Frame ', 'weapon-frame-enhanced'),
    member(20, 'adaptive frame', 'weapon-frame-exotic', 'two'),
    member(10, 'Adaptive Frame', 'weapon-frame'),
    member(30, 'Adaptive-Frame', 'weapon-frame'),
    member(40, 'Adaptive Frame', 'weapon-trait'),
    member(50, 'Adaptive Frame', 'weapon-frame-enhanced-exotic'),
  )
  const result = groupFrames(items)
  assert.deepEqual(result.aliases, {
    1: { to: 10, kind: 'frame' }, 20: { to: 10, kind: 'frame' }, 50: { to: 10, kind: 'frame' },
  })

  assert.equal(result.report.groups[0].mixedExotic, true)
  assert.equal(result.report.groups[0].differingDescriptions, true)
  assert.deepEqual(result.report.nearMisses, [['adaptive frame', 'adaptive-frame']])
  assert.deepEqual(groupFrames(Object.fromEntries(Object.entries(items).reverse())), result)
  assert.throws(() => groupFrames(byHash(member(1, 'Only', 'weapon-frame-enhanced'),
    member(2, 'Only', 'weapon-frame-enhanced-exotic'))), /no non-enhanced/)
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

test('legacy selection records owner name, shared owners, and fails on a missing owner definition', () => {
  const holder = hash => ({ hash, displayProperties: { name: `Holder ${hash}`, description: '' } })
  const inventory = byHash(plug(1, 'One', 'Intrinsic', 6), plug(2, 'Two', 'Intrinsic', 6),
    plug(3, 'Three', 'Intrinsic', 6), plug(4, 'Four', 'Intrinsic', 6), holder(50), holder(51))
  const entry = (hash, type, appearsOn) => ({ hash, type, appearsOn })
  const legacy = {
    1: entry(1, 'Weapon Frame Exotic', [50]),
    2: entry(2, 'Weapon Frame Exotic', [50, 51, 50]),
    3: entry(3, 'Weapon Frame Exotic', ['Sword']),
    4: entry(4, 'Weapon Frame Exotic', [51, 'Sword']),
  }
  const select = (manifest) => legacyCategory('weapon-frame-exotic', 'Weapon Frame Exotic', 'Weapons', 1).select(manifest)
  const items = Object.fromEntries(select({ inventoryItem: inventory, extraTypes: {}, legacy }).map(item => [item.hash, item]))
  assert.deepEqual([items[1].itemHash, items[1].itemName, items[1].owners], [50, 'Holder 50', undefined])
  assert.deepEqual([items[2].itemHash, items[2].itemName, items[2].owners], [undefined, undefined, [50, 51]])
  assert.deepEqual([items[3].itemHash, items[3].itemName, items[3].owners], [undefined, undefined, undefined])
  assert.deepEqual([items[4].itemHash, items[4].itemName, items[4].owners], [undefined, undefined, undefined])
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

test('weaponTypes come from legacy appearsOn weapon-type strings, deduplicated in authored order', () => {
  assert.deepEqual(weaponTypesOf(['Sword', 5, 'Hand Cannon', 'Sword', 'Helmet', 'Titan Subclass']), ['Sword', 'Hand Cannon'])
  assert.deepEqual(weaponTypesOf([]), [])
  assert.deepEqual(weaponTypesOf([5, 6]), [])
  const inventory = byHash(plug(1, 'One'), plug(2, 'Two'), plug(3, 'Three'))
  const entry = (hash, appearsOn) => ({ hash, type: 'Weapon Trait', appearsOn })
  const legacy = { 1: entry(1, ['Sword', 'Hand Cannon', 'Sword']), 2: entry(2, [7]), 3: entry(3, []) }
  const items = Object.fromEntries(legacyCategory('weapon-trait', 'Weapon Trait', 'Weapons', 1)
    .select({ inventoryItem: inventory, extraTypes: {}, legacy }).map(item => [item.hash, item]))
  assert.deepEqual(items[1].weaponTypes, ['Sword', 'Hand Cannon'])
  assert.equal(Object.hasOwn(items[2], 'weaponTypes'), false)
  assert.equal(Object.hasOwn(items[3], 'weaponTypes'), false)
})

test('generation inherits weaponTypes onto enhanced variants and writes the localized label table', () => {
  const inventory = byHash(plug(1, 'One'), plug(2, 'One', 'Enhanced Trait', 3))
  const legacy = { 1: { hash: 1, type: 'Weapon Trait', appearsOn: ['Sword', 'Combat Bow', 'Helmet'] } }
  const cwd = process.cwd()
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'clarity-weapon-types-'))
  try {
    process.chdir(directory)
    generateV2({
      inventoryItem: inventory, plugSet: {}, legacy, extraTypes: {}, trait: {}, sandboxPerk: {},
      itemCategoryNames: {
        en: { 100: 'Sword', 101: 'Bow', 102: 'Armor' },
        de: { 100: 'Schwert', 101: 'Bogen' },
        fr: { 100: 'Épée' },
      },
      itemCategoryFailures: { ja: 'Fetch failed (404): fixture' },
    }, { 1: 2 }, 'fixture')
    const read = name => JSON.parse(fs.readFileSync(path.join('templates', 'v2', `${name}.json`)))
    assert.deepEqual(read('items')[1].weaponTypes, ['Sword', 'Combat Bow'])
    assert.deepEqual(read('items')[2].weaponTypes, ['Sword', 'Combat Bow'])
    const labels = read('weaponTypes')
    assert.deepEqual(Object.keys(labels), [...weaponTypes])
    assert.deepEqual(labels.Sword, { en: 'Sword', de: 'Schwert', fr: 'Épée' })
    assert.deepEqual(labels['Combat Bow'], { en: 'Bow', de: 'Bogen' })
    assert.deepEqual(labels.Glaive, { en: 'Glaive' })
    assert.equal(read('coverage').weaponTypeLabels.unmatched.includes('Glaive'), true)
    assert.equal(read('coverage').weaponTypeLabels.unmatched.includes('Sword'), false)
    assert.deepEqual(read('coverage').weaponTypeLabels.failed, { ja: 'Fetch failed (404): fixture' })
  } finally {
    process.chdir(cwd)
    fs.rmSync(directory, { recursive: true })
  }
})

test('label table shape: English present for all 17 types even without a manifest, other languages optional', () => {
  assert.equal(weaponTypes.length, 17)
  const { labels, unmatched } = buildWeaponTypeLabels({})
  assert.deepEqual(unmatched, [...weaponTypes])
  for (const type of weaponTypes) assert.deepEqual(labels[type], { en: type })
  assert.deepEqual(parseCategoryNames({
    1: { displayProperties: { name: ' Sword ' } }, 2: { displayProperties: { name: '' } }, 3: {}, 4: null,
  }), { 1: 'Sword' })
  assert.throws(() => parseCategoryNames([]), /Expected item category/)
})

test('canonical weapon types equal the weapon-type strings in templates/rawData.json', () => {
  const rawData = JSON.parse(fs.readFileSync(new URL('../templates/rawData.json', import.meta.url)))
  const found = new Set()
  let withTypes = 0
  for (const raw of Object.values(rawData)) {
    if (!raw.type.startsWith('Weapon')) continue
    const strings = raw.appearsOn.filter(value => typeof value === 'string')
    for (const value of strings) found.add(value)
    if (strings.length) withTypes++
    assert.deepEqual(weaponTypesOf(raw.appearsOn), [...new Set(strings)])
  }
  assert.deepEqual([...found].sort(), [...weaponTypes].sort())
  assert.ok(withTypes > 0)
  console.log(`weaponTypes parity: ${found.size} types, ${withTypes} weapon perks with weaponTypes`)
})
