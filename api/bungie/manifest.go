package bungie

type ContentPathKeys string

const (
	InventoryItemPath     ContentPathKeys = "DestinyInventoryItemDefinition"
	InventoryItemLitePath ContentPathKeys = "DestinyInventoryItemLiteDefinition"
	PlugSetPath           ContentPathKeys = "DestinyPlugSetDefinition"
	SocketTypePath        ContentPathKeys = "DestinySocketTypeDefinition"
)

type LanguageCode string

const (
	En    LanguageCode = "en"
	Fr    LanguageCode = "fr"
	Es    LanguageCode = "es"
	EsMX  LanguageCode = "es-mx"
	De    LanguageCode = "de"
	It    LanguageCode = "it"
	Ja    LanguageCode = "ja"
	PtBR  LanguageCode = "pt-br"
	Ru    LanguageCode = "ru"
	Pl    LanguageCode = "pl"
	Ko    LanguageCode = "ko"
	ZhCHT LanguageCode = "zh-cht"
	ZhCHS LanguageCode = "zh-chs"
)

type ContentLinks map[LanguageCode]map[ContentPathKeys]string

type Manifest struct {
	Response struct {
		Version                        string       `json:"version"`
		JsonWorldComponentContentPaths ContentLinks `json:"jsonWorldComponentContentPaths"`
	} `json:"Response"`
}
