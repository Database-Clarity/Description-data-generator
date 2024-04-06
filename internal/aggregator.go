package internal

import (
	"slices"
	"strings"

	"github.com/Ice-mourne/Description-editor-backend/api/bungie"
	"github.com/Ice-mourne/Description-editor-backend/pkg/tools"
)

const (
	armorMod_CH = 590099826
	armorPerk_CH = 3154740035

	weaponMod_CH = 2685412949
	weaponPerk_CH = 4241085061
	weaponFrame_CH = 3956125808

	weaponCrafting_CH = 3410521964

	ability_CH_1 = 309722977
	ability_CH_2 = 3218807805

	super_CH = 457473665

	aspect_CH_1 = 2140934067
	aspect_CH_2 = 3400923910
	aspect_CH_3 = 764703411

	fragment_CH_1 = 1313488945
	fragment_CH_2 = 193371309
	fragment_CH_3 = 2819965312
)

func isLegendary(item bungie.InventoryItem) bool {
	return item.ItemTypeAndTierDisplayName != nil && strings.Contains(strings.ToLower(*item.ItemTypeAndTierDisplayName), "legendary")
}
func isExotic(item bungie.InventoryItem) bool {
	return item.ItemTypeAndTierDisplayName != nil && strings.Contains(strings.ToLower(*item.ItemTypeAndTierDisplayName), "exotic")
}
func isArtifact(item bungie.InventoryItem) bool {
	return item.ItemTypeDisplayName != nil && 
				 strings.Contains(strings.ToLower(*item.ItemTypeDisplayName), "artifact") &&
				 item.Preview != nil &&
				 item.Preview.DerivedItemCategories != nil
}
func hasSockets(item bungie.InventoryItem) bool {
	return item.Sockets != nil && item.Sockets.SocketCategories != nil
}

func Aggregator() (perksMods []bungie.InventoryItem) {
	for _, item := range InventoryItems {
		// artifact mods
		if isArtifact(item) {
			for _, category := range item.Preview.DerivedItemCategories {
				for _, mod := range category.Items {
					artifactMod, ok := InventoryItems[mod.ItemHash]

					if ok {
						// add meta data to the perk
						artifactMod.METADATA.ItemHash = item.Hash
						artifactMod.METADATA.ItemTier = *item.Inventory.TierTypeName
						artifactMod.METADATA.ItemType = *item.ItemTypeDisplayName
						artifactMod.METADATA.Category = bungie.ArtifactMod

						perksMods = append(perksMods, artifactMod)
					}
				}
			}
			continue
		}

		// all other need to have sockets
		if !hasSockets(item) {
			continue
		}

		// legendary armor mods
		if item.ItemType == 2 && isLegendary(item) {
			perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{armorMod_CH}, item, bungie.LegendaryArmorMod)...)
			continue
		}
		// exotic armor intrinsic perks
		if item.ItemType == 2 && isExotic(item) {
			perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{armorMod_CH, armorPerk_CH}, item, bungie.ExoticArmorIntrinsic)...)
			continue
		}
		// legendary weapon frames, perks and mods
		if item.ItemType == 3 && isLegendary(item) {
			perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{weaponFrame_CH}, item, bungie.LegendaryWeaponFrame)...)
			perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{weaponPerk_CH},  item, bungie.LegendaryWeaponPerk)...)
			perksMods = append(perksMods,	perksFromSockets(item.Sockets, []uint32{weaponMod_CH}, 	 item, bungie.LegendaryWeaponMod)...)
			continue
		}
		// exotic weapon frames, perks and catalysts
		if item.ItemType == 3 && isExotic(item){
			perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{weaponFrame_CH}, 							item, bungie.ExoticWeaponFrame)...)
			perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{weaponPerk_CH},	 							item, bungie.ExoticWeaponPerk)...)
			perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{weaponMod_CH, weaponPerk_CH},	item, bungie.ExoticWeaponCatalyst)...)
			continue
		}
		// subclass abilities, supers, aspects and fragments
		if item.ItemType == 16 {
			perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{ability_CH_1,  ability_CH_2					 			 }, item, bungie.Ability)...)
			perksMods	= append(perksMods, perksFromSockets(item.Sockets, []uint32{super_CH												 					 }, item, bungie.Super)...)
			perksMods =	append(perksMods, perksFromSockets(item.Sockets, []uint32{aspect_CH_1, 	 aspect_CH_2, 	aspect_CH_3	 }, item, bungie.Aspect)...)
			perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{fragment_CH_1, fragment_CH_2, fragment_CH_3}, item, bungie.Fragment)...)
			continue
		}
		// ghost mods
		if item.ItemType == 24 {
			perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{3886482628}, item, bungie.GhostMod)...)
			continue
		}
		// crafted weapon perks
		if item.ItemType == 30 {
			if item.Crafting == nil {
				continue
			}
			craftedWeapon, ok := InventoryItems[item.Crafting.OutputItemHash]
			if !ok {
				perksMods = append(perksMods, perksFromSockets(item.Sockets, []uint32{weaponCrafting_CH}, craftedWeapon, bungie.CraftedWeaponPerk)...)
				continue
			}
		}
	}
	perksMods = compressPerkMods(perksMods)

	return
}

