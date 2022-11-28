export type InventoryItems = {
   [key: string]: InventoryItem
}

// paste this \/ in https://data.destinysets.com/ console to get object and use Paste JSON as Code extension to get interface
// entire InventoryItem is to big and fails to generate interface

// const condition = (v) =>
//    (v.itemTypeDisplayName === 'Artifact' ||
//       v.itemType === 19 ||
//       v.itemType === 2 ||
//       v.itemType === 3 ||
//       v.itemType === 30) &&
//    !(
//       v.itemTypeDisplayName === 'Shader' ||
//       v.itemTypeDisplayName.includes('Emote') ||
//       v.itemTypeDisplayName === 'Ghost Projection' ||
//       v.itemTypeDisplayName.includes('Ornament')
//    )

// $InventoryItem.filter(condition)

export interface InventoryItem {
   displayProperties:                 DisplayProperties;
   tooltipNotifications:              TooltipNotification[];
   itemTypeDisplayName:               string;
   flavorText:                        string;
   uiItemDisplayStyle:                string;
   itemTypeAndTierDisplayName:        string;
   displaySource:                     string;
   action?:                           Action;
   inventory:                         Inventory;
   plug?:                             Plug;
   acquireRewardSiteHash:             number;
   acquireUnlockHash:                 number;
   investmentStats:                   InvestmentStat[];
   perks:                             Perk[];
   allowActions:                      boolean;
   doesPostmasterPullHaveSideEffects: boolean;
   nonTransferrable:                  boolean;
   itemCategoryHashes:                number[];
   specialItemType:                   number;
   itemType:                          number;
   itemSubType:                       number;
   classType:                         number;
   breakerType:                       number;
   equippable:                        boolean;
   defaultDamageType:                 number;
   isWrapper:                         boolean;
   hash:                              number;
   index:                             number;
   redacted:                          boolean;
   blacklisted:                       boolean;
   $type:                             string;
   backgroundColor?:                  BackgroundColor;
   screenshot?:                       string;
   stats?:                            Stats;
   equippingBlock?:                   EquippingBlock;
   translationBlock?:                 TranslationBlock;
   preview?:                          Preview;
   quality?:                          Quality;
   sockets?:                          Sockets;
   talentGrid?:                       TalentGrid;
   summaryItemHash?:                  number;
   traitIds?:                         string[];
   traitHashes?:                      number[];
   tooltipStyle?:                     string;
   secondaryIcon?:                    string;
   collectibleHash?:                  number;
   iconWatermark?:                    string;
   damageTypeHashes?:                 number[];
   damageTypes?:                      number[];
   defaultDamageTypeHash?:            number;
   iconWatermarkShelved?:             string;
   loreHash?:                         number;
   crafting?:                         Crafting;
   objectives?:                       Objectives;
   gearset?:                          Gearset;
   breakerTypeHash?:                  number;
   seasonHash?:                       number;
   value?:                            Value;
}

export interface Action {
   verbName:                string;
   verbDescription:         string;
   isPositive:              boolean;
   requiredCooldownSeconds: number;
   requiredItems:           any[];
   progressionRewards:      any[];
   actionTypeLabel?:        string;
   rewardSheetHash:         number;
   rewardItemHash:          number;
   rewardSiteHash:          number;
   requiredCooldownHash:    number;
   deleteOnAction:          boolean;
   consumeEntireStack:      boolean;
   useOnAcquire:            boolean;
}

export interface BackgroundColor {
   colorHash: number;
   red:       number;
   green:     number;
   blue:      number;
   alpha:     number;
}

export interface Crafting {
   outputItemHash:           number;
   requiredSocketTypeHashes: number[];
   failedRequirementStrings: string[];
   bonusPlugs:               BonusPlug[];
}

export interface BonusPlug {
   socketTypeHash: number;
   plugItemHash:   number;
}

export interface DisplayProperties {
   description:    string;
   name:           string;
   hasIcon:        boolean;
   icon?:          string;
   iconSequences?: IconSequence[];
   highResIcon?:   string;
}

export interface IconSequence {
   frames: string[];
}

export interface EquippingBlock {
   uniqueLabelHash:       number;
   equipmentSlotTypeHash: number;
   attributes:            number;
   equippingSoundHash:    number;
   hornSoundHash:         number;
   ammoType:              number;
   displayStrings:        string[];
   uniqueLabel?:          string;
}

export interface Gearset {
   trackingValueMax: number;
   itemList:         number[];
}

export interface Inventory {
   maxStackSize:                             number;
   bucketTypeHash:                           number;
   recoveryBucketTypeHash:                   number;
   tierTypeHash:                             number;
   isInstanceItem:                           boolean;
   nonTransferrableOriginal:                 boolean;
   tierTypeName?:                            string;
   tierType:                                 number;
   expirationTooltip:                        string;
   expiredInActivityMessage:                 string;
   expiredInOrbitMessage:                    string;
   suppressExpirationWhenObjectivesComplete: boolean;
   stackUniqueLabel?:                        string;
   recipeItemHash?:                          number;
}

export interface InvestmentStat {
   statTypeHash:          number;
   value:                 number;
   isConditionallyActive: boolean;
}

