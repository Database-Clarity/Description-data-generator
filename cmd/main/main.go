package main

import (
	"context"
	"regexp"
	"strconv"
	"strings"

	"github.com/Ice-mourne/Description-editor-backend/api/bungie"
	"github.com/Ice-mourne/Description-editor-backend/internal"
	"github.com/Ice-mourne/Description-editor-backend/pkg/tools"
	"github.com/jackc/pgx/v5"
)

var languages = []string{"en", "de", "es", "es-mx", "fr", "it", "ja", "ko", "pl", "pt-br", "ru", "zh-chs", "zh-cht"}
func buildColNames(itemNames bool) string {
	newString := `("hash","type","icon","appearsOn",`

	for _, lang := range languages {
		newString += `"name_` + lang + `",`
	}

	if itemNames {
		for _, lang := range languages {
			newString += `"itemName_` + lang + `",`
		}
		newString += `"itemHash","itemIcon",`
	}

	// remove the last comma
	newString = newString[:len(newString)-1]

	newString += `)`
	
	return newString
}
func buildOnConflict(itemNames bool) string {
	newString := `"type" = EXCLUDED."type","icon" = EXCLUDED."icon","appearsOn" = EXCLUDED."appearsOn",`

	for _, lang := range languages {
		newString += `"name_` + lang + `"=EXCLUDED."` + `name_` + lang + `",`
	}

	if itemNames {
		for _, lang := range languages {
			newString += `"itemName_` + lang + `"=EXCLUDED."` + `itemName_` + lang + `",`
		}
		newString += `"itemHash"=EXCLUDED."itemHash","itemIcon"=EXCLUDED."itemIcon",`
	}

	// remove the last comma
	newString = newString[:len(newString)-1]

	newString += `;`

	return newString
}
func valueBuilder(itemNames bool) (newString string) {
	length := 17
	if itemNames {
		length = 32
	}

	for i := 1; i < length + 1; i++ {
		newString += `$` + strconv.Itoa(i) + `,`
	}
	// remove the last comma
	newString = newString[:len(newString)-1]
	newString = `(` + newString + `)`
	return
}
func localizedNames(hash uint32) (names []any) {
	// stringHash := strconv.Itoa(int(hash))
	for _, lang := range languages {
		properLang := bungie.LanguageCode(lang)
		names = append(names, internal.InventoryItemsLight_allLanguages[properLang][hash].DisplayProperties.Name)
	}
	return
}

func uploadToDB(perkMod bungie.InventoryItem, perkModType string, tx pgx.Tx) {
	var err error
	// var q any

	values := []any{perkMod.Hash, perkModType, *perkMod.DisplayProperties.Icon, perkMod.METADATA.ItemTypes,}
	values = append(values, localizedNames(perkMod.Hash)...)
	itemNames := false

	if perkMod.METADATA.ItemTier == "Exotic" {
		itemNames = true
		
		values = append(values, localizedNames(perkMod.METADATA.ItemHash)...)

		itemIcon := *internal.InventoryItems[perkMod.METADATA.ItemHash].DisplayProperties.Icon
		values = append(values, perkMod.METADATA.ItemHash, itemIcon)
	}

	_, err = tx.Exec(context.Background(),
		`INSERT INTO perk ` +
			buildColNames(itemNames) +
		` VALUES ` +
			valueBuilder(itemNames) +
		` ON CONFLICT (hash) DO UPDATE SET ` + 
			buildOnConflict(itemNames),
		values...
	)
	 
	if err != nil {
		println("Error inserting perk into database")
		println(perkMod.DisplayProperties.Name)
		panic(err)
	}
}

func main() {
	internal.GetBungie() // downloads and saves bungie data to global variables

	perksMods := internal.Aggregator()

	squeal := tools.Squeal()
	tx, _ := squeal.Begin(context.Background())

	for _, perkMod := range perksMods {
		perkModType := perkModType(perkMod)
		uploadToDB(perkMod, perkModType, tx)
	}

	tx.Commit(context.Background())

	println("Done")
}

var armorModGeneral_Regex, _ = regexp.Compile(`(?i)(general|helmet|arms|chest|leg|class item) armor mod`)