// Finds all the sockets that belong to a specified categories and returns the perks from those sockets
func perksFromSockets(socket *bungie.Sockets, categoryHashes []uint32, item bungie.InventoryItem, category bungie.CategoryName) []bungie.InventoryItem {
	// socket indexes of the specified categories
	var socketIndexes []int
	for _, socket := range socket.SocketCategories {
		if slices.Contains(categoryHashes, socket.SocketCategoryHash) {
			socketIndexes = append(socketIndexes, socket.SocketIndexes...)
		}
	}

	// get sockets from the indexes
	var sockets []bungie.Socket
	for _, socketIndex := range socketIndexes {
		sockets = append(sockets, socket.SocketEntries[socketIndex])
	}

	// get hashes from sockets
	var hashes []uint32
	for _, socket := range sockets {
		// single initial item
		hashes = append(hashes, socket.SingleInitialItemHash)

		// reusable plug items
		for _, plug := range socket.ReusablePlugItems {
			hashes = append(hashes, plug.PlugItemHash)
		}

		// reusable plug set
		plugSet, ok := PlugSets[socket.ReusablePlugSetHash]
		if ok {
			for _, plug := range plugSet.ReusablePlugItems {
				hashes = append(hashes, plug.PlugItemHash)
			}
		}

		// randomized plug set
		plugSet, ok = PlugSets[socket.RandomizedPlugSetHash]
		if ok {
			for _, plug := range plugSet.ReusablePlugItems {
				hashes = append(hashes, plug.PlugItemHash)
			}
		}

		// replacement plugs
		socket, ok := SocketTypes[socket.SocketTypeHash]
		if ok {
			for _, plug := range socket.PlugWhitelist {
				hashes = append(hashes, plug.ReinitializationPossiblePlugHashes...)
			}
		}
	}

	// remove duplicate hashes
	slices.Sort(hashes)
	hashes = slices.Compact(hashes)

	// get perks from hashes
	var perks []bungie.InventoryItem
	for _, hash := range hashes {
		perk, ok := InventoryItems[hash]

		if ok {
			// add meta data to the perk
			perk.METADATA.ItemHash = item.Hash
			perk.METADATA.ItemTier = *item.Inventory.TierTypeName
			perk.METADATA.ItemType = *item.ItemTypeDisplayName
			perk.METADATA.Category = category

			// add perk to the list
			perks = append(perks, perk)
		}
	}

	return perks
}

func compressPerkMods(perksMods []bungie.InventoryItem) []bungie.InventoryItem {
	perksModsMap := make(map[uint32]bungie.InventoryItem)
	for _, perkMod := range perksMods {
		_, ok := perksModsMap[perkMod.Hash]
		if !ok {
			perksModsMap[perkMod.Hash] = perkMod
		}
		perkModInMap := perksModsMap[perkMod.Hash]

		perkModInMap.METADATA.ItemHashes = append(perkModInMap.METADATA.ItemHashes, perkMod.METADATA.ItemHash)
		perkModInMap.METADATA.ItemTiers  = append(perkModInMap.METADATA.ItemTiers, 	perkMod.METADATA.ItemTier)
		perkModInMap.METADATA.ItemTypes  = append(perkModInMap.METADATA.ItemTypes, 	perkMod.METADATA.ItemType)

		perksModsMap[perkMod.Hash] = perkModInMap
	}

	perksModsSlice := make([]bungie.InventoryItem, 0, len(perksModsMap))
	for _, perkMod := range perksModsMap {
		slices.Sort(perkMod.METADATA.ItemHashes)
		slices.Sort(perkMod.METADATA.ItemTiers)
		slices.Sort(perkMod.METADATA.ItemTypes)

		perkMod.METADATA.ItemHashes = slices.Compact(perkMod.METADATA.ItemHashes)
		perkMod.METADATA.ItemTiers  = slices.Compact(perkMod.METADATA.ItemTiers)
		perkMod.METADATA.ItemTypes  = slices.Compact(perkMod.METADATA.ItemTypes)

		if slices.Contains(perkMod.METADATA.ItemTiers, "Legendary") {
			perkMod.METADATA.ItemTier 	= "Legendary"
			perkMod.METADATA.ItemHashes = nil
			perkMod.METADATA.ItemTiers 	= nil
		}

		if slices.Contains(perkMod.METADATA.ItemTiers, "Exotic") {
			perkMod.METADATA.ItemTier  = "Exotic"
			perkMod.METADATA.ItemTiers = nil
		}

		perkMod.METADATA.ItemType = ""

		perksModsSlice = append(perksModsSlice, perkMod)
	}

	tools.WriteJsonToFile(perksModsSlice, "perksMods.json")

	return perksModsSlice
}