export interface Objectives {
   objectiveHashes:                  number[];
   displayActivityHashes:            number[];
   requireFullObjectiveCompletion:   boolean;
   questlineItemHash:                number;
   narrative:                        string;
   objectiveVerbName:                string;
   questTypeIdentifier:              string;
   questTypeHash:                    number;
   completionRewardSiteHash:         number;
   nextQuestStepRewardSiteHash:      number;
   timestampUnlockValueHash:         number;
   isGlobalObjectiveItem:            boolean;
   useOnObjectiveCompletion:         boolean;
   inhibitCompletionUnlockValueHash: number;
   perObjectiveDisplayProperties:    PerObjectiveDisplayProperty[];
   displayAsStatTracker:             boolean;
}

export interface PerObjectiveDisplayProperty {
   displayOnItemPreviewScreen: boolean;
}

export interface Perk {
   requirementDisplayString: string;
   perkHash:                 number;
   perkVisibility:           number;
}

export interface Plug {
   insertionRules:                   Rule[];
   plugCategoryIdentifier:           string;
   plugCategoryHash:                 number;
   onActionRecreateSelf:             boolean;
   actionRewardSiteHash:             number;
   actionRewardItemOverrideHash:     number;
   insertionMaterialRequirementHash: number;
   previewItemOverrideHash:          number;
   enabledMaterialRequirementHash:   number;
   enabledRules:                     Rule[];
   uiPlugLabel:                      string;
   plugStyle:                        number;
   plugAvailability:                 number;
   alternateUiPlugLabel:             string;
   alternatePlugStyle:               number;
   isDummyPlug:                      boolean;
   applyStatsToSocketOwnerItem:      boolean;
   energyCost?:                      EnergyCost;
   energyCapacity?:                  EnergyCapacity;
}

export interface Rule {
   failureMessage: string;
}

export interface EnergyCapacity {
   capacityValue:  number;
   energyTypeHash: number;
   energyType:     number;
}

export interface EnergyCost {
   energyCost:     number;
   energyTypeHash: number;
   energyType:     number;
}

export interface Preview {
   screenStyle:            string;
   previewVendorHash:      number;
   previewActionString:    string;
   derivedItemCategories?: DerivedItemCategory[];
}

export interface DerivedItemCategory {
   categoryDescription: string;
   items:               Item[];
   categoryIndex:       number;
}

export interface Item {
   itemHash:        number;
   vendorItemIndex: number;
}

export interface Quality {
   itemLevels:                      any[];
   qualityLevel:                    number;
   infusionCategoryName:            string;
   infusionCategoryHash:            number;
   infusionCategoryHashes:          number[];
   progressionLevelRequirementHash: number;
   currentVersion:                  number;
   versions:                        Version[];
   displayVersionWatermarkIcons:    string[];
}

export interface Version {
   powerCapHash: number;
}

export interface Sockets {
   detail:           string;
   socketEntries:    SocketEntry[];
   intrinsicSockets: IntrinsicSocket[];
   socketCategories: SocketCategory[];
}

export interface IntrinsicSocket {
   plugItemHash:   number;
   socketTypeHash: number;
   defaultVisible: boolean;
}

export interface SocketCategory {
   socketCategoryHash: number;
   socketIndexes:      number[];
}

export interface SocketEntry {
   socketTypeHash:                        number;
   singleInitialItemHash:                 number;
   reusablePlugItems:                     ReusablePlugItem[];
   preventInitializationOnVendorPurchase: boolean;
   preventInitializationWhenVersioning:   boolean;
   hidePerksInItemTooltip:                boolean;
   plugSources:                           number;
   reusablePlugSetHash?:                  number;
   overridesUiAppearance:                 boolean;
   defaultVisible:                        boolean;
   randomizedPlugSetHash?:                number;
}

export interface ReusablePlugItem {
   plugItemHash: number;
}

export interface Stats {
   disablePrimaryStatDisplay: boolean;
   statGroupHash?:            number;
   stats:                     { [key: string]: Stat };
   hasDisplayableStats:       boolean;
   primaryBaseStatHash:       number;
}

export interface Stat {
   statHash:        number;
   value:           number;
   minimum:         number;
   maximum:         number;
   displayMaximum?: number;
}

export interface TalentGrid {
   talentGridHash:   number;
   itemDetailString: string;
   hudDamageType:    number;
   buildName?:       string;
}

export interface TooltipNotification {
   displayString: string;
   displayStyle:  string;
}

export interface TranslationBlock {
   weaponPatternHash: number;
   defaultDyes:       Dye[];
   lockedDyes:        Dye[];
   customDyes:        any[];
   arrangements:      Arrangement[];
   hasGeometry:       boolean;
}

export interface Arrangement {
   classHash:          number;
   artArrangementHash: number;
}

export interface Dye {
   channelHash: number;
   dyeHash:     number;
}

export interface Value {
   itemValue:        ItemValue[];
   valueDescription: string;
}

export interface ItemValue {
   itemHash:                 number;
   quantity:                 number;
   hasConditionalVisibility: boolean;
}

