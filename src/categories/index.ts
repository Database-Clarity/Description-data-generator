import armorTraitExotic from './armor-trait-exotic.js'
import armorModGeneral from './armor-mod-general.js'
import armorModCombat from './armor-mod-combat.js'
import armorModActivity from './armor-mod-activity.js'
import armorModSeasonal from './armor-mod-seasonal.js'
import weaponPerk from './weapon-perk.js'
import weaponPerkExotic from './weapon-perk-exotic.js'
import weaponTrait from './weapon-trait.js'
import weaponTraitExotic from './weapon-trait-exotic.js'
import weaponTraitOrigin from './weapon-trait-origin.js'
import weaponTraitOriginExotic from './weapon-trait-origin-exotic.js'
import weaponTraitEnhanced from './weapon-trait-enhanced.js'
import weaponTraitEnhancedExotic from './weapon-trait-enhanced-exotic.js'
import weaponFrame from './weapon-frame.js'
import weaponFrameExotic from './weapon-frame-exotic.js'
import weaponFrameEnhanced from './weapon-frame-enhanced.js'
import weaponFrameEnhancedExotic from './weapon-frame-enhanced-exotic.js'
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
import { Category } from '../v2/types.js'

export const categories: Category[] = [
  armorTraitExotic, armorModGeneral, armorModCombat, armorModActivity, armorModSeasonal,
  weaponPerk, weaponPerkExotic, weaponTrait, weaponTraitExotic, weaponTraitOrigin,
  weaponTraitOriginExotic, weaponTraitEnhanced, weaponTraitEnhancedExotic,
  weaponFrame, weaponFrameExotic, weaponFrameEnhanced, weaponFrameEnhancedExotic,
  weaponCatalystExotic, weaponMod, subclassFragment, subclassAspect, subclassSuper,
  subclassGrenade, subclassMelee, subclassClass, subclassMovement, ghostMod, verbs,
].sort((a, b) => a.order - b.order)
