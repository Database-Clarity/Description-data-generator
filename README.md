# Description data generator

Run on Node 18 or newer:

```
npm ci
npm run build
npm run generate
```

`npm run check:v2` builds and runs offline regression tests. Generation downloads the
current English Bungie manifest and DIM's
[trait-to-enhanced-trait.json](https://raw.githubusercontent.com/DestinyItemManager/d2-additional-info/master/output/trait-to-enhanced-trait.json).
Network failures or invalid supplemental data fail the run explicitly.

## Outputs

- `templates/*.json`: unchanged legacy generation and formats.
- `templates/v2/categories.json`: category metadata for supported in-game groupings; exotic enhanced placeholders are excluded.
  `legacyType` is the exact converter perk type used by core export; genuinely new
  categories such as verbs omit it. Labels are presentation text, not export mappings.
- `templates/v2/items.json`: object keyed by real inventory/trait hash; includes
  `name`, `icon` when available, `categoryId`, and `inGameDescription` for Bungie drift.
  Inventory plugs include `plugCategoryHash` for alias-decision revalidation.
  Exotic entries retain their owning `itemHash` and `itemName` where the legacy rule
  records one (exotic armor traits: first owner; other exotic perks: exactly one owner).
  `owners` lists every owning item hash of an exotic perk shared by two or more items.
  `ownerNames` maps those hashes to nonempty English inventory names where available;
  missing definitions or blank names have no entry. Both are editor-only metadata
  and are not exported to legacy outputs. Older catalogs may omit `ownerNames`.
  The checked-in `items.json` at this branch's initial refresh preserves the existing
  catalog and adds owner names from Bungie's English inventory manifest version
  `245114.26.10.13.2000-1-bnet.66137`, inventory file
  `DestinyInventoryItemDefinition-e677f6ea-2a1e-48d4-a8c8-700a39a62585.json`
  (SHA-256 `b47bba01acdcb7c08e28726647864efefea8ffe73a7098d1c725c7118545b94c`).
  This version matches the existing coverage record, but does not prove which
  exact inventory bytes were used in the previous generation run.
- `templates/v2/sandboxAliases.json`: sandbox hash -> selected inventory tooltip hash.
- `templates/v2/aliases.json`: generic `{ "<hash>": { to, kind: "sandbox" | "frame" } }`
  aliases. Sandbox targets are resolved through frame groups. This supersedes
  `sandboxAliases.json`, which remains unchanged for older consumers.
- `templates/v2/coverage.json`: per-category legacy/v2 counts, manifest version,
  pairing coverage/disagreements, unresolved candidates, and shared sandbox aliases.
- `templates/v2/aliasProposals.json`: manifest-only review proposals, never approvals.
  Kind S groups share name, category, enhanced status and plug category (subclass
  groups ignore plug category). Numbered exotic frames instead require the same
  unnumbered stem, plug category and owning exotic; the unnumbered frame is canonical.
  Kind X contains only non-exotic, non-enhanced DIM twins with identical in-game
  wording. Wording-different DIM pairs appear only in the separate `possibleEnhanced`
  maintainer-call list. Description and investment-stat differences are flags;
  investment stats themselves are not emitted.

V2 intentionally excludes all stat data (`stats`, `importStatsFrom`, investment
stats) and weapon formulas. Proposal difference flags are the only stat-related
metadata. Manifest inputs are projected onto the explicit item
fields rather than copied wholesale. Legacy stat/formula generation, including
`templates/weaponFormula.json`, is unchanged. Regression checks scan every v2 JSON
output and exercise stat-bearing inputs to prevent these fields from leaking.

See [category instructions](src/categories/README.md) to add a category. Existing
classification reuses the legacy filters; new pairing reads the **unfiltered**
manifest, including exotic and catalyst-upgraded intrinsics. Exotic origin-slot firing modes are classified as exotic weapon perks; exotics have no enhanced subgroups.

## Enhanced pairing

Manifest candidates must share the exact name, plug category and item-type family.
Shared plug sets or weapon sockets disambiguate duplicate definitions; otherwise
only a unique exact match is accepted. Explicit `Enhanced ...` item types identify
legendary enhanced plugs, including origin traits, mods, barrels and magazines,
and place them in enhanced categories. Exotic categories never get enhanced
pairings: numbered II/III/IV exotic intrinsics are alias proposals, not enhancements.
DIM is authoritative when its mapping disagrees; disagreements are logged and saved.
Missing DIM definitions and unresolved manifest candidates are reported, never guessed.

`baseHash` on an enhanced item points to its base. Bases expose `enhancedHashes`
for all variants and `enhancedHash` for a deterministic default (DIM preferred,
otherwise lowest hash). Consumers must keep all variants, not assume a one-to-one
intrinsic mapping. Non-enhanced DIM twins retain provenance as `dimBaseHash`, not
`baseHash`; their bases do not receive enhanced pointers. Coverage separates
`paired` real enhancements from `nonEnhancedDimPairs`.

For a reproducible Phase A audit, set `ALIAS_AUDIT_DIR` to a directory containing
the pinned `manifest.json`, run `npm run check:v2`, then
`node tests\audit-alias-groups.mjs`. It generates before/after outputs only in that
directory, using `a2692d5` as the baseline (`ALIAS_BASE_REF` overrides it), and
records every changed item in `parity.json`. It does not refresh checked-in outputs.

## Sandbox and verbs

Legendary weapon frames across the base/enhanced frame categories share one tooltip when their names
match after trimming and case folding; icons do not matter. The canonical member
is the lowest non-enhanced hash and retains its category. Items keep their original
manifest facts and pairing. Coverage reports every group, mixed exotic/legendary
membership, differing in-game descriptions and punctuation-only near misses
(reported, never grouped). Consumers redirect aliases, list each group once, and
export its shared text under every member hash with that member's manifest facts.

Selected inventory tooltips retain all nonzero `perks[].perkHash` values in
`sandboxPerkHashes`. Valid sandbox definitions become aliases, **not categories,
associations, or separate tooltips**. When multiple selected items share a sandbox
hash, a plug item wins over a non-plug, then the lowest inventory hash wins.
All candidates and the chosen owner are recorded in coverage; authored per-item
differences cannot all be represented by one shared alias. Unselected manifest
items (weapons, quests, cosmetics, etc.) do not create new tooltips just because
they reference a sandbox perk.

The `verbs` category uses `DestinyTraitDefinition` entries with
`displayHint: "keyword"` and nonempty descriptions. These are real hashes, including
Scorch, Blind and **Jolted** (Bungie's name for Jolt). No invented or reserved IDs
are needed. `definitionType` identifies inventory vs trait hashes.

## Legacy compatibility check

Run the original generator before changes and save the three legacy JSON files.
Run the modified generator against the same manifest, then compare the files
byte-for-byte (for example with SHA-256). `coverage.json` also checks every legacy
hash and its category, not just totals; missing or duplicate entries fail generation.
Live manifest updates can change legacy files relative to Git even without code
changes, so the before/after run is the compatibility baseline.


### Armor set bonuses

`armor-set-bonus` entries come from `DestinyEquipableItemSetDefinition.setPerks`, keyed by
`sandboxPerkHash` with `definitionType: DestinySandboxPerkDefinition`. They carry `setHash`,
`setName` and `pieceCount` (2 or 4); there is no inventory-item owner or alias. The display name
includes the set, count and perk name. Existing set-conversion selector entries remain in the
catalog with `hiddenFromEditor: true`; that flag is editor-only and must not enter exports.

After generation, `node tests/setbonus-parity.mjs <pre-change-commit> <evidence-json-path>`
checks every set bonus against the current manifest and lists every added/changed hash.
Consumers must look up Clarity text using `setPerks[].sandboxPerkHash`, rather than an armour
item or selector hash. No new text exists until editors create the corresponding tooltips.