// I just given up on making this not a mess
func perkModType(perkMod bungie.InventoryItem) string {
	switch perkMod.METADATA.Category {
		// Legendary Armor Mod
		case bungie.LegendaryArmorMod:
			if perkMod.DisplayProperties.Name == "Riven's Curse" ||
				perkMod.DisplayProperties.Name == "Transcendent Blessing" {
				return "Armor Mod Activity"
			}
			if armorModGeneral_Regex.MatchString(strings.ToLower(*perkMod.ItemTypeDisplayName)) {
				return "Armor Mod General"
			}
			if strings.Contains(strings.ToLower(perkMod.DisplayProperties.Description), "raid") ||
				strings.Contains(strings.ToLower(*perkMod.ItemTypeDisplayName), "nightmare mod") {
				return "Armor Mod Activity"
			}
		// Exotic Armor Intrinsic
		case bungie.ExoticArmorIntrinsic:
			if *perkMod.ItemTypeDisplayName == "Intrinsic" || *perkMod.ItemTypeDisplayName == "Aeon Cult Mod" {
				return "Armor Trait Exotic"
			}
		// Legendary Weapon Mod
		case bungie.LegendaryWeaponMod:
			return "Weapon Mod"
		// Legendary Weapon Perk
		case bungie.LegendaryWeaponPerk:
			switch strings.ToLower(*perkMod.ItemTypeDisplayName) {
				case "trait":
					return "Weapon Trait"
				case "origin trait":
					return "Weapon Trait Origin"
				case "enhanced trait":
					return "Weapon Trait Enhanced"
				default:
					return "Weapon Perk"
		}
		// Legendary Weapon Frame
		case bungie.LegendaryWeaponFrame:
			if *perkMod.ItemTypeDisplayName == "Intrinsic" {
				return "Weapon Frame"
			}
			if *perkMod.ItemTypeDisplayName == "Enhanced Intrinsic" {
				return "Weapon Frame Enhanced"
			}
		// Exotic Weapon Catalyst
		case bungie.ExoticWeaponCatalyst:
			if strings.HasSuffix(perkMod.DisplayProperties.Name, "Catalyst") {
				return "Weapon Catalyst Exotic"
			}
			if perkMod.DisplayProperties.Name == "Lorentz Driver" || perkMod.DisplayProperties.Name == "Third Tail" {
				return "Weapon Catalyst Exotic"
			}
		// Exotic Weapon Frame
		case bungie.ExoticWeaponFrame:
			if *perkMod.ItemTypeDisplayName == "Intrinsic" {
				return "Weapon Frame Exotic"
			}
		// Exotic Weapon Perk
		case bungie.ExoticWeaponPerk:
			switch strings.ToLower(*perkMod.ItemTypeDisplayName) {
				case "trait":
					return "Weapon Trait Exotic"
				case "origin trait":
					return "Weapon Trait Origin Exotic"
				case "enhanced trait":
					return "Weapon Trait Enhanced Exotic"
				default:
					return "Weapon Perk Exotic"
			}
		// Artifact Mod
		case bungie.ArtifactMod:
			return "Armor Mod Seasonal"
		// Ghost Mod
		case bungie.GhostMod:
			if strings.Contains(strings.ToLower(*perkMod.ItemTypeDisplayName), "ghost mod") {
				return "Ghost Mod"
			}
		// Crafted weapon perk
		case bungie.CraftedWeaponPerk:
			// TODO: look in to this more
			if perkMod.Plug.UiPlugLabel == "masterwork" || strings.HasSuffix(perkMod.DisplayProperties.Name, "Catalyst") {
				return "Weapon Catalyst Exotic" // TODO: probably should be "Weapon Catalyst"
			}
		  exoticText := ""
		  if *perkMod.Inventory.TierTypeName == "Exotic" {
			  exoticText = " Exotic"
		  }
			switch strings.ToLower(*perkMod.ItemTypeDisplayName) { // TODO: look in to perk types more
				case "intrinsic":
					return "Weapon Frame" + exoticText
				case "enhanced intrinsic":
					return "Weapon Frame Enhanced" + exoticText
				case "trait":
					return "Weapon Trait" + exoticText
				case "origin trait":
					return "Weapon Trait Origin" + exoticText
				case "enhanced trait":
					return "Weapon Trait Enhanced" + exoticText
				default:
					return "Weapon Perk" + exoticText
			}
		// Ability
		case bungie.Ability:
			if strings.Contains(strings.ToLower(*perkMod.ItemTypeDisplayName), "melee") {
				return "Subclass Melee"
			}
			if strings.Contains(strings.ToLower(*perkMod.ItemTypeDisplayName), "grenade") {
				return "Subclass Grenade"
			}
			if strings.Contains(strings.ToLower(*perkMod.ItemTypeDisplayName), "movement") {
				return "Subclass Movement"
			}
			if strings.Contains(strings.ToLower(*perkMod.ItemTypeDisplayName), "class") {
				return "Subclass Class"
			}
		// Super
		case bungie.Super:
			if strings.Contains(strings.ToLower(*perkMod.ItemTypeDisplayName), "super") {
				return "Subclass Super"
			}
		// Aspect
		case bungie.Aspect:
			if strings.Contains(strings.ToLower(*perkMod.ItemTypeDisplayName), "aspect") {
				return "Subclass Aspect"
			}
		// Fragment
		case bungie.Fragment:
			if strings.Contains(strings.ToLower(*perkMod.ItemTypeDisplayName), "fragment") {
				return "Subclass Fragment"
			}
	}

	tools.WriteJsonToFile(perkMod, `perkMod-` + perkMod.DisplayProperties.Name + `.json`)

	return "Unknown"
}