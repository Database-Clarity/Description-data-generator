export type Stat = {
   displayProperties: DisplayProperties
   aggregationType: number
   hasComputedBlock: boolean
   statCategory: number
   interpolate: boolean
   hash: number
   index: number
   redacted: boolean
   blacklisted: boolean
}

export type DisplayProperties = {
   description: string
   name: string
   icon?: string
   iconSequences?: IconSequence[]
   hasIcon: boolean
}

export type IconSequence = {
   frames: string[]
}
