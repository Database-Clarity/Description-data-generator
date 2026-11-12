import armorSetBonus from './armor-set-bonus.js'
import armorTraitExotic from './armor-trait-exotic.js'
import armorTraitExoticClassItem from './armor-trait-exotic-class-item.js'
import armorModGeneral from './armor-mod-general.js'
import armorModCombat from './armor-mod-combat.js'
import armorModActivity from './armor-mod-activity.js'
import armorModSeasonal from './armor-mod-seasonal.js'
import weaponPerk from './weapon-perk.js'
import weaponPerkExotic from './weapon-perk-exotic.js'
import weaponTrait from './weapon-trait.js'
import weaponTraitExotic from './weapon-trait-exotic.js'
import weaponTraitOrigin from './weapon-trait-origin.js'
import weaponTraitEnhanced from './weapon-trait-enhanced.js'
import weaponFrame from './weapon-frame.js'
import weaponFrameExotic from './weapon-frame-exotic.js'
import weaponFrameEnhanced from './weapon-frame-enhanced.js'
import weaponCatalystExotic from './weapon-catalyst-exotic.js'
import weaponMod from './weapon-mod.js'
import subclassFragment from './subclass-fragment.js'
import subclassAspect from './subclass-aspect.js'
import subclassSuper from './subclass-super.js'
import subclassGrenade from './subclass-grenade.js'
import subclassMelee from './subclass-melee.js'
import subclassClass from './subclass-class.js'
import subclassMovement from './subclass-movement.js'
import ghostMod from './ghost-mod.js'
import verbs from './verbs.js'
import { legacyCategory } from '../v2/legacyCategory.js'
import { Category } from '../v2/types.js'

export const categories: Category[] = [
  armorSetBonus, armorTraitExotic, armorTraitExoticClassItem, armorModGeneral, armorModCombat, armorModActivity, armorModSeasonal,
  weaponPerk, weaponPerkExotic, weaponTrait, weaponTraitExotic, weaponTraitOrigin,
  weaponTraitEnhanced,
  weaponFrame, weaponFrameExotic, weaponFrameEnhanced,
  weaponCatalystExotic, weaponMod, subclassFragment, subclassAspect, subclassSuper,
  subclassGrenade, subclassMelee, subclassClass, subclassMovement, ghostMod, verbs,
  ...([
    ['weapon-perk-enhanced', 'Weapon Perk Enhanced', 231],
    ['weapon-trait-origin-enhanced', 'Weapon Trait Origin Enhanced', 233],
    ['weapon-mod-enhanced', 'Weapon Mod Enhanced', 235],
  ] as const).map(([id, type, order]) => ({
    ...legacyCategory(id, type, 'Weapons', order),
    legacyType: 'Weapon Trait Enhanced' as const,
  })),
].sort((a, b) => a.order - b.order)
