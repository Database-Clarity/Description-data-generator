package bungie

type SocketTypes map[uint32]SocketType

type SocketType struct {
	DisplayProperties               DisplayProperties `json:"displayProperties"`
	InsertAction                    InsertAction      `json:"insertAction"`
	PlugWhitelist                   []PlugWhitelist   `json:"plugWhitelist"`
	SocketCategoryHash              uint32            `json:"socketCategoryHash"`
	Visibility                      int               `json:"visibility"`
	AlwaysRandomizeSockets          bool              `json:"alwaysRandomizeSockets"`
	IsPreviewEnabled                bool              `json:"isPreviewEnabled"`
	HideDuplicateReusablePlugs      bool              `json:"hideDuplicateReusablePlugs"`
	OverridesUiAppearance           bool              `json:"overridesUiAppearance"`
	AvoidDuplicatesOnInitialization bool              `json:"avoidDuplicatesOnInitialization"`
	CurrencyScalars                 []CurrencyScalar  `json:"currencyScalars"`
	Hash                            uint32            `json:"hash"`
	Index                           int               `json:"index"`
	Redacted                        bool              `json:"redacted"`
	Blacklisted                     bool              `json:"blacklisted"`
}

type CurrencyScalar struct {
	CurrencyItemHash uint32 `json:"currencyItemHash"`
	ScalarValue      int    `json:"scalarValue"`
}

// type DisplayProperties struct {
// 	Description string `json:"description"`
// 	Name        string `json:"name"`
// 	HasIcon     bool   `json:"hasIcon"`
// }

type InsertAction struct {
	ActionExecuteSeconds int    `json:"actionExecuteSeconds"`
	ActionSoundHash      uint32 `json:"actionSoundHash"`
	IsPositiveAction     bool   `json:"isPositiveAction"`
	ActionType           int    `json:"actionType"`
}

type PlugWhitelist struct {
	CategoryHash                       uint32   `json:"categoryHash"`
	CategoryIdentifier                 string   `json:"categoryIdentifier"`
	ReinitializationPossiblePlugHashes []uint32 `json:"reinitializationPossiblePlugHashes,omitempty"`
}