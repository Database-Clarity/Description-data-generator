export interface InventoryItemLite {
    displayProperties:                 DisplayProperties;
    tooltipNotifications?:             TooltipNotification[];
    backgroundColor?:                  BackgroundColor;
    itemTypeDisplayName?:              string;
    uiItemDisplayStyle?:               string;
    itemTypeAndTierDisplayName?:       string;
    displaySource?:                    string;
    inventory:                         Inventory;
    equippingBlock?:                   EquippingBlock;
    quality?:                          Quality;
    acquireRewardSiteHash:             number;
    acquireUnlockHash:                 number;
    talentGrid?:                       TalentGrid;
    perks?:                            Perk[];
    iconWatermark?:                    string;
    allowActions:                      boolean;
    doesPostmasterPullHaveSideEffects: boolean;
    nonTransferrable:                  boolean;
    itemCategoryHashes?:               number[];
    specialItemType:                   number;
    itemType:                          number;
    itemSubType:                       number;
    classType:                         number;
    breakerType:                       number;
    equippable:                        boolean;
    defaultDamageType:                 number;
    isWrapper:                         boolean;
    loreHash?:                         number;
    value?:                            Value;
    summary?:                          Summary;
    collectibleHash?:                  number;
    secondaryIcon?:                    string;
    secondaryOverlay?:                 string;
    secondarySpecial?:                 string;
    summaryItemHash?:                  number;
    animations?:                       any[];
    links?:                            any[];
    seasonHash?:                       number;
    damageTypeHashes?:                 number[];
    damageTypes?:                      number[];
    defaultDamageTypeHash?:            number;
    breakerTypeHash?:                  number;
    setData?:                          SetData;
}

export interface BackgroundColor {
    colorHash: number;
    red:       number;
    green:     number;
    blue:      number;
    alpha:     number;
}

export interface DisplayProperties {
    description:    string;
    name:           string;
    icon?:          string;
    hasIcon:        boolean;
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

export interface Inventory {
    maxStackSize:                             number;
    bucketTypeHash:                           number;
    recoveryBucketTypeHash:                   number;
    tierTypeHash:                             number;
    isInstanceItem:                           boolean;
    nonTransferrableOriginal:                 boolean;
    tierTypeName?:                            TierTypeName;
    tierType:                                 number;
    expirationTooltip?:                       string;
    expiredInActivityMessage?:                string;
    expiredInOrbitMessage?:                   string;
    suppressExpirationWhenObjectivesComplete: boolean;
    stackUniqueLabel?:                        string;
    recipeItemHash?:                          number;
}

export enum TierTypeName {
    Basic = "Basic",
    Common = "Common",
    Exotic = "Exotic",
    Legendary = "Legendary",
    Rare = "Rare",
    Uncommon = "Uncommon",
}

export interface Perk {
    requirementDisplayString: string;
    perkHash:                 number;
    perkVisibility:           number;
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

export interface SetData {
    itemList:                 ItemList[];
    trackingUnlockValueHash:  number;
    abandonmentUnlockHash:    number;
    requireOrderedSetItemAdd: boolean;
    setIsFeatured:            boolean;
    setType:                  string;
    questLineName:            string;
    questLineDescription:     string;
    questStepSummary:         string;
}

export interface ItemList {
    trackingValue: number;
    itemHash:      number;
}

export interface Summary {
    sortPriority: number;
}

export interface TalentGrid {
    talentGridHash:   number;
    itemDetailString: string;
    hudDamageType:    number;
    buildName?:       string;
    hudIcon?:         string;
}

export interface TooltipNotification {
    displayString: string;
    displayStyle:  string;
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
