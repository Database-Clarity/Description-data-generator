package bungie

type InventoryItems map[uint32]InventoryItem

type InventoryItem struct {
	DisplayProperties          DisplayProperties `json:"displayProperties"`
	ItemTypeDisplayName        *string           `json:"itemTypeDisplayName,omitempty"`
	ItemTypeAndTierDisplayName *string           `json:"itemTypeAndTierDisplayName,omitempty"`
	Crafting                   *Crafting         `json:"crafting,omitempty"`
	Plug                       *Plug             `json:"plug,omitempty"`
	ItemCategoryHashes         *[]uint32         `json:"itemCategoryHashes,omitempty"`
	ItemType                   int               `json:"itemType"`
	ItemSubType                int               `json:"itemSubType"`
	Equippable                 bool              `json:"equippable"`
	Hash                       uint32            `json:"hash"`
	Redacted                   bool              `json:"redacted"`
	Preview                    *Preview          `json:"preview,omitempty"`
	Quality                    *Quality          `json:"quality,omitempty"`
	Sockets                    *Sockets          `json:"sockets,omitempty"`
	Inventory                  struct {
		TierTypeName *string `json:"tierTypeName,omitempty"`
	} `json:"inventory"`
	// Data not from bungie used for aggregation
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

type Crafting struct {
	OutputItemHash uint32 `json:"outputItemHash"`
}

type DisplayProperties struct {
	Description string  `json:"description"`
	Icon        *string `json:"icon"`
	Name        string  `json:"name"`
}

type Quality struct {
	Version []Version `json:"versions"`
}

type Version struct {
	PowerCapHash uint32 `json:"powerCapHash"`
}

type Plug struct {
	PlugCategoryHash       uint32 `json:"plugCategoryHash"`
	PlugCategoryIdentifier string `json:"plugCategoryIdentifier"`
	UiPlugLabel            string `json:"uiPlugLabel"`
}

type Preview struct {
	DerivedItemCategories []DerivedItemCategory `json:"derivedItemCategories,omitempty"`
}

type DerivedItemCategory struct {
	Items               []Item `json:"items"`
}

type Item struct {
	ItemHash        uint32 `json:"itemHash"`
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