package tools

func MapValueAtIndex[m comparable, t interface{}](map_ map[m]t, index int) (t) {
	currentIndex := 0
	var currentVal t

	for _, value := range map_ {
		if currentIndex == index {
			return value
		}
		currentVal = value
		currentIndex++
	}

	return currentVal // returns last value if index is out of range
}