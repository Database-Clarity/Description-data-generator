package tools	
	
import "sort"

func SortStringByLength(stringSlice []string) {
	sort.Slice(stringSlice, func(firstIndex, secondIndex int) bool {
		return len(stringSlice[firstIndex]) < len(stringSlice[secondIndex])
	})
}