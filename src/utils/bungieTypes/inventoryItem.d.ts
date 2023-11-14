export type InventoryItem = {
   displayProperties: DisplayProperties
   tooltipNotifications?: TooltipNotification[]
   itemTypeDisplayName?: string
   flavorText?: string
   uiItemDisplayStyle?: string
   itemTypeAndTierDisplayName?: string
   displaySource?: string
   action?: Action
   inventory: Inventory
   plug?: Plug
   acquireRewardSiteHash: number
   acquireUnlockHash: number
   investmentStats?: InvestmentStat[]
   perks?: Perk[]
   allowActions: boolean
   doesPostmasterPullHaveSideEffects: boolean
   nonTransferrable: boolean
   itemCategoryHashes?: number[]
   specialItemType: number
   itemType: number
   itemSubType: number
   classType: number
   breakerType: number
   equippable: boolean
   defaultDamageType: number
   isWrapper: boolean
   hash: number
   index: number
   redacted: boolean
   blacklisted: boolean
   backgroundColor?: BackgroundColor
   tooltipStyle?: string
   preview?: Preview
   screenshot?: string
   stats?: Stats
   equippingBlock?: EquippingBlock
   translationBlock?: TranslationBlock
   quality?: Quality
   sockets?: Sockets
   talentGrid?: TalentGrid
   summaryItemHash?: number
   traitIds?: string[]
   traitHashes?: number[]
   secondaryIcon?: string
   collectibleHash?: number
   iconWatermark?: string
   damageTypeHashes?: number[]
   damageTypes?: number[]
   defaultDamageTypeHash?: number
   iconWatermarkShelved?: string
   loreHash?: number
   gearset?: Gearset
   objectives?: Objectives
   crafting?: Crafting
   setData?: SetData
   value?: Value
   secondaryOverlay?: string
   secondarySpecial?: string
   metrics?: Metrics
   sack?: Sack
   summary?: Summary
   breakerTypeHash?: number
   seasonHash?: number
   animations?: any[]
   links?: any[]
}

export type Action = {
   verbName: string
   verbDescription: string
   isPositive: boolean
   requiredCooldownSeconds: number
   requiredItems: RequiredItem[]
   progressionRewards: ProgressionReward[]
   actionTypeLabel?: string
   rewardSheetHash: number
   rewardItemHash: number
   rewardSiteHash: number
   requiredCooldownHash: number
   deleteOnAction: boolean
   consumeEntireStack: boolean
   useOnAcquire: boolean
}

export type ProgressionReward = {
   progressionMappingHash: number
   amount: number
   applyThrottles: boolean
}

export type RequiredItem = {
   count: number
   itemHash: number
   deleteOnAction: boolean
}

export type BackgroundColor = {
   colorHash: number
   red: number
   green: number
   blue: number
   alpha: number
}

export type Crafting = {
   outputItemHash: number
   requiredSocketTypeHashes: number[]
   failedRequirementStrings: string[]
   bonusPlugs: BonusPlug[]
}

export type BonusPlug = {
   socketTypeHash: number
   plugItemHash: number
}

export type DisplayProperties = {
   description: string
   name: string
   hasIcon: boolean
   icon?: string
   iconSequences?: IconSequence[]
   highResIcon?: string
}

export type IconSequence = {
   frames: string[]
}

export type EquippingBlock = {
   uniqueLabelHash: number
   equipmentSlotTypeHash: number
   attributes: number
   equippingSoundHash: number
   hornSoundHash: number
   ammoType: number
   displayStrings: string[]
   uniqueLabel?: string
}

export type Gearset = {
   trackingValueMax: number
   itemList: number[]
}

export type Inventory = {
   maxStackSize: number
   bucketTypeHash: number
   recoveryBucketTypeHash: number
   tierTypeHash: number
   isInstanceItem: boolean
   nonTransferrableOriginal: boolean
   tierTypeName?: string
   tierType: number
   expirationTooltip?: string
   expiredInActivityMessage?: string
   expiredInOrbitMessage?: string
   suppressExpirationWhenObjectivesComplete: boolean
   stackUniqueLabel?: string
   recipeItemHash?: number
}

export type InvestmentStat = {
   statTypeHash: number
   value: number
   isConditionallyActive: boolean
}

export type Metrics = {
   availableMetricCategoryNodeHashes: number[]
}

export type Objectives = {
   objectiveHashes: number[]
   displayActivityHashes: number[]
   requireFullObjectiveCompletion: boolean
   questlineItemHash: number
   narrative: string
   objectiveVerbName: string
   questTypeIdentifier: string
   questTypeHash: number
   completionRewardSiteHash: number
   nextQuestStepRewardSiteHash: number
   timestampUnlockValueHash: number
   isGlobalObjectiveItem: boolean
   useOnObjectiveCompletion: boolean
   inhibitCompletionUnlockValueHash: number
   perObjectiveDisplayProperties: PerObjectiveDisplayProperty[]
   displayAsStatTracker: boolean
}

