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
- `templates/v2/categories.json`: category metadata, including empty legacy types.
  `legacyType` is the exact converter perk type used by core export; genuinely new
  categories such as verbs omit it. Labels are presentation text, not export mappings.
- `templates/v2/items.json`: object keyed by real inventory/trait hash; includes
  `name`, `icon` when available, `categoryId`, and `inGameDescription` for Bungie drift.
  Exotic entries retain their owning `itemHash` where known.
- `templates/v2/sandboxAliases.json`: sandbox hash -> selected inventory tooltip hash.
- `templates/v2/coverage.json`: per-category legacy/v2 counts, manifest version,
  pairing coverage/disagreements, unresolved candidates, and shared sandbox aliases.

See [category instructions](src/categories/README.md) to add a category. Existing
classification reuses the legacy filters; new pairing reads the **unfiltered**
manifest, including exotic and catalyst-upgraded intrinsics. No legacy filter or
legacy pairing behavior is changed.

## Enhanced pairing

Manifest candidates must share the exact name, plug category and item-type family.
Shared plug sets or weapon sockets disambiguate duplicate definitions; otherwise
only a unique exact match is accepted. Explicit `Enhanced ...` item types identify
enhanced plugs. Exotic intrinsics with numbered II/III/IV names require shared
socket/plug-set evidence and an exact stem (not a general name-prefix match).
DIM is authoritative when its mapping disagrees; disagreements are logged and saved.
Missing DIM definitions and unresolved manifest candidates are reported, never guessed.

`baseHash` on an enhanced item points to its base. Bases expose `enhancedHashes`
for all variants and `enhancedHash` for a deterministic default (DIM preferred,
otherwise lowest hash). Consumers must keep all variants, not assume a one-to-one
intrinsic mapping.

## Sandbox and verbs

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
