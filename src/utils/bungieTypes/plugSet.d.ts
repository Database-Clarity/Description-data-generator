export type PlugSet = {
   reusablePlugItems: ReusablePlugItem[]
   isFakePlugSet: boolean
   hash: number
   index: number
   redacted: boolean
   blacklisted: boolean
   displayProperties?: DisplayProperties
}

export type DisplayProperties = {
   description: string
   name: string
   hasIcon: boolean
}

export type ReusablePlugItem = {
   weight: number
   alternateWeight: number
   currentlyCanRoll: boolean
   plugItemHash: number
   craftingRequirements?: CraftingRequirements
}

export type CraftingRequirements = {
   unlockRequirements: UnlockRequirement[]
   materialRequirementHashes: number[]
   requiredLevel?: number
}

export type UnlockRequirement = {
   failureDescription: string
}
