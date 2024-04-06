package internal

import (
	"regexp"
	"slices"
	"strings"

	"github.com/Ice-mourne/Description-editor-backend/api/bungie"
)


func CleanUpInventoryItems(invItems *bungie.InventoryItems) bungie.InventoryItems {
	filteredInventoryItems := make(bungie.InventoryItems)
	statModReg, _ := regexp.Compile(`(resilience|recovery|discipline|mobility|strength|intellect)( mod|-forged)`)

	for _, item := range *invItems {
		name := strings.ToLower(item.DisplayProperties.Name)
		description := strings.ToLower(item.DisplayProperties.Description)
		var itemTypeDisplayName string
		if item.ItemTypeDisplayName != nil {
			itemTypeDisplayName = strings.ToLower(*item.ItemTypeDisplayName)
		} else {
			itemTypeDisplayName = ""
		}

		// skip some random crap
		if 
			item.ItemType == 9 ||
			item.ItemType == 12 ||
			item.ItemType == 14 ||
			item.ItemType == 15 ||
			item.ItemType == 17 ||
			item.ItemType == 21 ||
			item.ItemType == 22 ||
			item.ItemType == 25 ||
			item.ItemType == 26 ||
			strings.Contains(itemTypeDisplayName, "solstice embers") ||
			strings.Contains(itemTypeDisplayName, "kindling") ||
			strings.Contains(itemTypeDisplayName, "material") ||
			strings.Contains(itemTypeDisplayName, "armor set") ||
			strings.Contains(itemTypeDisplayName, "authorization mod") ||
			strings.HasSuffix(itemTypeDisplayName, "engram") ||
			strings.HasSuffix(itemTypeDisplayName, "currency") ||
			strings.ReplaceAll(itemTypeDisplayName, `"`, "") == "holiday gift" ||
			strings.Contains(name, "legendary engram") ||
			strings.Contains(name, "deepsight resonance") ||
			strings.Contains(name, "extract pattern") ||
			strings.Contains(name, "locked armor mod") ||
			strings.Contains(name, "trait locked") ||
			strings.Contains(name, "reset artifact") ||
			strings.Contains(name, "increase weapon level") ||
			item.Hash == 2132353550 || // osteo striga catalyst // can't be equipped
			item.Hash == 712324018 ||  // transformative perk   // basically place holder
			item.Hash == 1906855381 || // aeon safe             // dummy item
			item.Hash == 2076339106 || // aeon soul             // dummy item
			item.Hash == 1656912113 {  // aeon swift            // dummy item
				continue
		}

		// skip item with category hashes
		itemCategoryHashesToSkip := []uint32{34, 43, 44, 53, 56, 58, 1404791674, 1112488720, 208981632, 874645359, 1873949940}
		if item.ItemCategoryHashes != nil && slices.ContainsFunc(*item.ItemCategoryHashes, func (hashes uint32) bool {
			return slices.Contains(itemCategoryHashesToSkip, hashes)
		}) {
			continue
		}

		// skip items with power cap
		if item.ItemType == 2 || (item.ItemType == 3 && item.Quality != nil) {
			// check if items has power cap
			unlimitedPowerCap := slices.ContainsFunc(item.Quality.Version, func(version bungie.Version) bool {
				return version.PowerCapHash == 2759499571
			})

			// if it has then skip it
			if !unlimitedPowerCap {
				continue
			}
		}

		// skip dummy items
		if item.ItemType == 20 || item.ItemCategoryHashes != nil && slices.Contains(*item.ItemCategoryHashes, 3109687656) {
			continue
		}

		// skip non equippable armor
		if (item.ItemType == 0 || item.ItemType == 1 || item.ItemType == 2) && !item.Equippable {
			continue
		}

		// skip shader items // ItemSubType == Shader // ItemCategoryHashes == Shaders
		if item.ItemSubType == 20 || item.ItemCategoryHashes != nil && slices.Contains(*item.ItemCategoryHashes, 41) {
			continue
		}

		// skip masterwork items
		if item.Plug != nil {
			plugCategoryIdentifier := strings.ToLower(item.Plug.PlugCategoryIdentifier)
			uiPlugLabel := strings.ToLower(item.Plug.UiPlugLabel)

			masterwork := strings.Contains(plugCategoryIdentifier, "masterwork")
			stat := strings.Contains(plugCategoryIdentifier, "stat")
			kills := strings.Contains(plugCategoryIdentifier, "kills")			
			armor := strings.Contains(plugCategoryIdentifier, "armor")
			ghosts := strings.Contains(plugCategoryIdentifier, "ghosts")			
			interactable := strings.Contains(uiPlugLabel, "interactable")

			if masterwork && (stat || kills || armor || ghosts || interactable) {
				continue
			}
		}

		// skip deprecated items
		if strings.Contains(name, "deprecated") || strings.Contains(description, "deprecated") {
			continue
		}

		// skip items with no name or icon
		if name == "" || item.DisplayProperties.Icon == nil{
			continue
		}

		// skip sockets
		if strings.HasSuffix(name, " socket") {
			continue
		}

		// skip stat mods
		if statModReg.MatchString(name) {
			continue
		}

		// skip trackers
		if item.Plug != nil && item.Plug.PlugCategoryHash == 2947756142 {
			continue
		}

		// skip redacted items
		if item.Redacted {
			continue
		}

		// skip classified items
		if strings.Contains(name, "classified") {
			continue
		}

		// skip ornaments
		if item.ItemSubType == 21 || item.ItemCategoryHashes != nil && slices.Contains(*item.ItemCategoryHashes, 56) || strings.HasSuffix(itemTypeDisplayName, "ornament") {
			continue
		}

		// skip momento
		if strings.Contains(itemTypeDisplayName, "momento") {
			continue
		}

		filteredInventoryItems[item.Hash] = item
	}

	return filteredInventoryItems
}