export type PerObjectiveDisplayProperty = {
   displayOnItemPreviewScreen: boolean
   activityHash?: number
}

export type Perk = {
   requirementDisplayString: string
   perkHash: number
   perkVisibility: number
}

export type Plug = {
   insertionRules: Rule[]
   plugCategoryIdentifier: string
   plugCategoryHash: number
   onActionRecreateSelf: boolean
   actionRewardSiteHash: number
   actionRewardItemOverrideHash: number
   insertionMaterialRequirementHash: number
   previewItemOverrideHash: number
   enabledMaterialRequirementHash: number
   enabledRules: Rule[]
   uiPlugLabel: string
   plugStyle: number
   plugAvailability: number
   alternateUiPlugLabel: string
   alternatePlugStyle: number
   isDummyPlug: boolean
   applyStatsToSocketOwnerItem: boolean
   energyCost?: EnergyCost
   energyCapacity?: EnergyCapacity
}

export type Rule = {
   failureMessage: string
}

export type EnergyCapacity = {
   capacityValue: number
   energyTypeHash: number
   energyType: number
}

export type EnergyCost = {
   energyCost: number
   energyTypeHash: number
   energyType: number
}

export type Preview = {
   screenStyle: string
   previewVendorHash: number
   previewActionString: string
   derivedItemCategories?: DerivedItemCategory[]
   artifactHash?: number
}

export type DerivedItemCategory = {
   categoryDescription: string
   items: Item[]
   categoryIndex: number
}

export type Item = {
   itemHash: number
   vendorItemIndex: number
}

export type Quality = {
   itemLevels: any[]
   qualityLevel: number
   infusionCategoryName: string
   infusionCategoryHash: number
   infusionCategoryHashes: number[]
   progressionLevelRequirementHash: number
   currentVersion: number
   versions: Version[]
   displayVersionWatermarkIcons?: string[]
}

export type Version = {
   powerCapHash: number
}

export type Sack = {
   detailAction: string
   openAction: string
   seedUnlockValueHash: number
   resolvedBitVectorUnlockValueHash: number
   resolvedItemCountUnlockValueHash: number
   selectItemCount: number
   rollStateUnlockValueHash: number
   rewardItemListHash: number
   openOnAcquire: boolean
   vendorSackType?: string
}

export type SetData = {
   itemList: ItemList[]
   trackingUnlockValueHash: number
   abandonmentUnlockHash: number
   requireOrderedSetItemAdd: boolean
   setIsFeatured: boolean
   setType: string
   questLineName: string
   questLineDescription: string
   questStepSummary: string
}

export type ItemList = {
   trackingValue: number
   itemHash: number
}

export type Sockets = {
   detail: string
   socketEntries: SocketEntry[]
   intrinsicSockets: IntrinsicSocket[]
   socketCategories: SocketCategory[]
}

export type IntrinsicSocket = {
   plugItemHash: number
   socketTypeHash: number
   defaultVisible: boolean
}

export type SocketCategory = {
   socketCategoryHash: number
   socketIndexes: number[]
}

export type SocketEntry = {
   socketTypeHash: number
   singleInitialItemHash: number
   reusablePlugItems: ReusablePlugItem[]
   preventInitializationOnVendorPurchase: boolean
   preventInitializationWhenVersioning: boolean
   hidePerksInItemTooltip: boolean
   plugSources: number
   reusablePlugSetHash?: number
   overridesUiAppearance: boolean
   defaultVisible: boolean
   randomizedPlugSetHash?: number
}

export type ReusablePlugItem = {
   plugItemHash: number
}

export type Stats = {
   disablePrimaryStatDisplay: boolean
   statGroupHash?: number
   stats: { [key: string]: Stat }
   hasDisplayableStats: boolean
   primaryBaseStatHash: number
}

export type Stat = {
   statHash: number
   value: number
   minimum: number
   maximum: number
   displayMaximum?: number
}

export type Summary = {
   sortPriority: number
}

export type TalentGrid = {
   talentGridHash: number
   itemDetailString: string
   hudDamageType: number
   buildName?: string
   hudIcon?: string
}

export type TooltipNotification = {
   displayString: string
   displayStyle: string
}

export type TranslationBlock = {
   weaponPatternHash: number
   defaultDyes: Dye[]
   lockedDyes: Dye[]
   customDyes: Dye[]
   arrangements: Arrangement[]
   hasGeometry: boolean
}

export type Arrangement = {
   classHash: number
   artArrangementHash: number
}

export type Dye = {
   channelHash: number
   dyeHash: number
}

export type Value = {
   itemValue: ItemValue[]
   valueDescription: string
}

export type ItemValue = {
   itemHash: number
   quantity: number
   hasConditionalVisibility: boolean
}
