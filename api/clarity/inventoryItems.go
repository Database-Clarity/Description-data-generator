package clarity

type InventoryItems map[string]InventoryItem

type InventoryItem struct {
	/**
	// Items name => The Last Word, etc.
	// From => displayProperties.name
	*/
	Name string
	/**
	// Items description => ...a shadow of its former glory.
	// From => displayProperties.description
	*/
	Icon string
	/**
	// Items tier => Legendary, Exotic, etc.
	// From => inventory.tierTypeName
	*/
	TierTypeName string
	/**
	// Items type => Gauntlets, Linear Fusion Rifle, etc.
	// From => itemTypeDisplayName
	*/
	ItemTypeDisplayName string
	/**
	// Crafting output item hash => 1615052875
	// From => crafting.outputItemHash
	// Present only on crafting recipes
	*/
	CraftedItemHash *uint32
	/**
	// Item type => 2, 3, 16, etc.
	// From => itemType
	*/
	ItemType int
	/**
	// Item hash => 4232817861
	// From => hash
	*/
	Hash uint32
	/**
	// From => Preview.derivedItemCategories[].items[].itemHash
	// Compressed list of Artifact Mod hashes
	*/
	ArtifactMods *[]uint32
	/**
	// No changes to this one it is same as bungie
	*/
	Sockets *Sockets `json:"sockets,omitempty"`

	// Data not from bungie
	METADATA struct {
		ItemHash   uint32
		ItemHashes []uint32
		ItemType   string
		ItemTypes  []string
		ItemTier   string
		ItemTiers  []string
		Category   CategoryName
	}
}

type Sockets struct {
	SocketEntries []Socket `json:"socketEntries"`

	IntrinsicSockets []struct {
		SocketTypeHash        uint32 `json:"socketTypeHash"`
		SingleInitialItemHash uint32 `json:"singleInitialItemHash"`
	} `json:"intrinsicSockets"`
	SocketCategories []SocketCategory `json:"socketCategories"`
}

type SocketCategory struct {
	SocketCategoryHash uint32 `json:"socketCategoryHash"`
	SocketIndexes      []int  `json:"socketIndexes"`
}

type Socket struct {
	SocketTypeHash        uint32 `json:"socketTypeHash"`
	SingleInitialItemHash uint32 `json:"singleInitialItemHash"`
	ReusablePlugSetHash   uint32 `json:"reusablePlugSetHash"`
	ReusablePlugItems     []struct {
		PlugItemHash uint32 `json:"plugItemHash"`
	} `json:"reusablePlugItems"`
	RandomizedPlugSetHash uint32 `json:"randomizedPlugSetHash"`
}

type CategoryName string
const (
	ArtifactMod          CategoryName = "Artifact mod"
	LegendaryArmorMod    CategoryName = "Legendary armor mod"
	ExoticArmorIntrinsic CategoryName = "Exotic armor intrinsic"
	LegendaryWeaponFrame CategoryName = "Legendary weapon frame"
	LegendaryWeaponPerk  CategoryName = "Legendary weapon perk"
	LegendaryWeaponMod   CategoryName = "Legendary weapon mod"
	ExoticWeaponFrame    CategoryName = "Exotic weapon frame"
	ExoticWeaponPerk     CategoryName = "Exotic weapon perk"
	ExoticWeaponCatalyst CategoryName = "Exotic weapon catalyst"
	Ability              CategoryName = "Ability"
	Super                CategoryName = "Super"
	Aspect               CategoryName = "Aspect"
	Fragment             CategoryName = "Fragment"
	GhostMod             CategoryName = "Ghost mod"
	CraftedWeaponPerk    CategoryName = "Crafted weapon perk"
)