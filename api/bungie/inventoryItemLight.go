package bungie

type InventoryItemsLight map[uint32]DestinyInventoryItemLightDefinition

type DestinyInventoryItemLightDefinition struct {
	DisplayProperties struct {
		Name string `json:"name"`
	} `json:"displayProperties"`
}
