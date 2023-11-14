export type SocketType = {
   displayProperties: DisplayProperties
   insertAction: InsertAction
   plugWhitelist: PlugWhitelist[]
   socketCategoryHash: number
   visibility: number
   alwaysRandomizeSockets: boolean
   isPreviewEnabled: boolean
   hideDuplicateReusablePlugs: boolean
   overridesUiAppearance: boolean
   avoidDuplicatesOnInitialization: boolean
   currencyScalars: CurrencyScalar[]
   hash: number
   index: number
   redacted: boolean
   blacklisted: boolean
}

export type CurrencyScalar = {
   currencyItemHash: number
   scalarValue: number
}

export type DisplayProperties = {
   description: string
   name: string
   hasIcon: boolean
}

export type InsertAction = {
   actionExecuteSeconds: number
   actionSoundHash: number
   isPositiveAction: boolean
   actionType: number
}

export type PlugWhitelist = {
   categoryHash: number
   categoryIdentifier: string
   reinitializationPossiblePlugHashes?: number[]
}
