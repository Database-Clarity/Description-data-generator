package internal

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/Ice-mourne/Description-editor-backend/api/bungie"
	"github.com/Ice-mourne/Description-editor-backend/pkg/tools"
)

var InventoryItems bungie.InventoryItems
var PlugSets bungie.PlugSets
var SocketTypes bungie.SocketTypes
var InventoryItemsLight_allLanguages = make(map[bungie.LanguageCode]bungie.InventoryItemsLight)

func getFromURL(url string) []byte {
		resp, err := http.Get("https://www.bungie.net/" + url)
		if err != nil {
			println("Error fetching data from ", url)
			panic(err)
		}
		defer resp.Body.Close()
	
		// Read the response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			println("Error reading body from ", url)
			panic(err)
		}

		return body
}


// fetch bungie manifest and save globally
func GetBungie() {
	manifestURL := "Platform/Destiny2/Manifest/"

	manifestBody := getFromURL(manifestURL)
	var manifest bungie.Manifest
	if err := json.Unmarshal(manifestBody, &manifest); err != nil {
		println("Error unmarshalling manifest")
		panic(err)
	}
	
	jsonWorld := manifest.Response.JsonWorldComponentContentPaths

	// inventory item
	inventoryItemBody := getFromURL(jsonWorld[bungie.En][bungie.InventoryItemPath])
	var unfilteredInventoryItems bungie.InventoryItems
	if err := json.Unmarshal(inventoryItemBody, &unfilteredInventoryItems); err != nil {
		println("Error unmarshalling inventory item")
		panic(err)
	}
	InventoryItems = CleanUpInventoryItems(&unfilteredInventoryItems)

	// plug set
	plugSetBody := getFromURL(jsonWorld[bungie.En][bungie.PlugSetPath])
	if err := json.Unmarshal(plugSetBody, &PlugSets); err != nil {
		println("Error unmarshalling plug set")
		panic(err)
	}

	// socket type
	socketTypeBody := getFromURL(jsonWorld[bungie.En][bungie.SocketTypePath])
	if err := json.Unmarshal(socketTypeBody, &SocketTypes); err != nil {
		println("Error unmarshalling socket type")
		panic(err)
	}

	// inventory item light
	for languageCode, data := range jsonWorld {
		inventoryItemLightBody := getFromURL(data[bungie.InventoryItemLitePath])
		var items bungie.InventoryItemsLight
		if err := json.Unmarshal(inventoryItemLightBody, &items); err != nil {
			println("Error unmarshalling inventory item light in language: ", languageCode)
			panic(err)
		}

		InventoryItemsLight_allLanguages[languageCode] = items
	}

	println("Fetched all data from bungie")
}

// DownloadBungieDataLocally downloads and saves Bungie data locally
func DownloadBungieDataLocally() {
	GetBungie()

	// Check if localBungieData folder exists, if not create it
	_, err := os.Stat("localBungieData")
	if os.IsNotExist(err) {
		errDir := os.MkdirAll("localBungieData", os.ModePerm)
		if errDir != nil {
			log.Fatalln("Failed to create directory: localBungieData")
			panic(err)
		}
	}

	// Write inventory items
	tools.WriteJsonToFile(InventoryItems, "localBungieData/inventoryItems.json")

	// Write plug sets
	tools.WriteJsonToFile(PlugSets, "localBungieData/plugSets.json")

	// Write socket types
	tools.WriteJsonToFile(SocketTypes, "localBungieData/socketTypes.json", )

	// Write inventory items light
	tools.WriteJsonToFile(InventoryItemsLight_allLanguages, "localBungieData/inventoryItemsLight_allLanguages.json", )
}

func GetBungieLocal() {
	// Read inventory items
	inventoryItemsFile, err := os.Open("localBungieData/inventoryItems.json")
	if err != nil {
		println("Failed to open file: localBungieData/inventoryItems.json")
		println("Make sure to run DownloadBungieDataLocally() first.")
		panic(err)
	}
	defer inventoryItemsFile.Close()

	err = json.NewDecoder(inventoryItemsFile).Decode(&InventoryItems)
	if err != nil {
		println("Failed to decode inventoryItems.json")
		panic(err)
	}

	// Read plug sets
	plugSetsFile, err := os.Open("localBungieData/plugSets.json")
	if err != nil {
		println("Failed to open file: localBungieData/plugSets.json")
		println("Make sure to run DownloadBungieDataLocally() first.")
		panic(err)
	}
	defer plugSetsFile.Close()

	err = json.NewDecoder(plugSetsFile).Decode(&PlugSets)
	if err != nil {
		println("Failed to decode plugSets.json")
		panic(err)
	}

	// Read socket types
	socketTypesFile, err := os.Open("localBungieData/socketTypes.json")
	if err != nil {
		println("Failed to open file: localBungieData/socketTypes.json")
		println("Make sure to run DownloadBungieDataLocally() first.")
		panic(err)
	}
	defer socketTypesFile.Close()

	err = json.NewDecoder(socketTypesFile).Decode(&SocketTypes)
	if err != nil {
		println("Failed to decode socketTypes.json")
		panic(err)
	}

	// Read inventory items light
	inventoryItemsLight_allLanguagesFile, err := os.Open("localBungieData/inventoryItemsLight_allLanguages.json")
	if err != nil {
		println("Failed to open file: localBungieData/inventoryItemsLight_allLanguages.json")
		println("Make sure to run DownloadBungieDataLocally() first.")
		panic(err)
	}
	defer inventoryItemsLight_allLanguagesFile.Close()

	err = json.NewDecoder(inventoryItemsLight_allLanguagesFile).Decode(&InventoryItemsLight_allLanguages)
	if err != nil {
		println("Failed to decode inventoryItemsLight_allLanguages.json")
		panic(err)
	}
}
