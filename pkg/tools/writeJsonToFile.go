package tools

import (
	"encoding/json"
	"os"
)

// writeJsonToFile writes the given json data to the specified file path
func WriteJsonToFile(data interface{}, filePath string) {
	file, err := os.Create(filePath)
	if err != nil {
		println("Failed to create file:", filePath)
		panic(err)
	}
	defer file.Close()

	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		println("Failed to marshal data for file:", filePath)
		panic(err)
	}

	_, err = file.Write(jsonData)
	if err != nil {
		println("Failed to write to file:", filePath)
		panic(err)
	}
}