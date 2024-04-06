package tools

func ReverseString(str string) (result string) {
	for _, v := range str {
		result = string(v) + result
	}
	return
}