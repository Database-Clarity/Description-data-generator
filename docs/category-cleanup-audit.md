# Category audit

Manifest 245114.26.10.13.2000-1-bnet.66137; baseline 54486e2. Counts before cleanup. Registry selectors use legacy socket/recipe categories; enhanced selections also use DIM/manifest pairing. Existing labels remain unchanged.

| Category | Items | Derivation | Finding |
|---|---:|---|---|
| armor-trait-exotic | 138 | Armor Trait Exotic; socket/recipe selection; manifest types: Aeon Cult Mod, Intrinsic | Real manifest grouping; keep (editor label unchanged) |
| armor-mod-general | 321 | Armor Mod General; socket/recipe selection; manifest types: Arms Armor Mod, Chest Armor Mod, Class Item Armor Mod, General Armor Mod, Helmet Armor Mod, Leg Armor Mod | Real manifest grouping; keep (editor label unchanged) |
| armor-set-bonus | 112 | EquipableItemSet.setPerks → SandboxPerk | Real manifest grouping; keep (editor label unchanged) |
| armor-mod-combat | 0 | Armor Mod Combat; socket/recipe selection; manifest types: (none selected) | Real retired Charged with Light / Elemental Well / Warmind Cell mods; keep despite no selected sockets |
| armor-mod-activity | 63 | Armor Mod Activity; socket/recipe selection; manifest types: Deep Stone Crypt Raid Mod, Garden of Salvation Raid Mod, King's Fall Mod, Last Wish Raid Mod, Nightmare Mod, Root of Nightmares Armor Mod, Vault of Glass Armor Mod, Vow of the Disciple Raid Mod | Real manifest grouping; keep (editor label unchanged) |
| armor-mod-seasonal | 35 | Armor Mod Seasonal; socket/recipe selection; manifest types: Artifact Perk | Real manifest grouping; keep (editor label unchanged) |
| weapon-perk | 223 | Weapon Perk; socket/recipe selection; manifest types: Arrow, Barrel, Battery, Blade, Bolt, Bowstring, Grip, Guard, Haft, Launcher Barrel, Magazine, Rail, Scope, Sight, Stock, Weapon Mod | Real manifest grouping; keep (editor label unchanged) |
| weapon-perk-exotic | 29 | Weapon Perk Exotic; socket/recipe selection; manifest types: Arrow, Barrel, Battery, Blade, Bowstring, Grips, Handle, Intrinsic, Launcher Barrel, Magazine, Scope, Tang, Weapon Ornament | Real manifest grouping; keep (editor label unchanged) |
| weapon-trait | 234 | Weapon Trait; socket/recipe selection; manifest types: Trait | Real manifest grouping; keep (editor label unchanged) |
| weapon-trait-exotic | 134 | Weapon Trait Exotic; socket/recipe selection; manifest types: Trait | Real manifest grouping; keep (editor label unchanged) |
| weapon-trait-origin | 92 | Weapon Trait Origin; socket/recipe selection; manifest types: Origin Trait | Real manifest grouping; keep (editor label unchanged) |
| weapon-trait-origin-exotic | 2 | Weapon Trait Origin Exotic; socket/recipe selection; manifest types: Origin Trait | Misleading split: manifest calls these Origin Trait, but both are Revision Zero firing modes; move to weapon-perk-exotic |
| weapon-trait-enhanced | 228 | Weapon Trait Enhanced; socket/recipe selection; manifest types: Enhanced Trait, Trait | Real manifest grouping; keep (editor label unchanged) |
| weapon-trait-enhanced-exotic | 0 | Weapon Trait Enhanced Exotic; socket/recipe selection; manifest types: (none selected) | Invented empty cross-product; remove (exotics have no enhanced subgroups) |
| weapon-frame | 84 | Weapon Frame; socket/recipe selection; manifest types: Intrinsic | Real manifest grouping; keep (editor label unchanged) |
| weapon-frame-exotic | 185 | Weapon Frame Exotic; socket/recipe selection; manifest types: Intrinsic | Real manifest grouping; keep (editor label unchanged) |
| weapon-frame-enhanced | 232 | Weapon Frame Enhanced; socket/recipe selection; manifest types: Enhanced Intrinsic | Real manifest grouping; keep (editor label unchanged) |
| weapon-frame-enhanced-exotic | 0 | Weapon Frame Enhanced Exotic; socket/recipe selection; manifest types: (none selected) | Invented empty cross-product; remove (exotics have no enhanced subgroups) |
| weapon-catalyst-exotic | 162 | Weapon Catalyst Exotic; socket/recipe selection; manifest types: Trait | Real manifest grouping; keep (editor label unchanged) |
| weapon-mod | 50 | Weapon Mod; socket/recipe selection; manifest types: Weapon Mod | Real manifest grouping; keep (editor label unchanged) |
| weapon-perk-enhanced | 111 | Weapon Trait Enhanced; socket/recipe selection; manifest types: Enhanced Arrow, Enhanced Barrel, Enhanced Battery, Enhanced Blade, Enhanced Bolt, Enhanced Bowstring, Enhanced Grip, Enhanced Guard, Enhanced Haft, Enhanced Launcher Barrel, Enhanced Magazine, Enhanced Rail, Enhanced Stock | Real manifest grouping; keep (editor label unchanged) |
| weapon-perk-enhanced-exotic | 0 | Weapon Trait Enhanced Exotic; socket/recipe selection; manifest types: (none selected) | Invented empty cross-product; remove (exotics have no enhanced subgroups) |
| weapon-trait-origin-enhanced | 91 | Weapon Trait Enhanced; socket/recipe selection; manifest types: Enhanced Origin Trait, Origin Trait | Real manifest grouping; keep (editor label unchanged) |
| weapon-trait-origin-enhanced-exotic | 0 | Weapon Trait Enhanced Exotic; socket/recipe selection; manifest types: (none selected) | Invented empty cross-product; remove (exotics have no enhanced subgroups) |
| weapon-mod-enhanced | 45 | Weapon Trait Enhanced; socket/recipe selection; manifest types: Enhanced Weapon Mod | Real manifest grouping; keep (editor label unchanged) |
| weapon-mod-enhanced-exotic | 0 | Weapon Trait Enhanced Exotic; socket/recipe selection; manifest types: (none selected) | Invented empty cross-product; remove (exotics have no enhanced subgroups) |
| subclass-fragment | 99 | Subclass Fragment; socket/recipe selection; manifest types: Arc Fragment, Prismatic Fragment, Solar Fragment, Stasis Fragment, Strand Fragment, Void Fragment | Real manifest grouping; keep (editor label unchanged) |
| subclass-aspect | 60 | Subclass Aspect; socket/recipe selection; manifest types: Arc Aspect, Solar Aspect, Stasis Aspect, Strand Aspect, Void Aspect | Real manifest grouping; keep (editor label unchanged) |
| subclass-super | 30 | Subclass Super; socket/recipe selection; manifest types: Super Ability | Real manifest grouping; keep (editor label unchanged) |
| subclass-grenade | 45 | Subclass Grenade; socket/recipe selection; manifest types: Arc Grenade, Arc Grenade &#124; Light Ability, Solar Grenade, Solar Grenade &#124; Light Ability, Stasis Grenade, Stasis Grenade &#124; Darkness Ability, Strand Grenade, Strand Grenade &#124; Darkness Ability, Void Grenade, Void Grenade &#124; Light Ability | Real manifest grouping; keep (editor label unchanged) |
| subclass-melee | 41 | Subclass Melee; socket/recipe selection; manifest types: Arc Melee, Arc Melee &#124; Light Ability, Melee, Solar Melee, Solar Melee &#124; Light Ability, Stasis Melee, Stasis Melee &#124; Darkness Ability, Strand Melee, Strand Melee &#124; Darkness Ability, Void Melee, Void Melee &#124; Light Ability | Real manifest grouping; keep (editor label unchanged) |
| subclass-class | 42 | Subclass Class; socket/recipe selection; manifest types: Class Ability | Real manifest grouping; keep (editor label unchanged) |
| subclass-movement | 58 | Subclass Movement; socket/recipe selection; manifest types: Movement Ability | Real manifest grouping; keep (editor label unchanged) |
| verbs | 35 | Trait.displayHint=keyword + description | Real manifest grouping; keep (editor label unchanged) |
| ghost-mod | 29 | Ghost Mod; socket/recipe selection; manifest types: Activity Ghost Mod, Economic Ghost Mod, Experience Ghost Mod, Tracking Ghost Mod | Real manifest grouping; keep (editor label unchanged) |
