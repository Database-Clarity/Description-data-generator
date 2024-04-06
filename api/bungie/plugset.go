package bungie

type PlugSets map[uint32]PlugSet

type PlugSet struct {
	ReusablePlugItems []ReusablePlugItem `json:"reusablePlugItems"`
	IsFakePlugSet     bool               `json:"isFakePlugSet"`
	Hash              uint32             `json:"hash"`
	Index             int                `json:"index"`
	Redacted          bool               `json:"redacted"`
	Blacklisted       bool               `json:"blacklisted"`
	DisplayProperties *DisplayProperties `json:"displayProperties,omitempty"`
}

// type DisplayProperties struct {
// 	Description string `json:"description"`
// 	Name        string `json:"name"`
// 	HasIcon     bool   `json:"hasIcon"`
// }

type ReusablePlugItem struct {
	// Weight               int                   `json:"weight"`
	// AlternateWeight      int                   `json:"alternateWeight"`
	CurrentlyCanRoll     bool                  `json:"currentlyCanRoll"`
	PlugItemHash         uint32                `json:"plugItemHash"`
	CraftingRequirements *CraftingRequirements `json:"craftingRequirements,omitempty"`
}

type CraftingRequirements struct {
	UnlockRequirements        []UnlockRequirement `json:"unlockRequirements"`
	MaterialRequirementHashes []int               `json:"materialRequirementHashes"`
	RequiredLevel             *int                `json:"requiredLevel,omitempty"`
}

type UnlockRequirement struct {
	FailureDescription string `json:"failureDescription"`
}